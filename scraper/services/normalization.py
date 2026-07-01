"""
Job normalization service - standardizes scraped jobs to a unified format.
"""

from datetime import datetime, timedelta
from typing import List, Optional
import re
from urllib.parse import urlparse

from scrapers.base_scraper import ScrapedJob
from core.schemas import JobSchema
from core.logger import get_logger
from core.settings import settings
from core.config_loader import keywords_config

logger = get_logger(__name__)


class NormalizationService:
    """Normalizes scraped jobs to a standard format."""

    REMOTE_KEYWORDS = keywords_config.get('remote_keywords', [])
    CATEGORY_KEYWORDS = keywords_config.get('category_keywords', {})
    LOCATION_VARIANTS = keywords_config.get('location_variants', {})

    @staticmethod
    def _extract_salary(salary_text: str) -> Optional[dict]:
        """Extract salary values, currency, and disclosure flag from raw text."""
        if not salary_text:
            return None
            
        text = salary_text.lower().replace(",", "")
        metadata = {}
        
        # Match currency
        currency = "MKD"
        if "eur" in text or "€" in text:
            currency = "EUR"
        elif "usd" in text or "$" in text:
            currency = "USD"
            
        # Match ranges e.g. 30000 - 40000 den
        range_match = re.search(r'(\d+)\s*[-toдо]+\s*(\d+)', text)
        if range_match:
            metadata["salary_min"] = int(range_match.group(1))
            metadata["salary_max"] = int(range_match.group(2))
        else:
            single_match = re.search(r'(\d+)', text)
            if single_match:
                val = int(single_match.group(1))
                metadata["salary_min"] = val
                metadata["salary_max"] = val
                
        if "по договор" in text or "negotiable" in text or "договор" in text:
            metadata["salary_disclosed"] = False
        else:
            metadata["salary_disclosed"] = bool(metadata.get("salary_min"))
            
        metadata["currency"] = currency
        return metadata

    @staticmethod
    def _normalize_location(location: str) -> tuple[str, bool]:
        """Normalize location and return (normalized_location, is_confident)"""
        loc = (location or "").strip()
        if not loc or loc.lower() in ["", "unknown", "непозната"]:
            return "Unknown", False
            
        loc_lower = loc.lower()
        
        for std_name, variants in NormalizationService.LOCATION_VARIANTS.items():
            for variant in variants:
                # Match full word or if variant is exactly the location
                pattern = r'(?:\b|^)' + re.escape(variant) + r'(?:\b|$)'
                if re.search(pattern, loc_lower):
                    return std_name, True
                    
        return loc, False

    @staticmethod
    def _fallback_company(company: str, description: Optional[str], url: str) -> str:
        """Company extraction fallback chain: structured -> description pattern -> domain -> Unknown"""
        company = (company or "").strip()
        if company and company.lower() not in ["", "unknown", "непозната", "непознато"]:
            return company
            
        # Description match
        if description:
            desc = description[:500]
            match = re.search(r'(?i)(?:компанијата|клиентот)\s+([A-ZА-Ш][a-zа-шA-ZА-Ш0-9\s\&\-\.]+?)(?:\s+бара|\s+вработува|\s+има потреба)', desc)
            if match:
                return match.group(1).strip()
                
        # Domain fallback
        if url:
            try:
                domain = urlparse(url).netloc.replace("www.", "")
                if domain and domain not in ["kariera.mk", "vrabotuvanje.com.mk", "najdirabota.com.mk", "jobs.com.mk", "oglasizarabota.mk", "apliciraj.mk"]:
                    return domain.split('.')[0].capitalize()
            except Exception:
                pass
                
        return "Unknown"

    @staticmethod
    def normalize_job(
        scraped_job: ScrapedJob,
        source_name: str,
        source_id: str,
    ) -> JobSchema:
        """Normalize a scraped job to standard format."""
        # Determine if remote
        is_remote = scraped_job.is_remote or NormalizationService._is_remote(
            scraped_job.title + " " + scraped_job.location
        )

        # Determine category
        categories = NormalizationService._categorize(scraped_job.title, scraped_job.description)

        # Calculate expiration date
        expires_at = datetime.utcnow() + timedelta(days=settings.expired_job_days)

        # Build company logo URL
        company_logo_url = scraped_job.company_logo_url

        # Fallback company chain
        final_company = NormalizationService._fallback_company(scraped_job.company, scraped_job.description, scraped_job.url)

        # Normalize location
        norm_location, loc_confident = NormalizationService._normalize_location(scraped_job.location)

        # Extract salary metadata
        salary_metadata = NormalizationService._extract_salary(scraped_job.salary) or {}
        salary_metadata["location_confidence"] = loc_confident

        return JobSchema(
            title=scraped_job.title.strip(),
            company=final_company,
            location=norm_location,
            url=scraped_job.url.strip(),
            description=scraped_job.description,
            employment_type=scraped_job.employment_type,
            categories=categories,
            is_remote=is_remote,
            salary=scraped_job.salary,
            source_name=source_name,
            source_url=None,
            application_url=scraped_job.url,
            posted_date=scraped_job.posted_date,
            company_logo_url=company_logo_url,
            expires_at=expires_at,
            metadata=salary_metadata,
        )

    @staticmethod
    def _is_remote(text: str) -> bool:
        """Check if job is remote based on keywords."""
        text_lower = text.lower()
        for keyword in NormalizationService.REMOTE_KEYWORDS:
            pattern = r'(?:\b|\s|^)' + re.escape(keyword) + r'(?:\b|\s|$)'
            if re.search(pattern, text_lower):
                return True
        return False

    @staticmethod
    def _categorize(title: str, description: str = "") -> List[str]:
        """Categorize job based on title and description keywords."""
        title_lower = title.lower()
        desc_lower = (description or "")[:500].lower() # limit to first 500 chars to avoid false positives
        categories = []

        # 1. Primary Check: Search in the Title
        for category, keywords in NormalizationService.CATEGORY_KEYWORDS.items():
            for keyword in keywords:
                pattern = r'(?:\b|^)' + re.escape(keyword) + r'(?:\b|$)'
                if re.search(pattern, title_lower):
                    categories.append(category)
                    break

        # 2. Secondary Check: If no category found, search the top of the description
        if not categories and desc_lower:
            for category, keywords in NormalizationService.CATEGORY_KEYWORDS.items():
                for keyword in keywords:
                    pattern = r'(?:\b|^)' + re.escape(keyword) + r'(?:\b|$)'
                    if re.search(pattern, desc_lower):
                        categories.append(category)
                        break

        if not categories:
            categories = ["Останато"]

        return categories

    @staticmethod
    def normalize_batch(
        scraped_jobs: List[ScrapedJob],
        source_name: str,
        source_id: str,
    ) -> List[JobSchema]:
        """Normalize a batch of scraped jobs."""
        normalized = []
        for job in scraped_jobs:
            try:
                normalized_job = NormalizationService.normalize_job(job, source_name, source_id)
                normalized.append(normalized_job)
            except Exception as e:
                logger.error(f"Failed to normalize job: {str(e)}", source=source_name)
                continue

        return normalized
