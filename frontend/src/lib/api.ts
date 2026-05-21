// API client for backend communication

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"
const API_BASE = `${API_URL}/api/v1`

/**
 * Central fetch wrapper — converts network-level failures ("Failed to fetch",
 * CORS errors, backend unreachable) into clear, actionable error messages
 * so users never see the raw browser TypeError.
 */
async function apiFetch(
  url: string,
  options?: RequestInit,
  fallback?: unknown
): Promise<Response> {
  try {
    const resp = await fetch(url, options)
    return resp
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    const isNetworkError =
      msg.toLowerCase().includes("failed to fetch") ||
      msg.toLowerCase().includes("network request failed") ||
      msg.toLowerCase().includes("networkerror") ||
      msg.toLowerCase().includes("load failed") ||
      msg.toLowerCase().includes("cors")
    if (isNetworkError) {
      throw new Error(
        "Cannot reach the Orbis server. " +
        "Please check your internet connection and try again. " +
        "If the issue persists, the service may be temporarily down."
      )
    }
    throw err
  }
}

/**
 * Parse a Response — handles both JSON error bodies and plain text.
 * Throws with a clean message on non-OK status.
 */
async function parseResponse<T>(resp: Response, fallback?: T): Promise<T> {
  if (resp.ok) return resp.json() as Promise<T>
  // Try to extract a detail message from JSON body
  let detail = `Server error (${resp.status})`
  try {
    const body = await resp.json()
    if (body?.detail) detail = String(body.detail)
    else if (body?.message) detail = String(body.message)
    else if (body?.error) detail = String(body.error)
  } catch {
    try { detail = await resp.text() || detail } catch { /* ignore */ }
  }
  if (resp.status === 401 || resp.status === 403) {
    throw new Error("You need to be logged in to use this feature.")
  }
  if (resp.status >= 500) {
    throw new Error(`Orbis server error — please try again in a moment. (${detail})`)
  }
  throw new Error(detail)
}


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
  ema8?: number
  ema21: number
  ema50: number
  ema200?: number
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
  ema8?: number | null
  ema21: number | null
  ema50: number | null
  ema200?: number | null
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
  bull_case?: string
  fundamental_snapshot?: string[]
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
  const response = await apiFetch(`${API_URL}/api/scan/ai-analyze?top_n=${top_n}`, {
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
  const response = await apiFetch(`${API_URL}/api/scan/analyze-content`, {
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
  const response = await apiFetch(`${API_URL}/api/scan/symbol/ai`, {
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
  const response = await apiFetch(`${API_URL}/api/scan/symbol`, {
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
  const response = await apiFetch(`${API_URL}/api/health`)
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
  const response = await apiFetch(
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
  const response = await apiFetch(`${API_URL}/api/watchlist/`, { headers })
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
  const response = await apiFetch(`${API_URL}/api/watchlist/`, {
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
  const response = await apiFetch(
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
  const response = await apiFetch(
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
  brokerage_authorization?: string   // authorization UUID — use this for unlink, not id
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
  const response = await apiFetch(`${API_URL}/api/snaptrade/register`, {
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
 * Get SnapTrade Connect URL for linking a brokerage.
 * Pass redirectUri so SnapTrade redirects the popup back to our callback page
 * after OAuth completes, allowing the parent window to detect completion via postMessage.
 */
export async function snaptradeGetConnectUrl(redirectUri?: string): Promise<{ redirect_url: string }> {
  const headers = await getAuthHeaders()
  const params = redirectUri ? `?redirect_uri=${encodeURIComponent(redirectUri)}` : ""
  const response = await apiFetch(`${API_URL}/api/snaptrade/connect${params}`, { headers })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to get connect URL")
  }
  return response.json()
}

export interface SnapTradeAuthorization {
  id: string
  brokerage?: { name?: string; slug?: string }
  type?: string
  created_date?: string
}

/**
 * List the user's active brokerage authorizations (each has an id for unlinking)
 */
export async function snaptradeListAuthorizations(): Promise<SnapTradeAuthorization[]> {
  const headers = await getAuthHeaders()
  const response = await apiFetch(`${API_URL}/api/snaptrade/authorizations`, { headers })
  if (!response.ok) return []
  const data = await response.json()
  return data.authorizations ?? []
}

/**
 * Unlink a brokerage by removing its authorization ID (NOT the account id)
 */
export async function snaptradeUnlinkAccount(authorizationId: string): Promise<void> {
  const headers = await getAuthHeaders()
  const response = await apiFetch(`${API_URL}/api/snaptrade/authorizations/${encodeURIComponent(authorizationId)}`, {
    method: "DELETE",
    headers,
  })
  if (!response.ok && response.status !== 204) {
    const err = await response.json().catch(() => ({}))
    throw new Error((err as any).detail || "Failed to unlink account")
  }
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
  const response = await apiFetch(`${API_URL}/api/snaptrade/status`, { headers })
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
  const response = await apiFetch(`${API_URL}/api/snaptrade/holdings`, { headers })
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
  const response = await apiFetch(`${API_URL}/api/snaptrade/holdings/${accountId}`, { headers })
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
  const response = await apiFetch(`${API_URL}/api/snaptrade/accounts/${accountId}/balances`, { headers })
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

  const response = await apiFetch(`${API_URL}/api/snaptrade/activities?${query}`, { headers })
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
  const response = await apiFetch(`${API_URL}/api/snaptrade/disconnect`, {
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
  const response = await apiFetch(`${API_URL}/api/snaptrade/order/place`, {
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
  const response = await apiFetch(`${API_URL}/api/snaptrade/order/preview`, {
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
  const response = await apiFetch(`${API_URL}/api/ai/training/`, { headers })
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
  const response = await apiFetch(`${API_URL}/api/ai/training/`, {
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
  const response = await apiFetch(`${API_URL}/api/ai/training/${id}`, {
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
  const response = await apiFetch(`${API_URL}/api/ai/training/${id}`, {
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
  const response = await apiFetch(`${API_URL}/api/ai/training/youtube`, {
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
  const response = await apiFetch(`${API_URL}/api/ai/training/${id}/toggle`, {
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
  is_crowdsource_eligible?: boolean
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
  traded_at?: string
  is_crowdsource_eligible?: boolean
}): Promise<TradeOutcome> {
  const headers = await getAuthHeaders()
  const response = await apiFetch(`${API_URL}/api/trades/outcome`, {
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
  const response = await apiFetch(`${API_URL}/api/trades/outcome/${tradeId}`, {
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
  const response = await apiFetch(`${API_URL}/api/trades/outcomes?limit=${limit}`, { headers })
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
  const response = await apiFetch(`${API_URL}/api/ai/query-log?limit=${limit}`, { headers })
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
  const response = await apiFetch(`${API_URL}/api/snaptrade/symbols/search`, {
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

// ============================================================
// Options API
// ============================================================

export interface OptionsContract {
  ticker: string
  contract_type: "call" | "put"
  strike: number | null
  expiration: string
  bid: number | null
  ask: number | null
  last: number | null
  volume: number
  open_interest: number
  iv: number | null
  delta: number | null
  gamma: number | null
  theta: number | null
  vega: number | null
}

export interface OptionsChainResponse {
  symbol: string
  calls: OptionsContract[]
  puts: OptionsContract[]
  expirations: string[]
  total: number
}

export interface PaperTradeCreate {
  symbol: string
  contract_ticker: string
  contract_type: "call" | "put"
  strike_price: number
  expiration_date: string
  action: "buy" | "sell"
  quantity: number
  price_per_contract: number
  notes?: string
}

/**
 * Fetch live options chain from Polygon via the backend.
 */
export async function getOptionsChain(
  symbol: string,
  opts: {
    expiration_date?: string
    contract_type?: "call" | "put"
    limit?: number
  } = {}
): Promise<OptionsChainResponse> {
  const headers = await getAuthHeaders()
  const params = new URLSearchParams()
  if (opts.expiration_date) params.set("expiration_date", opts.expiration_date)
  if (opts.contract_type) params.set("contract_type", opts.contract_type)
  if (opts.limit) params.set("limit", String(opts.limit))

  const response = await apiFetch(
    `${API_URL}/api/options/chain/${symbol}?${params}`,
    { headers }
  )
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || `Failed to fetch options chain for ${symbol}`)
  }
  return response.json()
}

/**
 * Log a simulated (paper) options trade.
 */
export async function placePaperTrade(body: PaperTradeCreate): Promise<Record<string, unknown>> {
  const headers = await getAuthHeaders()
  const response = await apiFetch(`${API_URL}/api/options/paper-trade`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || "Failed to place paper trade")
  }
  return response.json()
}

/**
 * Get the current user's paper trade history.
 */
export async function getPaperTrades(limit = 50): Promise<{ trades: Record<string, unknown>[] }> {
  const headers = await getAuthHeaders()
  const response = await apiFetch(
    `${API_URL}/api/options/paper-trades?limit=${limit}`,
    { headers }
  )
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || "Failed to fetch paper trades")
  }
  return response.json()
}

// ============================================================
// Focus List: Prices + Last Scan
// ============================================================

export interface TickerPrice {
  price: number
  change_pct: number
  volume: number
}

export async function getWatchlistPrices(
  symbols: string[]
): Promise<Record<string, TickerPrice>> {
  if (!symbols.length) return {}
  const headers = await getAuthHeaders()
  const response = await apiFetch(
    `${API_URL}/api/watchlist/prices?symbols=${symbols.join(",")}`,
    { headers }
  )
  if (!response.ok) return {}
  const data = await response.json()
  return data.prices ?? {}
}

export interface LastScan {
  id: string
  symbol: string
  price: number
  trigger_price: number
  distance_pct: number
  adr_pct_14: number
  ema8?: number
  ema21: number
  ema50: number
  ema200?: number
  avg_vol_50: number
  market_cap?: number
  setup_type: string
  breakout_score: number
  notes?: string[]
  scanned_at: string
}

export async function getLastScan(symbol: string): Promise<LastScan | null> {
  const headers = await getAuthHeaders()
  const response = await apiFetch(
    `${API_URL}/api/watchlist/${symbol.toUpperCase()}/last-scan`,
    { headers }
  )
  if (!response.ok) return null
  const data = await response.json()
  return data.scan ?? null
}

export async function updateWatchlistItem(
  symbol: string,
  updates: { notes?: string; alert_enabled?: boolean; alert_price?: number | null }
): Promise<void> {
  const headers = await getAuthHeaders()
  await fetch(`${API_URL}/api/watchlist/${symbol.toUpperCase()}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(updates),
  })
}

// ============================================================
// Sean's Verified Trades API
// ============================================================

export interface SeanTrade {
  id: string
  symbol: string
  direction: "long" | "short"
  setup_type?: string | null
  breakout_score?: number | null
  entry_price: number
  exit_price?: number | null
  stop_price?: number | null
  gain_pct?: number | null
  contract_type?: "call" | "put" | null
  strike_price?: number | null
  expiration_date?: string | null
  contracts_held?: number | null
  premium_paid?: number | null
  premium_exit?: number | null
  outcome: "win" | "loss" | "breakeven" | "open"
  why_took_trade?: string | null
  looked_wrong_but?: string | null
  looked_right_but?: string | null
  key_lesson?: string | null
  chart_image_url?: string | null
  traded_at: string
  closed_at?: string | null
  created_at: string
  updated_at: string
}

export interface SeanTradeCreate {
  symbol: string
  direction?: "long" | "short"
  setup_type?: string
  breakout_score?: number
  entry_price: number
  exit_price?: number
  stop_price?: number
  gain_pct?: number
  contract_type?: "call" | "put"
  strike_price?: number
  expiration_date?: string
  contracts_held?: number
  premium_paid?: number
  premium_exit?: number
  outcome?: "win" | "loss" | "breakeven" | "open"
  why_took_trade?: string
  looked_wrong_but?: string
  looked_right_but?: string
  key_lesson?: string
  chart_image_url?: string
  traded_at?: string
}

export interface SeanTradeUpdate {
  exit_price?: number
  stop_price?: number
  gain_pct?: number
  outcome?: "win" | "loss" | "breakeven"
  premium_exit?: number
  contracts_held?: number
  why_took_trade?: string
  looked_wrong_but?: string
  looked_right_but?: string
  key_lesson?: string
  chart_image_url?: string
  closed_at?: string
}

/** Admin: list all of Sean's verified trades */
export async function getSeanTrades(opts: {
  outcome?: string
  setup_type?: string
  symbol?: string
  limit?: number
} = {}): Promise<{ trades: SeanTrade[]; count: number }> {
  const headers = await getAuthHeaders()
  const params = new URLSearchParams()
  if (opts.outcome) params.set("outcome", opts.outcome)
  if (opts.setup_type) params.set("setup_type", opts.setup_type)
  if (opts.symbol) params.set("symbol", opts.symbol)
  if (opts.limit) params.set("limit", String(opts.limit))
  const response = await apiFetch(`${API_URL}/api/sean-trades/?${params}`, { headers })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error((error as any).detail || "Failed to fetch Sean's trades")
  }
  return response.json()
}

/** Admin: submit a new verified trade */
export async function submitSeanTrade(data: SeanTradeCreate): Promise<SeanTrade> {
  const headers = await getAuthHeaders()
  const response = await apiFetch(`${API_URL}/api/sean-trades/`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error((error as any).detail || "Failed to submit trade")
  }
  return response.json()
}

/** Admin: update or close an existing Sean trade */
export async function updateSeanTrade(
  id: string,
  data: SeanTradeUpdate
): Promise<SeanTrade> {
  const headers = await getAuthHeaders()
  const response = await apiFetch(`${API_URL}/api/sean-trades/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error((error as any).detail || "Failed to update trade")
  }
  return response.json()
}

/** Admin: permanently delete a Sean trade */
export async function deleteSeanTrade(id: string): Promise<void> {
  const headers = await getAuthHeaders()
  const response = await apiFetch(`${API_URL}/api/sean-trades/${id}`, {
    method: "DELETE",
    headers,
  })
  if (!response.ok && response.status !== 204) {
    const error = await response.json().catch(() => ({}))
    throw new Error((error as any).detail || "Failed to delete trade")
  }
}

// ── Phase 3: Pattern Summaries ──────────────────────────────────────

export interface PatternSummariesResponse {
  summaries: string
  has_data: boolean
}

export interface RefreshSummariesResponse {
  message: string
  results: Record<string, boolean>
}

export async function getPatternSummaries(): Promise<PatternSummariesResponse> {
  const headers = await getAuthHeaders()
  const response = await apiFetch(`${API_URL}/api/ai/training/pattern-summaries`, { headers })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to fetch pattern summaries')
  }
  return response.json()
}

export async function refreshPatternSummaries(): Promise<RefreshSummariesResponse> {
  const headers = await getAuthHeaders()
  const response = await apiFetch(`${API_URL}/api/ai/training/refresh-summaries`, {
    method: 'POST',
    headers,
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to refresh pattern summaries')
  }
  return response.json()
}

// ── Dashboard Intelligence ─────────────────────────────────────────────────

export interface DashboardTopSetup {
  id?: string
  scan_date?: string
  rank: number
  symbol: string
  company_name?: string
  sector?: string
  industry?: string
  setup_type: string
  ai_score: number
  opportunity_score?: number
  confidence?: string
  price?: number
  price_change_pct?: number
  volume?: number
  market_cap?: number
  etf_group?: string
  leading_theme?: string
  analysis?: string
  key_factors?: string[]
  risk_level?: string
  recommendation?: string
  is_extended?: boolean
  is_sideways?: boolean
  group_breakout?: boolean
}

export interface DashboardSector {
  id?: string
  scan_date?: string
  sector: string
  etf_symbol?: string
  change_pct?: number
  volume?: number
  relative_volume?: number
  price?: number
  top_stocks?: string[]
  is_breaking_out?: boolean
  setup_type?: string
}

export interface DashboardSentiment {
  id?: string
  scan_date?: string
  sentiment: string
  sentiment_score: number
  vix?: number
  spy_change?: number
  qqq_change?: number
  iwm_change?: number
  advance_decline_ratio?: number
  new_highs?: number
  new_lows?: number
  above_50ma_pct?: number
  above_200ma_pct?: number
  leading_themes?: string[]
  market_notes?: string
}

export interface DashboardAllResponse {
  success: boolean
  top_setups: DashboardTopSetup[]
  sectors: DashboardSector[]
  sentiment: DashboardSentiment | null
}

export async function getDashboardAll(): Promise<DashboardAllResponse> {
  const headers = await getAuthHeaders()
  const res = await apiFetch(`${API_URL}/api/dashboard/all`, { headers })
  return parseResponse<DashboardAllResponse>(res)
}

export async function getDashboardTopSetups(): Promise<{ success: boolean; setups: DashboardTopSetup[]; count: number }> {
  const headers = await getAuthHeaders()
  const res = await apiFetch(`${API_URL}/api/dashboard/top-setups`, { headers })
  return parseResponse(res)
}

export async function getDashboardSectors(): Promise<{ success: boolean; sectors: DashboardSector[]; count: number }> {
  const headers = await getAuthHeaders()
  const res = await apiFetch(`${API_URL}/api/dashboard/sectors`, { headers })
  return parseResponse(res)
}

export async function getDashboardSentiment(): Promise<{ success: boolean; sentiment: DashboardSentiment }> {
  const headers = await getAuthHeaders()
  const res = await apiFetch(`${API_URL}/api/dashboard/sentiment`, { headers })
  return parseResponse(res)
}

export async function refreshDashboard(): Promise<{ success: boolean; message: string }> {
  const headers = await getAuthHeaders()
  const res = await apiFetch(`${API_URL}/api/dashboard/refresh`, { method: 'POST', headers })
  return parseResponse(res)
}
