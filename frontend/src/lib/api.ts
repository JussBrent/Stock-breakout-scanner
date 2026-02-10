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
  const response = await fetch(`${API_BASE}/scan/ai-analyze?top_n=${top_n}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to analyze stocks")
  }

  return response.json()
}

/**
 * Scan a single symbol
 */
export async function scanSymbol(symbol: string): Promise<ScanResult | null> {
  const response = await fetch(`${API_BASE}/scan/symbol`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
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
