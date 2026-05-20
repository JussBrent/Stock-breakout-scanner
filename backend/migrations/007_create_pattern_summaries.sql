-- ============================================================
-- 007_create_pattern_summaries.sql
-- Phase 3: Auto-Learning Summaries
-- Stores AI-generated 'what the data says' summaries per
-- setup type, computed from Sean's trades + crowdsource data.
-- Refreshed on-demand (admin) or auto via lifespan scheduler.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pattern_summaries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which pattern this summary covers
  setup_type      TEXT NOT NULL,
  score_range     TEXT NOT NULL DEFAULT 'all',

  -- The AI-generated narrative — injected verbatim into Sean's context
  summary         TEXT NOT NULL,

  -- Data snapshot used to generate this summary
  sean_trade_count     INTEGER NOT NULL DEFAULT 0,
  community_trade_count INTEGER NOT NULL DEFAULT 0,
  sean_win_rate        NUMERIC(5,2),
  community_win_rate   NUMERIC(5,2),

  -- Staleness tracking
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),

  -- Unique per setup_type + score_range
  CONSTRAINT pattern_summaries_unique UNIQUE (setup_type, score_range),

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS pattern_summaries_setup_idx
  ON public.pattern_summaries (setup_type);

CREATE INDEX IF NOT EXISTS pattern_summaries_expires_idx
  ON public.pattern_summaries (expires_at);

-- RLS
ALTER TABLE public.pattern_summaries ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins full access on pattern_summaries"
  ON public.pattern_summaries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- All authenticated users can read
CREATE POLICY "Authenticated users read pattern_summaries"
  ON public.pattern_summaries FOR SELECT
  USING (auth.role() = 'authenticated');

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_pattern_summaries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pattern_summaries_updated_at
  BEFORE UPDATE ON public.pattern_summaries
  FOR EACH ROW EXECUTE FUNCTION update_pattern_summaries_updated_at();
