# Quick Reference Card

## 🚀 Getting Started (5 minutes)

### 1. Database Setup (Supabase)
```
1. Go to supabase.com/dashboard
2. Create new project (name: jobwall, save password)
3. Wait for creation (2-3 min)
4. Settings → Database → Connection Pooler → Copy URI
5. SQL Editor → New Query → Paste schema.sql → Run
```

### 2. Scraper Setup
```bash
cd scraper
python quick_setup.py  # Automated setup
# Or manual:
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with Supabase DATABASE_URL
```

### 3. Frontend Setup
```bash
cp .env.local.example .env.local
# Edit .env.local with:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - NEXT_PUBLIC_SCRAPER_URL
```

### 4. Run Everything
```bash
# Terminal 1: Scraper
cd scraper
source venv/bin/activate
SCRAPER_MODE=server python main.py

# Terminal 2: Frontend
npm run dev

# Open http://localhost:3000
```

---

## 📡 API Endpoints

### Scraper API (http://localhost:8000)
```bash
# Health check
curl http://localhost:8000/health

# Trigger scrape (all sources)
curl -X POST http://localhost:8000/scrape

# Trigger specific source
curl -X POST http://localhost:8000/scrape?sources=Kariera.mk

# Scheduler status
curl http://localhost:8000/scheduler/status

# List sources
curl http://localhost:8000/sources
```

### Frontend API (http://localhost:3000)
```bash
# Get jobs
curl "http://localhost:3000/api/jobs?category=IT&limit=10"

# Trigger scrape (admin panel)
curl -X POST http://localhost:3000/api/admin/scrape \
  -H "Content-Type: application/json" \
  -d '{"sourceId":"uuid","sourceName":"Kariera.mk"}'
```

---

## 🔧 Configuration

### Scraper (.env in scraper/)
```env
DATABASE_URL=postgresql://...  # Supabase connection
SCRAPER_MODE=server            # server, once, or scheduler
SCRAPE_INTERVAL_MINUTES=30     # How often to scrape
DB_POOL_SIZE=5                 # Supabase free tier = ~10 max
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SCRAPER_URL=http://localhost:8000
```

---

## 📊 Monitoring

```bash
# Check scraper health
curl http://localhost:8000/health | jq

# View scraper logs
tail -f scraper/logs/scraper.log

# Check database (Supabase)
# Dashboard → Table Editor → jobs table

# Watch jobs appear in real-time
watch -n 5 'curl -s http://localhost:8000/health | jq .jobs_count'
```

---

## ❌ Troubleshooting

| Problem | Solution |
|---------|----------|
| Database connection failed | Check `DATABASE_URL` in `.env` is using Connection Pooler |
| No jobs showing | Click "Trigger Scrape" in admin panel, wait 30 sec |
| Scraper keeps crashing | Check logs: `tail -f scraper/logs/scraper.log` |
| Too many connections | Set `DB_POOL_SIZE=3` in `.env` |
| Port 8000 in use | `lsof -i :8000` to find process, or use different port |

---

## 📂 File Structure
```
├── scraper/
│   ├── .env                    # Configuration (create from .env.example)
│   ├── main.py                # Entry point
│   ├── requirements.txt        # Python dependencies
│   ├── scrapers/              # 11 job sources
│   ├── services/              # Dedup, normalization
│   └── logs/                  # Scraper logs
│
├── src/
│   ├── app/
│   │   ├── page.tsx           # Home with jobs
│   │   ├── admin/page.tsx     # Admin scrape button
│   │   └── api/admin/scrape/  # API bridge to scraper
│   └── lib/supabase/client.ts # Supabase setup
│
├── .env.local                 # Frontend config
├── SETUP_GUIDE.md            # Full setup instructions
└── schema.sql                # Database schema
```

---

## 🌐 Production Deployment

### Scraper on Railway/Render
```bash
1. Push to GitHub (including scraper folder)
2. Create account on Railway.app or Render.com
3. Connect GitHub repo
4. Set environment variable: DATABASE_URL
5. Deploy!
```

### Frontend on Vercel
```bash
1. Push to GitHub
2. Connect to Vercel
3. Set environment variables:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - NEXT_PUBLIC_SCRAPER_URL (production URL)
4. Deploy!
```

---

## 💡 Tips & Tricks

### Run single scrape (no scheduler)
```bash
SCRAPER_MODE=once python main.py
```

### Scrape only one source
```bash
curl -X POST http://localhost:8000/scrape?sources=Kariera.mk
```

### View recent jobs
```bash
# In Supabase SQL Editor
SELECT * FROM jobs 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check for duplicates
```bash
# In Supabase SQL Editor
SELECT COUNT(*), company, title 
FROM jobs 
GROUP BY company, title 
HAVING COUNT(*) > 1
LIMIT 10;
```

---

## 📞 Need Help?

- **Supabase docs**: supabase.com/docs
- **Next.js docs**: nextjs.org/docs
- **Scraper docs**: scraper/README.md
- **Full guide**: SETUP_GUIDE.md

---

**Made with ❤️ for JobWall**
