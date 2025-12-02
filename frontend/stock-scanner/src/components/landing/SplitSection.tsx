"use client"

import { TextRoll } from "@/components/ui/text-roll"
import React from "react"
import { motion } from "framer-motion"

const comparisonFeatures = [
  {
    without: {
      title: "Manual Chart Analysis",
      description: "Spend 1-2 hours every night manually reviewing charts to identify breakout patterns",
    },
    with: {
      title: "AI Pattern Recognition",
      description: "Automated scanning identifies 8 EMA breakouts across 2,000+ stocks in under 30 seconds",
    },
  },
  {
    without: {
      title: "No Quality Scoring",
      description: "Difficult to objectively rank which setups have the highest probability of success",
    },
    with: {
      title: "AI Strength Scoring",
      description: "Every setup gets an institutional-grade quality score based on multiple technical factors",
    },
  },
  {
    without: {
      title: "Limited Market Coverage",
      description: "Humanly impossible to scan more than 100-200 stocks with consistent quality",
    },
    with: {
      title: "Complete Market Scan",
      description: "Automated coverage of entire U.S. equity universe with consistent analysis quality",
    },
  },
  {
    without: {
      title: "Inconsistent Results",
      description: "Fatigue and human error lead to missed opportunities and varying analysis quality",
    },
    with: {
      title: "100% Consistency",
      description: "Same rigorous criteria applied to every stock, every night, without fatigue or bias",
    },
  },
]

const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.22, 0.61, 0.36, 1],
    },
  },
}

const headerVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.8, 0.25, 1],
    },
  },
}

const gridVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: [0.22, 0.61, 0.36, 1],
    },
  },
}

export default function ComparisonSection() {
  return (
    <motion.section
      className="relative overflow-hidden bg-black py-24 sm:py-32"
      variants={sectionVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        {/* Header */}
        <motion.div className="mb-20 text-center" variants={headerVariants}>
          <h2 className="mb-6 font-serif text-5xl font-bold leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-7xl">
            <TextRoll className="inline-block">Turn hours of stock scanning</TextRoll>
            <br />
            <span className="text-white">into seconds.</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-400 sm:text-xl">
            Stop wasting time on manual chart analysis. StockBreakout Scanner automates your entire scanning workflow
            with AI-powered pattern recognition.
          </p>
        </motion.div>

        {/* Comparison Grid */}
        <motion.div className="grid gap-4 lg:grid-cols-2 lg:gap-6" variants={gridVariants}>
          {comparisonFeatures.map((feature, index) => (
            <React.Fragment key={index}>
              {/* Without Card */}
              <motion.div
                variants={cardVariants}
                whileHover={{
                  y: -4,
                  scale: 1.01,
                  transition: { duration: 0.18, ease: "easeOut" },
                }}
                className="group relative overflow-hidden rounded-xl border border-red-900/30 bg-red-950/10 p-8 backdrop-blur-sm transition-colors hover:border-red-800/50 hover:bg-red-950/20"
              >
                <div className="flex items-start gap-4">
                  {/* X Icon */}
                  <div className="shrink-0">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5 text-red-500"
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-3 text-xl font-semibold text-white">{feature.without.title}</h3>
                    <p className="text-base leading-relaxed text-gray-400">{feature.without.description}</p>
                  </div>
                </div>
              </motion.div>

              {/* With Card */}
              <motion.div
                variants={cardVariants}
                whileHover={{
                  y: -4,
                  scale: 1.02,
                  transition: { duration: 0.18, ease: "easeOut" },
                }}
                className="group relative overflow-hidden rounded-xl border border-emerald-900/30 bg-emerald-950/10 p-8 backdrop-blur-sm transition-colors hover:border-emerald-800/50 hover:bg-emerald-950/20"
              >
                {/* subtle glow accent */}
                <div className="pointer-events-none absolute inset-0 opacity-0 mix-blend-screen blur-3xl transition-opacity duration-300 group-hover:opacity-100">
                  <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 via-emerald-400/5 to-transparent" />
                </div>

                <div className="relative flex items-start gap-4">
                  {/* Checkmark Icon */}
                  <div className="shrink-0">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5 text-emerald-500"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-3 text-xl font-semibold text-white">{feature.with.title}</h3>
                    <p className="text-base leading-relaxed text-gray-400">{feature.with.description}</p>
                  </div>
                </div>
              </motion.div>
            </React.Fragment>
          ))}
        </motion.div>
      </div>
    </motion.section>
  )
}
