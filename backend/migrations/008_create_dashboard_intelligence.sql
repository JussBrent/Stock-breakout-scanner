-- Migration 008: Dashboard Intelligence tables
CREATE TABLE IF NOT EXISTS daily_top_setups (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  rank         INTEGER NOT NULL CHECK (rank BETWEEN 1 AND 10),
  symbol       TEXT NOT NULL,
  company_name TEXT,
  sector       TEXT,
  industry     TEXT,
  setup_type   TEXT NOT NULL,
  ai_score     NUMERIC(5,2) NOT NULL DEFAULT 0,
  opportunity_score NUMERIC(5,2),
  confidence   TEXT,
  price        NUMERIC(12,4),
  price_change_pct NUMERIC(8,4),
  volume       BIGINT,
  avg_volume   BIGINT,
  relative_volume NUMERIC(8,2),
  market_cap   BIGINT,
  eps_growth   NUMERIC(8,2),
  revenue_growth NUMERIC(8,2),
  etf_group    TEXT,
  leading_theme TEXT,
  analysis     TEXT,
  key_factors  TEXT[],
  risk_level   TEXT,
  recommendation TEXT,
  is_extended  BOOLEAN DEFAULT FALSE,
  is_sideways  BOOLEAN DEFAULT FALSE,
  group_breakout BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (scan_date, symbol)
);

CREATE TABLE IF NOT EXISTS sector_performance (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  sector       TEXT NOT NULL,
  etf_symbol   TEXT,
  change_pct   NUMERIC(8,4),
  volume       BIGINT,
  avg_volume   BIGINT,
  relative_volume NUMERIC(8,2),
  price        NUMERIC(12,4),
  top_stocks   TEXT[],
  is_breaking_out BOOLEAN DEFAULT FALSE,
  setup_type   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (scan_date, sector)
);

CREATE TABLE IF NOT EXISTS market_sentiment (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_date    DATE NOT NULL DEFAULT CURRENT_DATE UNIQUE,
  sentiment    TEXT NOT NULL DEFAULT 'neutral',
  sentiment_score NUMERIC(5,2) DEFAULT 50,
  vix          NUMERIC(8,4),
  spy_change   NUMERIC(8,4),
  qqq_change   NUMERIC(8,4),
  iwm_change   NUMERIC(8,4),
  advance_decline_ratio NUMERIC(8,4),
  new_highs    INTEGER,
  new_lows     INTEGER,
  above_50ma_pct NUMERIC(8,4),
  above_200ma_pct NUMERIC(8,4),
  leading_themes TEXT[],
  market_notes TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE daily_top_setups ENABLE ROW LEVEL SECURITY;
ALTER TABLE sector_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_sentiment ENABLE ROW LEVEL SECURITY;

CREATE POLICY auth_read_daily_top_setups ON daily_top_setups FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY service_write_daily_top_setups ON daily_top_setups FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY auth_read_sector_performance ON sector_performance FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY service_write_sector_performance ON sector_performance FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY auth_read_market_sentiment ON market_sentiment FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY service_write_market_sentiment ON market_sentiment FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_daily_top_setups_date ON daily_top_setups(scan_date DESC);
CREATE INDEX IF NOT EXISTS idx_sector_performance_date ON sector_performance(scan_date DESC);
CREATE INDEX IF NOT EXISTS idx_market_sentiment_date ON market_sentiment(scan_date DESC);
