// API client for backend communication

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"
const API_BASE = `${API_URL}/api/v1`

// Types matching backend models
export interface AIStockRating {
  symbol: string
  opportunity_score: number // 0-100 rating
  confidence: number // 0-100 AI confidence
  analysis: string // Brief analysis
  key_factors: string[] // Key positive/negative factors
  risk_level: string // "Low", "Medium", "High"
  recommendation: string // "Strong Buy", "Buy", "Hold", "Avoid"
}

export interface ScanResult {
  symbol: string
  price: number
  trigger_price: number
  distance_pct: number
  adr_pct_14: number
  ema21: number
  ema50: number
  ema200: number
  avg_vol_50: number
  market_cap?: number
  setup_type: "FLAT_TOP" | "WEDGE" | "FLAG" | "BASE" | "UNKNOWN"
  breakout_score: number
  notes: string[]
}

export interface AIAnalyzeResponse {
  success: boolean
  count: number
  ratings: AIStockRating[]
  message: string
}

export interface AISymbolAnalysis {
  symbol: string
  price: number
  ema21: number | null
  ema50: number | null
  ema200: number | null
  adr_pct_14: number
  avg_vol_50: number
  market_cap: number | null
  trend: string
  passes_breakout_filter: boolean
  setup_type: string | null
  trigger_price: number | null
  distance_pct: number | null
  breakout_score: number | null
  opportunity_score: number
  confidence: number
  analysis: string
  key_factors: string[]
  risk_level: string
  recommendation: string
  direction: "Long" | "Short" | null
  suggested_entry: number | null
  suggested_stop: number | null
  suggested_target: number | null
  suggested_expiry: string | null
  entry_notes: string
  stop_notes: string
}

export interface UniverseScanRequest {
  symbols?: string[]
  save_to_db?: boolean
  use_mock?: boolean
}

// API Functions

/**
 * Scan universe and get AI-rated top opportunities
 */
export async function aiAnalyzeScan(
  request: UniverseScanRequest = {},
  top_n: number = 10
): Promise<AIAnalyzeResponse> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/api/scan/ai-analyze?top_n=${top_n}`, {
    method: "POST",
    headers,
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to analyze stocks")
  }

  return response.json()
}

/**
 * Analyze chart image or news text with Sean AI
 */
export async function analyzeContent(opts: {
  textContent?: string
  imageBase64?: string
  mediaType?: string
}): Promise<string> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/api/scan/analyze-content`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      text_content: opts.textContent ?? null,
      image_base64: opts.imageBase64 ?? null,
      media_type: opts.mediaType ?? "image/png",
    }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Analysis failed")
  }
  const data = await response.json()
  return data.analysis
}

/**
 * AI analysis for any symbol — fetches Polygon data + runs Claude analysis
 */
export async function aiScanSymbol(symbol: string): Promise<AISymbolAnalysis> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/api/scan/symbol/ai`, {
    method: "POST",
    headers,
    body: JSON.stringify({ symbol }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to analyse symbol")
  }
  const data = await response.json()
  return data.result
}

/**
 * Scan a single symbol (technical filter only, no AI)
 */
export async function scanSymbol(symbol: string): Promise<ScanResult | null> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/api/scan/symbol`, {
    method: "POST",
    headers,
    body: JSON.stringify({ symbol }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to scan symbol")
  }

  const data = await response.json()
  return data.results.length > 0 ? data.results[0] : null
}

/**
 * Health check
 */
export async function healthCheck(): Promise<{
  status: string
  polygon_api: boolean
  supabase: boolean
}> {
  const response = await fetch(`${API_URL}/health`)
  return response.json()
}

// ============================================================
// Momentum API
// ============================================================

export interface MomentumStock {
  symbol: string
  company: string
  price: number
  momentum: number
  trend: "bullish" | "bearish" | "neutral"
  volume: string
  changePercent: number
  breakoutStrength: number
  efficiency: number
}

/**
 * Get top momentum stocks (gainers or losers)
 */
export async function getMomentumStocks(
  direction: "gainers" | "losers" = "gainers"
): Promise<{ stocks: MomentumStock[]; marketOpen: boolean }> {
  const headers = await getAuthHeaders()
  const response = await fetch(
    `${API_URL}/api/momentum/stocks?direction=${direction}`,
    { headers }
  )
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to fetch momentum data")
  }
  const data = await response.json()
  return { stocks: data.stocks ?? [], marketOpen: data.marketOpen ?? false }
}

// ============================================================
// Watchlist API
// ============================================================

export interface WatchlistItem {
  id?: number
  user_id: string
  symbol: string
  added_at: string
  notes?: string | null
  alert_enabled: boolean
  alert_price?: number | null
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { supabase } = await import("./supabase")
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

/**
 * Get user's watchlist
 */
export async function getWatchlist(): Promise<WatchlistItem[]> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/api/watchlist/`, { headers })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to fetch watchlist")
  }
  return response.json()
}

/**
 * Add symbol to watchlist
 */
export async function addToWatchlist(
  symbol: string,
  notes?: string
): Promise<WatchlistItem> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/api/watchlist/`, {
    method: "POST",
    headers,
    body: JSON.stringify({ symbol: symbol.toUpperCase(), notes }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to add to watchlist")
  }
  return response.json()
}

/**
 * Remove symbol from watchlist
 */
export async function removeFromWatchlist(symbol: string): Promise<void> {
  const headers = await getAuthHeaders()
  const response = await fetch(
    `${API_URL}/api/watchlist/${symbol.toUpperCase()}`,
    { method: "DELETE", headers }
  )
  if (!response.ok && response.status !== 204) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to remove from watchlist")
  }
}

/**
 * Check if symbol is in watchlist
 */
export async function checkInWatchlist(
  symbol: string
): Promise<{ symbol: string; in_watchlist: boolean }> {
  const headers = await getAuthHeaders()
  const response = await fetch(
    `${API_URL}/api/watchlist/${symbol.toUpperCase()}/check`,
    { headers }
  )
  if (!response.ok) {
    return { symbol, in_watchlist: false }
  }
  return response.json()
}

// ============================================================
// SnapTrade / Brokerage API
// ============================================================

export interface SnapTradeAccount {
  id: string
  brokerage_authorization_id?: string
  name: string
  number: string
  institution_name?: string
  sync_status?: { status: string }
}

export interface SnapTradeHolding {
  symbol?: { symbol?: string; description?: string }
  units?: number
  price?: number
  open_pnl?: number
  currency?: { code?: string }
}

export interface SnapTradeActivity {
  id?: string
  symbol?: { symbol?: string }
  type?: string
  action?: string
  units?: number
  price?: number
  amount?: number
  trade_date?: string
  settlement_date?: string
  description?: string
}

/**
 * Register user with SnapTrade
 */
export async function snaptradeRegister(): Promise<{ status: string; user_id: string }> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/api/snaptrade/register`, {
    method: "POST",
    headers,
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to register with SnapTrade")
  }
  return response.json()
}

/**
 * Get SnapTrade Connect URL for linking a brokerage
 */
export async function snaptradeGetConnectUrl(): Promise<{ redirect_url: string }> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/api/snaptrade/connect`, { headers })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to get connect URL")
  }
  return response.json()
}

/**
 * Check SnapTrade connection status
 */
export async function snaptradeGetStatus(): Promise<{
  registered: boolean
  accounts_linked: number
  accounts: SnapTradeAccount[]
}> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/api/snaptrade/status`, { headers })
  if (!response.ok) {
    return { registered: false, accounts_linked: 0, accounts: [] }
  }
  return response.json()
}

/**
 * Get all holdings across linked accounts
 */
export async function snaptradeGetHoldings(): Promise<{
  holdings: Array<{ account: SnapTradeAccount; holdings: SnapTradeHolding[] }>
}> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/api/snaptrade/holdings`, { headers })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to fetch holdings")
  }
  return response.json()
}

/**
 * Get holdings for a specific account
 */
export async function snaptradeGetAccountHoldings(accountId: string): Promise<{
  holdings: SnapTradeHolding[]
}> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/api/snaptrade/holdings/${accountId}`, { headers })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to fetch account holdings")
  }
  return response.json()
}

/**
 * Get account balances
 */
export async function snaptradeGetBalances(accountId: string): Promise<{
  balances: Array<{ currency?: { code?: string }; cash?: number; buying_power?: number }>
}> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/api/snaptrade/accounts/${accountId}/balances`, { headers })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to fetch balances")
  }
  return response.json()
}

/**
 * Get trade/activity history
 */
export async function snaptradeGetActivities(params?: {
  start_date?: string
  end_date?: string
  account_id?: string
}): Promise<{ activities: SnapTradeActivity[] }> {
  const headers = await getAuthHeaders()
  const query = new URLSearchParams()
  if (params?.start_date) query.set("start_date", params.start_date)
  if (params?.end_date) query.set("end_date", params.end_date)
  if (params?.account_id) query.set("account_id", params.account_id)

  const response = await fetch(`${API_URL}/api/snaptrade/activities?${query}`, { headers })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to fetch activities")
  }
  return response.json()
}

/**
 * Disconnect SnapTrade — revokes all brokerage connections and deletes stored credentials
 */
export async function snaptradeDisconnect(): Promise<{ status: string }> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/api/snaptrade/disconnect`, {
    method: "POST",
    headers,
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to disconnect")
  }
  return response.json()
}

/**
 * Place a trade order
 */
export async function snaptradePlaceOrder(order: {
  account_id: string
  symbol: string
  action: "BUY" | "SELL"
  order_type: "Market" | "Limit" | "StopLimit" | "StopLoss"
  quantity: number
  price?: number
  stop_price?: number
  time_in_force?: string
}): Promise<{ order: unknown }> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/api/snaptrade/order/place`, {
    method: "POST",
    headers,
    body: JSON.stringify(order),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to place order")
  }
  return response.json()
}

/**
 * Preview order impact
 */
export async function snaptradePreviewOrder(order: {
  account_id: string
  symbol: string
  action: "BUY" | "SELL"
  order_type: string
  quantity: number
  price?: number
}): Promise<{ impact: unknown }> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/api/snaptrade/order/preview`, {
    method: "POST",
    headers,
    body: JSON.stringify(order),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to preview order")
  }
  return response.json()
}

// ============================================================
// AI Training Content API
// ============================================================

export interface TrainingContent {
  id: string
  title: string
  content: string
  source_type: string
  tags: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function getTrainingContent(): Promise<TrainingContent[]> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/api/ai/training/`, { headers })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to fetch training content")
  }
  return response.json()
}

export async function createTrainingContent(data: {
  title: string
  content: string
  source_type?: string
  tags?: string[]
}): Promise<TrainingContent> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/api/ai/training/`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to create training content")
  }
  return response.json()
}

export async function updateTrainingContent(
  id: string,
  data: { title?: string; content?: string; tags?: string[]; is_active?: boolean }
): Promise<TrainingContent> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/api/ai/training/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to update training content")
  }
  return response.json()
}

export async function deleteTrainingContent(id: string): Promise<void> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/api/ai/training/${id}`, {
    method: "DELETE",
    headers,
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to delete training content")
  }
}

export async function importYoutubeTranscript(
  url: string,
  tags: string[] = []
): Promise<TrainingContent> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/api/ai/training/youtube`, {
    method: "POST",
    headers,
    body: JSON.stringify({ url, tags }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to import YouTube transcript")
  }
  return response.json()
}

export async function toggleTrainingContent(id: string): Promise<TrainingContent> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/api/ai/training/${id}/toggle`, {
    method: "PATCH",
    headers,
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to toggle training content")
  }
  return response.json()
}

// ============================================================
// Trade Outcomes API
// ============================================================

export interface TradeOutcome {
  id: string
  user_id: string
  symbol: string
  setup_type?: string
  entry_price: number
  exit_price?: number
  gain_pct?: number
  outcome: "win" | "loss" | "breakeven" | "open"
  breakout_score?: number
  notes?: string
  traded_at?: string
  closed_at?: string
}

export async function logTradeOutcome(data: {
  symbol: string
  setup_type?: string
  entry_price: number
  exit_price?: number
  gain_pct?: number
  outcome?: string
  breakout_score?: number
  notes?: string
}): Promise<TradeOutcome> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/api/trades/outcome`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to log trade outcome")
  }
  return response.json()
}

export async function updateTradeOutcome(
  tradeId: string,
  data: { exit_price?: number; gain_pct?: number; outcome?: string; notes?: string }
): Promise<TradeOutcome> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/api/trades/outcome/${tradeId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to update trade outcome")
  }
  return response.json()
}

export async function getTradeOutcomes(limit = 50): Promise<{ outcomes: TradeOutcome[] }> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/api/trades/outcomes?limit=${limit}`, { headers })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to fetch trade outcomes")
  }
  return response.json()
}

// ============================================================
// AI Query Log API
// ============================================================

export interface AIQueryLog {
  id: string
  query_text: string
  category: string
  queried_at: string
}

export async function getAIQueryLog(limit = 50): Promise<{ queries: AIQueryLog[] }> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/api/ai/query-log?limit=${limit}`, { headers })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to fetch query log")
  }
  return response.json()
}

// ============================================================
// Symbol Search (SnapTrade)
// ============================================================

export async function snaptradeSearchSymbols(query: string): Promise<{ symbols: unknown[] }> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/api/snaptrade/symbols/search`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to search symbols")
  }
  return response.json()
}
