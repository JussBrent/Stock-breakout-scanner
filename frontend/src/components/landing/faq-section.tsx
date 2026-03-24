import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion"

const ease = [0.22, 1, 0.36, 1] as const

const sectionVariant = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease },
  },
}

const faqContainerVariant = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

const faqItemVariant = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease },
  },
}

const faqs = [
  {
    question: "How does the AI strength scoring work?",
    answer:
      "Our AI analyzes multiple technical factors including price action, volume patterns, moving averages, and breakout quality to generate a 0-100 strength score. Higher scores indicate setups that more closely match winning patterns.",
  },
  {
    question: "Can I customize the scanning criteria?",
    answer:
      "Yes. While we provide a default 8 EMA breakout methodology, you can create custom scan profiles with your own technical filters, price ranges, volume thresholds, and indicator combinations.",
  },
  {
    question: "How often are scans updated?",
    answer:
      "Scans run automatically after market close (4:00 PM ET) and complete within 30 seconds. Your Focus List is ready before you finish your evening routine, so you can review setups and plan trades for the next day.",
  },
  {
    question: "What markets and instruments are supported?",
    answer:
      "Currently we scan all U.S. equities (NYSE, NASDAQ, AMEX) with a minimum price of $5 and average volume above 500K shares. Options, futures, and international markets are on the roadmap.",
  },
  {
    question: "Do I need coding knowledge to use this?",
    answer:
      "No coding required. The scanner is built for traders, not programmers. Set your preferences with simple dropdowns and sliders, then let the AI handle the rest.",
  },
  {
    question: "How is this different from other scanners?",
    answer:
      "Traditional scanners only filter by technical criteria. We combine technical screening with AI pattern recognition and fundamental quality scoring to identify the highest-probability setups that match proven trading methodologies.",
  },
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const faqRef = useRef<HTMLDivElement | null>(null)
  const reduceMotion = useReducedMotion()
  const isFaqInView = useInView(faqRef, { once: true, amount: 0.3 })

  return (
    <section id="faq" className="relative bg-black py-20 sm:py-32">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, #222 1px, transparent 1px),
              linear-gradient(to bottom, #222 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Left: Stats Display */}
          <motion.div
            className="flex flex-col justify-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={sectionVariant}
          >
            {/* Stats Grid */}
            <div className="relative">
              {/* Central Stat */}
              <div className="flex flex-col items-center justify-center text-center mb-8">
                <div className="border border-[#00ff88] p-8 sm:p-12 bg-[#00ff88]/5">
                  <div className="font-mono text-6xl sm:text-7xl md:text-8xl font-bold text-[#00ff88]">
                    2,000+
                  </div>
                  <div className="font-mono text-sm text-white/60 uppercase tracking-wider mt-2">
                    Stocks Scanned Daily
                  </div>
                </div>
              </div>

              {/* Orbiting Stats */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: "30s", label: "Scan Time" },
                  { value: "95%", label: "Accuracy" },
                  { value: "24/7", label: "Uptime" },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    className="border border-[#222] bg-[#0a0a0a] p-4 text-center"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.45, ease, delay: i * 0.08 }}
                  >
                    <div className="font-mono text-xl sm:text-2xl font-bold text-white">
                      {stat.value}
                    </div>
                    <div className="font-mono text-[10px] text-white/40 uppercase tracking-wider">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right: FAQ List */}
          <motion.div
            ref={faqRef}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={sectionVariant}
          >
            <motion.div className="mb-8" variants={sectionVariant}>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-1 w-8 bg-[#00ff88]" />
                <span className="font-mono text-xs uppercase tracking-wider text-[#00ff88]">
                  FAQ
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                Everything you need to know
              </h2>
            </motion.div>

            <motion.div className="space-y-2" variants={faqContainerVariant}>
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  variants={faqItemVariant}
                  whileHover={{ y: -2 }}
                  className={`border transition-all ${
                    openIndex === index
                      ? "border-[#00ff88]/50 bg-[#00ff88]/5"
                      : "border-[#222] bg-[#0a0a0a] hover:border-[#00ff88]/20"
                  }`}
                >
                  <button
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left"
                  >
                    <span className="font-mono text-sm font-bold text-white">
                      <TypedQuestion
                        text={faq.question}
                        start={isFaqInView}
                        delay={reduceMotion ? 0 : index * 140}
                      />
                    </span>
                    <motion.div
                      animate={{ rotate: openIndex === index ? 180 : 0 }}
                      transition={{ duration: 0.25, ease }}
                      className={`flex h-6 w-6 shrink-0 items-center justify-center border transition-all ${
                        openIndex === index
                          ? "border-[#00ff88] bg-[#00ff88] text-black rotate-180"
                          : "border-white/20 text-white/60"
                      }`}
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {openIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5">
                          <p className="font-mono text-sm text-white/60 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function TypedQuestion({ text, start, delay = 0 }: { text: string; start: boolean; delay?: number }) {
  const [value, setValue] = useState("")

  useEffect(() => {
    if (!start) return

    let charIndex = 0
    let intervalId: ReturnType<typeof setInterval> | undefined

    const timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        charIndex += 1
        setValue(text.slice(0, charIndex))

        if (charIndex >= text.length && intervalId) {
          clearInterval(intervalId)
        }
      }, 18)
    }, delay)

    return () => {
      clearTimeout(timeoutId)
      if (intervalId) clearInterval(intervalId)
    }
  }, [text, start, delay])

  return <>{value || (start ? "" : text)}</>
}
