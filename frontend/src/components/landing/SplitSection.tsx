import { motion } from "framer-motion"

const motionEase = [0.22, 1, 0.36, 1] as const

const headerVariant = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: motionEase },
  },
}

const cardsContainerVariant = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
}

const cardVariant = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: motionEase,
    },
  },
}

const statContainerVariant = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

const statVariant = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: motionEase,
    },
  },
}

const comparisonFeatures = [
  {
    title: "AI Pattern Recognition",
    description: "Automated scanning identifies 8 EMA breakouts across 2,000+ stocks in under 30 seconds.",
  },
  {
    title: "AI Strength Scoring",
    description: "Every setup gets an institutional-grade quality score based on multiple technical factors.",
  },
  {
    title: "Complete Market Scan",
    description: "Automated coverage of entire U.S. equity universe with consistent analysis quality.",
  },
  {
    title: "100% Consistency",
    description: "Same rigorous criteria applied to every stock, every night, without fatigue or bias.",
  },
]

export default function ComparisonSection() {
  return (
    <section id="comparison" className="relative bg-black py-20 sm:py-32">
      {/* Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, #222 1px, transparent 1px),
              linear-gradient(to bottom, #222 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      {/* Flowing Lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[20, 40, 60, 80].map((left, i) => (
          <motion.div
            key={i}
            className="absolute w-px bg-linear-to-b from-transparent via-[#00ff88]/40 to-transparent"
            initial={{ y: "-120%", opacity: 0 }}
            animate={{ y: "120vh", opacity: [0, 1, 1, 0] }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.5,
            }}
            style={{
              left: `${left}%`,
              height: "200px",
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section Header */}
        <motion.div
          className="mb-16 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.35 }}
          variants={headerVariant}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-px w-8 bg-[#00ff88]" />
            <span className="font-mono text-xs uppercase tracking-wider text-[#00ff88]">
              Comparison
            </span>
            <div className="h-px w-8 bg-[#00ff88]" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Turn hours of stock scanning
            <br />
            <span className="text-[#00ff88]">into seconds.</span>
          </h2>
          <p className="mx-auto max-w-2xl font-mono text-sm text-white/60">
            Stop wasting time on manual chart analysis. StockBreakout Scanner automates your entire scanning workflow with AI-powered pattern recognition.
          </p>
        </motion.div>

        {/* Comparison Grid */}
        <motion.div
          className="grid gap-4 md:grid-cols-2"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          variants={cardsContainerVariant}
        >
          {comparisonFeatures.map((feature, index) => (
            <motion.div
              key={index}
              className="group border border-[#222] bg-[#0a0a0a] p-6 sm:p-8 transition-all hover:border-[#00ff88]/50 hover:bg-[#00ff88]/5"
              variants={cardVariant}
              whileHover={{ y: -4, borderColor: "rgba(0,255,136,0.5)", backgroundColor: "rgba(0,255,136,0.05)" }}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center border border-[#00ff88] bg-[#00ff88] text-black">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="font-mono text-sm text-white/60">{feature.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom Stats */}
        <motion.div
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.35 }}
          variants={statContainerVariant}
        >
          {[
            { value: "2,000+", label: "Stocks Scanned" },
            { value: "<30s", label: "Scan Time" },
            { value: "100%", label: "Consistency" },
            { value: "24/7", label: "Availability" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              className="border border-[#222] bg-[#0a0a0a] p-6 text-center"
              variants={statVariant}
              whileHover={{ y: -3, borderColor: "#333" }}
            >
              <div className="font-mono text-2xl sm:text-3xl font-bold text-[#00ff88]">{stat.value}</div>
              <div className="font-mono text-xs text-white/40 uppercase tracking-wider mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
