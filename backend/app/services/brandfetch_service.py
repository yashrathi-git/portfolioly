"""Brandfetch integration utilities for company logo enrichment."""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from typing import Dict, Iterable, List, Optional
from urllib.parse import quote

import httpx

from ..core.config import settings
from ..schemas.portfolio import Education, PortfolioData, WorkExperience
from .portfolio_service import get_portfolio_service

logger = logging.getLogger(__name__)


class BrandfetchError(Exception):
    """Custom exception for Brandfetch-related errors."""


@dataclass
class BrandfetchSearchResult:
    """Normalized Brandfetch search result."""

    icon: Optional[str]
    domain: Optional[str]
    name: Optional[str] = None
    brand_id: Optional[str] = None


@dataclass
class LogoCandidate:
    """Candidate item for logo enrichment."""

    section: str
    index: int
    display_name: str
    normalized_name: str
    existing_logo_url: Optional[str]
    existing_brandfetch_logo: Optional[str]
    existing_brandfetch_domain: Optional[str]


@dataclass
class LogoUpdate:
    """Logo enrichment update details for persistence."""

    section: str
    index: int
    brandfetch_logo_url: Optional[str]
    brandfetch_domain: Optional[str]
    has_user_logo: bool


class BrandfetchService:
    """Service wrapper around Brandfetch search API."""

    def __init__(self) -> None:
        self._settings = settings.brandfetch
        self._base_url = self._settings.base_url.rstrip("/")

    @property
    def is_enabled(self) -> bool:
        return bool(self._settings.enabled and self._settings.client_id)

    async def search_company(self, name: str) -> Optional[BrandfetchSearchResult]:
        """Search for a company logo using Brandfetch search API."""

        if not self.is_enabled:
            return None

        sanitized = (name or "").strip()
        if not sanitized:
            return None

        url = f"{self._base_url}/search/{quote(sanitized)}"
        params = {"c": self._settings.client_id}

        try:
            async with httpx.AsyncClient(
                timeout=self._settings.search_timeout_seconds
            ) as client:
                response = await client.get(url, params=params)
        except httpx.HTTPError as exc:
            logger.warning("Brandfetch request failed for '%s': %s", sanitized, exc)
            return None

        if response.status_code == 404:
            return None

        if response.status_code >= 400:
            logger.warning(
                "Brandfetch request returned %s for '%s': %s",
                response.status_code,
                sanitized,
                response.text,
            )
            return None

        try:
            payload = response.json()
        except ValueError as exc:
            logger.warning(
                "Failed to parse Brandfetch response for '%s': %s", sanitized, exc
            )
            return None

        if not isinstance(payload, list) or not payload:
            return None

        first_match = next((item for item in payload if isinstance(item, dict)), None)
        if not first_match:
            return None

        icon = first_match.get("icon")
        domain = first_match.get("domain")
        brand_name = first_match.get("name")
        brand_id = first_match.get("brandId") or first_match.get("brand_id")

        if not icon and not domain:
            return None

        return BrandfetchSearchResult(
            icon=icon,
            domain=domain,
            name=brand_name,
            brand_id=brand_id,
        )


def _extract_latest_date(obj: WorkExperience | Education) -> tuple[int, int]:
    """Return sortable tuple (year, month) using end_date fallback to start_date."""

    date_info = getattr(obj, "end_date", None) or getattr(obj, "start_date", None)
    if not date_info:
        return (0, 0)

    year = getattr(date_info, "year", None) or 0
    month = getattr(date_info, "month", None) or 0
    return (year, month)


def _normalize_name(name: str) -> str:
    return name.strip().lower()


def _collect_candidates(
    portfolio: PortfolioData, limit: int = 8
) -> List[LogoCandidate]:
    candidates: List[LogoCandidate] = []

    work_items = sorted(
        [
            (idx, exp, _extract_latest_date(exp))
            for idx, exp in enumerate(portfolio.work_experiences or [])
        ],
        key=lambda item: item[2],
        reverse=True,
    )

    education_items = sorted(
        [
            (idx, edu, _extract_latest_date(edu))
            for idx, edu in enumerate(portfolio.education or [])
        ],
        key=lambda item: item[2],
        reverse=True,
    )

    for original_index, exp, _ in work_items:
        if len(candidates) >= limit:
            break

        name = (exp.organization or "").strip()
        if not name:
            continue

        if (exp.logo_url or "").strip():
            continue  # User-provided logo present

        if (exp.brandfetch_logo_url or "").strip():
            continue  # Already enriched

        candidates.append(
            LogoCandidate(
                section="work_experiences",
                index=original_index,
                display_name=name,
                normalized_name=_normalize_name(name),
                existing_logo_url=exp.logo_url,
                existing_brandfetch_logo=exp.brandfetch_logo_url,
                existing_brandfetch_domain=exp.brandfetch_domain,
            )
        )

    if len(candidates) < limit:
        for original_index, edu, _ in education_items:
            if len(candidates) >= limit:
                break

            name = (edu.institution or "").strip()
            if not name:
                continue

            if (edu.logo_url or "").strip():
                continue

            if (edu.brandfetch_logo_url or "").strip():
                continue

            candidates.append(
                LogoCandidate(
                    section="education",
                    index=original_index,
                    display_name=name,
                    normalized_name=_normalize_name(name),
                    existing_logo_url=edu.logo_url,
                    existing_brandfetch_logo=edu.brandfetch_logo_url,
                    existing_brandfetch_domain=edu.brandfetch_domain,
                )
            )

    return candidates


async def _fetch_results(
    service: BrandfetchService, names: Iterable[str]
) -> Dict[str, Optional[BrandfetchSearchResult]]:
    tasks = [service.search_company(name) for name in names]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    mapping: Dict[str, Optional[BrandfetchSearchResult]] = {}
    for name, result in zip(names, results):
        if isinstance(result, Exception):
            logger.warning("Brandfetch search raised for '%s': %s", name, result)
            mapping[name] = None
        else:
            mapping[name] = result
    return mapping


async def enrich_portfolio_logos(user_id: str, portfolio_snapshot: dict) -> None:
    """Background task to enrich stored portfolio data with Brandfetch logos."""

    service = get_brandfetch_service()
    if not service.is_enabled:
        logger.info("Brandfetch enrichment skipped: service disabled")
        return

    if not portfolio_snapshot:
        logger.info("Brandfetch enrichment skipped: empty portfolio snapshot")
        return

    try:
        portfolio = PortfolioData.model_validate(portfolio_snapshot)
    except Exception as exc:  # pragma: no cover - defensive
        logger.warning(
            "Brandfetch enrichment skipped: failed to validate portfolio snapshot for %s: %s",
            user_id,
            exc,
        )
        return

    candidates = _collect_candidates(portfolio)
    if not candidates:
        logger.info("Brandfetch enrichment: no candidates for user %s", user_id)
        return

    unique_name_mapping: Dict[str, str] = {}
    ordered_names: List[str] = []
    for candidate in candidates:
        if candidate.normalized_name not in unique_name_mapping:
            unique_name_mapping[candidate.normalized_name] = candidate.display_name
            ordered_names.append(candidate.display_name)

    results = await _fetch_results(service, ordered_names)

    updates: List[LogoUpdate] = []
    for candidate in candidates:
        display_name = unique_name_mapping.get(candidate.normalized_name)
        if not display_name:
            continue

        result = results.get(display_name)
        if not result or not result.icon:
            continue

        if (
            candidate.existing_brandfetch_logo == result.icon
            and candidate.existing_brandfetch_domain == result.domain
        ):
            continue

        updates.append(
            LogoUpdate(
                section=candidate.section,
                index=candidate.index,
                brandfetch_logo_url=result.icon,
                brandfetch_domain=result.domain,
                has_user_logo=bool((candidate.existing_logo_url or "").strip()),
            )
        )

    if not updates:
        logger.info("Brandfetch enrichment: no updates to apply for user %s", user_id)
        return

    portfolio_service = get_portfolio_service()

    try:
        await portfolio_service.apply_brandfetch_logo_updates(user_id, updates)
        logger.info(
            "Brandfetch enrichment applied for user %s (%d updates)",
            user_id,
            len(updates),
        )
    except Exception as exc:  # pragma: no cover - defensive
        logger.warning(
            "Failed to persist Brandfetch logo updates for %s: %s", user_id, exc
        )


_brandfetch_service: Optional[BrandfetchService] = None


def get_brandfetch_service() -> BrandfetchService:
    """Get or create singleton Brandfetch service instance."""

    global _brandfetch_service
    if _brandfetch_service is None:
        _brandfetch_service = BrandfetchService()
    return _brandfetch_service
