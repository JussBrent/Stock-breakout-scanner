import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Link } from "react-router-dom"
import { 
  TrendingUp, 
  Send, 
  ChevronRight,
  Zap,
  BarChart3,
  Code,
  Plus,
  Clock,
  LayoutGrid,
  Settings,
  Maximize2,
  Info,
  Lightbulb
} from "lucide-react"

// Mock data for scan results
const mockResults = [
  { symbol: "NVDA", company: "NVIDIA Corp", price: 495.50, change: 3.2, score: 94, signal: "STRONG BUY", pattern: "Bull Flag" },
  { symbol: "AMD", company: "Advanced Micro", price: 158.30, change: 2.8, score: 91, signal: "STRONG BUY", pattern: "Ascending Triangle" },
  { symbol: "TSLA", company: "Tesla Inc", price: 248.75, change: 4.1, score: 89, signal: "BUY", pattern: "Cup & Handle" },
  { symbol: "AAPL", company: "Apple Inc", price: 189.95, change: 2.1, score: 88, signal: "BUY", pattern: "Volume Climax" },
  { symbol: "META", company: "Meta Platforms", price: 348.60, change: 2.5, score: 86, signal: "BUY", pattern: "Breakout" },
]

// Chat suggestions
const chatSuggestions = [
  "Find breakout stocks above $100",
  "Show me high momentum tech stocks",
  "Scan for volume surge patterns",
  "Find stocks with RSI oversold",
]

// Generate candlestick data
const generateCandleData = () => {
  const data = []
  let price = 299
  for (let i = 0; i < 50; i++) {
    const open = price
    const volatility = Math.random() * 8 - 4
    const close = open + volatility
    const high = Math.max(open, close) + Math.random() * 3
    const low = Math.min(open, close) - Math.random() * 3
    const volume = Math.floor(Math.random() * 100) + 20
    data.push({ open, close, high, low, volume, date: i })
    price = close
  }
  return data
}

export default function DemoScanPage() {
  const [candleData, setCandleData] = useState(generateCandleData())
  const [selectedStock, setSelectedStock] = useState(mockResults[0])
  const [chatInput, setChatInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [typedText, setTypedText] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([
    { role: "assistant", content: "Hi, I'm your AI trading assistant. Ask me to scan for breakout opportunities or analyze market patterns." }
  ])
  const chatEndRef = useRef<HTMLDivElement>(null)
  
  // Typing animation for demo
  useEffect(() => {
    const demoQuery = "Find high momentum breakout stocks"
    let i = 0
    const typeInterval = setInterval(() => {
      if (i <= demoQuery.length) {
        setTypedText(demoQuery.slice(0, i))
        i++
      } else {
        clearInterval(typeInterval)
        setTimeout(() => {
          setIsScanning(true)
          setTimeout(() => {
            setIsScanning(false)
            setShowResults(true)
          }, 2000)
        }, 500)
      }
    }, 80)
    
    return () => clearInterval(typeInterval)
  }, [])

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatHistory])

  const handleSend = () => {
    if (!chatInput.trim()) return
    setChatHistory(prev => [...prev, { role: "user", content: chatInput }])
    setChatInput("")
    setIsScanning(true)
    
    setTimeout(() => {
      setChatHistory(prev => [...prev, { 
        role: "assistant", 
        content: `Found ${mockResults.length} stocks matching your criteria. Top pick: ${mockResults[0].symbol} with a ${mockResults[0].score} breakout score.` 
      }])
      setIsScanning(false)
      setShowResults(true)
    }, 1500)
  }

  const currentPrice = candleData[candleData.length - 1]?.close.toFixed(2) || "299.14"
  const priceChange = ((candleData[candleData.length - 1]?.close - candleData[candleData.length - 2]?.close) || -1.01).toFixed(2)
  const changePercent = ((Number(priceChange) / candleData[candleData.length - 2]?.close) * 100 || -0.34).toFixed(2)

  return (
    <div className="h-screen bg-black text-white overflow-hidden flex flex-col">
      {/* Structural Lines - Top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-[#00ff88]/20" />
      <div className="absolute top-0 left-[280px] w-px h-full bg-[#222]" />
      <div className="absolute top-0 right-[100px] w-px h-full bg-[#222]" />
      
      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Chat */}
        <div className="w-[280px] border-r border-[#222] flex flex-col bg-[#0a0a0a]">
          {/* Chat Header */}
          <div className="p-4 border-b border-[#222] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-white">New Chat</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-1 hover:bg-[#222] transition-colors">
                <Plus className="w-4 h-4 text-[#888]" />
              </button>
              <button className="p-1 hover:bg-[#222] transition-colors">
                <Clock className="w-4 h-4 text-[#888]" />
              </button>
              <button className="p-1 hover:bg-[#222] transition-colors">
                <LayoutGrid className="w-4 h-4 text-[#888]" />
              </button>
            </div>
          </div>
          
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatHistory.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={msg.role === "assistant" ? "text-white" : "text-[#00ff88]"}
              >
                {msg.role === "user" && (
                  <span className="text-[#00ff88] mr-2 font-mono">{">"}</span>
                )}
                <span className="text-sm leading-relaxed">{msg.content}</span>
              </motion.div>
            ))}
            
            {isScanning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-[#00ff88]"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border border-[#00ff88] border-t-transparent"
                />
                <span className="text-sm font-mono">Scanning markets...</span>
              </motion.div>
            )}
            <div ref={chatEndRef} />
          </div>
          
          {/* Chat Input */}
          <div className="p-4 border-t border-[#222]">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00ff88] font-mono">{">"}</span>
              <input
                type="text"
                value={chatInput || typedText}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask anything..."
                className="w-full bg-[#111] border border-[#222] pl-7 pr-10 py-2 text-sm font-mono text-white placeholder:text-[#444] focus:outline-none focus:border-[#00ff88]/50"
              />
              <button 
                onClick={handleSend}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-[#222] transition-colors"
              >
                <Send className="w-4 h-4 text-[#00ff88]" />
              </button>
            </div>
            
            {/* Suggestions */}
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="text-[#00ff88] font-mono">?</span>
              <span className="text-[#666]">info</span>
              <span className="text-[#ff6b6b] font-mono ml-2">!</span>
              <span className="text-[#666]">suggestions</span>
            </div>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Chart Header */}
          <div className="h-12 border-b border-[#222] flex items-center justify-between px-4 bg-[#0a0a0a]">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-[#4285f4] flex items-center justify-center text-xs font-bold">G</div>
                <span className="font-mono text-sm text-white">ALPHABET INC. CLASS C CAPITAL STOCK</span>
                <span className="font-mono text-sm text-[#666]">$GOOG</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Plus className="w-4 h-4 text-[#666]" />
                <Clock className="w-4 h-4 text-[#666]" />
                <span className="text-[#888]">15M</span>
                <TrendingUp className="w-4 h-4 text-[#666]" />
                <span className="text-[#888]">TOOLS</span>
                <Settings className="w-4 h-4 text-[#666]" />
              </div>
            </div>
            <span className="font-mono text-xs text-[#666]">STOCKBREAKOUT</span>
          </div>
          
          {/* Price Info */}
          <div className="px-4 py-2 border-b border-[#222] bg-[#0a0a0a]">
            <div className="flex items-center gap-4">
              <span className="font-mono text-sm">
                C <span className="text-[#ff4444]">{currentPrice}</span>{" "}
                <span className="text-[#ff4444]">{priceChange}</span>{" "}
                <span className="text-[#666]">({changePercent}%)</span>
              </span>
              <span className="font-mono text-sm text-[#00ff88]">VOL 1.44M</span>
            </div>
          </div>
          
          {/* Chart Area */}
          <div className="flex-1 relative bg-[#0a0a0a] p-4">
            {/* Candlestick Chart */}
            <div className="absolute inset-4 flex">
              {/* Chart */}
              <div className="flex-1 relative">
                {/* Grid Lines */}
                <div className="absolute inset-0">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="absolute w-full h-px bg-[#1a1a1a]" style={{ top: `${(i + 1) * 12}%` }} />
                  ))}
                </div>
                
                {/* Candles */}
                <svg className="w-full h-full" viewBox="0 0 1000 400" preserveAspectRatio="none">
                  {candleData.map((candle, i) => {
                    const x = (i / candleData.length) * 980 + 10
                    const width = 12
                    const isGreen = candle.close >= candle.open
                    const color = isGreen ? "#00ff88" : "#ff4444"
                    
                    // Normalize values
                    const minPrice = Math.min(...candleData.map(c => c.low))
                    const maxPrice = Math.max(...candleData.map(c => c.high))
                    const priceRange = maxPrice - minPrice
                    
                    const normalizeY = (price: number) => 380 - ((price - minPrice) / priceRange) * 360
                    
                    const openY = normalizeY(candle.open)
                    const closeY = normalizeY(candle.close)
                    const highY = normalizeY(candle.high)
                    const lowY = normalizeY(candle.low)
                    
                    return (
                      <g key={i}>
                        {/* Wick */}
                        <line
                          x1={x + width / 2}
                          y1={highY}
                          x2={x + width / 2}
                          y2={lowY}
                          stroke={color}
                          strokeWidth="1"
                        />
                        {/* Body */}
                        <rect
                          x={x}
                          y={Math.min(openY, closeY)}
                          width={width}
                          height={Math.max(Math.abs(closeY - openY), 2)}
                          fill={isGreen ? color : "transparent"}
                          stroke={color}
                          strokeWidth="1"
                        />
                      </g>
                    )
                  })}
                  
                  {/* Current Price Line */}
                  <line x1="0" y1="200" x2="1000" y2="200" stroke="#ff4444" strokeWidth="1" strokeDasharray="4" />
                </svg>
                
                {/* Volume Bars */}
                <div className="absolute bottom-0 left-0 right-0 h-16 flex items-end gap-px px-2">
                  {candleData.map((candle, i) => {
                    const isGreen = candle.close >= candle.open
                    const height = (candle.volume / 120) * 100
                    return (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ delay: i * 0.02, duration: 0.3 }}
                        className="flex-1"
                        style={{ backgroundColor: isGreen ? "#00ff88" : "#ff4444", opacity: 0.6 }}
                      />
                    )
                  })}
                </div>
              </div>
              
              {/* Price Levels */}
              <div className="w-16 flex flex-col justify-between py-2 text-right">
                {[314, 310, 307, 304, 301, 298, 295].map((price) => (
                  <span key={price} className="font-mono text-xs text-[#666]">{price}.00</span>
                ))}
              </div>
            </div>
            
            {/* Current Price Badge */}
            <div className="absolute right-20 top-1/2 -translate-y-1/2 bg-[#ff4444] px-2 py-0.5">
              <span className="font-mono text-xs text-white">{currentPrice}</span>
            </div>
          </div>
          
          {/* Code Editor Section */}
          <div className="h-48 border-t border-[#222] bg-[#0a0a0a]">
            <div className="h-8 border-b border-[#222] flex items-center px-4 gap-4">
              <div className="flex items-center gap-2 text-[#00ff88]">
                <Code className="w-4 h-4" />
                <span className="font-mono text-xs">CODE</span>
              </div>
              <div className="flex-1" />
              <Maximize2 className="w-4 h-4 text-[#666]" />
            </div>
            <div className="p-4 font-mono text-sm">
              <div className="text-[#666]">
                <span className="text-[#888] mr-4">1</span>
                <span className="text-[#888]"># Hey! I'm your AI trading assistant</span>
              </div>
              <div className="text-[#666]">
                <span className="text-[#888] mr-4">2</span>
                <span className="text-[#888]"># Describe your strategy in the chat, and I'll write the code for you.</span>
              </div>
              <div className="text-[#666]">
                <span className="text-[#888] mr-4">3</span>
                <span className="text-[#888]">#</span>
              </div>
              <div className="text-[#666] flex items-center">
                <span className="text-[#888] mr-4">4</span>
                <span className="text-[#888]"># </span>
                <motion.div 
                  className="flex gap-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-8 h-3 bg-[#333]"
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 1.5, delay: i * 0.1, repeat: Infinity }}
                    />
                  ))}
                </motion.div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Sidebar - Results */}
        <div className="w-[300px] border-l border-[#222] bg-[#0a0a0a] flex flex-col">
          {/* Results Header */}
          <div className="p-4 border-b border-[#222]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs text-[#666] uppercase tracking-wider">Scan Results</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-[#00ff88] animate-pulse" />
                <span className="font-mono text-xs text-[#00ff88]">LIVE</span>
              </div>
            </div>
          </div>
          
          {/* Results List */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence>
              {showResults && mockResults.map((stock, i) => (
                <motion.div
                  key={stock.symbol}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => setSelectedStock(stock)}
                  className={`p-4 border-b border-[#222] cursor-pointer transition-colors ${
                    selectedStock.symbol === stock.symbol ? "bg-[#00ff88]/5 border-l-2 border-l-[#00ff88]" : "hover:bg-[#111]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-mono text-sm text-white font-bold">{stock.symbol}</span>
                      <span className="font-mono text-xs text-[#666] ml-2">{stock.company}</span>
                    </div>
                    <span className={`font-mono text-xs px-2 py-0.5 ${
                      stock.signal === "STRONG BUY" 
                        ? "bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/50" 
                        : "bg-[#00cc6a]/20 text-[#00cc6a] border border-[#00cc6a]/50"
                    }`}>
                      {stock.signal}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-sm text-white">${stock.price.toFixed(2)}</span>
                      <span className={`font-mono text-xs ${stock.change >= 0 ? "text-[#00ff88]" : "text-[#ff4444]"}`}>
                        {stock.change >= 0 ? "+" : ""}{stock.change}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs text-[#666]">Score:</span>
                      <span className="font-mono text-sm text-[#00ff88] font-bold">{stock.score}</span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="font-mono text-xs text-[#666]">Pattern:</span>
                    <span className="font-mono text-xs text-[#888]">{stock.pattern}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {!showResults && (
              <div className="p-8 text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-2 border-[#222] border-t-[#00ff88] mx-auto mb-4"
                />
                <span className="font-mono text-xs text-[#666]">Waiting for scan...</span>
              </div>
            )}
          </div>
          
          {/* CTA */}
          <div className="p-4 border-t border-[#222]">
            <Link to="/signup">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-[#00ff88] text-black font-mono text-sm py-3 flex items-center justify-center gap-2 hover:bg-[#00cc6a] transition-colors"
              >
                <Zap className="w-4 h-4" />
                Get Full Access
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </Link>
            <p className="font-mono text-xs text-[#666] text-center mt-2">
              Unlock unlimited scans & real-time alerts
            </p>
          </div>
        </div>
      </div>
      
      {/* Bottom Structural Line */}
      <div className="h-px bg-[#222]" />
      
      {/* Back to Home Link */}
      <div className="h-10 bg-[#0a0a0a] border-t border-[#222] flex items-center justify-between px-4">
        <Link to="/" className="font-mono text-xs text-[#666] hover:text-[#00ff88] transition-colors flex items-center gap-2">
          <ChevronRight className="w-3 h-3 rotate-180" />
          Back to Home
        </Link>
        <div className="flex items-center gap-4 font-mono text-xs text-[#666]">
          <span>DEMO MODE</span>
          <div className="w-px h-4 bg-[#222]" />
          <span className="text-[#00ff88]">v1.0.0</span>
        </div>
      </div>
    </div>
  )
}
