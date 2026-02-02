-- Migration: Create user-related tables
-- Run this in Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- WATCHLISTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.watchlists (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    notes TEXT,
    alert_enabled BOOLEAN DEFAULT false,
    alert_price NUMERIC(10, 2),
    added_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    UNIQUE(user_id, symbol)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON public.watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_symbol ON public.watchlists(symbol);
CREATE INDEX IF NOT EXISTS idx_watchlists_user_symbol ON public.watchlists(user_id, symbol);

-- Row Level Security (RLS)
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own watchlist items
CREATE POLICY "Users can view own watchlist"
    ON public.watchlists FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own watchlist items
CREATE POLICY "Users can insert own watchlist"
    ON public.watchlists FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own watchlist items
CREATE POLICY "Users can update own watchlist"
    ON public.watchlists FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own watchlist items
CREATE POLICY "Users can delete own watchlist"
    ON public.watchlists FOR DELETE
    USING (auth.uid() = user_id);


-- ============================================
-- USER PREFERENCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Scan preferences
    min_score INTEGER DEFAULT 70,
    max_distance_pct NUMERIC(5, 2) DEFAULT 5.0,
    min_adr_pct NUMERIC(5, 2) DEFAULT 2.0,
    setup_types TEXT[] DEFAULT ARRAY['FLAT_TOP', 'ASCENDING_WEDGE', 'HIGH_TIGHT_FLAG'],

    -- Display preferences
    default_timeframe TEXT DEFAULT '1D',
    results_per_page INTEGER DEFAULT 25,
    dark_mode BOOLEAN DEFAULT true,

    -- Notification preferences
    email_alerts BOOLEAN DEFAULT false,
    alert_threshold INTEGER DEFAULT 80,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Row Level Security (RLS)
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own preferences
CREATE POLICY "Users can view own preferences"
    ON public.user_preferences FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own preferences
CREATE POLICY "Users can insert own preferences"
    ON public.user_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own preferences
CREATE POLICY "Users can update own preferences"
    ON public.user_preferences FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Plan information
    plan TEXT DEFAULT 'free', -- free, premium, pro
    status TEXT DEFAULT 'active', -- active, canceled, past_due, trialing

    -- Stripe information
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,

    -- Billing period
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- Row Level Security (RLS)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own subscription
CREATE POLICY "Users can view own subscription"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Service role can manage all subscriptions (for webhooks)
CREATE POLICY "Service role can manage subscriptions"
    ON public.subscriptions FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');


-- ============================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to user_preferences
CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to subscriptions
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- GRANT PERMISSIONS
-- ============================================
-- Grant authenticated users access to tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.watchlists TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_preferences TO authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;

-- Grant service role full access (for backend operations)
GRANT ALL ON public.watchlists TO service_role;
GRANT ALL ON public.user_preferences TO service_role;
GRANT ALL ON public.subscriptions TO service_role;

-- Grant usage on sequences
GRANT USAGE, SELECT ON SEQUENCE watchlists_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE watchlists_id_seq TO service_role;