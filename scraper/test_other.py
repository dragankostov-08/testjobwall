from core.database import get_supabase
client = get_supabase()

res = client.table('jobs').select('title, company').contains('categories', ['Останато']).limit(50).execute()
with open("other_jobs.txt", "w", encoding="utf-8") as f:
    for r in res.data:
        f.write(f"{r['title']} - {r['company']}\n")
