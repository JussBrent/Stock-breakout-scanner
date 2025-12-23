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
      ease: [0.22, 0.61, 0.36, 1] as const,
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
      ease: [0.25, 0.8, 0.25, 1] as const,
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
      ease: [0.22, 0.61, 0.36, 1] as const,
    },
  },
}

export default function ComparisonSection() {
  return (
    <motion.section
      id="split"
      className="relative overflow-hidden bg-black py-16 sm:py-24 lg:py-32"
      variants={sectionVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
    >
      {/* Modern mesh gradient with radial glow */}
      <div className="absolute inset-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-radial from-neutral-900/40 via-black to-black" />
        
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-emerald-900/20 via-neutral-900/10 to-transparent rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-gradient-to-tl from-neutral-800/20 via-neutral-900/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        {/* Dot grid pattern */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />
        
        {/* Animated line grid with gradient flow */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `
              linear-gradient(to bottom, 
                transparent 0%, 
                rgba(16, 185, 129, 0.3) 10%, 
                rgba(16, 185, 129, 0.1) 20%, 
                transparent 30%, 
                transparent 100%
              ),
              linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '100% 200%, 80px 80px, 80px 80px',
            animation: 'gridFlow 8s linear infinite'
          }}
        />
        
        {/* Vertical flowing pixels */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute w-px h-32 left-[20%] bg-gradient-to-b from-transparent via-emerald-400 to-transparent opacity-60"
            style={{ animation: 'flowDown 3s linear infinite' }}
          />
          <div 
            className="absolute w-px h-32 left-[40%] bg-gradient-to-b from-transparent via-emerald-500 to-transparent opacity-60"
            style={{ animation: 'flowDown 4s linear infinite 1s' }}
          />
          <div 
            className="absolute w-px h-32 left-[60%] bg-gradient-to-b from-transparent via-emerald-400 to-transparent opacity-60"
            style={{ animation: 'flowDown 3.5s linear infinite 0.5s' }}
          />
          <div 
            className="absolute w-px h-32 left-[80%] bg-gradient-to-b from-transparent via-emerald-500 to-transparent opacity-60"
            style={{ animation: 'flowDown 4.5s linear infinite 2s' }}
          />
        </div>
        
        {/* Add custom keyframes */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes flowDown {
            0% {
              transform: translateY(-100%);
              opacity: 0;
            }
            10% {
              opacity: 0.6;
            }
            90% {
              opacity: 0.6;
            }
            100% {
              transform: translateY(100vh);
              opacity: 0;
            }
          }
          
          @keyframes gridFlow {
            0% {
              background-position: 0% 0%, 0 0, 0 0;
            }
            100% {
              background-position: 0% 200%, 0 0, 0 0;
            }
          }
        `}} />
      </div>
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        {/* Header */}
        <motion.div className="mb-12 sm:mb-20 text-center" variants={headerVariants}>
          <h2 className="mb-4 sm:mb-6 font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] tracking-tight text-white px-2">
            <TextRoll className="inline-block">Turn hours of stock scanning</TextRoll>
            <br />
            <span className="text-white">into seconds.</span>
          </h2>
          <p className="mx-auto max-w-2xl text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed text-neutral-300 px-4">
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
                className="group relative overflow-hidden rounded-xl border border-red-900/30 bg-red-950/10 p-5 sm:p-8 backdrop-blur-sm transition-colors hover:border-red-800/50 hover:bg-red-950/20"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* X Icon */}
                  <div className="shrink-0">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 sm:h-5 sm:w-5 text-red-500"
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2 sm:mb-3 text-lg sm:text-xl font-semibold text-white">{feature.without.title}</h3>
                    <p className="text-sm sm:text-base leading-relaxed text-neutral-300">{feature.without.description}</p>
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
                className="group relative overflow-hidden rounded-xl border border-emerald-900/30 bg-emerald-950/10 p-5 sm:p-8 backdrop-blur-sm transition-colors hover:border-emerald-800/50 hover:bg-emerald-950/20"
              >
                {/* subtle glow accent */}
                <div className="pointer-events-none absolute inset-0 opacity-0 mix-blend-screen blur-3xl transition-opacity duration-300 group-hover:opacity-100">
                  <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 via-emerald-400/5 to-transparent" />
                </div>

                <div className="relative flex items-start gap-3 sm:gap-4">
                  {/* Checkmark Icon */}
                  <div className="shrink-0">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2 sm:mb-3 text-lg sm:text-xl font-semibold text-white">{feature.with.title}</h3>
                    <p className="text-sm sm:text-base leading-relaxed text-neutral-300">{feature.with.description}</p>
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
