"""Azure Blob Storage service helpers for persisting user-uploaded PDFs."""

from __future__ import annotations

import asyncio
import logging
import os
from dataclasses import dataclass
from typing import Optional

from azure.core.exceptions import AzureError, ResourceExistsError
from azure.storage.blob import ContentSettings
from azure.storage.blob.aio import BlobServiceClient, ContainerClient
from fastapi import UploadFile

from ..core.config import settings


logger = logging.getLogger(__name__)


@dataclass
class AzureBlobConfig:
    """Runtime configuration for Azure Blob interactions."""

    enabled: bool
    container_name: str
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
        self._container_client: Optional[ContainerClient] = None

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
            container_client = await self._get_or_create_container_client()
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

    async def _get_or_create_container_client(self) -> ContainerClient:
        """Lazily initialize and memoize the container client."""

        if self._container_client is not None:
            return self._container_client

        async with self._client_lock:
            if self._container_client is not None:
                return self._container_client

            blob_service_client = self._build_blob_service_client()
            container_client = blob_service_client.get_container_client(
                self._config.container_name
            )

            try:
                await container_client.create_container()
                logger.info(
                    "Created Azure Blob container '%s'", self._config.container_name
                )
            except ResourceExistsError:
                logger.debug(
                    "Azure Blob container '%s' already exists",
                    self._config.container_name,
                )

            self._blob_service_client = blob_service_client
            self._container_client = container_client

        return self._container_client

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
        return safe.replace("\r", "").replace("\n", "")

    @staticmethod
    def _format_content_disposition(filename: Optional[str]) -> Optional[str]:
        """Format a Content-Disposition header that preserves the original filename."""

        if not filename:
            return None

        safe_name = filename.replace('"', "")
        return f'attachment; filename="{safe_name}"'


_azure_blob_service: Optional[AzureBlobStorageService] = None


def get_azure_blob_storage_service() -> AzureBlobStorageService:
    """Return a singleton instance of AzureBlobStorageService."""

    global _azure_blob_service

    if _azure_blob_service is None:
        config = AzureBlobConfig(
            enabled=_is_storage_enabled(),
            container_name=settings.upload.AZURE_STORAGE_CONTAINER,
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
