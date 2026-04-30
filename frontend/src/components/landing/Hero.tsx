import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import type { Variants } from "framer-motion"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
}

// Demo scenarios that cycle through
const demoScenarios = [
  {
    prompt: "Buy NVDA when RSI is oversold",
    ticker: "NVDA",
    change: "+2.4%",
    resultTitle: "NVDA Oversold Reversal",
    resultType: "LONG",
    entry: "RSI < 30",
    exit: "Profit > 5%",
    chartData: [45, 42, 38, 35, 40, 48, 55, 60, 58, 65],
    chatMessage: "Looking for oversold conditions on NVDA...",
  },
  {
    prompt: "Find breakout patterns on AAPL",
    ticker: "AAPL",
    change: "+1.8%",
    resultTitle: "AAPL Channel Breakout",
    resultType: "LONG",
    entry: "Price > Resistance",
    exit: "Trailing 3%",
    chartData: [50, 52, 51, 53, 54, 52, 55, 58, 62, 68],
    chatMessage: "Scanning AAPL for breakout patterns...",
  },
  {
    prompt: "Alert me when TSLA hits support",
    ticker: "TSLA",
    change: "-1.2%",
    resultTitle: "TSLA Support Bounce",
    resultType: "LONG",
    entry: "Near $180 support",
    exit: "Stop at $175",
    chartData: [65, 60, 55, 52, 48, 45, 48, 52, 50, 55],
    chatMessage: "Setting alert for TSLA support levels...",
  },
  {
    prompt: "Show me MSFT momentum signals",
    ticker: "MSFT",
    change: "+0.9%",
    resultTitle: "MSFT Momentum Play",
    resultType: "LONG",
    entry: "MACD crossover",
    exit: "RSI > 70",
    chartData: [40, 42, 45, 48, 52, 50, 55, 58, 62, 65],
    chatMessage: "Analyzing MSFT momentum indicators...",
  },
]

export default function HeroSection() {
  const navigate = useNavigate()
  const [typedText, setTypedText] = useState("")
  const [currentScenario, setCurrentScenario] = useState(0)
  const [demoPhase, setDemoPhase] = useState<"typing" | "processing" | "result" | "fadeout">("typing")
  const [promptTyped, setPromptTyped] = useState("")
  const [progress, setProgress] = useState(0)
  
  const fullText = "The market doesn't wait. Neither should you."
  const scenario = demoScenarios[currentScenario]

  // Main headline typing effect
  useEffect(() => {
    const timeout = setTimeout(() => {
      let idx = 0
      const interval = setInterval(() => {
        idx += 1
        setTypedText(fullText.slice(0, idx))
        if (idx >= fullText.length) clearInterval(interval)
      }, 40)
      return () => clearInterval(interval)
    }, 800)
    return () => clearTimeout(timeout)
  }, [])

  // Demo cycling logic
  const runDemoCycle = useCallback(() => {
    // Reset state
    setPromptTyped("")
    setProgress(0)
    setDemoPhase("typing")
    
    // Type the prompt
    let idx = 0
    const prompt = demoScenarios[currentScenario].prompt
    const typeInterval = setInterval(() => {
      idx += 1
      setPromptTyped(prompt.slice(0, idx))
      if (idx >= prompt.length) {
        clearInterval(typeInterval)
        // Move to processing phase
        setTimeout(() => {
          setDemoPhase("processing")
          // Animate progress bar
          let prog = 0
          const progInterval = setInterval(() => {
            prog += 5
            setProgress(prog)
            if (prog >= 100) {
              clearInterval(progInterval)
              // Show result
              setTimeout(() => {
                setDemoPhase("result")
                // Fade out and move to next scenario
                setTimeout(() => {
                  setDemoPhase("fadeout")
                  setTimeout(() => {
                    setCurrentScenario((prev) => (prev + 1) % demoScenarios.length)
                  }, 500)
                }, 3000)
              }, 300)
            }
          }, 30)
        }, 500)
      }
    }, 50)

    return () => clearInterval(typeInterval)
  }, [currentScenario])

  useEffect(() => {
    const cleanup = runDemoCycle()
    return cleanup
  }, [currentScenario, runDemoCycle])

  return (
    <section className="relative min-h-screen bg-black pt-16 overflow-hidden">
      {/* Animated Grid Background */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ duration: 2 }}
        className="absolute inset-0"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, #00ff88 1px, transparent 1px),
              linear-gradient(to bottom, #00ff88 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
          }}
        />
      </motion.div>

      {/* Scan Lines */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ top: ["0%", "100%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute w-full h-px bg-[#00ff88]/30"
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-20 sm:pt-32 pb-16"
      >
        {/* Status Badge */}
        <motion.div variants={itemVariants} className="mb-8 flex items-center gap-2">
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="h-2 w-2 bg-[#00ff88]" 
          />
          <span className="font-mono text-xs uppercase tracking-wider text-[#00ff88]">
            Now Live
          </span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1 
          variants={itemVariants}
          className="mb-6 mx-auto whitespace-nowrap text-center font-sans text-[clamp(1.15rem,4.5vw,3.75rem)] font-bold leading-[1.1] tracking-tight text-white"
        >
          {typedText}
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="inline-block w-[3px] h-[0.9em] bg-[#00ff88] ml-1 align-middle"
          />
        </motion.h1>

        <motion.p 
          variants={itemVariants}
          className="mb-10 max-w-2xl font-mono text-sm sm:text-base text-white/60 leading-relaxed"
        >
          Orbis brings professional trading tools to everyday investors.
          Scan 2,000+ stocks in seconds with AI-powered pattern recognition.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 mb-16">
          <motion.button 
            whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(0, 255, 136, 0.3)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/dashboard")}
            className="group border border-[#00ff88] bg-[#00ff88] px-8 py-4 font-mono text-sm font-bold uppercase tracking-wider text-black transition-all hover:bg-transparent hover:text-[#00ff88]"
          >
            <span className="flex items-center justify-center gap-2">
              <span>Launch Scanner</span>
              <motion.svg 
                className="h-4 w-4"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </motion.svg>
            </span>
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02, borderColor: "#00ff88" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/demo")}
            className="border border-white/20 bg-transparent px-8 py-4 font-mono text-sm font-bold uppercase tracking-wider text-white transition-all hover:border-[#00ff88] hover:text-[#00ff88]"
          >
            View Demo
          </motion.button>
        </motion.div>

        {/* Animated Demo Panels */}
        <motion.div 
          variants={itemVariants}
          className="grid gap-4 lg:grid-cols-2"
        >
          {/* Left Panel - Chat Interface with Cycling Demo */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={`chat-${currentScenario}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: demoPhase === "fadeout" ? 0 : 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="border border-[#222] bg-[#0a0a0a]"
            >
              {/* Terminal Header */}
              <div className="flex items-center justify-between border-b border-[#222] px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#ff5f56]" />
                  <div className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                  <div className="h-3 w-3 rounded-full bg-[#27c93f]" />
                </div>
                <span className="font-mono text-xs text-white/40">orbis_terminal</span>
              </div>
              
              {/* Prompt Input */}
              <div className="p-6">
                <div className="flex items-center gap-3 border border-[#222] bg-black/50 px-4 py-3 mb-4">
                  <span className="font-mono text-sm text-white flex-1">
                    {promptTyped}
                    <motion.span
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className={`inline-block w-[2px] h-[14px] bg-white ml-0.5 align-middle ${demoPhase !== "typing" ? "opacity-0" : ""}`}
                    />
                  </span>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ 
                      scale: demoPhase === "result" ? 1 : 0,
                      backgroundColor: "#00ff88"
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    className="w-8 h-8 flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                </div>

                {/* Progress Bar */}
                <motion.div 
                  initial={{ scaleX: 0 }}
                  animate={{ 
                    scaleX: demoPhase === "processing" || demoPhase === "result" ? 1 : 0,
                    opacity: demoPhase === "processing" ? 1 : demoPhase === "result" ? 0.3 : 0
                  }}
                  transition={{ duration: 0.3 }}
                  className="h-1 bg-[#0066ff] origin-left mb-6"
                  style={{ transform: `scaleX(${progress / 100})` }}
                />

                {/* Result Card */}
                <AnimatePresence>
                  {demoPhase === "result" && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="border border-[#222] bg-[#111] p-4"
                    >
                      <div className="flex items-start gap-4">
                        {/* Mini Chart */}
                        <div className="w-20 h-14 border border-[#222] bg-black flex items-end p-1">
                          <svg viewBox="0 0 80 40" className="w-full h-full">
                            <motion.path
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              d={`M ${scenario.chartData.map((v, i) => `${i * 9},${40 - (v - 30) * 0.8}`).join(" L ")}`}
                              fill="none"
                              stroke="#00ff88"
                              strokeWidth="2"
                            />
                          </svg>
                        </div>
                        
                        {/* Result Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-base font-bold text-white">{scenario.resultTitle}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="font-mono text-xs text-white/60">${scenario.ticker}</span>
                            <span className="px-2 py-0.5 bg-[#00ff88] font-mono text-xs font-bold text-black">
                              {scenario.resultType}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                              <span className="font-mono text-xs text-white/60">Entry: {scenario.entry}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                              <span className="font-mono text-xs text-white/60">Exit: {scenario.exit}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Processing Message */}
                <AnimatePresence>
                  {demoPhase === "processing" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 font-mono text-xs text-white/40"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-3 h-3 border border-[#00ff88] border-t-transparent rounded-full"
                      />
                      {scenario.chatMessage}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Right Panel - Chart with Animations */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={`chart-${currentScenario}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: demoPhase === "fadeout" ? 0 : 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="border border-[#222] bg-[#0a0a0a]"
            >
              <div className="flex items-center justify-between border-b border-[#222] px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-white">{scenario.ticker}</span>
                  <motion.span 
                    key={scenario.change}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`font-mono text-xs ${scenario.change.startsWith("+") ? "text-[#00ff88]" : "text-[#ff5f56]"}`}
                  >
                    {scenario.change}
                  </motion.span>
                </div>
                <div className="flex gap-1">
                  <div className="h-2 w-2 bg-white/20" />
                  <div className="h-2 w-2 bg-white/20" />
                </div>
              </div>
              
              {/* Animated Candlestick Chart */}
              <div className="p-6 min-h-[280px] flex items-center justify-center">
                <AnimatedCandlestickChart 
                  key={currentScenario} 
                  data={scenario.chartData} 
                  isProcessing={demoPhase === "processing" || demoPhase === "result"}
                />
              </div>

              {/* Analysis Output */}
              <motion.div 
                className="border-t border-[#222] p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-xs text-white/60">{">"}</span>
                  <span className="font-mono text-sm text-white">Analyzing {scenario.ticker} patterns...</span>
                </div>
                <AnimatePresence>
                  {demoPhase === "result" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2 overflow-hidden"
                    >
                      <motion.svg 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                        className="h-4 w-4 text-[#00ff88]" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </motion.svg>
                      <span className="font-mono text-xs">
                        <span className="text-white/60">SIGNAL: </span>
                        <span className="text-[#00ff88]">{scenario.resultType}</span>
                        <span className="text-white/60"> | Entry: </span>
                        <span className="text-white">{scenario.entry}</span>
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Partners */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="mt-16 border-t border-[#222] pt-8"
        >
          <p className="mb-6 font-mono text-xs uppercase tracking-wider text-white/40">
            Partnered With:
          </p>
          <div className="flex flex-wrap items-center gap-8">
            {["Alpaca", "Tradier", "TD Ameritrade", "E*TRADE"].map((partner, i) => (
              <motion.span 
                key={partner} 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{ delay: 1.4 + i * 0.1 }}
                whileHover={{ opacity: 1, color: "#00ff88" }}
                className="font-mono text-sm text-white cursor-default"
              >
                {partner}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}

function AnimatedCandlestickChart({ data, isProcessing }: { data: number[], isProcessing: boolean }) {
  const [animatedData, setAnimatedData] = useState(data)
  
  // Animate chart data when processing
  useEffect(() => {
    if (!isProcessing) {
      setAnimatedData(data)
      return
    }
    
    const interval = setInterval(() => {
      setAnimatedData(prev => 
        prev.map((val, i) => {
          const variation = (Math.random() - 0.5) * 3
          return Math.max(30, Math.min(70, val + variation))
        })
      )
    }, 200)
    
    return () => clearInterval(interval)
  }, [isProcessing, data])

  const candles = animatedData.map((close, i) => {
    const open = i === 0 ? close - 2 : animatedData[i - 1]
    const isGreen = close > open
    return {
      o: open,
      c: close,
      h: Math.max(open, close) + Math.random() * 5,
      l: Math.min(open, close) - Math.random() * 5,
      isGreen,
    }
  })

  const allVals = candles.flatMap(c => [c.h, c.l])
  const minL = Math.min(...allVals)
  const maxH = Math.max(...allVals)
  const range = maxH - minL || 1
  const height = 180
  const width = 300

  const scale = (val: number) => height - ((val - minL) / range) * height

  return (
    <svg viewBox={`0 0 ${width} ${height + 20}`} className="w-full max-w-[300px]">
      {/* Grid lines */}
      {[0, 1, 2, 3, 4].map(i => (
        <line
          key={i}
          x1={0}
          y1={height * i / 4}
          x2={width}
          y2={height * i / 4}
          stroke="#222"
          strokeWidth={0.5}
        />
      ))}
      
      {candles.map((candle, i) => {
        const x = i * 28 + 15
        const bodyTop = scale(Math.max(candle.o, candle.c))
        const bodyBottom = scale(Math.min(candle.o, candle.c))
        const bodyHeight = Math.max(bodyBottom - bodyTop, 2)

        return (
          <motion.g 
            key={i}
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            style={{ transformOrigin: `${x + 8}px ${height}px` }}
          >
            {/* Wick */}
            <motion.line
              x1={x + 8}
              y1={scale(candle.h)}
              x2={x + 8}
              y2={scale(candle.l)}
              stroke={candle.isGreen ? "#00ff88" : "#ff5f56"}
              strokeWidth={1}
              animate={{ 
                y1: scale(candle.h), 
                y2: scale(candle.l) 
              }}
              transition={{ duration: 0.2 }}
            />
            {/* Body */}
            <motion.rect
              x={x}
              width={16}
              fill={candle.isGreen ? "#00ff88" : "#ff5f56"}
              animate={{ 
                y: bodyTop, 
                height: bodyHeight 
              }}
              transition={{ duration: 0.2 }}
            />
          </motion.g>
        )
      })}
      
      {/* Buy Signal */}
      <motion.g
        initial={{ opacity: 0, scale: 0 }}
        animate={{ 
          opacity: isProcessing ? 1 : 0, 
          scale: isProcessing ? 1 : 0 
        }}
        transition={{ delay: 0.5, type: "spring", stiffness: 500, damping: 25 }}
      >
        <polygon 
          points={`${15 + 3 * 28},${height + 5} ${15 + 3 * 28 + 8},${height + 15} ${15 + 3 * 28 - 8},${height + 15}`}
          fill="#00ff88" 
        />
      </motion.g>
      
      {/* Sell Signal */}
      <motion.g
        initial={{ opacity: 0, scale: 0 }}
        animate={{ 
          opacity: isProcessing ? 1 : 0, 
          scale: isProcessing ? 1 : 0 
        }}
        transition={{ delay: 0.7, type: "spring", stiffness: 500, damping: 25 }}
      >
        <polygon 
          points={`${15 + 7 * 28},-5 ${15 + 7 * 28 + 8},5 ${15 + 7 * 28 - 8},5`}
          fill="#ff5f56" 
        />
      </motion.g>
    </svg>
  )
}
