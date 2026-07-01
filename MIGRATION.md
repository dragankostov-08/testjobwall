# Migration Guide: Node.js/BullMQ → Python/APScheduler

This guide helps you migrate from the old Node.js scraper to the new Python-based system.

## ⏱️ Migration Time

- **Planning**: 5 minutes
- **Setup**: 15 minutes
- **Testing**: 10 minutes
- **Cleanup**: 5 minutes
- **Total**: ~40 minutes (mostly waiting for setup)

## 📋 Pre-Migration Checklist

- [ ] Backup existing Supabase database
- [ ] Verify Node.js scraper is working
- [ ] Note current job count in database
- [ ] Ensure all 11 sources are active
- [ ] Document any custom scraper modifications

## 🔄 Migration Steps

### Step 1: Backup Database (2 min)

In Supabase Dashboard:
1. Go to **Settings → Backups**
2. Click **Create backup** manually
3. Download backup file (optional but recommended)
4. Save backup date and size

### Step 2: Stop Old Node.js System (1 min)

```bash
# If running locally
Ctrl+C  # Stop the dev server

# If running in production
docker-compose down  # Or appropriate stop command

# Verify it's stopped
ps aux | grep node  # Should show nothing
```

### Step 3: Setup Python Scraper (15 min)

```bash
cd scraper

# Run automated setup
python quick_setup.py

# Follow prompts:
# 1. Paste Supabase DATABASE_URL
# 2. Test connection
```

**Or manual setup:**

```bash
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env

# Edit .env with:
# DATABASE_URL=[Your Supabase Connection String]
```

### Step 4: Test Python Scraper (5 min)

**Test 1: Database Connection**
```bash
python -c "from core.database import db_manager; db_manager.get_session_sync().close(); print('✓ Connected!')"
```

**Test 2: Single Scrape Cycle**
```bash
SCRAPER_MODE=once python main.py
```

Watch for output like:
```
Starting full scrape cycle
Found 11 active sources
Scraping Kariera.mk...
Scraped 25 jobs
...
```

**Test 3: Health Check API**
```bash
SCRAPER_MODE=server python main.py
# In another terminal:
curl http://localhost:8000/health
```

### Step 5: Verify Data Migration (3 min)

```bash
# Check job count in Supabase
curl http://localhost:8000/health | jq .jobs_count

# Should match approximately the old count
# Some duplicates might be removed by deduplication
```

Expected output:
```json
{
  "status": "healthy",
  "database": "connected",
  "jobs_count": 1234,
  "sources_count": 11,
  "last_scrape_time": "2024-01-15T10:30:00Z"
}
```

### Step 6: Update Frontend (2 min)

Update `.env.local`:
```env
# Add this line
NEXT_PUBLIC_SCRAPER_URL=http://localhost:8000

# For production, change to your scraper URL:
# NEXT_PUBLIC_SCRAPER_URL=https://scraper.yourdomain.com
```

### Step 7: Test Frontend Integration (5 min)

1. **Start both systems**:
```bash
# Terminal 1: Python scraper
cd scraper
SCRAPER_MODE=server python main.py

# Terminal 2: Next.js frontend
npm run dev
```

2. **Visit http://localhost:3000**
   - Should see jobs loaded from Supabase

3. **Go to Admin Panel** (http://localhost:3000/admin)
   - Click "Trigger Scrape"
   - Should see success message

4. **Verify jobs updated**
   - Wait 30 seconds
   - Refresh page
   - New jobs should appear

### Step 8: Remove Old System (Optional)

If confident in new system:

```bash
# Remove BullMQ/Redis dependencies from Node.js
npm remove bullmq ioredis

# Remove old scraper files (optional)
# Keep for reference or delete if not needed
rm -rf src/workers/scrape.ts

# Update package.json if needed
git commit -m "Remove BullMQ/Redis dependencies"
```

**⚠️ Keep for reference first!** Don't delete immediately in case you need to reference old code.

### Step 9: Production Deployment (Optional Now)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup:
- Vercel (frontend)
- Railway (scraper)
- Docker on VPS

## 🔍 Verification Checklist

- [ ] Python scraper connects to Supabase
- [ ] Single scrape cycle completes successfully
- [ ] Health check endpoint responds
- [ ] Frontend loads jobs from Supabase
- [ ] Admin "Trigger Scrape" button works
- [ ] Scheduler running (check logs)
- [ ] No errors in logs
- [ ] Job count > 0
- [ ] Old Node.js system stopped

## 📊 Before & After Comparison

### Before (Node.js/BullMQ)
```
Frontend (Next.js)
    ↓ (REST API)
Node.js API
    ↓ (BullMQ queue)
Redis Queue
    ↓
Node.js Worker (scrape.ts)
    ↓
Supabase Database
```

### After (Python)
```
Frontend (Next.js)
    ↓ (REST API)
Python API
    ↓ (Direct)
APScheduler
    ↓
Python Scrapers
    ↓
Supabase Database
```

### Benefits
- **Simpler**: No queue or Redis needed
- **Faster**: Direct scheduling vs queue-based
- **Cheaper**: No Redis hosting needed
- **More reliable**: Built-in retry logic
- **Easier to scale**: Add scrapers without touching queues

## 🐛 Troubleshooting During Migration

### Issue: "Database connection failed"
```
Solution: Verify DATABASE_URL in scraper/.env
Check: You're using Connection Pooler URL (not direct)
```

### Issue: "No jobs appearing"
```
Solution 1: Run manual scrape: SCRAPER_MODE=once python main.py
Solution 2: Check Supabase SQL Editor - any jobs in database?
Solution 3: Check health endpoint: curl http://localhost:8000/health
```

### Issue: "Old and new jobs mixed"
```
Normal! The deduplication prevents true duplicates.
Some similar jobs might be skipped by hash matching.
This is a feature, not a bug.
```

### Issue: "Job count decreased"
```
Expected! The deduplication removes old duplicates.
The hash-based system is stricter than the URL-only approach.
```

## 📈 Rollback Plan (If Needed)

If something goes wrong:

```bash
# Stop new scraper
Ctrl+C  # Kill Python scraper

# Restore database from backup (Supabase)
Settings → Backups → Restore

# Restart old system
docker-compose up -d  # Or your old setup

# Check everything works
curl http://localhost:3000
```

**Time to rollback**: < 5 minutes

## ✅ Post-Migration Tasks

1. **Monitor Logs**
   ```bash
   tail -f scraper/logs/scraper.log
   ```

2. **Verify Automatic Scheduling**
   ```bash
   # Check if scraper runs automatically
   # Should run every 30 minutes by default
   curl http://localhost:8000/scheduler/status
   ```

3. **Update Documentation**
   - Commit IMPLEMENTATION_SUMMARY.md
   - Update team on new system
   - Archive old documentation

4. **Schedule Regular Backups**
   - Supabase handles daily backups
   - Consider weekly exports for safety

5. **Monitor Production (If Deployed)**
   - Set up alerts for scraper health
   - Monitor job count trends
   - Check database storage usage

## 🎓 Learning Path

New to Python-based architecture?

1. **Read**: IMPLEMENTATION_SUMMARY.md
2. **Explore**: Scraper code structure
3. **Modify**: Try adding a new job source
4. **Deploy**: Get it running in production
5. **Scale**: Add monitoring and alerts

## 📚 Documentation

- **QUICK_REFERENCE.md** - Command reference
- **SETUP_GUIDE.md** - Complete setup guide
- **DEPLOYMENT.md** - Production deployment
- **scraper/README.md** - Technical details
- **scraper/SUPABASE.md** - Supabase-specific

## 🆘 Need Help?

### Common Questions

**Q: Will I lose existing jobs?**
A: No! Jobs are already in Supabase. Old and new system use the same database.

**Q: Can I run both systems simultaneously?**
A: Not recommended. One will overwrite the other's results. Stop the old system first.

**Q: How do I add new job sources?**
A: See scraper/README.md section "Adding New Job Sources" - just create a Python file!

**Q: What if I need custom scraping logic?**
A: Edit the scraper files directly. It's much easier than Node.js/Cheerio.

**Q: Can I go back to the old system?**
A: Yes! Just restore from a database backup and restart the Node.js app.

## 📝 Migration Checklist (Printable)

```
Migration: Node.js → Python Scraper
Date: _______________
Operator: _______________

Pre-Migration
□ Database backed up
□ Old system documented
□ Current job count noted: _____

Migration
□ Old system stopped
□ Python venv created
□ Dependencies installed
□ Database URL configured
□ Connection test passed
□ Single scrape cycle successful
□ Frontend updated
□ Integration test passed

Post-Migration
□ Monitoring active
□ Logs reviewed
□ Team notified
□ Documentation updated
□ Scheduled tasks verified

Status: ✓ Complete / ✗ Rollback
```

---

## Summary

The migration from Node.js/BullMQ to Python/APScheduler is straightforward:

1. **Setup Python** (~15 min)
2. **Test Scraper** (~5 min)
3. **Update Frontend** (~2 min)
4. **Verify Everything** (~5 min)

You'll end up with:
- ✅ Simpler architecture
- ✅ No Redis needed
- ✅ Lower costs
- ✅ Easier maintenance
- ✅ Better performance

**Start with `cd scraper && python quick_setup.py`**

Good luck with your migration! 🚀
