-- ============================================================
-- 006_add_crowdsource_to_trade_outcomes.sql
-- Phase 2: Crowdsource Enhancement
-- Adds opt-in flag to trade_outcomes so users can anonymously
-- contribute their trades to the shared AI training pool.
-- Also creates the aggregate stats view Sean AI uses.
-- ============================================================

-- 1. Add opt-in column to trade_outcomes
ALTER TABLE public.trade_outcomes
  ADD COLUMN IF NOT EXISTS is_crowdsource_eligible BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.trade_outcomes.is_crowdsource_eligible IS
  'User opted in to share this trade anonymously for AI training (Phase 2 crowdsource)';

-- Index for fast aggregate queries on opted-in rows
CREATE INDEX IF NOT EXISTS trade_outcomes_crowdsource_idx
  ON public.trade_outcomes (is_crowdsource_eligible, setup_type, breakout_score)
  WHERE is_crowdsource_eligible = true;

-- 2. Helper function: score band label
-- Converts a numeric score 0-100 into a readable band string e.g. 83 -> '80-89'
CREATE OR REPLACE FUNCTION score_band(score INTEGER)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF score IS NULL THEN RETURN 'unscored'; END IF;
  RETURN (FLOOR(score / 10) * 10)::TEXT || '-' || (FLOOR(score / 10) * 10 + 9)::TEXT;
END;
$$;

-- 3. Aggregate stats view
-- Used by _get_crowdsource_context() in ai_analysis.py
-- Groups opted-in closed trades by setup_type + score band
CREATE OR REPLACE VIEW public.crowdsource_stats AS
SELECT
  setup_type,
  score_band(breakout_score) AS score_range,
  COUNT(*) AS trade_count,
  ROUND(
    100.0 * SUM(CASE WHEN outcome = 'win' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0),
    1
  ) AS win_rate_pct,
  ROUND(AVG(gain_pct)::NUMERIC, 2) AS avg_gain_pct,
  ROUND(AVG(CASE WHEN outcome = 'win' THEN gain_pct END)::NUMERIC, 2) AS avg_winner_pct,
  ROUND(AVG(CASE WHEN outcome = 'loss' THEN gain_pct END)::NUMERIC, 2) AS avg_loser_pct
FROM public.trade_outcomes
WHERE
  is_crowdsource_eligible = true
  AND outcome IN ('win', 'loss', 'breakeven')
  AND setup_type IS NOT NULL
GROUP BY setup_type, score_band(breakout_score)
HAVING COUNT(*) >= 5
ORDER BY trade_count DESC, win_rate_pct DESC;

-- 4. Grant read access to authenticated users
-- The crowdsource_stats VIEW is fully anonymized aggregate data
GRANT SELECT ON public.crowdsource_stats TO authenticated;

-- Done.
-- After running this migration:
--   1. Deploy backend (trade_routes.py + ai_analysis.py updated)
--   2. Deploy frontend (opt-in toggle on trade log form)
--   3. Sean AI automatically uses crowdsource_stats once >= 5
--      users have contributed trades per setup bucket.
