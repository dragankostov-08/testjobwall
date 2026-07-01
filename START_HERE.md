# 🚀 Quick Start - 10 Minutes to Running

This is the fastest way to get JobWall running locally with Supabase.

## Prerequisites (2 min)

- Python 3.12+ (`python --version`)
- Node.js 18+ (`node --version`)
- Supabase account (free at supabase.com)

## Setup Database (3 min)

1. **Create Supabase project**:
   - Go to https://supabase.com/dashboard
   - New Project → name: "jobwall" → Create
   - Wait 2-3 minutes

2. **Get connection string**:
   - Settings → Database → Connection Pooler → Copy URI
   - Save it somewhere

3. **Create database schema**:
   - SQL Editor → New Query
   - Copy entire contents of `schema.sql` (in root folder)
   - Run Query

## Setup Scraper (3 min)

```bash
cd scraper
python quick_setup.py
# Follow prompts and paste your DATABASE_URL
```

## Setup Frontend (1 min)

```bash
cp .env.local.example .env.local
# Edit .env.local and add:
# - NEXT_PUBLIC_SUPABASE_URL (from Supabase Settings → API)
# - NEXT_PUBLIC_SUPABASE_ANON_KEY (from Supabase Settings → API)
# - NEXT_PUBLIC_SCRAPER_URL=http://localhost:8000
```

## Run Everything (1 min)

**Terminal 1**:
```bash
cd scraper
SCRAPER_MODE=server python main.py
# Wait for: "Starting FastAPI server"
```

**Terminal 2**:
```bash
npm run dev
# Wait for: "Local: http://localhost:3000"
```

## Done! ✅

- Visit http://localhost:3000 (see jobs)
- Go to http://localhost:3000/admin (trigger scrapes)
- Check http://localhost:8000/health (scraper status)

## Next Steps

- **Detailed setup**: See `SETUP_GUIDE.md`
- **Commands reference**: See `QUICK_REFERENCE.md`
- **Troubleshooting**: See `QUICK_REFERENCE.md` troubleshooting section
- **Deploy**: See `DEPLOYMENT.md`

---

**That's it! You're running JobWall locally with Python + Supabase.** 🎉

For issues, see `QUICK_REFERENCE.md` troubleshooting section.
