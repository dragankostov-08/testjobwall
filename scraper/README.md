# JobWall Scraper - Python Edition

A production-ready, scalable job aggregation system that collects jobs from 11+ sources and stores them in PostgreSQL for the JobWall React frontend.

## Features

- **Modular Architecture**: Easy to add new job sources
- **Concurrent Scraping**: Multiple sources in parallel
- **Smart Deduplication**: Prevents duplicate jobs using SHA256 hashing and URL matching
- **Automatic Scheduling**: APScheduler-based scraping every 30 minutes
- **Error Handling**: Comprehensive retry logic and error reporting
- **Structured Logging**: JSON-formatted logs for monitoring
- **Docker Ready**: Complete Docker and docker-compose setup
- **Health Checks**: Built-in API endpoints for monitoring
- **Performance**: <100ms database queries with optimized indexes

## Supported Job Sources

1. Kariera.mk
2. Vrabotuvanje.com.mk
3. Apliciraj.mk
4. Najdirabota.com.mk
5. Vraboti.se
6. Jobs.com.mk
7. Oglasizarabota.mk
8. App.thrivity.mk
9. Honorarec.mk
10. Imashchoek.mk
11. Manpower.mk

## Tech Stack

- **Python 3.12+**
- **SQLAlchemy ORM** - Database abstraction
- **Pydantic** - Data validation
- **BeautifulSoup4** - HTML parsing
- **Requests** - HTTP client
- **APScheduler** - Job scheduling
- **FastAPI** - Health check API
- **PostgreSQL** - Data storage
- **Docker** - Containerization

## Installation

### Prerequisites

- Python 3.12+
- PostgreSQL 14+ OR Supabase account (PostgreSQL-based)
- Docker (optional, for containerized deployment)

### Local Setup with Local PostgreSQL

1. **Clone and navigate to scraper directory**

```bash
cd scraper
```

2. **Create virtual environment**

```bash
python -m venv venv

# On Windows
venv\Scripts\activate

# On Linux/macOS
source venv/bin/activate
```

3. **Install dependencies**

```bash
pip install -r requirements.txt
```

4. **Configure environment**

```bash
cp .env.example .env
# Edit .env with your local database connection
# DATABASE_URL=postgresql://user:password@localhost:5432/jbowall
```

5. **Update database schema**

The existing schema.sql in the root directory already has the required tables.

6. **Run the scraper**

```bash
# Run with scheduler (default)
python main.py

# Run single scrape cycle
SCRAPER_MODE=once python main.py

# Run with API server
SCRAPER_MODE=server python main.py
```

### Setup with Supabase

#### Option 1: Local Development with Supabase

1. **Create Supabase project** at [https://supabase.com](https://supabase.com)

2. **Get your connection string**
   - Go to Supabase Dashboard → Settings → Database → Connection Pooler
   - Select "URI" tab
   - Copy the connection string

3. **Configure .env**

```bash
cp .env.example .env
```

   Edit `.env` with your Supabase connection string:

```env
DATABASE_URL=postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
LOG_LEVEL=INFO
SCRAPER_MODE=server
```

   **⚠️ Important**: Use the **Connection Pooler** URL (pgbouncer) from Supabase, not the direct connection URL, for better performance.

4. **Create database schema**
   - Log into Supabase SQL Editor
   - Execute the SQL from root `schema.sql`
   - This creates the `sources` and `jobs` tables

5. **Run the scraper**

```bash
python main.py
```

#### Option 2: Docker with Supabase

1. **Create .env file with Supabase URL**

```bash
cat > .env << EOF
DATABASE_URL=postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
EOF
```

2. **Run with docker-compose (Supabase edition)**

```bash
docker-compose -f docker-compose.supabase.yml up -d
```

3. **View logs**

```bash
docker-compose -f docker-compose.supabase.yml logs -f scraper
```

4. **Stop the scraper**

```bash
docker-compose -f docker-compose.supabase.yml down
```

## API Endpoints

When running in server mode, the scraper provides REST endpoints:

### Health Check

```bash
GET /health

Response:
{
  "status": "healthy",
  "database": "connected",
  "jobs_count": 1234,
  "sources_count": 11,
  "last_scrape_time": "2024-01-15T10:30:00Z"
}
```

### Trigger Scrape

```bash
# Scrape all sources
POST /scrape

# Scrape specific sources
POST /scrape?sources=Kariera.mk&sources=Jobs.com.mk

Response:
{
  "message": "Full scrape triggered"
}
```

### Scheduler Status

```bash
GET /scheduler/status

Response:
{
  "is_running": true,
  "jobs": [
    {
      "id": "scrape_all",
      "name": "Scrape all sources",
      "next_run_time": "2024-01-15T11:00:00Z"
    }
  ]
}
```

### List Sources

```bash
GET /sources

Response:
[
  {
    "id": "uuid",
    "name": "Kariera.mk",
    "base_url": "https://kariera.mk/",
    "active": true,
    "last_scraped": "2024-01-15T10:30:00Z"
  }
]
```

## Configuration

Edit `.env` file to customize settings:

```env
# Database Configuration
# For local PostgreSQL:
#   DATABASE_URL=postgresql://user:password@localhost:5432/jbowall
# For Supabase (recommended - use Connection Pooler, not direct URL):
#   DATABASE_URL=postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres

DATABASE_URL=postgresql://user:password@localhost:5432/jbowall

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/scraper.log

# Scheduling
SCRAPE_INTERVAL_MINUTES=30
ENABLE_SCHEDULER=true

# Scraping
REQUEST_TIMEOUT=30
RETRY_ATTEMPTS=3
CONCURRENT_SCRAPERS=3

# Performance
BATCH_INSERT_SIZE=100
DB_POOL_SIZE=20

# Features
ENABLE_DEDUPLICATION=true
ENABLE_NORMALIZATION=true
DELETE_EXPIRED_JOBS=true
EXPIRED_JOB_DAYS=30
```

## Supabase Configuration Guide

### Getting Your Connection String

1. **Log in to Supabase** at [https://supabase.com/dashboard](https://supabase.com/dashboard)

2. **Navigate to your project**

3. **Go to Settings → Database**

4. **Copy the Connection Pooler URI**
   - Click "URI" tab (not "Display")
   - Copy the connection string
   - Format: `postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres`

5. **Paste into .env**

```env
DATABASE_URL=postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

### Creating Database Schema in Supabase

1. **Go to Supabase SQL Editor**

2. **Paste and execute** the schema from `schema.sql`:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    base_url VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT true,
    last_scraped TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    location VARCHAR(100) NOT NULL,
    url TEXT NOT NULL UNIQUE,
    categories TEXT[] NOT NULL,
    is_remote BOOLEAN DEFAULT false,
    score NUMERIC(4,2) DEFAULT 1.00,
    hash_key VARCHAR(64) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    company_logo_url TEXT
);

-- Pre-populate Sources
INSERT INTO sources (name, base_url) VALUES 
('Kariera.mk', 'https://kariera.mk/'),
('Vrabotuvanje.com.mk', 'https://www.vrabotuvanje.com.mk/'),
('Apliciraj.mk', 'https://apliciraj.mk/'),
('Najdirabota.com.mk', 'https://www.najdirabota.com.mk/'),
('Vraboti.se', 'https://vraboti.se/'),
('Jobs.com.mk', 'https://jobs.com.mk/'),
('Oglasizarabota.mk', 'https://www.oglasizarabota.mk/'),
('App.thrivity.mk', 'https://app.thrivity.mk/job-posts'),
('Honorarec.mk', 'https://honorarec.mk/'),
('Imashchoek.mk', 'https://imashchoek.mk/find-a-job'),
('Manpower.mk', 'https://manpower.mk/mk/mozhnosti-za-rabota')
ON CONFLICT (name) DO NOTHING;

-- Production Indexes
CREATE INDEX IF NOT EXISTS idx_jobs_category_score ON jobs USING btree (categories, score DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_expires_at ON jobs (expires_at);
CREATE INDEX IF NOT EXISTS idx_jobs_hash_key ON jobs (hash_key);
CREATE INDEX IF NOT EXISTS idx_jobs_search ON jobs USING gin (to_tsvector('simple', title || ' ' || company));
```

3. **Run Query** and verify tables are created

### Supabase Best Practices

- **Connection Pooling**: Always use Connection Pooler URL, not direct connection
  - Direct URL: For migrations only
  - Connection Pooler: For application connections

- **RLS (Row Level Security)**: Consider disabling for scraper (it's a backend service)
  - In Supabase: Settings → Database → RLS → Disable for this application

- **Database Limits**: 
  - Free tier: 500MB storage, 50k monthly active users
  - Check your project plan if scraping large datasets

- **Connection Limits**:
  - Supabase free: 10 concurrent connections
  - Update `DB_POOL_SIZE` if hitting limits:
    ```env
    DB_POOL_SIZE=8  # Keep below connection limit
    ```

## Architecture

```
scraper/
├── core/
│   ├── settings.py      # Configuration management
│   ├── logger.py        # Structured logging setup
│   ├── database.py      # Database connection pool
│   ├── models.py        # SQLAlchemy ORM models
│   └── schemas.py       # Pydantic validation schemas
├── scrapers/
│   ├── base_scraper.py  # Base class for all scrapers
│   ├── kariera_mk.py    # Individual source scrapers
│   ├── jobs_com_mk.py
│   └── ...
├── services/
│   ├── deduplication.py # Duplicate detection
│   ├── normalization.py # Data standardization
│   └── job_processor.py # Database operations
├── scheduler/
│   └── scheduler.py     # APScheduler integration
├── main.py              # Entry point
├── requirements.txt     # Python dependencies
└── docker-compose.yml   # Local testing setup
```

## Adding New Job Sources

1. **Create scraper file** in `scrapers/` directory:

```python
from typing import List
from bs4 import BeautifulSoup
from scrapers.base_scraper import BaseScraper, ScrapedJob
from core.logger import get_logger

logger = get_logger(__name__)


class MySourceScraper(BaseScraper):
    def __init__(self):
        super().__init__(
            source_name="My Source",
            base_url="https://mysource.com/"
        )

    def scrape(self) -> List[ScrapedJob]:
        logger.info("Starting scrape", source=self.source_name)
        jobs = []
        
        try:
            response = self._get(self.base_url)
            if not response:
                return jobs
                
            soup = BeautifulSoup(response.content, 'html.parser')
            # Parse and extract jobs...
            
        except Exception as e:
            logger.error(f"Scraping failed: {str(e)}", source=self.source_name)
        
        return jobs
```

2. **Register in** `scrapers/__init__.py`:

```python
from scrapers.my_source import MySourceScraper

SCRAPER_CLASSES = [
    # ... existing scrapers
    MySourceScraper,
]
```

3. **Add source to database** via the admin panel or directly:

```sql
INSERT INTO sources (name, base_url, active) 
VALUES ('My Source', 'https://mysource.com/', true)
ON CONFLICT (name) DO NOTHING;
```

## Error Handling

The system includes comprehensive error handling:

- **Automatic retries** with exponential backoff
- **Connection pooling** for database efficiency
- **Graceful degradation** - one source failure doesn't stop others
- **Structured error logging** for debugging
- **Health checks** for monitoring

## Performance Optimization

- **Batch inserts**: Groups jobs for faster database writes
- **Connection pooling**: Reuses database connections
- **Concurrent scraping**: Multiple sources in parallel
- **Indexed queries**: <100ms response times
- **Deduplication**: Prevents redundant data

## Monitoring

Monitor scraper health using the health check endpoint:

```bash
curl http://localhost:8000/health
```

View logs:

```bash
tail -f logs/scraper.log

# Or in Docker
docker-compose logs -f scraper
```

## Migration from Node.js System

See [MIGRATION.md](./MIGRATION.md) for detailed migration instructions.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment instructions.

## Troubleshooting

### Database Connection Error

```
Error: Failed to connect to database
```

**Solution**: Check DATABASE_URL in .env matches your database instance

```bash
# Test connection
python -c "from core.database import db_manager; db_manager.get_session_sync()"
```

### Supabase Connection Issues

**Error**: `psycopg2.OperationalError: could not translate host name`

**Solution**: 
- Verify you're using the **Connection Pooler** URL (pgbouncer), not direct URL
- URL should contain `pooler.supabase.com`, not just `aws-0-`

**Error**: `too many connections`

**Solution**: Reduce connection pool size in .env:
```env
DB_POOL_SIZE=5  # Default is 20, reduce for Supabase free tier
```

**Error**: `relation "sources" does not exist`

**Solution**: 
- Run the SQL schema in Supabase SQL Editor
- Verify tables were created: Go to Supabase Dashboard → Table Editor

### No Jobs Being Scraped

**Solution**: Check if scrapers are enabled and running

```bash
curl http://localhost:8000/health
curl http://localhost:8000/scheduler/status
```

### High Memory Usage

**Solution**: Reduce BATCH_INSERT_SIZE or concurrent_scrapers

```env
BATCH_INSERT_SIZE=50
CONCURRENT_SCRAPERS=2
```

## Contributing

To add improvements:

1. Create new scraper for additional job sources
2. Enhance existing scrapers' CSS selectors
3. Improve error handling and logging
4. Add monitoring and alerting

## License

MIT
