'use client'

import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const heroContainer = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 0.61, 0.36, 1] as const,
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
    transition: { duration: 0.7, ease: [0.22, 0.61, 0.36, 1] as const },
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
        className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col items-center justify-center px-4 sm:px-6 md:px-8 pb-12 sm:pb-20 pt-12 sm:pt-20"
        initial="hidden"
        animate="visible"
        variants={heroContainer}
      >
        {/* Eyebrow */}
        <motion.div
          className="mb-4 sm:mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3 sm:px-4 py-1.5 sm:py-2 backdrop-blur-sm"
          variants={fadeUp}
        >
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
          <span className="text-[10px] sm:text-xs font-medium uppercase tracking-widest text-gray-400">
            Stock Breakout Scanner
          </span>
        </motion.div>

        {/* Main headline + subheadline */}
        <motion.div
          className="flex flex-col items-center"
          variants={staggerGroup}
        >
          <motion.h1
            className="max-w-5xl text-balance text-center font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[1.1] sm:leading-[1.05] tracking-tight text-white px-2"
            variants={fadeUp}
          >
            Find Breakout Opportunities{' '}
            <span className="text-white">Instantly.</span>
          </motion.h1>

          <motion.p
            className="mt-4 sm:mt-6 max-w-2xl text-balance text-center text-sm sm:text-base md:text-lg leading-relaxed text-gray-400 px-4"
            variants={fadeUp}
          >
            AI-driven breakout scans based on your coach’s methodology. Turn 2
            hours of manual scanning into a Focus List in seconds.
          </motion.p>
        </motion.div>

        {/* CTAs */}
        <motion.div
          className="mt-6 sm:mt-10 flex flex-col items-center gap-3 sm:gap-4 w-full sm:w-auto px-4 sm:px-0 sm:flex-row"
          variants={staggerGroup}
        >
          {/* Get Started → /login */}
          <motion.div variants={fadeUp} className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto rounded-full bg-white px-8 sm:px-10 py-5 text-base font-semibold text-black shadow-2xl hover:bg-white/90"
              asChild
            >
              <Link to="/login">Get Started</Link>
            </Button>
          </motion.div>

          {/* Run Demo Scan → /demo */}
          <motion.div variants={fadeUp} className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto rounded-full border-white/40 bg-black/40 px-8 sm:px-10 py-5 text-base text-white backdrop-blur hover:border-green-500/60 hover:bg-green-500/10"
              asChild
            >
              <Link to="/demo">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="mr-2 h-4 w-4"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                Run Demo Scan
              </Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Trust indicators with avatars */}
        <motion.div
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:gap-6"
          variants={fadeUp}
        >
          <div className="flex -space-x-3">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&q=80"
              alt="Trader"
              className="h-10 w-10 rounded-full border-2 border-white/20 bg-gray-800 object-cover"
            />
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&q=80"
              alt="Trader"
              className="h-10 w-10 rounded-full border-2 border-white/20 bg-gray-800 object-cover"
            />
            <img
              src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&q=80"
              alt="Trader"
              className="h-10 w-10 rounded-full border-2 border-white/20 bg-gray-800 object-cover"
            />
            <img
              src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&q=80"
              alt="Trader"
              className="h-10 w-10 rounded-full border-2 border-white/20 bg-gray-800 object-cover"
            />
          </div>
          <p className="text-sm text-white/70">
            Join <span className="font-semibold text-white">2,400+ traders</span> finding breakouts daily
          </p>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          className="mt-10 sm:mt-16 grid w-full max-w-4xl grid-cols-3 gap-3 sm:gap-6 rounded-2xl border border-white/10 bg-black/40 p-4 sm:p-8 backdrop-blur-md mx-4"
          variants={staggerGroup}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
        >
          <motion.div className="text-center" variants={fadeUp}>
            <p className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-white">98%</p>
            <p className="mt-1 sm:mt-2 text-[10px] sm:text-xs uppercase tracking-wider text-gray-500">Accuracy Rate</p>
          </motion.div>
          <motion.div className="text-center border-x border-white/10" variants={fadeUp}>
            <p className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-white">2min</p>
            <p className="mt-1 sm:mt-2 text-[10px] sm:text-xs uppercase tracking-wider text-gray-500">Avg Scan Time</p>
          </motion.div>
          <motion.div className="text-center" variants={fadeUp}>
            <p className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-white">150+</p>
            <p className="mt-1 sm:mt-2 text-[10px] sm:text-xs uppercase tracking-wider text-gray-500">Daily Scans</p>
          </motion.div>
        </motion.div>

        {/* Focus List preview card */}
        <motion.div
          className="mt-12 sm:mt-20 w-full max-w-5xl overflow-hidden rounded-2xl sm:rounded-3xl border border-white/15 bg-black/60 shadow-2xl backdrop-blur-md mx-4"
          variants={fadeUp}
        >
          <div className="border-b border-white/10 bg-black/40 px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex gap-1 sm:gap-1.5">
                  <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-gray-600" />
                  <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-gray-500" />
                  <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-green-500" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-white">
                  Tonight's Focus List
                </span>
              </div>
              <span className="text-[10px] sm:text-xs text-gray-500">
                Live · 17:03 ET
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-8">
            <motion.div
              className="grid gap-4 sm:gap-6 sm:grid-cols-3"
              variants={staggerGroup}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
            >
              <motion.div
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-black/70 to-black/40 p-6 transition-all hover:border-green-500/50 hover:shadow-xl hover:shadow-green-500/10"
                variants={fadeUp}
                whileHover={{ scale: 1.02, y: -4 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                  Symbol
                </p>
                <p className="relative mt-3 font-serif text-3xl font-bold text-white">
                  NVDA
                </p>
                <p className="relative mt-3 text-sm leading-relaxed text-gray-400">
                  Watch for breakout above{' '}
                  <span className="font-semibold text-green-500">$183.40</span>
                </p>
              </motion.div>

              <motion.div
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-black/70 to-black/40 p-6 transition-all hover:border-white/30 hover:shadow-xl hover:shadow-white/10"
                variants={fadeUp}
                whileHover={{ scale: 1.02, y: -4 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                  Setup Quality
                </p>
                <p className="relative mt-3 font-serif text-3xl font-bold text-white">
                  92 <span className="text-xl text-gray-400">A+</span>
                </p>
                <p className="relative mt-3 text-sm leading-relaxed text-gray-400">
                  8 EMA trend · volume expansion · clean structure
                </p>
              </motion.div>

              <motion.div
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-black/70 to-black/40 p-6 transition-all hover:border-green-500/50 hover:shadow-xl hover:shadow-green-500/10"
                variants={fadeUp}
                whileHover={{ scale: 1.02, y: -4 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                  Scan Time
                </p>
                <p className="relative mt-3 font-serif text-3xl font-bold text-white">
                  17:03
                </p>
                <p className="relative mt-3 text-sm leading-relaxed text-gray-400">
                  Added to Premium Focus List for tomorrow's open.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Testimonials / Reviews Section */}
        <motion.div
          className="mt-24 w-full max-w-6xl"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="mb-12 text-center">
            <motion.p
              className="text-xs uppercase tracking-[0.2em] text-gray-500"
              variants={fadeUp}
            >
              Trusted by Professionals
            </motion.p>
            <motion.h2
              className="mt-3 font-serif text-3xl font-semibold text-white sm:text-4xl"
              variants={fadeUp}
            >
              What traders are saying
            </motion.h2>
          </div>

          <motion.div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            variants={staggerGroup}
          >
            {[
              {
                name: "Michael Chen",
                role: "Day Trader",
                avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&q=80",
                review: "This scanner cut my research time from 2 hours to 10 minutes. The AI quality scores are incredibly accurate.",
                rating: 5
              },
              {
                name: "Sarah Williams",
                role: "Swing Trader",
                avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&q=80",
                review: "Game changer for finding 8 EMA setups. The focus lists are exactly what I need each morning.",
                rating: 5
              },
              {
                name: "Alex Rodriguez",
                role: "Professional Trader",
                avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&q=80",
                review: "Best breakout scanner I've used. The custom filters let me dial in my exact strategy perfectly.",
                rating: 5
              }
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 to-black/40 p-6 backdrop-blur-sm transition-all hover:border-white/30"
                variants={fadeUp}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-green-500/10 to-white/5 blur-2xl transition-all group-hover:scale-150" />
                
                <div className="relative">
                  <div className="flex items-center gap-4">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="h-12 w-12 rounded-full border-2 border-white/20 bg-gray-800 object-cover"
                    />
                    <div>
                      <p className="font-semibold text-white">{testimonial.name}</p>
                      <p className="text-xs text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, j) => (
                      <svg
                        key={j}
                        className="h-4 w-4 text-green-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-gray-400">
                    "{testimonial.review}"
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}
