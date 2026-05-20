-- ============================================================
-- 005_create_sean_trades.sql
-- Sean's personal verified trades — used as ground-truth
-- training signal for Sean AI. Admin-only write access.
-- ============================================================

-- ── Main table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sean_trades (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What was traded
  symbol              TEXT        NOT NULL,                          -- e.g. "NVDA"
  direction           TEXT        NOT NULL DEFAULT 'long'
                                  CHECK (direction IN ('long', 'short')),
  setup_type          TEXT,                                          -- e.g. "flat_top_breakout", "bull_flag"
  breakout_score      INTEGER     CHECK (breakout_score BETWEEN 0 AND 100),

  -- Stock entry / exit
  entry_price         NUMERIC(12,4) NOT NULL CHECK (entry_price > 0),
  exit_price          NUMERIC(12,4)           CHECK (exit_price  > 0),
  stop_price          NUMERIC(12,4)           CHECK (stop_price  > 0),
  gain_pct            NUMERIC(8,4),                                  -- computed or manual, e.g. 12.5

  -- Options contract (nullable — fill only for options trades)
  contract_type       TEXT        CHECK (contract_type IN ('call', 'put')),
  strike_price        NUMERIC(12,4),
  expiration_date     DATE,
  contracts_held      INTEGER     CHECK (contracts_held > 0),
  premium_paid        NUMERIC(14,4),                                 -- per-contract cost at entry
  premium_exit        NUMERIC(14,4),                                 -- per-contract value at exit

  -- Outcome
  outcome             TEXT        NOT NULL DEFAULT 'open'
                                  CHECK (outcome IN ('win', 'loss', 'breakeven', 'open')),

  -- The gold — qualitative teaching labels
  -- Why Sean took it / why he passed on something similar
  why_took_trade      TEXT,                                          -- "clear flat top, 3 weeks tight, vol dry up"
  -- What made it look wrong but was actually fine (false-negative avoidance)
  looked_wrong_but    TEXT,                                          -- "base felt loose but sector was ripping"
  -- What looked right but failed (false-positive avoidance)
  looked_right_but    TEXT,                                          -- "perfect flag but market topped that day"
  -- What he'd do differently or what to watch for
  key_lesson          TEXT,

  -- Chart reference (optional base64 or storage URL)
  chart_image_url     TEXT,

  -- Metadata
  traded_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at           TIMESTAMPTZ,
  created_by          UUID        REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS sean_trades_symbol_idx     ON public.sean_trades (symbol);
CREATE INDEX IF NOT EXISTS sean_trades_setup_idx      ON public.sean_trades (setup_type);
CREATE INDEX IF NOT EXISTS sean_trades_outcome_idx    ON public.sean_trades (outcome);
CREATE INDEX IF NOT EXISTS sean_trades_traded_at_idx  ON public.sean_trades (traded_at DESC);

-- ── RLS ───────────────────────────────────────────────────
ALTER TABLE public.sean_trades ENABLE ROW LEVEL SECURITY;

-- Admins have full read/write
CREATE POLICY "Admins full access on sean_trades"
  ON public.sean_trades FOR ALL
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

-- All authenticated users can SELECT (read) so Sean can use the data in AI context.
-- No user can INSERT / UPDATE / DELETE — that stays admin-only above.
CREATE POLICY "Authenticated users can read sean_trades"
  ON public.sean_trades FOR SELECT
  USING (auth.role() = 'authenticated');

-- ── updated_at trigger ────────────────────────────────────
CREATE OR REPLACE FUNCTION update_sean_trades_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sean_trades_updated_at
  BEFORE UPDATE ON public.sean_trades
  FOR EACH ROW EXECUTE FUNCTION update_sean_trades_updated_at();

-- ── Computed gain_pct helper ──────────────────────────────
-- Auto-compute gain_pct on exit_price insert/update when it isn't supplied manually.
-- For options: based on premium. For stocks: based on entry/exit price.
CREATE OR REPLACE FUNCTION compute_sean_trade_gain()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.gain_pct IS NULL THEN
    IF NEW.contract_type IS NOT NULL
       AND NEW.premium_paid IS NOT NULL
       AND NEW.premium_exit IS NOT NULL
       AND NEW.premium_paid > 0 THEN
      -- Options P&L
      NEW.gain_pct := ROUND(((NEW.premium_exit - NEW.premium_paid) / NEW.premium_paid) * 100, 4);
    ELSIF NEW.exit_price IS NOT NULL AND NEW.entry_price > 0 THEN
      -- Stock P&L (direction-aware)
      IF NEW.direction = 'short' THEN
        NEW.gain_pct := ROUND(((NEW.entry_price - NEW.exit_price) / NEW.entry_price) * 100, 4);
      ELSE
        NEW.gain_pct := ROUND(((NEW.exit_price - NEW.entry_price) / NEW.entry_price) * 100, 4);
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sean_trades_compute_gain
  BEFORE INSERT OR UPDATE ON public.sean_trades
  FOR EACH ROW EXECUTE FUNCTION compute_sean_trade_gain();
