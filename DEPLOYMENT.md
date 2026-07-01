# Production Deployment Guide

This guide covers deploying JobWall to production with Supabase as the database backend.

## Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│              CDN / DNS                               │
│         (Cloudflare, Route53, etc.)                 │
└────────────────┬──────────────────────────────────────┘
                 │
        ┌────────┴─────────┐
        │                  │
        ▼                  ▼
    Frontend          Scraper API
    (Vercel)         (Railway/Render)
        │                  │
        └────────────┬─────┘
                     │
                     ▼
              Supabase Database
              (PostgreSQL)
```

## Option 1: Vercel (Frontend) + Railway (Scraper)

### Step 1: Prepare Repository

1. **Ensure both frontend and scraper are in same repo**:
```
jobwall/
├── src/                  # Next.js frontend
├── scraper/              # Python scraper
├── schema.sql           # Database schema
└── package.json
```

2. **Push to GitHub**:
```bash
git add .
git commit -m "Full JobWall setup with Python scraper"
git push origin main
```

### Step 2: Deploy Frontend (Vercel)

1. **Go to vercel.com and sign in with GitHub**

2. **Import your repository**:
   - Select your GitHub repo
   - Framework: Next.js
   - Root directory: ./

3. **Set environment variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = [your anon key]
   NEXT_PUBLIC_SCRAPER_URL = https://your-scraper-url.railway.app
   ```

4. **Deploy**:
   - Click Deploy
   - Wait for build (2-5 minutes)
   - You'll get a URL like: `https://jobwall-xxx.vercel.app`

5. **Verify**:
   - Visit your Vercel URL
   - Check admin panel loads correctly

### Step 3: Deploy Scraper (Railway)

1. **Go to railway.app and sign in with GitHub**

2. **Create new project**:
   - Click "New Project"
   - "Deploy from GitHub repo"
   - Select your GitHub repo

3. **Configure deployment**:
   - Root directory: `scraper`
   - Framework: Python

4. **Set environment variables** (in Railway dashboard):
   ```
   DATABASE_URL=postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
   SCRAPER_MODE=server
   SCRAPE_INTERVAL_MINUTES=30
   DB_POOL_SIZE=5
   ```

5. **Deploy**:
   - Railway auto-deploys on git push
   - Watch logs to verify deployment
   - Get your Railway URL (e.g., `https://your-scraper-url.railway.app`)

6. **Update Vercel environment**:
   - Go back to Vercel
   - Settings → Environment Variables
   - Update `NEXT_PUBLIC_SCRAPER_URL` to your Railway URL
   - Redeploy

7. **Verify**:
   - Visit `https://your-scraper-url.railway.app/health`
   - Should return JSON with status

### Step 4: Verify Production Setup

1. **Frontend loads**: Visit Vercel URL
2. **Admin panel works**: Click "Trigger Scrape"
3. **Jobs appear**: Wait 30 seconds, refresh page
4. **Scraper logs**: Check Railway logs for activity

---

## Option 2: Render (Frontend) + Render (Scraper)

### Step 1: Deploy Frontend

1. **Go to render.com and sign in**

2. **Create new Web Service**:
   - Connect GitHub repo
   - Name: `jobwall-frontend`
   - Root directory: `./`
   - Build command: `npm run build`
   - Start command: `npm start`

3. **Set environment variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = [your anon key]
   NEXT_PUBLIC_SCRAPER_URL = https://your-scraper.onrender.com
   ```

4. **Deploy** and wait for build

### Step 2: Deploy Scraper

1. **Create new Web Service** (Render):
   - Connect same GitHub repo
   - Name: `jobwall-scraper`
   - Root directory: `scraper`
   - Build command: `pip install -r requirements.txt`
   - Start command: `gunicorn main:app -b 0.0.0.0:8000`

2. **Set environment variables**:
   ```
   DATABASE_URL=postgresql://...
   SCRAPER_MODE=server
   ```

3. **Deploy** and get your Render scraper URL

4. **Update frontend environment variable**:
   - Go to frontend service settings
   - Update `NEXT_PUBLIC_SCRAPER_URL` with scraper URL

---

## Option 3: Docker on VPS (AWS EC2, DigitalOcean, etc.)

### Prerequisites
- VPS with Ubuntu 22.04+
- Docker and Docker Compose installed
- Public IP address
- SSL certificate (Let's Encrypt recommended)

### Step 1: Set up VPS

```bash
# SSH into your server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Clone repository
git clone https://github.com/yourusername/jobwall.git
cd jobwall
```

### Step 2: Create docker-compose.prod.yml

```yaml
version: '3.9'

services:
  scraper:
    build: ./scraper
    container_name: jbowall_scraper
    environment:
      DATABASE_URL: ${DATABASE_URL}
      SCRAPER_MODE: server
      SCRAPE_INTERVAL_MINUTES: 30
      DB_POOL_SIZE: 5
    ports:
      - "8000:8000"
    volumes:
      - ./scraper/logs:/app/logs
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    container_name: jbowall_frontend
    environment:
      NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      NEXT_PUBLIC_SCRAPER_URL: http://scraper:8000
    ports:
      - "3000:3000"
    restart: always
```

### Step 3: Create environment file

```bash
cat > .env.prod << EOF
DATABASE_URL=postgresql://postgres...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
EOF
```

### Step 4: Create Dockerfile for frontend

```dockerfile
# scraper/Dockerfile.frontend
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### Step 5: Deploy

```bash
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Step 6: Set up Nginx reverse proxy

```bash
# Install Nginx
apt install nginx -y

# Create config
sudo tee /etc/nginx/sites-available/jobwall << EOF
upstream scraper {
    server localhost:8000;
}

upstream frontend {
    server localhost:3000;
}

server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /api/admin/scrape {
        proxy_pass http://scraper;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
    }
}

server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://scraper;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
    }
}
EOF

# Enable config
sudo ln -s /etc/nginx/sites-available/jobwall /etc/nginx/sites-enabled/

# Test
sudo nginx -t

# Restart
sudo systemctl restart nginx
```

### Step 7: SSL Certificate (Let's Encrypt)

```bash
# Install certbot
apt install certbot python3-certbot-nginx -y

# Get certificate
certbot certonly --nginx -d yourdomain.com -d api.yourdomain.com

# Auto-renew
systemctl enable certbot.timer
systemctl start certbot.timer
```

---

## Monitoring & Maintenance

### 1. Set up Monitoring

**Railway/Render**: Built-in logs and metrics
- Dashboard shows CPU, memory, bandwidth usage
- Automatic alerts available

**VPS**: Use PM2 or systemd
```bash
# Monitor containers
watch docker stats

# Check logs
docker-compose logs -f
```

### 2. Database Backups

**Supabase**: Automatic daily backups
- Dashboard → Settings → Backups
- Manual backup available anytime
- Point-in-time recovery available

**Recommended**: Enable backup notifications in Supabase

### 3. Scaling

**If jobs are slow:**
- Increase `CONCURRENT_SCRAPERS` (if not I/O limited)
- Increase Supabase to Pro tier

**If database is slow:**
- Monitor query performance in Supabase dashboard
- Consider adding indexes
- Upgrade Supabase plan if at storage limit

**If scraper crashes frequently:**
- Check logs: `docker logs jbowall_scraper`
- Reduce `CONCURRENT_SCRAPERS`
- Increase timeout values

### 4. Regular Maintenance

```bash
# Weekly: Check logs for errors
docker-compose logs | grep ERROR

# Monthly: Verify backups working
# Check Supabase backup status

# Quarterly: Update dependencies
docker-compose pull
docker-compose up -d
```

---

## Security Checklist

- [ ] Never commit `.env` files to Git
- [ ] Use strong database password
- [ ] Enable SSL/TLS (Let's Encrypt)
- [ ] Set up firewall rules (allow only necessary ports)
- [ ] Regular security updates (OS and Docker images)
- [ ] Monitor error logs for suspicious activity
- [ ] Use environment variables for all secrets
- [ ] Enable Supabase authentication if needed
- [ ] Rate limit API endpoints if public
- [ ] Regular database backups verified

---

## Troubleshooting Production Issues

### Scraper not running
```bash
# Check status
curl https://your-api.com/health

# Check logs (Railway)
# Dashboard → Logs

# Check logs (VPS)
docker-compose logs jbowall_scraper
```

### Frontend can't reach scraper
```bash
# Verify scraper is accessible
curl https://your-api.com/health

# Check NEXT_PUBLIC_SCRAPER_URL is correct
# Check frontend environment variables
```

### Database connection pool exhausted
```
Error: too many connections
```
- Reduce `DB_POOL_SIZE` from 5 to 3
- Reduce `CONCURRENT_SCRAPERS`
- Upgrade Supabase plan

### Memory usage high
- Check which process is consuming memory
- Reduce `BATCH_INSERT_SIZE`
- Increase server RAM or upgrade container tier

---

## Cost Estimates

| Component | Cost |
|-----------|------|
| Supabase | Free-$25/mo |
| Vercel | Free-$20/mo |
| Railway | $7-50/mo |
| Domain | $10/year |
| **Total** | **Free-$100/mo** |

**Budget-friendly setup:**
- Supabase free tier: $0
- Vercel free: $0 (or pro)
- Railway: $7/mo minimum
- **Total: ~$7/mo**

---

## Further Reading

- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-to-prod)
- [Vercel Deployment Best Practices](https://vercel.com/docs/deployments/overview)
- [Railway Deployment Guide](https://docs.railway.app)
- [Docker Production Best Practices](https://docs.docker.com/config/containers/resource_constraints/)
