from core.database import get_supabase

client = get_supabase()

from services.normalization import NormalizationService

# Fetch all jobs
response = client.table("jobs").select("id, title, description, categories").execute()
jobs = response.data

updates = 0
for job in jobs:
    new_cats = NormalizationService._categorize(job.get("title") or "", job.get("description") or "")
    if new_cats != job.get("categories"):

        client.table("jobs").update({"categories": new_cats}).eq("id", job["id"]).execute()
        updates += 1

print(f"Done! Updated {updates} jobs.")
