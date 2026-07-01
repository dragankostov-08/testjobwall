CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- Job Sources
-- =============================================
CREATE TABLE IF NOT EXISTS sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'Kariera.mk', 'Vrabotuvanje.com.mk'
    base_url VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT true,
    trust_score NUMERIC(3,2) DEFAULT 0.70,
    last_scraped TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- Job Listings
-- =============================================
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    location VARCHAR(100) NOT NULL,
    url TEXT NOT NULL UNIQUE,
    description TEXT,
    categories TEXT[] NOT NULL, -- e.g., ['IT', 'Remote']
    is_remote BOOLEAN DEFAULT false,
    salary VARCHAR(255),
    score NUMERIC(4,2) DEFAULT 1.00,
    hash_key VARCHAR(64) UNIQUE, -- Deduplication key: SHA256(company + title + location)
    view_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    save_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    company_logo_url TEXT
);

-- =============================================
-- News Sources
-- =============================================
CREATE TABLE IF NOT EXISTS news_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL UNIQUE,
    url VARCHAR(500) NOT NULL,
    source_type VARCHAR(50) DEFAULT 'rss',   -- 'rss' or 'scraper'
    trust_score NUMERIC(3,2) DEFAULT 0.50,
    active BOOLEAN DEFAULT true,
    last_fetched TIMESTAMP WITH TIME ZONE,
    scraper_config JSONB DEFAULT '{}'::jsonb
);

-- =============================================
-- News Articles
-- =============================================
CREATE TABLE IF NOT EXISTS news_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID REFERENCES news_sources(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    summary TEXT,
    original_url TEXT NOT NULL UNIQUE,
    image_url TEXT,
    author VARCHAR(255),
    published_at TIMESTAMP WITH TIME ZONE NOT NULL,
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    category VARCHAR(100) DEFAULT 'general',
    relevance_score NUMERIC(4,2) DEFAULT 1.00,
    view_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    is_trending BOOLEAN DEFAULT false
);

-- =============================================
-- Pre-populate Sources
-- =============================================
INSERT INTO sources (name, base_url, trust_score) VALUES 
('Kariera.mk', 'https://kariera.mk/', 0.95),
('Vrabotuvanje.com.mk', 'https://www.vrabotuvanje.com.mk/', 0.90),
('Apliciraj.mk', 'https://apliciraj.mk/', 0.85),
('Najdirabota.com.mk', 'https://www.najdirabota.com.mk/', 0.85),
('Vraboti.se', 'https://vraboti.se/', 0.80),
('Jobs.com.mk', 'https://jobs.com.mk/', 0.80),
('Oglasizarabota.mk', 'https://www.oglasizarabota.mk/', 0.75),
('App.thrivity.mk', 'https://app.thrivity.mk/job-posts', 0.75),
('Honorarec.mk', 'https://honorarec.mk/', 0.70),
('Imashchoek.mk', 'https://imashchoek.mk/find-a-job', 0.70),
('Manpower.mk', 'https://manpower.mk/mk/mozhnosti-za-rabota', 0.70)
ON CONFLICT (name) DO NOTHING;

INSERT INTO news_sources (name, url, source_type, trust_score) VALUES
('IT.mk', 'https://it.mk/feed/', 'rss', 0.85),
('Kapital.mk', 'https://kapital.mk/feed/', 'rss', 0.90),
('Biznis.mk', 'https://biznis.mk/feed/', 'rss', 0.80),
('Faktor.mk', 'https://faktor.mk/rss', 'rss', 0.75),
('SDK.mk', 'https://sdk.mk/index.php/feed/', 'rss', 0.70)
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- Production Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_jobs_category_score ON jobs USING btree (categories, score DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_expires_at ON jobs (expires_at);
CREATE INDEX IF NOT EXISTS idx_jobs_hash_key ON jobs (hash_key);
CREATE INDEX IF NOT EXISTS idx_jobs_search ON jobs USING gin (to_tsvector('simple', title || ' ' || company));
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_remote_score ON jobs (is_remote, score DESC) WHERE is_remote = true;

CREATE INDEX IF NOT EXISTS idx_news_published ON news_articles (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_relevance ON news_articles (relevance_score DESC, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_category ON news_articles (category, relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_news_trending ON news_articles (is_trending, published_at DESC) WHERE is_trending = true;
CREATE INDEX IF NOT EXISTS idx_news_original_url ON news_articles (original_url);
