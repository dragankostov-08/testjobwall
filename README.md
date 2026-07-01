# JobWall - Job Aggregator Platform

A modern job aggregation system that collects jobs from 11+ Macedonian/regional job portals and displays them through a beautiful React frontend.

## 🎯 Features

- **11 Job Sources**: Automatic scraping from major job portals
- **Real-time Updates**: Jobs updated every 30 minutes (configurable)
- **Smart Deduplication**: Prevents duplicate listings using SHA256 hashing
- **Fast Search**: <100ms queries with optimized database indexes
- **Admin Panel**: Manual trigger scraping and monitor status
- **Production Ready**: Docker support, comprehensive logging, health checks
- **Cost Effective**: Runs on Supabase free tier (~$0/month)
- **Scalable**: Add new sources without touching frontend code

## 🚀 Quick Start

**Start here**: [START_HERE.md](./START_HERE.md) - **10 minute setup**

```bash
# 1. Setup Supabase (3 min)
# Go to supabase.com, create project, run schema.sql

# 2. Setup Scraper (3 min)
cd scraper
python quick_setup.py

# 3. Setup Frontend (1 min)
cp .env.local.example .env.local
# Edit with Supabase credentials

# 4. Run Everything (1 min)
SCRAPER_MODE=server python main.py  # Terminal 1
npm run dev                          # Terminal 2

# Visit http://localhost:3000
```

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **[START_HERE.md](./START_HERE.md)** | 10-minute quick start ⭐ |
| **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** | Command cheat sheet |
| **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** | Complete setup walkthrough |
| **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** | What was built & why |
| **[DEPLOYMENT.md](./DEPLOYMENT.md)** | Production deployment |
| **[MIGRATION.md](./MIGRATION.md)** | Move from Node.js system |

## 🏗️ Architecture

```
Frontend (Next.js)  →  Python Scraper  →  Supabase PostgreSQL
   Port 3000           Port 8000           Managed Database
```

## 🔄 How It Works

- **11 Scrapers**: Fetch jobs from Macedonian job portals
- **Smart Deduplication**: Prevents duplicate listings
- **Automatic Scheduling**: Every 30 minutes (configurable)
- **Direct Storage**: Jobs saved to Supabase
- **Fast API**: Frontend queries Supabase directly

## 💰 Cost

| Item | Cost |
|------|------|
| Supabase | $0 (free tier) |
| Vercel | Free-$20/mo |
| Scraper Hosting | $7/mo minimum |
| **Total** | **$0-$50/month** |

## 🛠️ Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Scraper**: Python 3.12, FastAPI, APScheduler
- **Database**: PostgreSQL (via Supabase)
- **Infrastructure**: Docker, Vercel, Railway

## 🐳 Docker Support

```bash
# Local development
docker-compose up -d

# With Supabase
docker-compose -f docker-compose.supabase.yml up -d
```

## 📡 API Endpoints

**Scraper** (http://localhost:8000):
```bash
curl http://localhost:8000/health
curl -X POST http://localhost:8000/scrape
```

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for:
- **Vercel** (frontend)
- **Railway** (scraper)
- **Docker on VPS** (full stack)

## 🆘 Troubleshooting

1. **Database connection failed**: Check `DATABASE_URL` in `scraper/.env`
2. **No jobs appearing**: Click "Trigger Scrape" in admin panel
3. **More help**: See [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) troubleshooting

## 🎓 Getting Help

- **New?** → Read [START_HERE.md](./START_HERE.md)
- **Commands?** → Read [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
- **Deploy?** → Read [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Technical?** → Read [scraper/README.md](./scraper/README.md)

---

**Ready to get started? → [START_HERE.md](./START_HERE.md)**
