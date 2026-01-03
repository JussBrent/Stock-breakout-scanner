export type VolumeStatus = "Confirming" | "Weak" | "Expanding"
export type TradeBias = "Bullish" | "Bearish" | "Neutral"

export interface StockData {
  symbol: string
  company: string
  price: number
  breakoutLevel: number
  volumeStatus: VolumeStatus
  trendStatus: string
  aiConfidence: number
  tradeBias: TradeBias
  upside: number
  target: number
  volume: string
  score: number
}

export const mockStockData: StockData[] = [
  {
    symbol: "NVDA",
    company: "NVIDIA Corp",
    price: 495.5,
    breakoutLevel: 483.4,
    volumeStatus: "Confirming",
    trendStatus: "Strong Uptrend",
    aiConfidence: 94,
    tradeBias: "Bullish",
    upside: 16.04,
    target: 575.0,
    volume: "48.2M",
    score: 94,
  },
  {
    symbol: "AMD",
    company: "Advanced Micro Devices",
    price: 158.3,
    breakoutLevel: 145.2,
    volumeStatus: "Expanding",
    trendStatus: "Strong Momentum",
    aiConfidence: 91,
    tradeBias: "Bullish",
    upside: 16.87,
    target: 185.0,
    volume: "62.1M",
    score: 91,
  },
  {
    symbol: "TSLA",
    company: "Tesla Inc",
    price: 248.75,
    breakoutLevel: 255.0,
    volumeStatus: "Weak",
    trendStatus: "Approaching Resistance",
    aiConfidence: 89,
    tradeBias: "Bullish",
    upside: 18.59,
    target: 295.0,
    volume: "98.5M",
    score: 89,
  },
  {
    symbol: "COIN",
    company: "Coinbase Global",
    price: 312.45,
    breakoutLevel: 298.5,
    volumeStatus: "Confirming",
    trendStatus: "Breakout Active",
    aiConfidence: 87,
    tradeBias: "Bullish",
    upside: 22.15,
    target: 381.65,
    volume: "34.7M",
    score: 87,
  },
]

export interface AIInsight {
  pattern: string
  successRate: number
  riskNotes: string[]
  recommendation: string
}

export const getAIInsight = (symbol: string): AIInsight => {
  const insights: Record<string, AIInsight> = {
    NVDA: {
      pattern: "Bull Flag Breakout",
      successRate: 78,
      riskNotes: [
        "Watch for profit-taking near $500 psychological level",
        "Strong institutional support with increasing volume",
        "8 EMA alignment confirms bullish trend continuation",
      ],
      recommendation:
        "Watch for breakout above $483.40 with volume expansion. Strong call opportunities if price holds above 8 EMA on pullbacks.",
    },
    AMD: {
      pattern: "Ascending Triangle",
      successRate: 72,
      riskNotes: [
        "Semiconductor sector momentum remains strong",
        "Previous resistance at $160 now support",
        "Volume expansion needed above $165 for continuation",
      ],
      recommendation:
        "Strong momentum with breakout confirmation. Entry above $160 recommended with volume validation and tight stops.",
    },
    TSLA: {
      pattern: "Range Consolidation",
      successRate: 65,
      riskNotes: [
        "Volume declining during consolidation - needs catalyst",
        "Major resistance at $255 level from previous rejection",
        "Potential fake breakout risk without volume confirmation",
      ],
      recommendation:
        "Approaching key resistance. Wait for volume expansion and close above $255 before entry. Higher risk setup.",
    },
    COIN: {
      pattern: "Breakout Continuation",
      successRate: 68,
      riskNotes: [
        "Strong correlation with Bitcoin price movement",
        "Elevated volatility expected in crypto-related stocks",
        "Monitor broader crypto market sentiment and on-chain metrics",
      ],
      recommendation:
        "Active breakout with volume confirmation. Consider scaling into position with profit targets at $350 and $380. Trail stops aggressively.",
    },
  }

  return insights[symbol] || insights.NVDA
}
// AI Chat Messages
export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export const mockChatMessages: ChatMessage[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hello! I'm your AI stock analysis advisor. I can help you analyze stocks, identify breakout patterns, and provide trading insights. What would you like to know?",
    timestamp: new Date(Date.now() - 5 * 60000),
  },
  {
    id: "2",
    role: "user",
    content: "What's your analysis on NVDA right now?",
    timestamp: new Date(Date.now() - 4 * 60000),
  },
  {
    id: "3",
    role: "assistant",
    content: "NVDA is showing a strong Bull Flag breakout pattern with 94% AI confidence. The stock is trading at $495.50 above the breakout level of $483.40. Key indicators show:\n\n• Volume Status: Confirming\n• Trend: Strong Uptrend\n• Target Price: $575.00 (+16% upside)\n• Risk Considerations: Watch for profit-taking near $500\n\nI recommend entering on pullbacks to the 8 EMA with tight stops below $480.",
    timestamp: new Date(Date.now() - 3 * 60000),
  },
  {
    id: "4",
    role: "user",
    content: "What about AMD and TSLA? Which is better?",
    timestamp: new Date(Date.now() - 2 * 60000),
  },
  {
    id: "5",
    role: "assistant",
    content: "Great question! Here's the comparison:\n\n**AMD:** Ascending triangle with 91% confidence, $185 target. Strong institutional support and volume expansion. Lower risk setup.\n\n**TSLA:** Range consolidation with 89% confidence, $295 target. However, volume is declining and it's approaching heavy resistance at $255. This is a higher-risk setup.\n\nI'd recommend AMD for better risk-reward, as it has stronger technical setup and momentum. TSLA requires volume confirmation before entry.",
    timestamp: new Date(Date.now() - 1 * 60000),
  },
]

// Scan Results Types
export interface ScanDiagnostic {
  category: string
  status: "positive" | "negative" | "neutral" | "warning"
  message: string
  confidence: number
}

export interface ScanResult {
  id: string
  input: string
  inputType: "stock_name" | "screenshot" | "content"
  scanDate: Date
  overallScore: number
  recommendation: string
  diagnostics: ScanDiagnostic[]
}

export const mockScanResults: ScanResult[] = [
  {
    id: "scan-1",
    input: "NVDA",
    inputType: "stock_name",
    scanDate: new Date(Date.now() - 1 * 60000),
    overallScore: 94,
    recommendation: "Strong Buy - Excellent breakout setup with high confidence",
    diagnostics: [
      {
        category: "Technical Pattern",
        status: "positive",
        message: "Bull Flag Breakout confirmed with volume expansion",
        confidence: 94,
      },
      {
        category: "Trend Analysis",
        status: "positive",
        message: "Strong uptrend with price above 8 EMA",
        confidence: 92,
      },
      {
        category: "Volume Confirmation",
        status: "positive",
        message: "Volume increasing on breakout (48.2M shares)",
        confidence: 88,
      },
      {
        category: "Risk Assessment",
        status: "warning",
        message: "Watch psychological resistance at $500 level",
        confidence: 85,
      },
      {
        category: "Institutional Activity",
        status: "positive",
        message: "Strong institutional buying pressure detected",
        confidence: 91,
      },
    ],
  },
  {
    id: "scan-2",
    input: "AMD vs NVDA comparison. Both semiconductor stocks showing bullish momentum. NVDA broke above 483 level while AMD is testing 160 resistance.",
    inputType: "content",
    scanDate: new Date(Date.now() - 30 * 60000),
    overallScore: 87,
    recommendation: "Both showing bullish setups - AMD offers better risk-reward",
    diagnostics: [
      {
        category: "Pattern Recognition",
        status: "positive",
        message: "Both stocks identified as bullish breakout candidates",
        confidence: 89,
      },
      {
        category: "Sector Analysis",
        status: "positive",
        message: "Semiconductor sector showing strength",
        confidence: 86,
      },
      {
        category: "Entry Point Quality",
        status: "neutral",
        message: "NVDA already in move, AMD offers better entry",
        confidence: 84,
      },
      {
        category: "Risk Management",
        status: "positive",
        message: "Clear support levels identified for both trades",
        confidence: 82,
      },
    ],
  },
]

// Focus List - User's Watchlist
export interface FocusListItem {
  id: string
  symbol: string
  company: string
  price: number
  change: number
  changePercent: number
  target: number
  dailyUpdate: string
  addedDate: Date
}

export const mockFocusListItems: FocusListItem[] = [
  {
    id: "focus-1",
    symbol: "NVDA",
    company: "NVIDIA Corp",
    price: 495.5,
    change: 8.25,
    changePercent: 1.69,
    target: 575.0,
    dailyUpdate: "Strong momentum continues. Price holding above 8 EMA. Volume confirming breakout.",
    addedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: "focus-2",
    symbol: "AMD",
    company: "Advanced Micro Devices",
    price: 158.3,
    change: 2.15,
    changePercent: 1.37,
    target: 185.0,
    dailyUpdate: "Ascending triangle forming. Testing key resistance at $160. Watch for breakout.",
    addedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: "focus-3",
    symbol: "COIN",
    company: "Coinbase Global",
    price: 312.45,
    change: -3.22,
    changePercent: -1.02,
    target: 381.65,
    dailyUpdate: "Pullback after recent breakout. Strong support at $305. Potential entry zone.",
    addedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
]

// Trade History & Analytics
export interface TradeHistory {
  id: string
  symbol: string
  type: "buy" | "sell" | "analysis"
  action: string
  entry?: number
  exit?: number
  status: "open" | "closed" | "pending"
  date: Date
  profitLoss?: number
}

export const mockTradeHistory: TradeHistory[] = [
  {
    id: "trade-1",
    symbol: "NVDA",
    type: "buy",
    action: "Bought on breakout above $483",
    entry: 485.25,
    status: "open",
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: "trade-2",
    symbol: "AMD",
    type: "analysis",
    action: "AI recommended ascending triangle pattern",
    status: "pending",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "trade-3",
    symbol: "TSLA",
    type: "sell",
    action: "Sold on resistance rejection at $255",
    entry: 248.75,
    exit: 252.5,
    profitLoss: 1508.75,
    status: "closed",
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: "trade-4",
    symbol: "COIN",
    type: "buy",
    action: "Bought on volume expansion",
    entry: 310.0,
    status: "open",
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: "trade-5",
    symbol: "AAPL",
    type: "analysis",
    action: "AI flagged double bottom formation",
    status: "pending",
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  },
]

// AI Search History
export interface SearchHistory {
  id: string
  query: string
  symbol?: string
  category: "stock_analysis" | "pattern" | "comparison" | "general"
  timestamp: Date
}

export const mockSearchHistory: SearchHistory[] = [
  {
    id: "search-1",
    query: "What's the breakout potential for NVDA?",
    symbol: "NVDA",
    category: "stock_analysis",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: "search-2",
    query: "Compare AMD vs NVDA momentum",
    symbol: "AMD",
    category: "comparison",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
  },
  {
    id: "search-3",
    query: "Bull Flag pattern success rate",
    category: "pattern",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
  },
  {
    id: "search-4",
    query: "Best entry point for TSLA right now?",
    symbol: "TSLA",
    category: "stock_analysis",
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
  },
  {
    id: "search-5",
    query: "How do I identify institutional buying?",
    category: "general",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
]

// Stock Momentum Data
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

export const mockMomentumStocks: MomentumStock[] = [
  {
    symbol: "NVDA",
    company: "NVIDIA Corp",
    price: 495.5,
    momentum: 92,
    trend: "bullish",
    volume: "48.2M",
    changePercent: 1.69,
    breakoutStrength: 94,
    efficiency: 87,
  },
  {
    symbol: "AMD",
    company: "Advanced Micro Devices",
    price: 158.3,
    momentum: 85,
    trend: "bullish",
    volume: "62.1M",
    changePercent: 1.37,
    breakoutStrength: 88,
    efficiency: 82,
  },
  {
    symbol: "COIN",
    company: "Coinbase Global",
    price: 312.45,
    momentum: 78,
    trend: "neutral",
    volume: "34.7M",
    changePercent: -1.02,
    breakoutStrength: 72,
    efficiency: 68,
  },
  {
    symbol: "TSLA",
    company: "Tesla Inc",
    price: 248.75,
    momentum: 65,
    trend: "bearish",
    volume: "98.5M",
    changePercent: -2.45,
    breakoutStrength: 55,
    efficiency: 48,
  },
  {
    symbol: "AAPL",
    company: "Apple Inc",
    price: 245.2,
    momentum: 72,
    trend: "neutral",
    volume: "52.3M",
    changePercent: 0.82,
    breakoutStrength: 68,
    efficiency: 71,
  },
]
