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

-- Create users table with admin role
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  is_admin boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS for users table
alter table users enable row level security;

-- Users can read their own data
create policy "Users can read own data"
  on users for select
  using (auth.uid() = id);

-- Only admins can update admin status (managed via SQL or admin panel)
create policy "Admins can update users"
  on users for update
  using (
    exists (
      select 1 from users
      where id = auth.uid() and is_admin = true
    )
  );

-- Create filter_presets table
create table if not exists filter_presets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  filters jsonb not null,
  created_by uuid references users(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  constraint unique_preset_name unique (name, created_by)
);

-- Enable RLS for filter_presets
alter table filter_presets enable row level security;

-- Only admins can create presets
create policy "Admins can create presets"
  on filter_presets for insert
  with check (
    exists (
      select 1 from users
      where id = auth.uid() and is_admin = true
    )
  );

-- Only admins can read presets
create policy "Admins can read presets"
  on filter_presets for select
  using (
    exists (
      select 1 from users
      where id = auth.uid() and is_admin = true
    )
  );

-- Only admins can update their own presets
create policy "Admins can update own presets"
  on filter_presets for update
  using (
    created_by = auth.uid() and
    exists (
      select 1 from users
      where id = auth.uid() and is_admin = true
    )
  );

-- Only admins can delete their own presets
create policy "Admins can delete own presets"
  on filter_presets for delete
  using (
    created_by = auth.uid() and
    exists (
      select 1 from users
      where id = auth.uid() and is_admin = true
    )
  );

-- Create indexes for performance
create index if not exists idx_filter_presets_created_by
  on filter_presets (created_by);

create index if not exists idx_filter_presets_created_at
  on filter_presets (created_at desc);

-- Function to automatically create user record on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create user record on auth.users insert
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
