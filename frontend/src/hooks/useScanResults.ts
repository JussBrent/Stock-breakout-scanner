import { useEffect, useState } from 'react'

export type BreakoutScan = {
  id: string
  symbol: string
  price: number
  trigger_price: number
  distance_pct: number
  adr_pct_14: number
  avg_vol_50: number
  ema21: number
  ema50: number
  ema200: number
  setup_type: 'FLAT_TOP' | 'WEDGE' | 'FLAG' | 'BASE' | 'UNKNOWN'
  breakout_score: number
  notes: string[]
  market_cap?: number
  scanned_at: string
}

// Mock data matching backend scanner output
const MOCK_SCAN_RESULTS: BreakoutScan[] = [
  {
    id: '1',
    symbol: 'NVDA',
    price: 188.85,
    trigger_price: 194.50,
    distance_pct: 2.98,
    adr_pct_14: 2.33,
    ema21: 187.0,
    ema50: 182.0,
    ema200: 175.0,
    avg_vol_50: 42_500_000,
    market_cap: 2_900_000_000_000,
    setup_type: 'FLAT_TOP',
    breakout_score: 85,
    notes: ['tight base', 'vol contraction', 'flat top resistance', 'near trigger'],
    scanned_at: new Date().toISOString(),
  },
  {
    id: '2',
    symbol: 'MSFT',
    price: 412.45,
    trigger_price: 425.00,
    distance_pct: 3.04,
    adr_pct_14: 1.98,
    ema21: 410.0,
    ema50: 405.0,
    ema200: 395.0,
    avg_vol_50: 18_000_000,
    market_cap: 3_100_000_000_000,
    setup_type: 'WEDGE',
    breakout_score: 78,
    notes: ['higher lows', 'volume confirms'],
    scanned_at: new Date().toISOString(),
  },
  {
    id: '3',
    symbol: 'META',
    price: 628.90,
    trigger_price: 645.00,
    distance_pct: 2.56,
    adr_pct_14: 2.88,
    ema21: 625.0,
    ema50: 615.0,
    ema200: 590.0,
    avg_vol_50: 14_200_000,
    market_cap: 1_600_000_000_000,
    setup_type: 'FLAG',
    breakout_score: 92,
    notes: ['tight base', 'vol contraction', 'higher lows', 'near trigger', 'volume confirms'],
    scanned_at: new Date().toISOString(),
  },
  {
    id: '4',
    symbol: 'AAPL',
    price: 246.35,
    trigger_price: 252.00,
    distance_pct: 2.29,
    adr_pct_14: 2.15,
    ema21: 245.0,
    ema50: 240.0,
    ema200: 230.0,
    avg_vol_50: 52_300_000,
    market_cap: 3_600_000_000_000,
    setup_type: 'BASE',
    breakout_score: 72,
    notes: ['tight base', 'near trigger'],
    scanned_at: new Date().toISOString(),
  },
  {
    id: '5',
    symbol: 'TSLA',
    price: 345.20,
    trigger_price: 358.00,
    distance_pct: 3.71,
    adr_pct_14: 3.45,
    ema21: 342.0,
    ema50: 335.0,
    ema200: 320.0,
    avg_vol_50: 98_000_000,
    market_cap: 1_100_000_000_000,
    setup_type: 'WEDGE',
    breakout_score: 81,
    notes: ['higher lows', 'volume confirms', 'vol contraction'],
    scanned_at: new Date().toISOString(),
  },
  {
    id: '6',
    symbol: 'AMD',
    price: 142.80,
    trigger_price: 148.50,
    distance_pct: 3.99,
    adr_pct_14: 2.89,
    ema21: 141.0,
    ema50: 138.0,
    ema200: 130.0,
    avg_vol_50: 55_000_000,
    market_cap: 230_000_000_000,
    setup_type: 'FLAT_TOP',
    breakout_score: 76,
    notes: ['flat top resistance', 'tight base'],
    scanned_at: new Date().toISOString(),
  },
  {
    id: '7',
    symbol: 'GOOGL',
    price: 178.25,
    trigger_price: 182.50,
    distance_pct: 2.38,
    adr_pct_14: 2.12,
    ema21: 176.5,
    ema50: 172.0,
    ema200: 165.0,
    avg_vol_50: 24_800_000,
    market_cap: 2_200_000_000_000,
    setup_type: 'FLAG',
    breakout_score: 88,
    notes: ['tight base', 'higher lows', 'near trigger', 'volume confirms'],
    scanned_at: new Date().toISOString(),
  },
]

export function useScanResults() {
  const [results, setResults] = useState<BreakoutScan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setResults(MOCK_SCAN_RESULTS)
      setLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  return { results, loading, error }
}
