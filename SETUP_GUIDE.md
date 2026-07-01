# JobWall Complete Setup Guide - Supabase + Python Scraper

## Overview

This guide walks you through setting up JobWall with:
- **Frontend**: Next.js React app (existing)
- **Backend**: Python scraper with APScheduler
- **Database**: Supabase (managed PostgreSQL)

Everything works together with the frontend connecting to Supabase and the scraper filling it with data.

## Architecture

```
┌─────────────────────────────────────────────────┐
│         React Frontend (Next.js)               │
│  - Displays jobs from Supabase               │
│  - Admin panel triggers Python scraper       │
│  - Uses Supabase JS client                   │
└──────────────┬──────────────────────────────────┘
               │
        ┌──────┴──────┬─────────────────┐
        │             │                 │
        ▼             ▼                 ▼
    Supabase      Python Scraper    Your App
    (Database)    (Port 8000)        (Port 3000)
```

## Prerequisites

- Supabase account (free at https://supabase.com)
- Node.js 18+ (for Next.js frontend)
- Python 3.12+ (for scraper)
- Git (for version control)

## Complete Setup (15-20 minutes)

### Step 1: Create Supabase Project (5 min)

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - **Project name**: `jobwall`
   - **Database password**: Save this! (you'll need it)
   - **Region**: Choose closest to you
   - **Plan**: Free tier

4. Wait for project creation (2-3 minutes)

### Step 2: Get Database Connection String (2 min)

1. Open your project dashboard
2. Go to **Settings → Database**
3. Find **Connection Pooler** section
4. Click **URI** tab
5. **Copy the entire connection string**

Save it somewhere safe - you'll use it next.

### Step 3: Run Database Schema (3 min)

1. In your project, go to **SQL Editor**
2. Click **New Query**
3. Copy entire contents of [schema.sql](../schema.sql) from root directory
4. Paste it in the SQL editor
5. Click **Run** or press `Ctrl+Enter`

Wait for success message. Then check **Table Editor** to verify `sources` and `jobs` tables exist.

### Step 4: Configure Frontend (2 min)

1. In root directory, update `.env.local`:

```env
# Existing Supabase configuration (should already be there)
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]

# Add this for scraper communication
NEXT_PUBLIC_SCRAPER_URL=http://localhost:8000
```

2. Get the values from Supabase:
   - **Settings → API → Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Settings → API → anon key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 5: Setup Python Scraper (5 min)

```bash
# Navigate to scraper directory
cd scraper

# Windows: Run setup script
setup.bat

# Linux/macOS: Run setup script
bash setup.sh

# Or manual setup:
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env

# Edit .env with your Supabase DATABASE_URL
# DATABASE_URL=postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

### Step 6: Start Everything

**Terminal 1 - Python Scraper**:
```bash
cd scraper
source venv/bin/activate  # or venv\Scripts\activate
SCRAPER_MODE=server python main.py
```

You should see:
```
Starting FastAPI server with scheduler
Scraper running on http://0.0.0.0:8000
```

**Terminal 2 - Next.js Frontend**:
```bash
npm run dev
```

You should see:
```
Local:        http://localhost:3000
```

### Step 7: Verify Everything Works

1. **Check scraper health**: http://localhost:8000/health
   - Should see green status and job count

2. **Check frontend**: http://localhost:3000
   - Should display jobs from Supabase

3. **Check admin panel**: http://localhost:3000/admin
   - Click "Trigger Scrape" button
   - Should see success message

## File Structure

```
jobwall/
├── src/                              # React frontend
│   ├── app/
│   │   ├── page.tsx                 # Home page with jobs
│   │   ├── admin/page.tsx           # Admin panel
│   │   └── api/
│   │       └── admin/scrape/        # API bridge to Python scraper
│   └── lib/
│       └── supabase/client.ts       # Supabase configuration
│
└── scraper/                          # Python scraper
    ├── core/
    │   ├── settings.py              # Configuration
    │   ├── database.py              # Database connection
    │   ├── models.py                # SQLAlchemy models
    │   └── schemas.py               # Pydantic schemas
    ├── scrapers/                    # Individual job scrapers
    │   ├── base_scraper.py
    │   ├── kariera_mk.py
    │   └── ... (11 total)
    ├── services/
    │   ├── deduplication.py
    │   ├── normalization.py
    │   └── job_processor.py
    ├── scheduler/
    │   └── scheduler.py             # APScheduler setup
    ├── main.py                      # Entry point
    ├── requirements.txt             # Python dependencies
    └── .env                         # Configuration (create from .env.example)
```

## How It Works

### Job Flow

1. **Frontend requests jobs** → Supabase (via Supabase JS client)
2. **Admin clicks "Trigger Scrape"** → Next.js API → Python scraper API
3. **Python scraper runs** → Fetches from 11 job sources
4. **Scraper normalizes & deduplicates** → Inserts into Supabase
5. **Frontend displays updated jobs** → Supabase data

### Scheduling

The Python scraper automatically:
- Runs every 30 minutes (configurable)
- Scrapes all 11 sources concurrently
- Deduplicates using SHA256 hashing
- Updates `last_scraped` timestamp
- Cleans up expired jobs (>30 days old)

## Configuration Reference

### Environment Variables

**Frontend** (`.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[KEY]
NEXT_PUBLIC_SCRAPER_URL=http://localhost:8000  # Change for production
```

**Scraper** (`scraper/.env`):
```env
DATABASE_URL=postgresql://postgres...  # Supabase connection
SCRAPER_MODE=server                    # or "once" for single run
SCRAPE_INTERVAL_MINUTES=30             # How often to scrape
DB_POOL_SIZE=5                         # Connection pool size
ENABLE_SCHEDULER=true
```

### Customizing Scraper Schedule

Edit `scraper/.env`:

```env
# Every 15 minutes
SCRAPE_INTERVAL_MINUTES=15

# Or every hour
SCRAPE_INTERVAL_MINUTES=60
```

## API Endpoints

### Scraper API (Python)

All endpoints listen on `http://localhost:8000`

**Health Check**:
```bash
curl http://localhost:8000/health
```

**Trigger Scrape**:
```bash
# All sources
curl -X POST http://localhost:8000/scrape

# Specific source
curl -X POST http://localhost:8000/scrape?sources=Kariera.mk
```

**Scheduler Status**:
```bash
curl http://localhost:8000/scheduler/status
```

**List Sources**:
```bash
curl http://localhost:8000/sources
```

### Frontend API

**List Jobs**:
```bash
curl "http://localhost:3000/api/jobs?category=IT&limit=10"
```

**Trigger Scrape** (called from admin panel):
```bash
curl -X POST http://localhost:3000/api/admin/scrape \
  -H "Content-Type: application/json" \
  -d '{"sourceId":"uuid","sourceName":"Kariera.mk"}'
```

## Monitoring

### Check Scraper Health

```bash
curl http://localhost:8000/health | jq
```

Response shows:
- Database connection status
- Total jobs in database
- Number of sources
- Last scrape time

### View Logs

```bash
# Scraper logs
tail -f scraper/logs/scraper.log

# Frontend logs (already in terminal)
# Just watch the Next.js terminal
```

### Monitor in Supabase Dashboard

1. **Table Editor**: View `jobs` and `sources` tables
2. **Logs**: Check for any errors
3. **Usage**: Monitor storage and connections

## Deployment (Production)

### Deploy Frontend (Vercel - Recommended)

```bash
# Connect your repo to Vercel
# Set environment variables in Vercel dashboard
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SCRAPER_URL=https://your-scraper-domain.com
```

### Deploy Scraper (Multiple Options)

**Option 1: Docker on VPS**
```bash
cd scraper
docker build -t jbowall-scraper .
docker run -d \
  -e DATABASE_URL="..." \
  -e SCRAPER_MODE=server \
  -p 8000:8000 \
  jbowall-scraper
```

**Option 2: Railway.app**
1. Push scraper folder to GitHub
2. Connect to Railway
3. Set `DATABASE_URL` environment variable
4. Deploy!

**Option 3: AWS Lambda** (for low-frequency scraping)
- Convert to AWS Lambda handler
- Trigger via EventBridge (every 30 min)
- Store results in Supabase

**Option 4: Docker Compose on Server**
```bash
cd scraper
docker-compose -f docker-compose.supabase.yml up -d
```

## Troubleshooting

### "Database connection failed"

```
Error: could not connect to server
```

**Solution**:
1. Verify DATABASE_URL in `scraper/.env`
2. Verify using **Connection Pooler** URL (not direct)
3. Test: `python -c "from core.database import db_manager; db_manager.get_session_sync().close(); print('OK')"`

### "No jobs showing in frontend"

**Solution**:
1. Check scraper health: `http://localhost:8000/health`
2. Check Supabase table editor - any jobs in database?
3. Check frontend logs - any errors?
4. Try manual trigger: Click "Trigger Scrape" in admin panel

### "Scraper keeps crashing"

**Solution**:
1. Check logs: `tail -f scraper/logs/scraper.log`
2. Verify all 11 job sources are accessible
3. Reduce `CONCURRENT_SCRAPERS` in `.env`

### "Connection pool exhausted"

```
Error: too many connections
```

**Solution**:
- Reduce `DB_POOL_SIZE` in `scraper/.env`
- Free tier Supabase has ~10 connection limit
- Set: `DB_POOL_SIZE=5`

### "Frontend can't reach scraper"

**Solution**:
1. Verify `NEXT_PUBLIC_SCRAPER_URL` is set
2. Check scraper is running on port 8000
3. Check firewall isn't blocking port 8000
4. In production, ensure scraper URL is publicly accessible

## Adding More Job Sources

1. Create new scraper in `scraper/scrapers/my_source.py`:

```python
from scrapers.base_scraper import BaseScraper, ScrapedJob

class MySourceScraper(BaseScraper):
    def __init__(self):
        super().__init__("My Source", "https://mysource.com")
    
    def scrape(self):
        # Parse and return jobs
        pass
```

2. Add to `scraper/scrapers/__init__.py`
3. Run SQL in Supabase to register:

```sql
INSERT INTO sources (name, base_url) 
VALUES ('My Source', 'https://mysource.com')
ON CONFLICT (name) DO NOTHING;
```

4. Scraper will automatically use it next run!

## Quick Commands

```bash
# Start everything locally
make start  # if you have make installed

# Or manually:

# Terminal 1 - Scraper
cd scraper
source venv/bin/activate
SCRAPER_MODE=server python main.py

# Terminal 2 - Frontend
npm run dev

# Test endpoints
curl http://localhost:8000/health
curl http://localhost:3000
```

## Cost Breakdown

| Component | Free | Pro |
|-----------|------|-----|
| Supabase | Free | $25/mo |
| Vercel (frontend) | Free | Paid |
| Scraper hosting | Free (run locally) | $5-50/mo |
| **Total** | **Free** | **$30+/mo** |

For 11 sources every 30 minutes, you'll stay well within free tier limits.

## Next Steps

1. ✅ Set up Supabase project
2. ✅ Run database schema
3. ✅ Configure frontend .env
4. ✅ Set up Python scraper
5. ✅ Start both services
6. 🚀 Visit http://localhost:3000
7. 📝 Test admin "Trigger Scrape" button
8. 🌐 Deploy to production

## Support & Resources

- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Python Scraper Docs**: See `scraper/README.md`
- **GitHub Issues**: Report bugs and feature requests

---

**You're all set! Enjoy your JobWall scraper!** 🎉
