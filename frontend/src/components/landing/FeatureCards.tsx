import { useState, useEffect, useRef } from "react"
import { motion, useInView, useReducedMotion } from "framer-motion"

const motionTokens = {
  ease: [0.22, 1, 0.36, 1] as const,
  duration: {
    fast: 0.25,
    base: 0.5,
    slow: 0.8,
  },
}

const container = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionTokens.duration.base,
      ease: motionTokens.ease,
    },
  },
}

const cardInView = {
  hidden: { opacity: 0, y: 32 },
  visible: (index: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: motionTokens.duration.base,
      ease: motionTokens.ease,
      delay: index * 0.1,
    },
  }),
}

const fade = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: motionTokens.duration.base,
    },
  },
}

const features = [
  {
    title: "Prompt-Driven Technical Analysis",
    description: "Request technical analysis like support, resistance, and breakouts and set alerts or trades from the results.",
    prompts: [
      "Show me the support and resistance on AAPL",
      "Remind me when TSLA breaks out of the channel",
      "Sell TSLA when it drops to my support line",
    ],
  },
  {
    title: "Advanced Market Research",
    description: "Research companies, sectors, and market movements with fast, detailed analysis.",
    prompts: [
      "Find underrated, top-performing stocks",
      "Explain why TSLA just dropped suddenly",
      "Dive into MSFT's fundamentals",
    ],
  },
  {
    title: "Lightning-Fast Backtesting",
    description: "Validate your strategies against historical data in seconds with institutional-grade accuracy.",
    prompts: [
      "Backtest RSI divergence on SPY",
      "Test 8 EMA breakout strategy",
      "Compare momentum vs value factors",
    ],
  },
]

export default function FeaturesSection() {
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" })

  return (
    <motion.section
      id="features"
      ref={sectionRef}
      className="relative bg-black py-20 sm:py-32"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fade}
    >
      {/* Border lines */}
      <div className="absolute left-0 top-0 h-full w-px bg-[#222]" />
      <div className="absolute right-0 top-0 h-full w-px bg-[#222]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        {/* Header */}
        <motion.div
          className="mb-16 border-b border-[#222] pb-8"
          variants={fadeUp}
        >
          <div className="flex items-center gap-2 mb-4">
            <motion.div
              className="h-1 w-8 bg-[#00ff88]"
              initial={{ width: 0 }}
              animate={isInView ? { width: 32 } : {}}
              transition={{ duration: 0.4 }}
            />
            <span className="font-mono text-xs uppercase tracking-wider text-[#00ff88]">
              Features
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight text-balance">
            Everything you need to trade smarter.
          </h2>

          <p className="mt-4 max-w-2xl font-mono text-sm text-white/60">
            Orbis consolidates research, charting, and strategy building into one AI-driven platform.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid gap-4 lg:grid-cols-2">

          {/* Technical Analysis */}
          <motion.div
            className="lg:col-span-2 border border-[#222] bg-[#0a0a0a] overflow-hidden"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={cardInView}
            custom={0}
            whileHover={{ y: -4, borderColor: "#333" }}
            transition={{ duration: motionTokens.duration.fast }}
          >
            <div className="grid lg:grid-cols-2">

              <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-center">

                <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">
                  {features[0].title}
                </h3>

                <p className="font-mono text-sm text-white/60 mb-6">
                  {features[0].description}
                </p>

                <motion.div
                  className="space-y-3"
                  variants={container}
                >
                  {features[0].prompts.map((prompt, i) => (
                    <motion.div
                      key={i}
                      layout
                      className="flex items-center gap-3"
                      variants={fadeUp}
                    >
                      <span className="text-[#00ff88] font-mono text-xs">→</span>
                      <span className="font-mono text-xs text-white/80">
                        {prompt}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              <div className="border-t lg:border-t-0 lg:border-l border-[#222] p-6">
                <TechnicalAnalysisDemo />
              </div>

            </div>
          </motion.div>

          {/* Market Research */}
          <motion.div
            className="border border-[#222] bg-[#0a0a0a]"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={cardInView}
            custom={1}
            whileHover={{ y: -4, borderColor: "#333" }}
          >
            <div className="p-6 sm:p-8">

              <h3 className="text-xl font-bold text-white mb-4">
                {features[1].title}
              </h3>

              <p className="font-mono text-sm text-white/60 mb-6">
                {features[1].description}
              </p>

              <ResearchDemo />

            </div>
          </motion.div>

          {/* Backtesting */}
          <motion.div
            className="border border-[#222] bg-[#0a0a0a]"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={cardInView}
            custom={2}
            whileHover={{ y: -4, borderColor: "#333" }}
          >
            <div className="p-6 sm:p-8">

              <h3 className="text-xl font-bold text-white mb-4">
                {features[2].title}
              </h3>

              <p className="font-mono text-sm text-white/60 mb-6">
                {features[2].description}
              </p>

              <BacktestDemo />

            </div>
          </motion.div>

          {/* Community */}
          <motion.div
            className="lg:col-span-2 border border-[#222] bg-[#0a0a0a]"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={cardInView}
            custom={3}
            whileHover={{ y: -4, borderColor: "#333" }}
          >
            <div className="grid lg:grid-cols-2">

              <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-center">

                <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">
                  Share & Discover Strategies
                </h3>

                <p className="font-mono text-sm text-white/60 mb-6">
                  Discover, copy, and modify profitable strategies from the Orbis community.
                </p>

                <motion.div
                  className="space-y-3"
                  variants={container}
                >
                  {[
                    "Search for high win-rate strategies",
                    "Discover popular custom indicators",
                    "Save and modify community setups",
                  ].map((text, i) => (
                    <motion.div
                      key={i}
                      layout
                      className="flex items-center gap-3"
                      variants={fadeUp}
                    >
                      <span className="text-[#00ff88] font-mono text-xs">→</span>
                      <span className="font-mono text-xs text-white/80">{text}</span>
                    </motion.div>
                  ))}
                </motion.div>

              </div>

              <div className="border-t lg:border-t-0 lg:border-l border-[#222] p-6">
                <CommunityDemo />
              </div>

            </div>
          </motion.div>

        </div>
      </div>
    </motion.section>
  )
}

/* ------------------------------------------------ */
/* DEMO COMPONENTS */
/* ------------------------------------------------ */

function TechnicalAnalysisDemo() {

  const [tick, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((p) => p + 1)
    }, 1500)

    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: motionTokens.duration.base }}
    >
      <div className="mb-3 border border-[#222] bg-black/80 px-3 py-2 font-mono text-xs text-[#00ff88]">
        <span className="mr-2 text-white/40">&gt;</span>
        <PhraseTyper phrases={features[0].prompts} />
      </div>

      <div className="font-mono text-sm text-white mb-4">
        NVDA +{(2.4 + Math.sin(tick * 0.5) * 0.3).toFixed(1)}%
      </div>

      <div className="h-32 bg-black border border-[#222] flex items-end gap-1 p-2">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="flex-1 bg-[#00ff88]"
            animate={{
              height: `${40 + Math.sin(tick * 0.4 + i) * 30}%`,
            }}
            transition={{
              duration: motionTokens.duration.slow,
              ease: motionTokens.ease,
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}

function ResearchDemo() {
  return (
    <div className="space-y-3 border border-[#222] bg-black/50 p-4">
      <div className="font-mono text-[10px] uppercase tracking-wider text-white/50">
        Live research query
      </div>

      <div className="font-mono text-xs text-white min-h-5">
        <PhraseTyper phrases={features[1].prompts} />
      </div>

      <div className="h-px w-full bg-[#222]" />

      <div className="font-mono text-[11px] text-[#00ff88]">
        Analyzing fundamentals • sentiment • news flow
      </div>
    </div>
  )
}

function PhraseTyper({
  phrases,
  typingDelay = 34,
  deletingDelay = 20,
  holdDelay = 1300,
}: {
  phrases: string[]
  typingDelay?: number
  deletingDelay?: number
  holdDelay?: number
}) {
  const reduceMotion = useReducedMotion()
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [value, setValue] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!phrases.length) return

    if (reduceMotion) {
      const staticTimeout = setTimeout(() => {
        setPhraseIndex((idx) => (idx + 1) % phrases.length)
      }, holdDelay)
      return () => clearTimeout(staticTimeout)
    }

    const current = phrases[phraseIndex]
    const atEnd = value.length === current.length
    const atStart = value.length === 0

    const delay = !isDeleting
      ? atEnd
        ? holdDelay
        : typingDelay
      : deletingDelay

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (atEnd) {
          setIsDeleting(true)
          return
        }
        setValue(current.slice(0, value.length + 1))
        return
      }

      if (!atStart) {
        setValue(current.slice(0, value.length - 1))
        return
      }

      setIsDeleting(false)
      setPhraseIndex((idx) => (idx + 1) % phrases.length)
    }, delay)

    return () => clearTimeout(timeout)
  }, [
    phrases,
    phraseIndex,
    value,
    isDeleting,
    typingDelay,
    deletingDelay,
    holdDelay,
    reduceMotion,
  ])

  return (
    <span className="inline-flex items-center">
      {reduceMotion ? phrases[phraseIndex] : value}
      <motion.span
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
        className="ml-1 inline-block h-[1em] w-0.5 bg-[#00ff88]"
      />
    </span>
  )
}

function BacktestDemo() {

  const [bars] = useState<number[]>(() =>
    Array.from({ length: 20 }, () => Math.random() * 80 + 20)
  )

  return (
    <div className="border border-[#222] p-4">

      <div className="h-16 flex items-end gap-1 mb-4">

        {bars.map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 bg-[#00ff88]"
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{
              duration: motionTokens.duration.base,
              delay: i * 0.03,
              ease: motionTokens.ease,
            }}
          />
        ))}

      </div>

      <div className="font-mono text-xs text-white/60">
        Net Profit +34% | Win Rate 67%
      </div>

    </div>
  )
}

function CommunityDemo() {

  const [active, setActive] = useState(0)

  const strategies = [
    { name: "Momentum Score", stars: 8321 },
    { name: "Dist Lower BB", stars: 3142 },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((p) => (p + 1) % strategies.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [strategies.length])

  return (
    <div className="space-y-4">

      {strategies.map((s, i) => (
        <motion.div
          key={i}
          layout
          className="border border-[#222] p-4 bg-black/50"
          animate={{ opacity: i === active ? 1 : 0.6 }}
        >
          <div className="font-mono text-sm text-white">{s.name}</div>
          <div className="font-mono text-xs text-white/60">
            ⭐ {s.stars.toLocaleString()}
          </div>
        </motion.div>
      ))}

    </div>
  )
}