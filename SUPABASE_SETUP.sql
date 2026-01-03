-- Run this in Supabase SQL Editor to create breakout_scans table

create table if not exists breakout_scans (
  id uuid primary key default gen_random_uuid(),

  symbol text not null,
  scanned_at timestamptz not null default now(),

  price numeric not null,
  trigger_price numeric not null,
  distance_pct numeric not null,

  adr_pct_14 numeric not null,
  avg_vol_50 numeric not null,

  ema21 numeric not null,
  ema50 numeric not null,
  ema200 numeric not null,

  setup_type text not null,
  breakout_score int not null,

  notes text[],

  market_cap numeric
);

-- Create indexes for performance
create index if not exists idx_breakout_scans_scanned_at
  on breakout_scans (scanned_at desc);

create index if not exists idx_breakout_scans_score
  on breakout_scans (breakout_score desc);

create index if not exists idx_breakout_scans_symbol
  on breakout_scans (symbol);
