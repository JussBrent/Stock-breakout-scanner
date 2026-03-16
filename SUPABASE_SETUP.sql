-- ============================================================
-- STOCK SCANNER - COMPLETE SUPABASE DATABASE SETUP
-- Run this in Supabase SQL Editor (in order, top to bottom)
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- 1. PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    is_admin BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- 2. USER PREFERENCES
-- ============================================================
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
    push_alerts BOOLEAN DEFAULT false,
    alert_threshold INTEGER DEFAULT 80,
    alert_sound BOOLEAN DEFAULT true,

    -- Auto-scan settings
    auto_scan_enabled BOOLEAN DEFAULT false,
    auto_scan_interval INTEGER DEFAULT 300, -- seconds

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
    ON public.user_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
    ON public.user_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
    ON public.user_preferences FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- 3. WATCHLISTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.watchlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'My Watchlist',
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    color TEXT DEFAULT '#3B82F6',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_watchlist_name UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON public.watchlists(user_id);

ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watchlists"
    ON public.watchlists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own watchlists"
    ON public.watchlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own watchlists"
    ON public.watchlists FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own watchlists"
    ON public.watchlists FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- 4. WATCHLIST ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.watchlist_items (
    id BIGSERIAL PRIMARY KEY,
    watchlist_id UUID NOT NULL REFERENCES public.watchlists(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    notes TEXT,
    target_price NUMERIC(12, 2),
    stop_price NUMERIC(12, 2),
    alert_enabled BOOLEAN DEFAULT false,
    alert_price NUMERIC(12, 2),
    sort_order INTEGER DEFAULT 0,
    added_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_watchlist_item UNIQUE (watchlist_id, symbol)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_items_watchlist ON public.watchlist_items(watchlist_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_items_user ON public.watchlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_items_symbol ON public.watchlist_items(symbol);

ALTER TABLE public.watchlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watchlist items"
    ON public.watchlist_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own watchlist items"
    ON public.watchlist_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own watchlist items"
    ON public.watchlist_items FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own watchlist items"
    ON public.watchlist_items FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- 5. SCAN RESULTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.scan_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol TEXT NOT NULL,
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Price data
    price NUMERIC NOT NULL,
    trigger_price NUMERIC NOT NULL,
    distance_pct NUMERIC NOT NULL,

    -- Volume
    volume BIGINT,
    avg_vol_50 NUMERIC NOT NULL,
    relative_volume NUMERIC,

    -- Pattern
    setup_type TEXT NOT NULL,  -- FLAT_TOP, WEDGE, FLAG, BASE, UNKNOWN
    breakout_score INTEGER NOT NULL CHECK (breakout_score BETWEEN 0 AND 100),
    notes TEXT[],

    -- Market data
    market_cap NUMERIC,
    sector TEXT,
    industry TEXT,

    -- Metadata
    scan_preset_id UUID,  -- references filter_presets(id), FK added after table creation

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scan_results_scanned_at ON public.scan_results(scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_results_score ON public.scan_results(breakout_score DESC);
CREATE INDEX IF NOT EXISTS idx_scan_results_symbol ON public.scan_results(symbol);
CREATE INDEX IF NOT EXISTS idx_scan_results_setup_type ON public.scan_results(setup_type);


-- ============================================================
-- 6. SCAN RESULT METRICS (technical indicators per scan)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.scan_result_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_result_id UUID NOT NULL REFERENCES public.scan_results(id) ON DELETE CASCADE,

    -- EMAs
    ema21 NUMERIC,
    ema50 NUMERIC,
    ema200 NUMERIC,

    -- ADR / ATR
    adr_pct_14 NUMERIC,
    atr_14 NUMERIC,

    -- Momentum indicators
    rsi_14 NUMERIC,
    macd NUMERIC,
    macd_signal NUMERIC,
    macd_histogram NUMERIC,

    -- Trend
    trend_direction TEXT,  -- STRONG_UP, UP, NEUTRAL, DOWN, STRONG_DOWN
    ema_alignment TEXT,    -- BULLISH, BEARISH, MIXED

    -- Support/Resistance
    support_level NUMERIC,
    resistance_level NUMERIC,
    pivot_point NUMERIC,

    -- Volume metrics
    volume_trend TEXT,     -- INCREASING, DECREASING, STABLE
    accumulation_distribution NUMERIC,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scan_result_metrics_result ON public.scan_result_metrics(scan_result_id);


-- ============================================================
-- 7. ALERTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,

    -- Alert configuration
    alert_type TEXT NOT NULL,  -- PRICE_ABOVE, PRICE_BELOW, BREAKOUT, SCORE_THRESHOLD, VOLUME_SPIKE, PATTERN_DETECTED
    condition_value NUMERIC,   -- target price or score threshold
    condition_meta JSONB,      -- additional conditions (e.g. setup_type, timeframe)

    -- Alert delivery
    notify_email BOOLEAN DEFAULT false,
    notify_push BOOLEAN DEFAULT true,
    notify_sms BOOLEAN DEFAULT false,

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_triggered BOOLEAN DEFAULT false,
    triggered_at TIMESTAMPTZ,
    triggered_price NUMERIC,
    trigger_count INTEGER DEFAULT 0,
    max_triggers INTEGER DEFAULT 1,  -- 0 = unlimited

    -- Expiry
    expires_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_user ON public.alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_symbol ON public.alerts(symbol);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON public.alerts(is_active) WHERE is_active = true;

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts"
    ON public.alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own alerts"
    ON public.alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own alerts"
    ON public.alerts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own alerts"
    ON public.alerts FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- 8. BROKER CONNECTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.broker_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    broker_name TEXT NOT NULL,  -- ALPACA, TD_AMERITRADE, INTERACTIVE_BROKERS, WEBULL, TRADIER
    environment TEXT NOT NULL DEFAULT 'paper',  -- paper, live

    -- Auth (encrypted at rest by Supabase)
    api_key_encrypted TEXT,
    api_secret_encrypted TEXT,
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMPTZ,

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_connected BOOLEAN DEFAULT false,
    last_connected_at TIMESTAMPTZ,
    last_error TEXT,

    -- Settings
    default_account_id TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_broker_per_user UNIQUE (user_id, broker_name, environment)
);

CREATE INDEX IF NOT EXISTS idx_broker_connections_user ON public.broker_connections(user_id);

ALTER TABLE public.broker_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own broker connections"
    ON public.broker_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own broker connections"
    ON public.broker_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own broker connections"
    ON public.broker_connections FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own broker connections"
    ON public.broker_connections FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- 9. BROKER ACCOUNTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.broker_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES public.broker_connections(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    account_number TEXT NOT NULL,
    account_type TEXT,          -- MARGIN, CASH, IRA
    account_status TEXT,        -- ACTIVE, INACTIVE, RESTRICTED

    -- Balances (synced from broker)
    cash NUMERIC(14, 2) DEFAULT 0,
    buying_power NUMERIC(14, 2) DEFAULT 0,
    portfolio_value NUMERIC(14, 2) DEFAULT 0,
    equity NUMERIC(14, 2) DEFAULT 0,
    day_trade_count INTEGER DEFAULT 0,
    is_pdt BOOLEAN DEFAULT false,  -- Pattern Day Trader flag

    -- Sync
    last_synced_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_broker_accounts_user ON public.broker_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_broker_accounts_connection ON public.broker_accounts(connection_id);

ALTER TABLE public.broker_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own broker accounts"
    ON public.broker_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own broker accounts"
    ON public.broker_accounts FOR ALL USING (auth.uid() = user_id);


-- ============================================================
-- 10. BROKER ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.broker_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.broker_accounts(id) ON DELETE SET NULL,

    broker_order_id TEXT,       -- ID from the broker
    symbol TEXT NOT NULL,

    -- Order details
    side TEXT NOT NULL,          -- BUY, SELL
    order_type TEXT NOT NULL,    -- MARKET, LIMIT, STOP, STOP_LIMIT
    time_in_force TEXT DEFAULT 'DAY',  -- DAY, GTC, IOC, FOK

    quantity NUMERIC(12, 4) NOT NULL,
    limit_price NUMERIC(12, 2),
    stop_price NUMERIC(12, 2),

    -- Fill info
    filled_qty NUMERIC(12, 4) DEFAULT 0,
    filled_avg_price NUMERIC(12, 2),

    -- Status
    status TEXT NOT NULL DEFAULT 'pending',  -- pending, submitted, partial, filled, cancelled, rejected, expired
    submitted_at TIMESTAMPTZ,
    filled_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    reject_reason TEXT,

    -- Fees
    commission NUMERIC(10, 4) DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_broker_orders_user ON public.broker_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_broker_orders_symbol ON public.broker_orders(symbol);
CREATE INDEX IF NOT EXISTS idx_broker_orders_status ON public.broker_orders(status);
CREATE INDEX IF NOT EXISTS idx_broker_orders_created ON public.broker_orders(created_at DESC);

ALTER TABLE public.broker_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
    ON public.broker_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own orders"
    ON public.broker_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own orders"
    ON public.broker_orders FOR UPDATE USING (auth.uid() = user_id);


-- ============================================================
-- 11. BROKER POSITIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.broker_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.broker_accounts(id) ON DELETE SET NULL,

    symbol TEXT NOT NULL,
    quantity NUMERIC(12, 4) NOT NULL,
    avg_entry_price NUMERIC(12, 2) NOT NULL,
    current_price NUMERIC(12, 2),
    market_value NUMERIC(14, 2),

    -- P&L
    unrealized_pl NUMERIC(14, 2),
    unrealized_pl_pct NUMERIC(8, 4),
    realized_pl NUMERIC(14, 2) DEFAULT 0,

    -- Position info
    side TEXT DEFAULT 'long',  -- long, short
    cost_basis NUMERIC(14, 2),

    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_position UNIQUE (account_id, symbol)
);

CREATE INDEX IF NOT EXISTS idx_broker_positions_user ON public.broker_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_broker_positions_symbol ON public.broker_positions(symbol);

ALTER TABLE public.broker_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own positions"
    ON public.broker_positions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own positions"
    ON public.broker_positions FOR ALL USING (auth.uid() = user_id);


-- ============================================================
-- 12. BROKER ACTIVITIES (transaction log)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.broker_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.broker_accounts(id) ON DELETE SET NULL,

    activity_type TEXT NOT NULL,  -- FILL, DIVIDEND, TRANSFER, FEE, INTEREST, JOURNAL, SPLIT
    symbol TEXT,
    description TEXT,

    quantity NUMERIC(12, 4),
    price NUMERIC(12, 2),
    amount NUMERIC(14, 2),        -- net amount
    side TEXT,                     -- BUY, SELL

    broker_activity_id TEXT,       -- ID from broker
    activity_date TIMESTAMPTZ NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_broker_activities_user ON public.broker_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_broker_activities_symbol ON public.broker_activities(symbol);
CREATE INDEX IF NOT EXISTS idx_broker_activities_date ON public.broker_activities(activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_broker_activities_type ON public.broker_activities(activity_type);

ALTER TABLE public.broker_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activities"
    ON public.broker_activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage activities"
    ON public.broker_activities FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');


-- ============================================================
-- 13. EXECUTED TRADES (trade journal / tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.executed_trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    symbol TEXT NOT NULL,
    side TEXT NOT NULL,             -- LONG, SHORT

    -- Entry
    entry_price NUMERIC(12, 2) NOT NULL,
    entry_date TIMESTAMPTZ NOT NULL,
    entry_quantity NUMERIC(12, 4) NOT NULL,
    entry_order_id UUID REFERENCES public.broker_orders(id) ON DELETE SET NULL,

    -- Exit (null if still open)
    exit_price NUMERIC(12, 2),
    exit_date TIMESTAMPTZ,
    exit_quantity NUMERIC(12, 4),
    exit_order_id UUID REFERENCES public.broker_orders(id) ON DELETE SET NULL,

    -- Risk management
    stop_loss NUMERIC(12, 2),
    take_profit NUMERIC(12, 2),
    risk_reward_ratio NUMERIC(6, 2),
    position_size_pct NUMERIC(5, 2),  -- % of portfolio

    -- P&L
    realized_pnl NUMERIC(14, 2),
    realized_pnl_pct NUMERIC(8, 4),
    fees NUMERIC(10, 4) DEFAULT 0,

    -- Trade details
    strategy TEXT,                  -- breakout, momentum, pullback, reversal
    timeframe TEXT,                 -- 1m, 5m, 15m, 1h, 1D
    status TEXT DEFAULT 'open',     -- open, closed, partial

    -- Review
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),  -- self-rated trade quality
    lessons_learned TEXT,
    tags TEXT[],

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_executed_trades_user ON public.executed_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_executed_trades_symbol ON public.executed_trades(symbol);
CREATE INDEX IF NOT EXISTS idx_executed_trades_status ON public.executed_trades(status);
CREATE INDEX IF NOT EXISTS idx_executed_trades_entry_date ON public.executed_trades(entry_date DESC);

ALTER TABLE public.executed_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trades"
    ON public.executed_trades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own trades"
    ON public.executed_trades FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trades"
    ON public.executed_trades FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own trades"
    ON public.executed_trades FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- 14. TRADE SETUP LINKS (link trades to scan results)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.trade_setup_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id UUID NOT NULL REFERENCES public.executed_trades(id) ON DELETE CASCADE,
    scan_result_id UUID NOT NULL REFERENCES public.scan_results(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- How well the setup played out
    setup_followed BOOLEAN DEFAULT true,    -- did trader follow the setup?
    outcome_rating INTEGER CHECK (outcome_rating BETWEEN 1 AND 5),
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_trade_setup UNIQUE (trade_id, scan_result_id)
);

CREATE INDEX IF NOT EXISTS idx_trade_setup_links_trade ON public.trade_setup_links(trade_id);
CREATE INDEX IF NOT EXISTS idx_trade_setup_links_scan ON public.trade_setup_links(scan_result_id);

ALTER TABLE public.trade_setup_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trade setup links"
    ON public.trade_setup_links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own trade setup links"
    ON public.trade_setup_links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own trade setup links"
    ON public.trade_setup_links FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- 15. USER NOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- What the note is about
    note_type TEXT NOT NULL,       -- SYMBOL, TRADE, SCAN, GENERAL, JOURNAL
    symbol TEXT,                    -- optional, if note is about a stock
    reference_id UUID,             -- optional FK to trade/scan/etc
    reference_type TEXT,           -- TRADE, SCAN_RESULT, WATCHLIST

    -- Content
    title TEXT,
    content TEXT NOT NULL,
    tags TEXT[],
    is_pinned BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_notes_user ON public.user_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_symbol ON public.user_notes(symbol);
CREATE INDEX IF NOT EXISTS idx_user_notes_type ON public.user_notes(note_type);
CREATE INDEX IF NOT EXISTS idx_user_notes_reference ON public.user_notes(reference_id);

ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notes"
    ON public.user_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own notes"
    ON public.user_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes"
    ON public.user_notes FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes"
    ON public.user_notes FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- 16. FILTER PRESETS (admin-managed scan presets)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.filter_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    filters JSONB NOT NULL,
    is_public BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_preset_name UNIQUE (name, created_by)
);

CREATE INDEX IF NOT EXISTS idx_filter_presets_created_by ON public.filter_presets(created_by);
CREATE INDEX IF NOT EXISTS idx_filter_presets_created_at ON public.filter_presets(created_at DESC);

ALTER TABLE public.filter_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can create presets"
    ON public.filter_presets FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );
CREATE POLICY "Anyone can read public presets"
    ON public.filter_presets FOR SELECT
    USING (is_public = true OR created_by = auth.uid());
CREATE POLICY "Owners can update own presets"
    ON public.filter_presets FOR UPDATE
    USING (created_by = auth.uid());
CREATE POLICY "Owners can delete own presets"
    ON public.filter_presets FOR DELETE
    USING (created_by = auth.uid());


-- ============================================================
-- 17. SUBSCRIPTIONS (Stripe billing)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    plan TEXT DEFAULT 'free',           -- free, premium, pro
    status TEXT DEFAULT 'active',       -- active, canceled, past_due, trialing

    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,

    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage subscriptions"
    ON public.subscriptions FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');


-- ============================================================
-- DEFERRED FOREIGN KEYS (cross-table references)
-- ============================================================
ALTER TABLE public.scan_results
    ADD CONSTRAINT fk_scan_results_preset
    FOREIGN KEY (scan_preset_id) REFERENCES public.filter_presets(id) ON DELETE SET NULL;


-- ============================================================
-- SHARED TRIGGER: Auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_watchlists_updated_at
    BEFORE UPDATE ON public.watchlists
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at
    BEFORE UPDATE ON public.alerts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_broker_connections_updated_at
    BEFORE UPDATE ON public.broker_connections
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_broker_accounts_updated_at
    BEFORE UPDATE ON public.broker_accounts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_broker_orders_updated_at
    BEFORE UPDATE ON public.broker_orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_broker_positions_updated_at
    BEFORE UPDATE ON public.broker_positions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_executed_trades_updated_at
    BEFORE UPDATE ON public.executed_trades
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_notes_updated_at
    BEFORE UPDATE ON public.user_notes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_filter_presets_updated_at
    BEFORE UPDATE ON public.filter_presets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- GRANTS
-- ============================================================
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.watchlists TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.watchlist_items TO authenticated;
GRANT SELECT ON public.scan_results TO authenticated;
GRANT SELECT ON public.scan_result_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alerts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.broker_connections TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.broker_accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.broker_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.broker_positions TO authenticated;
GRANT SELECT ON public.broker_activities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.executed_trades TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.trade_setup_links TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.filter_presets TO authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;

-- Service role gets full access for backend operations
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.user_preferences TO service_role;
GRANT ALL ON public.watchlists TO service_role;
GRANT ALL ON public.watchlist_items TO service_role;
GRANT ALL ON public.scan_results TO service_role;
GRANT ALL ON public.scan_result_metrics TO service_role;
GRANT ALL ON public.alerts TO service_role;
GRANT ALL ON public.broker_connections TO service_role;
GRANT ALL ON public.broker_accounts TO service_role;
GRANT ALL ON public.broker_orders TO service_role;
GRANT ALL ON public.broker_positions TO service_role;
GRANT ALL ON public.broker_activities TO service_role;
GRANT ALL ON public.executed_trades TO service_role;
GRANT ALL ON public.trade_setup_links TO service_role;
GRANT ALL ON public.user_notes TO service_role;
GRANT ALL ON public.filter_presets TO service_role;
GRANT ALL ON public.subscriptions TO service_role;

-- Sequences
GRANT USAGE, SELECT ON SEQUENCE watchlist_items_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE watchlist_items_id_seq TO service_role;
