import unittest
from rapidfuzz import fuzz
import os
import sys

os.environ["SUPABASE_URL"] = "http://localhost"
os.environ["SUPABASE_KEY"] = "mock_key"

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.normalization import NormalizationService

class TestRuleEngine(unittest.TestCase):

    def test_extract_salary(self):
        # MKD basic
        res1 = NormalizationService._extract_salary("30000 denari")
        self.assertEqual(res1["salary_min"], 30000)
        self.assertEqual(res1["salary_max"], 30000)
        self.assertEqual(res1["currency"], "MKD")
        self.assertTrue(res1["salary_disclosed"])
        
        # Range with comma
        res2 = NormalizationService._extract_salary("40,000 - 50000 MKD")
        self.assertEqual(res2["salary_min"], 40000)
        self.assertEqual(res2["salary_max"], 50000)
        
        # EUR
        res3 = NormalizationService._extract_salary("1000 - 1500 EUR")
        self.assertEqual(res3["currency"], "EUR")
        self.assertEqual(res3["salary_max"], 1500)
        
        # Negotiable
        res4 = NormalizationService._extract_salary("Плата по договор")
        self.assertFalse(res4["salary_disclosed"])
        self.assertNotIn("salary_min", res4)

    def test_fallback_company(self):
        # Valid company
        c1 = NormalizationService._fallback_company("Kariera LLC", "", "")
        self.assertEqual(c1, "Kariera LLC")
        
        # Description match
        c2 = NormalizationService._fallback_company("Unknown", "Компанијата Макпетрол вработува 5 работници", "")
        self.assertEqual(c2, "Макпетрол")
        
        c3 = NormalizationService._fallback_company("непозната", "Клиентот T-Mobile бара агенти", "")
        self.assertEqual(c3, "T-Mobile")
        
        # Domain fallback
        c4 = NormalizationService._fallback_company("", "", "https://www.fakedomain.com/jobs/123")
        self.assertEqual(c4, "Fakedomain")

    def test_rapidfuzz_dedup_logic(self):
        title1 = "Senior Frontend Developer (React)"
        title2 = "Frontend Developer - Senior React"
        title3 = "Backend Java Developer"
        
        score1 = fuzz.token_sort_ratio(title1.lower(), title2.lower())
        score2 = fuzz.token_sort_ratio(title1.lower(), title3.lower())
        
        self.assertTrue(score1 > 75)
        self.assertTrue(score2 < 75)
        
    def test_location_normalization(self):
        l1, conf1 = NormalizationService._normalize_location("skp")
        self.assertEqual(l1, "Skopje")
        self.assertTrue(conf1)
        
        l2, conf2 = NormalizationService._normalize_location("битола")
        self.assertEqual(l2, "Bitola")
        self.assertTrue(conf2)
        
        l3, conf3 = NormalizationService._normalize_location("unknown")
        self.assertEqual(l3, "Unknown")
        self.assertFalse(conf3)
        
        l4, conf4 = NormalizationService._normalize_location("Some Random City")
        self.assertEqual(l4, "Some Random City")
        self.assertFalse(conf4)
        
    def test_spam_detection(self):
        from services.scoring import compute_job_score
        from core.schemas import JobSchema, SourceSchema
        
        # Test short link spam
        job1 = JobSchema(title="Test", company="Company", location="Skopje", url="http://test.com", source_name="Test", description="Apply here: bit.ly/12345")
        source = SourceSchema(id="00000000-0000-0000-0000-000000000000", name="Test", base_url="http://test.com", active=True)
        score1, breakdown1, _ = compute_job_score(job1, source)
        self.assertEqual(score1, -1.0)
        self.assertIn("spam", breakdown1)
        
        # Test document request spam
        job2 = JobSchema(title="Test", company="Company", location="Skopje", url="http://test.com", source_name="Test", description="ве молиме испратете слика од пасош")
        score2, breakdown2, _ = compute_job_score(job2, source)
        self.assertEqual(score2, -1.0)
        
        # Test unrealistic salary spam
        job3 = JobSchema(title="Test", company="Company", location="Skopje", url="http://test.com", source_name="Test", description="Short description", metadata={"salary_min": 600000, "currency": "MKD"})
        score3, breakdown3, _ = compute_job_score(job3, source)
        self.assertEqual(score3, -1.0)

    def test_freshness_decay(self):
        from services.scoring import compute_job_score
        from core.schemas import JobSchema, SourceSchema
        from datetime import datetime, timedelta, timezone
        
        now = datetime.now(timezone.utc)
        source = SourceSchema(id="00000000-0000-0000-0000-000000000000", name="Test", base_url="http://test.com", active=True)
        
        # Job posted today
        job_today = JobSchema(title="Test", company="Company", location="Skopje", url="http://test.com", source_name="Test", posted_date=now)
        score_today, br_today, _ = compute_job_score(job_today, source)
        
        # Job posted 14 days ago (decay constant)
        job_old = JobSchema(title="Test", company="Company", location="Skopje", url="http://test.com", source_name="Test", posted_date=now - timedelta(days=14))
        score_old, br_old, _ = compute_job_score(job_old, source)
        
        # Job posted 30 days ago
        job_older = JobSchema(title="Test", company="Company", location="Skopje", url="http://test.com", source_name="Test", posted_date=now - timedelta(days=30))
        score_older, br_older, _ = compute_job_score(job_older, source)
        
        # Verify freshness scores decrease predictably
        self.assertTrue(br_today["freshness"] > br_old["freshness"])
        self.assertTrue(br_old["freshness"] > br_older["freshness"])
        
if __name__ == '__main__':
    unittest.main()
