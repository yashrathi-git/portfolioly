"""Azure Blob Storage service helpers for persisting user-uploaded PDFs and images."""

from __future__ import annotations

import asyncio
import logging
import os
import time
from dataclasses import dataclass
from typing import Dict, Optional, Tuple
from urllib.parse import urlparse

from azure.core.exceptions import AzureError, ResourceExistsError, ResourceNotFoundError
from azure.storage.blob import ContentSettings
from azure.storage.blob.aio import BlobServiceClient, ContainerClient
from fastapi import UploadFile

from ..core.config import settings


logger = logging.getLogger(__name__)


@dataclass
class AzureBlobConfig:
    """Runtime configuration for Azure Blob interactions."""

    enabled: bool
    blob_prefix: str
    connection_string: Optional[str] = None
    account_url: Optional[str] = None
    account_key: Optional[str] = None


class AzureBlobStorageService:
    """Service for uploading user PDFs to Azure Blob Storage."""

    def __init__(self, config: AzureBlobConfig) -> None:
        self._config = config
        self._client_lock = asyncio.Lock()
        self._blob_service_client: Optional[BlobServiceClient] = None
        self._container_clients: Dict[str, ContainerClient] = {}

        if not self._config.enabled:
            logger.info(
                "Azure Blob Storage disabled via configuration; skipping initialization"
            )

    async def upload_user_pdf(
        self,
        *,
        user_id: str,
        source: str,
        upload_file: UploadFile,
    ) -> Optional[str]:
        """Upload a PDF for a user and return the blob URL if successful."""

        if not self._config.enabled:
            return None

        try:
            container_client = await self._get_or_create_container_client(
                settings.upload.CONTAINERS.resumes
            )
        except Exception:
            logger.exception("Failed to initialize Azure container client")
            return None

        blob_name = self._build_blob_name(
            user_id=user_id, source=source, filename=upload_file.filename
        )

        try:
            file_bytes = await upload_file.read()
            await upload_file.seek(0)
        except Exception:
            logger.exception(
                "Failed to read uploaded file stream for Azure persistence"
            )
            return None

        if not file_bytes:
            logger.warning(
                "Skipping Azure upload for user %s - file stream empty", user_id
            )
            return None

        metadata = {
            "user_id": user_id,
            "source": source,
            "original_filename": upload_file.filename or "",
        }

        content_settings = ContentSettings(
            content_type="application/pdf",
            content_disposition=self._format_content_disposition(upload_file.filename),
        )

        try:
            blob_client = container_client.get_blob_client(blob_name)
            await blob_client.upload_blob(
                data=file_bytes,
                overwrite=True,
                metadata=metadata,
                content_settings=content_settings,
            )
            return blob_client.url
        except AzureError as exc:
            logger.warning(
                "Azure Blob upload failed for user %s (source=%s): %s",
                user_id,
                source,
                exc,
            )
            return None
        except Exception:
            logger.exception(
                "Unexpected error during Azure Blob upload for user %s", user_id
            )
            return None

    async def upload_user_pdf_from_bytes(
        self,
        *,
        user_id: str,
        source: str,
        file_bytes: bytes,
        filename: str,
    ) -> Optional[str]:
        """Upload a PDF provided as raw bytes and return the blob URL if successful."""

        if not self._config.enabled:
            return None

        if not file_bytes:
            logger.warning(
                "Skipping Azure upload for user %s - provided byte stream empty",
                user_id,
            )
            return None

        try:
            container_client = await self._get_or_create_container_client(
                settings.upload.CONTAINERS.resumes
            )
        except Exception:
            logger.exception("Failed to initialize Azure container client")
            return None

        blob_name = self._build_blob_name(
            user_id=user_id, source=source, filename=filename
        )

        metadata = {
            "user_id": user_id,
            "source": source,
            "original_filename": filename or "",
        }

        content_settings = ContentSettings(
            content_type="application/pdf",
            content_disposition=self._format_content_disposition(filename),
        )

        try:
            blob_client = container_client.get_blob_client(blob_name)
            await blob_client.upload_blob(
                data=file_bytes,
                overwrite=True,
                metadata=metadata,
                content_settings=content_settings,
            )
            return blob_client.url
        except AzureError as exc:
            logger.warning(
                "Azure Blob upload failed for user %s (source=%s): %s",
                user_id,
                source,
                exc,
            )
            return None
        except Exception:
            logger.exception(
                "Unexpected error during Azure Blob upload for user %s", user_id
            )
            return None

    async def upload_profile_photo(
        self,
        *,
        user_id: str,
        upload_file: UploadFile,
    ) -> Optional[str]:
        """
        Upload profile photo, replacing existing if present.
        Returns public URL on success.
        """
        if not self._config.enabled:
            return None

        try:
            # Delete existing profile photo first
            await self.delete_user_profile_photo(user_id)

            # Determine file extension
            ext = self._get_file_extension(upload_file.filename)
            blob_name = f"{user_id}/profile-photo{ext}"

            # Upload with public access
            return await self._upload_blob(
                blob_name=blob_name,
                upload_file=upload_file,
                content_type=upload_file.content_type or "image/jpeg",
                metadata={
                    "user_id": user_id,
                    "type": "profile_photo",
                },
                container_name=settings.upload.CONTAINERS.images,
            )
        except Exception:
            logger.exception(
                "Unexpected error during profile photo upload for user %s", user_id
            )
            return None

    async def upload_project_image(
        self,
        *,
        user_id: str,
        upload_file: UploadFile,
    ) -> Optional[str]:
        """
        Upload project image with unique timestamp-based naming.
        Returns public URL on success.
        """
        if not self._config.enabled:
            return None

        try:
            timestamp = int(time.time() * 1000)
            ext = self._get_file_extension(upload_file.filename)
            safe_filename = self._sanitize_filename(upload_file.filename or "image")
            # Remove extension from safe_filename if present
            safe_filename = os.path.splitext(safe_filename)[0]
            blob_name = f"{user_id}/projects/{timestamp}_{safe_filename}{ext}"

            return await self._upload_blob(
                blob_name=blob_name,
                upload_file=upload_file,
                content_type=upload_file.content_type or "image/jpeg",
                metadata={
                    "user_id": user_id,
                    "type": "project_image",
                },
                container_name=settings.upload.CONTAINERS.images,
            )
        except Exception:
            logger.exception(
                "Unexpected error during project image upload for user %s", user_id
            )
            return None

    async def delete_user_profile_photo(self, user_id: str) -> None:
        """Delete existing profile photo for user if it exists."""
        if not self._config.enabled:
            return

        try:
            container_client = await self._get_or_create_container_client(
                settings.upload.CONTAINERS.images
            )
        except Exception:
            logger.exception("Failed to initialize Azure container client for deletion")
            return

        # Try all possible extensions
        for ext in [".jpg", ".jpeg", ".png", ".webp", ".gif"]:
            blob_name = f"{user_id}/profile-photo{ext}"
            try:
                blob_client = container_client.get_blob_client(blob_name)
                await blob_client.delete_blob()
                logger.info(f"Deleted existing profile photo: {blob_name}")
                return  # Successfully deleted, exit
            except ResourceNotFoundError:
                continue  # Blob doesn't exist, try next extension
            except AzureError as exc:
                logger.warning("Failed to delete profile photo %s: %s", blob_name, exc)
                continue
            except Exception:
                logger.exception(
                    "Unexpected error deleting profile photo %s", blob_name
                )
                continue

    async def delete_blob_by_url(self, blob_url: str) -> None:
        """Delete a specific blob by its URL."""
        if not self._config.enabled:
            return

        try:
            location = self._extract_container_and_blob(blob_url)
            if not location:
                logger.warning("Could not extract blob location from URL: %s", blob_url)
                return
            container_name, blob_name = location

            container_client = await self._get_or_create_container_client(
                container_name
            )

            blob_client = container_client.get_blob_client(blob_name)
            await blob_client.delete_blob()
            logger.info(f"Deleted blob: {blob_name}")
        except ResourceNotFoundError:
            logger.warning("Blob not found for deletion: %s", blob_url)
        except AzureError as exc:
            logger.warning("Failed to delete blob %s: %s", blob_url, exc)
        except Exception:
            logger.exception("Unexpected error deleting blob %s", blob_url)

    async def _upload_blob(
        self,
        *,
        blob_name: str,
        upload_file: UploadFile,
        content_type: str,
        metadata: dict,
        container_name: str,
    ) -> Optional[str]:
        """
        Internal helper to upload a blob with the given parameters.
        Returns the public URL on success.
        """
        try:
            container_client = await self._get_or_create_container_client(
                container_name
            )
        except Exception:
            logger.exception("Failed to initialize Azure container client")
            return None

        try:
            file_bytes = await upload_file.read()
            await upload_file.seek(0)
        except Exception:
            logger.exception(
                "Failed to read uploaded file stream for Azure persistence"
            )
            return None

        if not file_bytes:
            logger.warning("Skipping Azure upload - file stream empty")
            return None

        content_settings = ContentSettings(
            content_type=content_type,
            content_disposition=self._format_content_disposition(upload_file.filename),
        )

        try:
            blob_client = container_client.get_blob_client(blob_name)
            await blob_client.upload_blob(
                data=file_bytes,
                overwrite=True,
                metadata=metadata,
                content_settings=content_settings,
            )
            logger.info(f"Successfully uploaded blob: {blob_name}")
            return blob_client.url
        except AzureError as exc:
            logger.warning("Azure Blob upload failed for %s: %s", blob_name, exc)
            return None
        except Exception:
            logger.exception(
                "Unexpected error during Azure Blob upload for %s", blob_name
            )
            return None

    async def _get_or_create_container_client(
        self, container_name: str
    ) -> ContainerClient:
        """Lazily initialize and memoize container clients per name."""

        if container_name in self._container_clients:
            return self._container_clients[container_name]

        async with self._client_lock:
            if container_name in self._container_clients:
                return self._container_clients[container_name]

            if self._blob_service_client is None:
                self._blob_service_client = self._build_blob_service_client()

            container_client = self._blob_service_client.get_container_client(
                container_name
            )

            try:
                await container_client.create_container()
                logger.info("Created Azure Blob container '%s'", container_name)
            except ResourceExistsError:
                logger.debug("Azure Blob container '%s' already exists", container_name)

            self._container_clients[container_name] = container_client

        return self._container_clients[container_name]

    def _build_blob_service_client(self) -> BlobServiceClient:
        """Construct a BlobServiceClient using preferred credentials."""

        if self._blob_service_client is not None:
            return self._blob_service_client

        if self._config.connection_string:
            return BlobServiceClient.from_connection_string(
                self._config.connection_string
            )

        if self._config.account_url and self._config.account_key:
            return BlobServiceClient(
                account_url=self._config.account_url,
                credential=self._config.account_key,
            )

        raise RuntimeError("Azure Blob Storage credentials are not configured")

    def _build_blob_name(
        self, *, user_id: str, source: str, filename: Optional[str]
    ) -> str:
        """Create a deterministic blob name for the uploaded PDF."""

        sanitized_source = (source or "unknown").strip().lower()
        base_filename = self._sanitize_filename(filename) or "document.pdf"

        prefix = self._config.blob_prefix.strip("/")
        if prefix:
            return f"{prefix}/{user_id}/{sanitized_source}.pdf"

        return f"{user_id}/{sanitized_source}.pdf"

    @staticmethod
    def _sanitize_filename(filename: Optional[str]) -> str:
        """Return a filesystem-safe filename for metadata purposes."""

        if not filename:
            return ""

        safe = os.path.basename(filename)
        return safe.replace("\r", "").replace("\n", "").replace(" ", "_")

    @staticmethod
    def _format_content_disposition(filename: Optional[str]) -> Optional[str]:
        """Format a Content-Disposition header that preserves the original filename."""

        if not filename:
            return None

        safe_name = filename.replace('"', "")
        return f'attachment; filename="{safe_name}"'

    @staticmethod
    def _get_file_extension(filename: Optional[str]) -> str:
        """Extract file extension from filename, defaulting to .jpg if not found."""
        if not filename:
            return ".jpg"

        _, ext = os.path.splitext(filename)
        if not ext:
            return ".jpg"

        return ext.lower()

    def _extract_container_and_blob(self, blob_url: str) -> Optional[Tuple[str, str]]:
        """
        Extract container and blob name from Azure Blob Storage URL.
        URL format: https://<account>.blob.core.windows.net/<container>/<blob_name>
        """
        try:
            parsed = urlparse(blob_url)
            path = parsed.path.lstrip("/")
            if not path:
                return None

            parts = path.split("/", 1)
            if len(parts) != 2:
                return None

            return parts[0], parts[1]
        except Exception:
            logger.exception("Failed to extract container/blob from URL: %s", blob_url)
            return None


_azure_blob_service: Optional[AzureBlobStorageService] = None


def get_azure_blob_storage_service() -> AzureBlobStorageService:
    """Return a singleton instance of AzureBlobStorageService."""

    global _azure_blob_service

    if _azure_blob_service is None:
        config = AzureBlobConfig(
            enabled=_is_storage_enabled(),
            blob_prefix=settings.upload.AZURE_STORAGE_BLOB_PREFIX,
            connection_string=settings.azure_storage_connection_string,
            account_url=settings.azure_storage_account_url,
            account_key=settings.azure_storage_account_key,
        )
        _azure_blob_service = AzureBlobStorageService(config)

    return _azure_blob_service


def _is_storage_enabled() -> bool:
    """Determine whether Azure storage should be active based on config and env vars."""

    if not settings.upload.ENABLE_AZURE_STORAGE:
        return False

    if settings.azure_storage_connection_string:
        return True

    if settings.azure_storage_account_url and settings.azure_storage_account_key:
        return True

    logger.warning(
        "Azure storage is enabled but no credentials were provided; disabling at runtime",
    )
    return False
