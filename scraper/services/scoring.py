import math
import re
from datetime import datetime, timezone
from core.config_loader import scoring_config
from core.schemas import JobSchema, SourceSchema
from core.logger import get_logger

logger = get_logger(__name__)

def compute_job_score(job: JobSchema, source: SourceSchema, trending_keywords: set = None, client = None) -> tuple[float, dict, str|None]:
    """
    Computes a job ranking score incrementally, and returns a breakdown.
    Returns: (total_score, score_breakdown, ml_model_version)
    """
    if trending_keywords is None:
        trending_keywords = set()
        
    score_breakdown = {}
    total_score = 1.00 # Base minimum
    
    # 1. Advanced Anti-spam / fraud rules (Hard exclusion)
    if job.company and job.company.lower() in ["", "unknown", "непозната"]:
        return -1.0, {"spam": "Company is unknown"}, None
        
    desc_lower = (job.description or "").lower()
    
    # 1a. Requests for payment or personal documents
    spam_phrases = ["pay to apply", "send money", "испратете лична карта", "слика од пасош", "upload id", "копија од пасош", "bank details", "кредитна картичка", "credit card"]
    if any(p in desc_lower for p in spam_phrases):
        return -1.0, {"spam": "Suspicious request for documents or payment"}, None
        
    # 1b. Shortened links in description
    short_links = ["bit.ly/", "tinyurl.com/", "t.co/", "cutt.ly/", "goo.gl/"]
    if any(sl in desc_lower for sl in short_links):
        return -1.0, {"spam": "Contains shortened or non-allowlisted links"}, None

    # 1c. Unrealistic salary
    salary_meta = getattr(job, "metadata", {}) or {}
    sal_min = salary_meta.get("salary_min")
    curr = salary_meta.get("currency")
    if sal_min:
        if curr == "MKD" and sal_min > 300000 and len(desc_lower) < 200:
            return -1.0, {"spam": "Unrealistic salary without context"}, None
        if curr in ["EUR", "USD"] and sal_min > 8000 and len(desc_lower) < 200:
            return -1.0, {"spam": "Unrealistic salary without context"}, None
            
    # 1d. Duplicate description across different companies
    if client and job.description and len(job.description) > 50:
        try:
            from datetime import timedelta
            from rapidfuzz import fuzz  # type: ignore
            seven_days_ago = (datetime.utcnow() - timedelta(days=7)).isoformat()
            
            resp = client.table("jobs").select("company, description").eq("title", job.title).gte("created_at", seven_days_ago).execute()
            for r in resp.data:
                if r.get("company", "").lower() != job.company.lower():
                    existing_desc = r.get("description") or ""
                    if existing_desc and fuzz.token_sort_ratio(desc_lower, existing_desc.lower()) > 85:
                        return -1.0, {"spam": "Duplicate description under different company"}, None
        except Exception as e:
            logger.warning(f"Failed to check description duplicate: {e}")

    # 2. Cold-start / always-on quality proxy
    quality_conf = scoring_config.get('quality', {})
    q_score = 0.0
    
    if job.salary and job.salary.strip() and job.salary.lower() not in ["none", "null"]:
        has_sal_score = quality_conf.get('has_salary', 8.0)
        q_score += has_sal_score
        score_breakdown['has_salary'] = has_sal_score
        
    if job.description:
        desc_lower = job.description.lower()
        if any(req in desc_lower for req in ["requirements", "потребни квалификации", "бараме", "услови", "skills", "вештини"]):
            req_score = quality_conf.get('has_clear_requirements_section', 4.0)
            q_score += req_score
            score_breakdown['clear_requirements'] = req_score
            
        max_desc = quality_conf.get('description_length_max_score', 10.0)
        divisor = quality_conf.get('description_length_divisor', 50.0)
        desc_score = min(len(job.description) / divisor, max_desc)
        q_score += desc_score
        score_breakdown['description_length'] = round(desc_score, 2)
        
    if job.company and job.company.lower() != "unknown":
        comp_score = quality_conf.get('company_confidence_high', 6.0)
        q_score += comp_score
        score_breakdown['company_confidence'] = comp_score
        
    total_score += q_score
    
    # 3. Source trust scoring
    source_trust_mult = scoring_config.get('source_trust_multiplier', 10.0)
    trust_score = getattr(source, 'trust_score', 0.70)
    st_score = trust_score * source_trust_mult
    total_score += st_score
    score_breakdown['source_trust'] = round(st_score, 2)
    
    # 3b. Trending Keyword Bonus
    trend_score = 0.0
    if trending_keywords:
        job_tokens = set(re.findall(r'\b[A-Za-zА-Ша-ш0-9]{4,}\b', (job.title or "").lower()))
        matches = job_tokens.intersection(trending_keywords)
        if matches:
            trend_mult = scoring_config.get('keyword_trend_score', 5.0)
            trend_score = min(len(matches) * 2.0, trend_mult)  # Cap bonus
            total_score += trend_score
            score_breakdown['trending_bonus'] = round(trend_score, 2)
    
    # 4. Freshness decay
    posted = job.posted_date or datetime.now(timezone.utc)
    if posted.tzinfo is None:
        posted = posted.replace(tzinfo=timezone.utc)
        
    days_since_posted = max(0, (datetime.now(timezone.utc) - posted).days)
    base_freshness = scoring_config.get('base_freshness', 10.0)
    decay_constant = scoring_config.get('decay_constant', 14.0)
    
    freshness_score = max(0, base_freshness * math.exp(-days_since_posted / decay_constant))
    total_score += freshness_score
    score_breakdown['freshness'] = round(freshness_score, 2)
    
    ml_model_version = None
    # 5. Machine Learning Layer (To be added via ml_classifier)
    if scoring_config.get('enable_ml_scoring', False):
        try:
            from services.ml_classifier import get_ml_predictions
            ml_pred = get_ml_predictions(job)
            if ml_pred:
                remote_prob = ml_pred.get('remote_probability', 0)
                quality_ml = ml_pred.get('quality_score', 0)
                ml_model_version = ml_pred.get('model_version')
                
                rm_score = remote_prob * scoring_config.get('ml', {}).get('remote_probability', 20.0)
                qs_score = quality_ml * scoring_config.get('ml', {}).get('quality_score', 30.0)
                
                total_score += rm_score + qs_score
                score_breakdown['ml_remote_boost'] = round(rm_score, 2)
                score_breakdown['ml_quality_boost'] = round(qs_score, 2)
        except Exception as e:
            logger.warning(f"ML scoring failed: {e}")
            
    return round(total_score, 2), score_breakdown, ml_model_version
