# JobWall Scraper - Supabase Setup Guide

This guide walks you through setting up the JobWall scraper with Supabase as the database backend.

## Why Supabase?

- **Managed PostgreSQL**: No server management needed
- **Scalable**: Pay-as-you-go pricing
- **Reliable**: Automated backups and recovery
- **Secure**: Built-in authentication and RLS
- **Real-time**: Optional WebSocket subscriptions
- **Free Tier**: 500MB storage to get started

## Prerequisites

- Supabase account (free at [https://supabase.com](https://supabase.com))
- Python 3.12+ installed locally
- Docker (optional, for containerized deployment)

## Step 1: Create Supabase Project

1. **Sign up** at [https://supabase.com](https://supabase.com)

2. **Create a new project**
   - Organization: Create or select existing
   - Project name: `jbowall`
   - Database password: Save this securely!
   - Region: Choose closest to your location
   - Pricing plan: Free tier is fine for testing

3. **Wait for project creation** (2-3 minutes)

## Step 2: Get Connection String

1. **Open your Supabase project dashboard**

2. **Navigate to Settings → Database**

3. **Find Connection Pooler section**
   - Click the "Connection Pooler" tab
   - Select "URI" (not "Parameters")
   - Copy the full connection string

4. **Format verification**
   
   Your string should look like:
   ```
   postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
   ```

   ✅ **Correct**: Contains `pooler.supabase.com`
   ❌ **Wrong**: Contains just `aws-0-` without `pooler`

## Step 3: Initialize Database Schema

### Option A: Using Supabase SQL Editor (Easiest)

1. **Go to Supabase Dashboard → SQL Editor**

2. **Click "New Query"**

3. **Copy and paste the entire schema** from [../schema.sql](../schema.sql)

4. **Click "Run"** or press `Ctrl+Enter`

5. **Verify success**:
   - Check Supabase Dashboard → Table Editor
   - You should see `sources` and `jobs` tables

### Option B: Using psql CLI

```bash
# Install PostgreSQL client tools if not already installed
# On Windows: https://www.postgresql.org/download/windows/
# On macOS: brew install postgresql
# On Linux: sudo apt-get install postgresql-client

# Connect to your Supabase database
psql "postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Then paste the entire schema.sql contents and run
```

## Step 4: Configure Local Environment

1. **Navigate to scraper directory**

```bash
cd scraper
```

2. **Create .env file**

```bash
cp .env.example .env
```

3. **Edit .env** with your Supabase details

```env
# Replace with your actual Supabase connection string
DATABASE_URL=postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres

LOG_LEVEL=INFO
LOG_FILE=logs/scraper.log
SCRAPE_INTERVAL_MINUTES=30
ENABLE_SCHEDULER=true
SCRAPER_MODE=server
HEALTH_CHECK_PORT=8000
DB_POOL_SIZE=5
```

**⚠️ Security**: Never commit `.env` to version control. It's in `.gitignore`.

## Step 5: Install Dependencies

```bash
# Create virtual environment
python -m venv venv

# Activate it
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install requirements
pip install -r requirements.txt
```

## Step 6: Test Connection

```bash
# Test database connection
python -c "from core.database import db_manager; session = db_manager.get_session_sync(); print('✓ Database connected!'); session.close()"
```

If successful, you'll see: `✓ Database connected!`

If it fails, check:
- DATABASE_URL is correct
- Using Connection Pooler URL (not direct connection)
- Database schema was created (check Supabase Dashboard)

## Step 7: Run the Scraper

### Option A: Development Mode

```bash
# Run with API server (good for testing)
SCRAPER_MODE=server python main.py
```

Then visit: http://localhost:8000/health

### Option B: One-Time Scrape

```bash
# Run single scrape cycle
SCRAPER_MODE=once python main.py
```

### Option C: Full Scheduler

```bash
# Run with automated scheduling (every 30 minutes)
python main.py
```

## Step 8: Deploy with Docker

### Option A: Using docker-compose (Supabase)

```bash
# Create .env file in scraper directory
cat > .env << EOF
DATABASE_URL=postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
EOF

# Start the scraper
docker-compose -f docker-compose.supabase.yml up -d

# View logs
docker-compose -f docker-compose.supabase.yml logs -f scraper

# Stop
docker-compose -f docker-compose.supabase.yml down
```

### Option B: Manual Docker Build

```bash
# Build image
docker build -t jbowall-scraper:latest .

# Run
docker run -d \
  --name jbowall_scraper \
  -e DATABASE_URL="postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres" \
  -e SCRAPER_MODE=server \
  -p 8000:8000 \
  jbowall-scraper:latest

# View logs
docker logs -f jbowall_scraper
```

## Monitoring

### Check Scraper Health

```bash
curl http://localhost:8000/health
```

Response:
```json
{
  "status": "healthy",
  "database": "connected",
  "jobs_count": 1234,
  "sources_count": 11,
  "last_scrape_time": "2024-01-15T10:30:00Z"
}
```

### Check Scheduler Status

```bash
curl http://localhost:8000/scheduler/status
```

### View Logs

```bash
# Local logs
tail -f logs/scraper.log

# Docker logs
docker-compose -f docker-compose.supabase.yml logs -f scraper
```

### Monitor in Supabase Dashboard

1. **Go to Supabase Dashboard → Table Editor**
2. **Click `jobs` table** to view scraped jobs
3. **Click `sources` table** to check last_scraped timestamps

## Supabase Configuration Tips

### Connection Pooling

Supabase uses PgBouncer for connection pooling. For optimal performance:

```env
DB_POOL_SIZE=5  # Free tier has ~10 connection limit
DB_POOL_RECYCLE=3600  # Recycle connections hourly
```

### Performance Optimization

For large-scale scraping, consider:

```env
BATCH_INSERT_SIZE=100  # Batch jobs before inserting
CONCURRENT_SCRAPERS=3  # Parallel source scraping
SCRAPE_INTERVAL_MINUTES=60  # Less frequent scraping if needed
```

### Row Level Security (RLS)

Since the scraper is a backend service:

1. **Go to Supabase Dashboard → Authentication → Policies**
2. **Disable RLS** for `sources` and `jobs` tables (optional)
   - Or create a service role policy

RLS disabled is fine for internal backend services.

## Maintenance

### Backup Data

Supabase automatically backs up daily. To manually export:

1. **Dashboard → Settings → Database → Backups**
2. **Download backup** or use pg_dump

### Monitor Usage

1. **Dashboard → Settings → Billing**
2. **Check current usage** of storage and connections

### Scale Up

If you outgrow free tier:

1. **Dashboard → Settings → Billing**
2. **Upgrade to Pro** ($25/month)
   - 500GB storage
   - Higher connection limits
   - Priority support

## Troubleshooting

### Connection Refused

```
Error: could not connect to server
```

**Solution**:
- Verify DATABASE_URL is copied completely and correctly
- Check internet connection
- Verify Supabase project is active (not paused)

### Too Many Connections

```
Error: too many connections for role "postgres"
```

**Solution**:
- Reduce DB_POOL_SIZE in .env
- Free tier limit is ~10 connections
- Only one scraper instance should run per project

### SSL/TLS Error

```
Error: SSL/TLS error
```

**Solution**:
- Supabase requires SSL by default
- The scraper handles this automatically
- If issues persist, use Connection Pooler (not direct connection)

### Authentication Failed

```
Error: password authentication failed
```

**Solution**:
- Verify password in DATABASE_URL is correct
- Check for special characters that need URL encoding
- Re-copy from Supabase Connection Pooler panel

### No Data in Database

**Solution**:
1. Check schema was created: `SELECT * FROM sources;` in SQL Editor
2. Verify scraper is running: `curl http://localhost:8000/health`
3. Check logs for errors: `docker logs jbowall_scraper`

## Next Steps

1. **Monitor** scraper health via health check endpoint
2. **Add** new job sources by creating scrapers
3. **Connect** React frontend to Supabase DB (already configured)
4. **Deploy** to production (see DEPLOYMENT.md)

## Support

- **Supabase Docs**: https://supabase.com/docs
- **Supabase Community**: https://discord.supabase.com
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

## Cost Estimate

| Component | Free Tier | Pro Tier |
|-----------|-----------|----------|
| Storage | 500MB | 500GB |
| Monthly Active Users | 50k | Unlimited |
| Database Connections | ~10 | ~100 |
| Cost | Free | $25/month |

For 11 job sources scraping every 30 minutes:
- **Storage needed**: ~50MB/month (easily fits free tier)
- **Connections needed**: 1-3 (well below limit)
- **Recommendation**: Start with free tier, upgrade as needed
