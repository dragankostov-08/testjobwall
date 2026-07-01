-- Migration: Smart Ranking & News Feature
-- Run this against your Supabase instance

-- =============================================
-- 1. Sources: Add trust_score for ranking
-- =============================================
ALTER TABLE sources ADD COLUMN IF NOT EXISTS trust_score NUMERIC(3,2) DEFAULT 0.70;

-- Set trust scores for known sources based on data quality
UPDATE sources SET trust_score = 0.95 WHERE name = 'Kariera.mk';
UPDATE sources SET trust_score = 0.90 WHERE name = 'Vrabotuvanje.com.mk';
UPDATE sources SET trust_score = 0.85 WHERE name = 'Apliciraj.mk';
UPDATE sources SET trust_score = 0.85 WHERE name = 'Najdirabota.com.mk';
UPDATE sources SET trust_score = 0.80 WHERE name = 'Vraboti.se';
UPDATE sources SET trust_score = 0.80 WHERE name = 'Jobs.com.mk';
UPDATE sources SET trust_score = 0.75 WHERE name = 'Oglasizarabota.mk';
UPDATE sources SET trust_score = 0.75 WHERE name = 'App.thrivity.mk';
UPDATE sources SET trust_score = 0.70 WHERE name = 'Honorarec.mk';
UPDATE sources SET trust_score = 0.70 WHERE name = 'Imashchoek.mk';
UPDATE sources SET trust_score = 0.70 WHERE name = 'Manpower.mk';

-- =============================================
-- 2. Jobs: Add quality & engagement columns
-- =============================================
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary VARCHAR(255);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS save_count INTEGER DEFAULT 0;

-- Index for trending queries (engagement-based)
CREATE INDEX IF NOT EXISTS idx_jobs_engagement ON jobs ((view_count + click_count * 2 + save_count * 3) DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_remote_score ON jobs (is_remote, score DESC) WHERE is_remote = true;

-- =============================================
-- 3. News Sources table
-- =============================================
CREATE TABLE IF NOT EXISTS news_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL UNIQUE,
    url VARCHAR(500) NOT NULL,
    source_type VARCHAR(50) DEFAULT 'rss',   -- 'rss' or 'scraper'
    trust_score NUMERIC(3,2) DEFAULT 0.50,
    active BOOLEAN DEFAULT true,
    last_fetched TIMESTAMP WITH TIME ZONE,
    -- Scraper config (only used when source_type = 'scraper')
    scraper_config JSONB DEFAULT '{}'::jsonb
);

-- Pre-populate news sources (Macedonian career/business news)
INSERT INTO news_sources (name, url, source_type, trust_score) VALUES
('IT.mk', 'https://it.mk/feed/', 'rss', 0.85),
('Kapital.mk', 'https://kapital.mk/feed/', 'rss', 0.90),
('Biznis.mk', 'https://biznis.mk/feed/', 'rss', 0.80),
('Faktor.mk', 'https://faktor.mk/rss', 'rss', 0.75),
('SDK.mk', 'https://sdk.mk/index.php/feed/', 'rss', 0.70)
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- 4. News Articles table
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

-- Indexes for news queries
CREATE INDEX IF NOT EXISTS idx_news_published ON news_articles (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_relevance ON news_articles (relevance_score DESC, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_category ON news_articles (category, relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_news_trending ON news_articles (is_trending, published_at DESC) WHERE is_trending = true;
CREATE INDEX IF NOT EXISTS idx_news_original_url ON news_articles (original_url);
