"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { TrendingUp, ArrowUpRight, BarChart3, Zap, ChevronDown, ChevronUp } from "lucide-react"
import Navbar from "@/components/landing/Navbar"
import Footer from "@/components/landing/Footer"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface ScanResult {
  symbol: string
  company: string
  currentPrice: number
  targetPrice: number
  potentialGain: number
  volume: string
  breakoutScore: number
  signal: string
  avgVolume: string
  volumeChange: number
  supportLevel: number
  resistanceLevel: number
  ema8: number
  ema21: number
  rsi: number
  macdSignal: string
  priceChange24h: number
  marketCap: string
  sector: string
  pattern: string
}

const mockScanResults: Record<string, ScanResult[]> = {
  momentum: [
    {
      symbol: "NVDA",
      company: "NVIDIA Corp",
      currentPrice: 495.5,
      targetPrice: 575.0,
      potentialGain: 16.04,
      volume: "48.2M",
      breakoutScore: 94,
      signal: "Strong Buy",
      avgVolume: "42.8M",
      volumeChange: 12.6,
      supportLevel: 485.0,
      resistanceLevel: 512.0,
      ema8: 492.3,
      ema21: 478.5,
      rsi: 68,
      macdSignal: "Bullish",
      priceChange24h: 3.2,
      marketCap: "1.22T",
      sector: "Technology",
      pattern: "Bull Flag",
    },
    {
      symbol: "AMD",
      company: "Advanced Micro Devices",
      currentPrice: 158.3,
      targetPrice: 185.0,
      potentialGain: 16.87,
      volume: "62.1M",
      breakoutScore: 91,
      signal: "Strong Buy",
      avgVolume: "55.2M",
      volumeChange: 12.5,
      supportLevel: 152.5,
      resistanceLevel: 165.0,
      ema8: 156.8,
      ema21: 151.2,
      rsi: 65,
      macdSignal: "Bullish",
      priceChange24h: 2.8,
      marketCap: "256B",
      sector: "Technology",
      pattern: "Ascending Triangle",
    },
    {
      symbol: "TSLA",
      company: "Tesla Inc",
      currentPrice: 248.75,
      targetPrice: 295.0,
      potentialGain: 18.59,
      volume: "98.5M",
      breakoutScore: 89,
      signal: "Buy",
      avgVolume: "85.3M",
      volumeChange: 15.5,
      supportLevel: 242.0,
      resistanceLevel: 258.0,
      ema8: 245.6,
      ema21: 238.9,
      rsi: 62,
      macdSignal: "Bullish",
      priceChange24h: 4.1,
      marketCap: "789B",
      sector: "Automotive",
      pattern: "Cup & Handle",
    },
    {
      symbol: "PLTR",
      company: "Palantir Technologies",
      currentPrice: 28.45,
      targetPrice: 35.5,
      potentialGain: 24.78,
      volume: "45.3M",
      breakoutScore: 87,
      signal: "Buy",
      avgVolume: "38.9M",
      volumeChange: 16.5,
      supportLevel: 27.2,
      resistanceLevel: 30.0,
      ema8: 27.9,
      ema21: 26.5,
      rsi: 64,
      macdSignal: "Bullish",
      priceChange24h: 5.2,
      marketCap: "61B",
      sector: "Technology",
      pattern: "Breakout Retest",
    },
    {
      symbol: "COIN",
      company: "Coinbase Global",
      currentPrice: 215.6,
      targetPrice: 265.0,
      potentialGain: 22.91,
      volume: "18.7M",
      breakoutScore: 85,
      signal: "Buy",
      avgVolume: "15.2M",
      volumeChange: 23.0,
      supportLevel: 208.0,
      resistanceLevel: 225.0,
      ema8: 212.4,
      ema21: 205.8,
      rsi: 66,
      macdSignal: "Bullish",
      priceChange24h: 6.8,
      marketCap: "52B",
      sector: "Financial Services",
      pattern: "Double Bottom",
    },
  ],
  breakout: [
    {
      symbol: "SHOP",
      company: "Shopify Inc",
      currentPrice: 78.9,
      targetPrice: 98.0,
      potentialGain: 24.21,
      volume: "12.4M",
      breakoutScore: 92,
      signal: "Strong Buy",
      avgVolume: "10.8M",
      volumeChange: 14.8,
      supportLevel: 75.0,
      resistanceLevel: 82.5,
      ema8: 77.2,
      ema21: 73.4,
      rsi: 67,
      macdSignal: "Bullish",
      priceChange24h: 4.5,
      marketCap: "98B",
      sector: "Technology",
      pattern: "Breakout Above Resistance",
    },
    {
      symbol: "SQ",
      company: "Block Inc",
      currentPrice: 72.15,
      targetPrice: 88.5,
      potentialGain: 22.66,
      volume: "15.8M",
      breakoutScore: 88,
      signal: "Buy",
      avgVolume: "13.2M",
      volumeChange: 19.7,
      supportLevel: 68.5,
      resistanceLevel: 75.0,
      ema8: 70.8,
      ema21: 67.2,
      rsi: 63,
      macdSignal: "Bullish",
      priceChange24h: 3.7,
      marketCap: "42B",
      sector: "Financial Services",
      pattern: "Symmetrical Triangle",
    },
    {
      symbol: "SNAP",
      company: "Snap Inc",
      currentPrice: 15.4,
      targetPrice: 19.75,
      potentialGain: 28.25,
      volume: "28.9M",
      breakoutScore: 86,
      signal: "Buy",
      avgVolume: "22.5M",
      volumeChange: 28.4,
      supportLevel: 14.5,
      resistanceLevel: 16.2,
      ema8: 15.1,
      ema21: 14.3,
      rsi: 69,
      macdSignal: "Bullish",
      priceChange24h: 5.8,
      marketCap: "24B",
      sector: "Technology",
      pattern: "Inverse Head & Shoulders",
    },
    {
      symbol: "UBER",
      company: "Uber Technologies",
      currentPrice: 62.3,
      targetPrice: 78.0,
      potentialGain: 25.2,
      volume: "24.1M",
      breakoutScore: 84,
      signal: "Buy",
      avgVolume: "20.8M",
      volumeChange: 15.9,
      supportLevel: 59.0,
      resistanceLevel: 65.5,
      ema8: 61.2,
      ema21: 58.4,
      rsi: 61,
      macdSignal: "Bullish",
      priceChange24h: 2.9,
      marketCap: "127B",
      sector: "Technology",
      pattern: "Rectangle Breakout",
    },
    {
      symbol: "ROKU",
      company: "Roku Inc",
      currentPrice: 68.45,
      targetPrice: 85.0,
      potentialGain: 24.18,
      volume: "9.2M",
      breakoutScore: 82,
      signal: "Buy",
      avgVolume: "7.8M",
      volumeChange: 17.9,
      supportLevel: 65.0,
      resistanceLevel: 72.0,
      ema8: 67.3,
      ema21: 64.1,
      rsi: 60,
      macdSignal: "Bullish",
      priceChange24h: 3.4,
      marketCap: "9.8B",
      sector: "Technology",
      pattern: "Pennant",
    },
  ],
  volume: [
    {
      symbol: "AAPL",
      company: "Apple Inc",
      currentPrice: 189.95,
      targetPrice: 215.0,
      potentialGain: 13.18,
      volume: "125.6M",
      breakoutScore: 90,
      signal: "Buy",
      avgVolume: "98.2M",
      volumeChange: 27.9,
      supportLevel: 185.0,
      resistanceLevel: 195.0,
      ema8: 188.4,
      ema21: 183.9,
      rsi: 58,
      macdSignal: "Bullish",
      priceChange24h: 2.1,
      marketCap: "2.95T",
      sector: "Technology",
      pattern: "Volume Climax",
    },
    {
      symbol: "MSFT",
      company: "Microsoft Corp",
      currentPrice: 378.25,
      targetPrice: 425.0,
      potentialGain: 12.36,
      volume: "42.8M",
      breakoutScore: 88,
      signal: "Buy",
      avgVolume: "34.5M",
      volumeChange: 24.1,
      supportLevel: 370.0,
      resistanceLevel: 385.0,
      ema8: 375.6,
      ema21: 368.2,
      rsi: 59,
      macdSignal: "Bullish",
      priceChange24h: 1.8,
      marketCap: "2.81T",
      sector: "Technology",
      pattern: "Accumulation",
    },
    {
      symbol: "META",
      company: "Meta Platforms",
      currentPrice: 348.6,
      targetPrice: 395.0,
      potentialGain: 13.31,
      volume: "18.5M",
      breakoutScore: 86,
      signal: "Buy",
      avgVolume: "14.2M",
      volumeChange: 30.3,
      supportLevel: 340.0,
      resistanceLevel: 360.0,
      ema8: 345.8,
      ema21: 338.4,
      rsi: 61,
      macdSignal: "Bullish",
      priceChange24h: 2.5,
      marketCap: "888B",
      sector: "Technology",
      pattern: "Volume Breakout",
    },
    {
      symbol: "GOOGL",
      company: "Alphabet Inc",
      currentPrice: 138.75,
      targetPrice: 160.0,
      potentialGain: 15.32,
      volume: "28.4M",
      breakoutScore: 85,
      signal: "Buy",
      avgVolume: "21.8M",
      volumeChange: 30.3,
      supportLevel: 135.0,
      resistanceLevel: 145.0,
      ema8: 137.2,
      ema21: 133.8,
      rsi: 62,
      macdSignal: "Bullish",
      priceChange24h: 2.9,
      marketCap: "1.72T",
      sector: "Technology",
      pattern: "Surge Above Avg",
    },
    {
      symbol: "AMZN",
      company: "Amazon.com Inc",
      currentPrice: 151.2,
      targetPrice: 175.0,
      potentialGain: 15.74,
      volume: "52.3M",
      breakoutScore: 83,
      signal: "Buy",
      avgVolume: "42.6M",
      volumeChange: 22.8,
      supportLevel: 147.0,
      resistanceLevel: 158.0,
      ema8: 149.8,
      ema21: 145.3,
      rsi: 60,
      macdSignal: "Bullish",
      priceChange24h: 2.3,
      marketCap: "1.57T",
      sector: "Consumer Cyclical",
      pattern: "Distribution",
    },
  ],
}

const mockUploadResults: ScanResult[] = [
  {
    symbol: "AAPL",
    company: "Apple Inc",
    currentPrice: 189.95,
    targetPrice: 215.0,
    potentialGain: 13.18,
    volume: "125.6M",
    breakoutScore: 90,
    signal: "Buy",
    avgVolume: "98.2M",
    volumeChange: 27.9,
    supportLevel: 185.0,
    resistanceLevel: 195.0,
    ema8: 188.4,
    ema21: 183.9,
    rsi: 58,
    macdSignal: "Bullish",
    priceChange24h: 2.1,
    marketCap: "2.95T",
    sector: "Technology",
    pattern: "Volume Climax",
  },
  {
    symbol: "TSLA",
    company: "Tesla Inc",
    currentPrice: 248.75,
    targetPrice: 295.0,
    potentialGain: 18.59,
    volume: "98.5M",
    breakoutScore: 89,
    signal: "Buy",
    avgVolume: "85.3M",
    volumeChange: 15.5,
    supportLevel: 242.0,
    resistanceLevel: 258.0,
    ema8: 245.6,
    ema21: 238.9,
    rsi: 62,
    macdSignal: "Bullish",
    priceChange24h: 4.1,
    marketCap: "789B",
    sector: "Automotive",
    pattern: "Cup & Handle",
  },
  {
    symbol: "NVDA",
    company: "NVIDIA Corp",
    currentPrice: 495.5,
    targetPrice: 575.0,
    potentialGain: 16.04,
    volume: "48.2M",
    breakoutScore: 94,
    signal: "Strong Buy",
    avgVolume: "42.8M",
    volumeChange: 12.6,
    supportLevel: 485.0,
    resistanceLevel: 512.0,
    ema8: 492.3,
    ema21: 478.5,
    rsi: 68,
    macdSignal: "Bullish",
    priceChange24h: 3.2,
    marketCap: "1.22T",
    sector: "Technology",
    pattern: "Bull Flag",
  },
  {
    symbol: "AMD",
    company: "Advanced Micro Devices",
    currentPrice: 158.3,
    targetPrice: 185.0,
    potentialGain: 16.87,
    volume: "62.1M",
    breakoutScore: 91,
    signal: "Strong Buy",
    avgVolume: "55.2M",
    volumeChange: 12.5,
    supportLevel: 152.5,
    resistanceLevel: 165.0,
    ema8: 156.8,
    ema21: 151.2,
    rsi: 65,
    macdSignal: "Bullish",
    priceChange24h: 2.8,
    marketCap: "256B",
    sector: "Technology",
    pattern: "Ascending Triangle",
  },
  {
    symbol: "META",
    company: "Meta Platforms",
    currentPrice: 348.6,
    targetPrice: 395.0,
    potentialGain: 13.31,
    volume: "18.5M",
    breakoutScore: 86,
    signal: "Buy",
    avgVolume: "14.2M",
    volumeChange: 30.3,
    supportLevel: 340.0,
    resistanceLevel: 360.0,
    ema8: 345.8,
    ema21: 338.4,
    rsi: 61,
    macdSignal: "Bullish",
    priceChange24h: 2.5,
    marketCap: "888B",
    sector: "Technology",
    pattern: "Volume Breakout",
  },
  {
    symbol: "SHOP",
    company: "Shopify Inc",
    currentPrice: 78.9,
    targetPrice: 98.0,
    potentialGain: 24.21,
    volume: "12.4M",
    breakoutScore: 92,
    signal: "Strong Buy",
    avgVolume: "10.8M",
    volumeChange: 14.8,
    supportLevel: 75.0,
    resistanceLevel: 82.5,
    ema8: 77.2,
    ema21: 73.4,
    rsi: 67,
    macdSignal: "Bullish",
    priceChange24h: 4.5,
    marketCap: "98B",
    sector: "Technology",
    pattern: "Breakout Above Resistance",
  },
  {
    symbol: "COIN",
    company: "Coinbase Global",
    currentPrice: 215.6,
    targetPrice: 265.0,
    potentialGain: 22.91,
    volume: "18.7M",
    breakoutScore: 85,
    signal: "Buy",
    avgVolume: "15.2M",
    volumeChange: 23.0,
    supportLevel: 208.0,
    resistanceLevel: 225.0,
    ema8: 212.4,
    ema21: 205.8,
    rsi: 66,
    macdSignal: "Bullish",
    priceChange24h: 6.8,
    marketCap: "52B",
    sector: "Financial Services",
    pattern: "Double Bottom",
  },
]

const DemoScan = () => {
  const [selectedScan, setSelectedScan] = useState<string>("")
  const [isScanning, setIsScanning] = useState(false)
  const [results, setResults] = useState<ScanResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const scanOptions = [
    {
      id: "momentum",
      name: "Momentum Breakout",
      description: "High momentum stocks breaking resistance",
      icon: TrendingUp,
    },
    {
      id: "breakout",
      name: "Technical Breakout",
      description: "Stocks breaking key technical levels",
      icon: ArrowUpRight,
    },
    { id: "volume", name: "Volume Surge", description: "Unusual volume with bullish patterns", icon: BarChart3 },
  ]

  const handleScan = (scanType: string) => {
    setSelectedScan(scanType)
    setIsScanning(true)
    setShowResults(false)
    setResults([])
    setExpandedRow(null)

    setTimeout(() => {
      setResults(mockScanResults[scanType])
      setIsScanning(false)
      setShowResults(true)
    }, 2500)
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-400"
    if (score >= 85) return "text-green-500"
    if (score >= 80) return "text-yellow-500"
    return "text-gray-500"
  }

  const getSignalColor = (signal: string) => {
    if (signal === "Strong Buy") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/50"
    if (signal === "Buy") return "bg-green-500/10 text-green-400 border-green-500/50"
    return "bg-gray-500/10 text-gray-400 border-gray-500/50"
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-b from-emerald-500/5 to-transparent pt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 border border-emerald-500/30 mb-4">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs text-emerald-400 uppercase tracking-widest">Live Demo Scanner</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-3 text-white tracking-tight">AI-Powered Market Scanner</h1>
            <p className="text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Select a scan type to watch our algorithm identify high-potential trading opportunities in real-time.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Scan Options */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h2 className="text-sm uppercase tracking-wider text-gray-500 font-mono mb-4">Select Scan Type</h2>
          <div className="grid md:grid-cols-3 gap-4 mb-12">
            {scanOptions.map((option, index) => (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 + index * 0.05 }}
                onClick={() => handleScan(option.id)}
                disabled={isScanning}
                className={`group relative p-5 border transition-all text-left ${
                  selectedScan === option.id
                    ? "bg-emerald-500/5 border-emerald-500/50"
                    : "bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]"
                } ${isScanning ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 border ${selectedScan === option.id ? "border-emerald-500/50 bg-emerald-500/10" : "border-white/10 bg-white/5"}`}
                  >
                    <option.icon
                      className={`w-5 h-5 ${selectedScan === option.id ? "text-emerald-400" : "text-gray-400"}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`text-base font-semibold mb-1 ${selectedScan === option.id ? "text-emerald-400" : "text-white"}`}
                    >
                      {option.name}
                    </h3>
                    <p className="text-xs text-gray-500">{option.description}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Scanning Animation */}
        <AnimatePresence>
          {isScanning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16 border border-white/10 bg-white/[0.02]"
            >
              <div className="inline-block">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="w-12 h-12 border-2 border-white/10 border-t-emerald-500 mb-4 mx-auto"
                />
                <h3 className="text-lg font-semibold mb-1 text-white">Scanning Markets</h3>
                <p className="text-sm text-gray-500 font-mono">Analyzing market data...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showResults && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Results Header */}
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1 text-white">Scan Results</h2>
                  <p className="text-sm text-gray-500 font-mono">{results.length} opportunities detected</p>
                </div>
                <Button
                  onClick={() => handleScan(selectedScan)}
                  variant="outline"
                  size="sm"
                  className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                >
                  <Zap className="w-3.5 h-3.5 mr-2" />
                  Rescan
                </Button>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {/* Score Distribution Chart */}
                <div className="border border-white/10 bg-white/[0.02] p-4">
                  <h3 className="text-xs uppercase tracking-wider text-gray-500 font-mono mb-4">Score Distribution</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={results.map((r) => ({ symbol: r.symbol, score: r.breakoutScore }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis dataKey="symbol" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                      <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#000",
                          border: "1px solid #ffffff20",
                          borderRadius: 0,
                        }}
                        labelStyle={{ color: "#fff" }}
                      />
                      <Bar dataKey="score" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Potential Gain Chart */}
                <div className="border border-white/10 bg-white/[0.02] p-4">
                  <h3 className="text-xs uppercase tracking-wider text-gray-500 font-mono mb-4">Potential Upside %</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={results.map((r) => ({ symbol: r.symbol, gain: r.potentialGain }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis dataKey="symbol" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                      <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#000",
                          border: "1px solid #ffffff20",
                          borderRadius: 0,
                        }}
                        labelStyle={{ color: "#fff" }}
                      />
                      <Line type="monotone" dataKey="gain" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Signal Distribution Pie Chart */}
                <div className="border border-white/10 bg-white/[0.02] p-4">
                  <h3 className="text-xs uppercase tracking-wider text-gray-500 font-mono mb-4">Signal Distribution</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Strong Buy", value: results.filter((r) => r.signal === "Strong Buy").length },
                          { name: "Buy", value: results.filter((r) => r.signal === "Buy").length },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#22c55e" />
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#000",
                          border: "1px solid #ffffff20",
                          borderRadius: 0,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "10px" }} iconType="square" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-mono mb-2">Avg Score</p>
                  <p className="text-2xl font-bold text-emerald-400 font-mono">
                    {(results.reduce((acc, r) => acc + r.breakoutScore, 0) / results.length).toFixed(1)}
                  </p>
                </div>
                <div className="border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-mono mb-2">Avg Upside</p>
                  <p className="text-2xl font-bold text-emerald-400 font-mono">
                    {(results.reduce((acc, r) => acc + r.potentialGain, 0) / results.length).toFixed(2)}%
                  </p>
                </div>
                <div className="border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-mono mb-2">Strong Buys</p>
                  <p className="text-2xl font-bold text-emerald-400 font-mono">
                    {results.filter((r) => r.signal === "Strong Buy").length}
                  </p>
                </div>
                <div className="border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-mono mb-2">Avg RSI</p>
                  <p className="text-2xl font-bold text-emerald-400 font-mono">
                    {(results.reduce((acc, r) => acc + r.rsi, 0) / results.length).toFixed(0)}
                  </p>
                </div>
              </div>

              {/* Results Table */}
              <div className="border border-white/10 bg-white/[0.02]">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.02]">
                        <th className="text-left p-3 text-xs font-mono uppercase tracking-wider text-gray-500">
                          Symbol
                        </th>
                        <th className="text-left p-3 text-xs font-mono uppercase tracking-wider text-gray-500">
                          Company
                        </th>
                        <th className="text-right p-3 text-xs font-mono uppercase tracking-wider text-gray-500">
                          Price
                        </th>
                        <th className="text-right p-3 text-xs font-mono uppercase tracking-wider text-gray-500">
                          Target
                        </th>
                        <th className="text-right p-3 text-xs font-mono uppercase tracking-wider text-gray-500">
                          Upside
                        </th>
                        <th className="text-right p-3 text-xs font-mono uppercase tracking-wider text-gray-500">
                          Volume
                        </th>
                        <th className="text-center p-3 text-xs font-mono uppercase tracking-wider text-gray-500">
                          Score
                        </th>
                        <th className="text-center p-3 text-xs font-mono uppercase tracking-wider text-gray-500">
                          Signal
                        </th>
                        <th className="text-center p-3 text-xs font-mono uppercase tracking-wider text-gray-500"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result, index) => (
                        <>
                          <motion.tr
                            key={result.symbol}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                            onClick={() => setExpandedRow(expandedRow === result.symbol ? null : result.symbol)}
                          >
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center">
                                  <span className="text-xs font-bold text-emerald-400 font-mono">
                                    {result.symbol.charAt(0)}
                                  </span>
                                </div>
                                <span className="font-bold text-white font-mono text-sm">{result.symbol}</span>
                              </div>
                            </td>
                            <td className="p-3 text-sm text-gray-400">{result.company}</td>
                            <td className="p-3 text-right font-mono text-sm text-white">
                              ${result.currentPrice.toFixed(2)}
                            </td>
                            <td className="p-3 text-right font-mono text-sm text-emerald-400">
                              ${result.targetPrice.toFixed(2)}
                            </td>
                            <td className="p-3 text-right">
                              <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-emerald-400">
                                <ArrowUpRight className="w-3 h-3" />
                                {result.potentialGain.toFixed(2)}%
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono text-sm text-gray-400">{result.volume}</td>
                            <td className="p-3 text-center">
                              <span className={`text-xl font-bold font-mono ${getScoreColor(result.breakoutScore)}`}>
                                {result.breakoutScore}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span
                                className={`inline-block px-2 py-1 text-xs font-semibold font-mono border ${getSignalColor(result.signal)}`}
                              >
                                {result.signal.toUpperCase()}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              {expandedRow === result.symbol ? (
                                <ChevronUp className="w-4 h-4 text-gray-500 mx-auto" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-500 mx-auto" />
                              )}
                            </td>
                          </motion.tr>

                          {/* Expanded Details Row */}
                          <AnimatePresence>
                            {expandedRow === result.symbol && (
                              <motion.tr
                                key={`${result.symbol}-details`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="border-b border-white/5"
                              >
                                <td colSpan={9} className="p-0">
                                  <div className="p-6 bg-white/[0.01] border-t border-white/5">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                      {/* Technical Indicators */}
                                      <div>
                                        <h4 className="text-xs uppercase tracking-wider text-gray-500 font-mono mb-3 pb-2 border-b border-white/10">
                                          Technical Indicators
                                        </h4>
                                        <div className="space-y-2">
                                          <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500 font-mono">RSI</span>
                                            <span
                                              className={`text-xs font-bold font-mono ${result.rsi > 70 ? "text-red-400" : result.rsi > 50 ? "text-green-400" : "text-yellow-400"}`}
                                            >
                                              {result.rsi}
                                            </span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500 font-mono">EMA 8</span>
                                            <span className="text-xs font-mono text-white">
                                              ${result.ema8.toFixed(2)}
                                            </span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500 font-mono">EMA 21</span>
                                            <span className="text-xs font-mono text-white">
                                              ${result.ema21.toFixed(2)}
                                            </span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500 font-mono">MACD</span>
                                            <span className="text-xs font-bold text-emerald-400 font-mono">
                                              {result.macdSignal}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Price Levels */}
                                      <div>
                                        <h4 className="text-xs uppercase tracking-wider text-gray-500 font-mono mb-3 pb-2 border-b border-white/10">
                                          Price Levels
                                        </h4>
                                        <div className="space-y-2">
                                          <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500 font-mono">Support</span>
                                            <span className="text-xs font-mono text-green-400">
                                              ${result.supportLevel.toFixed(2)}
                                            </span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500 font-mono">Resistance</span>
                                            <span className="text-xs font-mono text-red-400">
                                              ${result.resistanceLevel.toFixed(2)}
                                            </span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500 font-mono">24h Change</span>
                                            <span
                                              className={`text-xs font-bold font-mono ${result.priceChange24h > 0 ? "text-emerald-400" : "text-red-400"}`}
                                            >
                                              {result.priceChange24h > 0 ? "+" : ""}
                                              {result.priceChange24h.toFixed(2)}%
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Volume Analysis */}
                                      <div>
                                        <h4 className="text-xs uppercase tracking-wider text-gray-500 font-mono mb-3 pb-2 border-b border-white/10">
                                          Volume Analysis
                                        </h4>
                                        <div className="space-y-2">
                                          <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500 font-mono">Avg Volume</span>
                                            <span className="text-xs font-mono text-gray-400">{result.avgVolume}</span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500 font-mono">Vol Change</span>
                                            <span className="text-xs font-bold text-emerald-400 font-mono">
                                              +{result.volumeChange.toFixed(1)}%
                                            </span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500 font-mono">Pattern</span>
                                            <span className="text-xs font-semibold text-white">{result.pattern}</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Company Info */}
                                      <div>
                                        <h4 className="text-xs uppercase tracking-wider text-gray-500 font-mono mb-3 pb-2 border-b border-white/10">
                                          Company Info
                                        </h4>
                                        <div className="space-y-2">
                                          <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500 font-mono">Sector</span>
                                            <span className="text-xs text-white">{result.sector}</span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500 font-mono">Market Cap</span>
                                            <span className="text-xs font-mono text-gray-400">{result.marketCap}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </motion.tr>
                            )}
                          </AnimatePresence>
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CTA Section */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="mt-8 p-6 border border-emerald-500/30 bg-emerald-500/5"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 border border-emerald-500/30 bg-emerald-500/10">
                    <Zap className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-2 text-white">Ready to Start Trading?</h3>
                    <p className="text-sm text-gray-400 mb-4">
                      These results are simulated for demo purposes. Sign up to get real-time alerts and access our full
                      suite of scanning tools.
                    </p>
                    <Button className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold">
                      Get Started Free
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Demo Input/Output Example - Only show when no results */}
        {!showResults && !isScanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto mt-12"
          >
            <div className="border border-white/10 bg-white/[0.02] p-8">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">How It Works</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Input Example */}
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-gray-500 mb-3">
                    Sample Input (CSV/Text)
                  </h4>
                  <div className="border border-white/10 bg-black p-4 text-xs text-gray-400 font-mono">
                    <div>AAPL</div>
                    <div>TSLA</div>
                    <div>NVDA</div>
                    <div>AMD</div>
                    <div>META</div>
                    <div>SHOP</div>
                    <div>COIN</div>
                  </div>
                </div>

                {/* Output Example */}
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-gray-500 mb-3">Scanner Output</h4>
                  <div className="border border-emerald-500/30 bg-black p-4 text-xs text-emerald-400 font-mono space-y-1">
                    <div>AAPL: BUY | RSI 58 | Vol Climax</div>
                    <div>TSLA: BUY | RSI 62 | Cup & Handle</div>
                    <div>NVDA: STRONG BUY | RSI 68 | Bull Flag</div>
                    <div>AMD: STRONG BUY | RSI 65 | Asc Triangle</div>
                    <div>META: BUY | RSI 61 | Vol Breakout</div>
                    <div>SHOP: STRONG BUY | RSI 67 | Resistance Break</div>
                    <div>COIN: BUY | RSI 66 | Double Bottom</div>
                  </div>
                </div>
              </div>

              <p className="mt-6 text-xs text-gray-500 font-mono italic border-t border-white/10 pt-4">
                Demo simulation: Select a scan type → Get actionable signals. Production version uses real-time data.
              </p>
            </div>
          </motion.div>
        )}
      </div>

      <Footer />
    </div>
  )
}

export default DemoScan
