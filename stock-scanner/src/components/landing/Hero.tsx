'use client'

import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

const heroContainer = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: 'easeOut',
    },
  },
}

const staggerGroup = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: 'easeOut' },
  },
}

export default function Hero() {
  return (
    <section className="relative isolate min-h-screen overflow-hidden pt-16">
      {/* Background GIF */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/-999x-999-qzb4AnjjF6uPmM3WungtuF7M5iGfRS.gif"
            alt=""
            className="h-full w-full object-cover opacity-80"
          />
        </div>

        {/* PURE dark overlay for readability (no white tint) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-black/90" />
      </div>

      {/* Hero content */}
      <motion.div
        className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col items-center justify-center px-6 pb-20 pt-20 sm:px-8"
        initial="hidden"
        animate="visible"
        variants={heroContainer}
      >
        {/* Eyebrow */}
        <motion.div
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-4 py-2 backdrop-blur-sm"
          variants={fadeUp}
        >
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          <span className="text-xs font-medium uppercase tracking-widest text-white/70">
            Stock Breakout Scanner
          </span>
        </motion.div>

        {/* Main headline + subheadline */}
        <motion.div
          className="flex flex-col items-center"
          variants={staggerGroup}
        >
          <motion.h1
            className="max-w-5xl text-balance text-center font-serif text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl"
            variants={fadeUp}
          >
            Find Breakout Opportunities{' '}
            <span className="text-white/80">Instantly.</span>
          </motion.h1>

          <motion.p
            className="mt-6 max-w-2xl text-balance text-center text-base leading-relaxed text-white/80 sm:text-lg"
            variants={fadeUp}
          >
            AI-driven breakout scans based on your coach’s methodology. Turn 2
            hours of manual scanning into a Focus List in seconds.
          </motion.p>
        </motion.div>

        {/* CTAs */}
        <motion.div
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
          variants={staggerGroup}
        >
          {/* White pill button */}
          <motion.div variants={fadeUp}>
            <Button
              size="lg"
              className="rounded-full bg-white px-10 py-5 text-base font-semibold text-black shadow-2xl hover:bg-white/90"
            >
              Get Started
            </Button>
          </motion.div>

          {/* Transparent outline button */}
          <motion.div variants={fadeUp}>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full border-white/40 bg-black/40 px-10 py-5 text-base text-white backdrop-blur hover:bg-white/10"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="mr-2 h-4 w-4"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
              Run Demo Scan
            </Button>
          </motion.div>
        </motion.div>

        {/* Trust copy */}
        <motion.p
          className="mt-8 text-xs text-white/60"
          variants={fadeUp}
        >
          Trusted by breakout traders · No credit card required to run your first
          scan
        </motion.p>

        {/* Focus List preview card */}
        <motion.div
          className="mt-20 w-full max-w-5xl overflow-hidden rounded-3xl border border-white/15 bg-black/60 shadow-2xl backdrop-blur-md"
          variants={fadeUp}
        >
          <div className="border-b border-white/10 bg-black/40 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-400/80" />
                </div>
                <span className="text-sm font-medium text-white">
                  Tonight’s Focus List
                </span>
              </div>
              <span className="text-xs text-white/50">
                Live · Updated 17:03 ET
              </span>
            </div>
          </div>

          <div className="p-8">
            <motion.div
              className="grid gap-6 sm:grid-cols-3"
              variants={staggerGroup}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
            >
              <motion.div
                className="group rounded-2xl border border-white/10 bg-black/50 p-6 transition-all hover:border-white/30 hover:shadow-lg"
                variants={fadeUp}
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
                  Symbol
                </p>
                <p className="mt-3 font-serif text-2xl font-semibold text-white">
                  NVDA
                </p>
                <p className="mt-3 text-sm leading-relaxed text-white/70">
                  Watch for breakout above{' '}
                  <span className="font-semibold text-white">$183.40</span>
                </p>
              </motion.div>

              <motion.div
                className="group rounded-2xl border border-white/10 bg-black/50 p-6 transition-all hover:border-white/30 hover:shadow-lg"
                variants={fadeUp}
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
                  Setup Quality
                </p>
                <p className="mt-3 font-serif text-2xl font-semibold text-white">
                  92 · Strong A+
                </p>
                <p className="mt-3 text-sm leading-relaxed text-white/70">
                  8 EMA trend · volume expansion · clean structure
                </p>
              </motion.div>

              <motion.div
                className="group rounded-2xl border border-white/10 bg-black/50 p-6 transition-all hover:border-white/30 hover:shadow-lg"
                variants={fadeUp}
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
                  Scan Time
                </p>
                <p className="mt-3 font-serif text-2xl font-semibold text-white">
                  17:03 ET
                </p>
                <p className="mt-3 text-sm leading-relaxed text-white/70">
                  Added to Premium Focus List for tomorrow’s open.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
