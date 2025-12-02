'use client'

import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const dropdownData = {
    features: {
      sections: [
        {
          title: 'CORE FEATURES',
          items: [
            { label: 'Real-Time Scanning', desc: 'Monitor breakouts as they happen' },
            { label: 'AI Pattern Detection', desc: 'Machine learning identifies setups' },
            { label: 'Multi-Timeframe Analysis', desc: 'From 1-min to daily charts' },
            { label: 'Custom Alerts', desc: 'Get notified instantly' }
          ]
        },
        {
          title: 'ADVANCED TOOLS',
          items: [
            { label: 'Volume Profile', desc: 'Institutional activity tracking' },
            { label: 'Heat Maps', desc: 'Sector and market visualization' },
            { label: 'Backtesting Engine', desc: 'Test strategies on historical data' }
          ]
        }
      ]
    },
    scanning: {
      sections: [
        {
          title: 'AI CAPABILITIES',
          items: [
            { label: 'Smart Screeners', desc: 'AI-powered stock filters' },
            { label: 'Pattern Recognition', desc: 'Identify breakout patterns' },
            { label: 'Sentiment Analysis', desc: 'Market mood tracking' }
          ]
        }
      ]
    }
  }

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-500 font-(--font-inter) ${
        scrolled
          ? 'bg-black/95 backdrop-blur-xl border-b border-white/10'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8">
        
        {/* Logo */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-black">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>

          <div className="flex flex-col leading-none">
            <span className="font-serif text-base font-semibold tracking-tight text-white">
              StockBreakout
            </span>
            <span className="text-[10px] uppercase tracking-widest text-white/60">
              Scanner
            </span>
          </div>
        </motion.div>

        {/* Nav Links */}
        <nav className="hidden items-center gap-8 text-sm md:flex">

          {/* FEATURES DROPDOWN */}
          <div
            className="relative"
            onMouseEnter={() => setOpenDropdown('features')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <motion.button
              className="flex items-center gap-1 text-white/70 transition-colors hover:text-white"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Features
              <ChevronDown className="h-3.5 w-3.5" />
            </motion.button>

            <AnimatePresence>
              {openDropdown === 'features' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-0 top-full pt-4"
                >
                  <div className="rounded-2xl bg-black/95 backdrop-blur-xl border border-white/10 p-8 shadow-2xl min-w-[600px]">
                    <div className="grid grid-cols-2 gap-8">
                      {dropdownData.features.sections.map((section, sectionIdx) => (
                        <div key={section.title}>
                          <h3 className="mb-4 text-xs font-medium tracking-widest text-white/40">
                            {section.title}
                          </h3>

                          <div className="space-y-3">
                            {section.items.map((item, itemIdx) => (
                              <motion.a
                                key={item.label}
                                href="#"
                                className="block rounded-lg p-3 transition-colors hover:bg-white/5"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                  duration: 0.3,
                                  delay: (sectionIdx * section.items.length + itemIdx) * 0.05
                                }}
                              >
                                <div className="font-medium text-white">{item.label}</div>
                                <div className="text-xs text-white/50">{item.desc}</div>
                              </motion.a>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* AI SCANNING DROPDOWN */}
          <div
            className="relative"
            onMouseEnter={() => setOpenDropdown('scanning')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <motion.button
              className="flex items-center gap-1 text-white/70 transition-colors hover:text-white"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              AI Scanning
              <ChevronDown className="h-3.5 w-3.5" />
            </motion.button>

            <AnimatePresence>
              {openDropdown === 'scanning' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-0 top-full pt-4"
                >
                  <div className="rounded-2xl bg-black/95 backdrop-blur-xl border border-white/10 p-8 shadow-2xl min-w-[300px]">
                    {dropdownData.scanning.sections.map((section) => (
                      <div key={section.title}>
                        <h3 className="mb-4 text-xs font-medium tracking-widest text-white/40">
                          {section.title}
                        </h3>

                        <div className="space-y-3">
                          {section.items.map((item, idx) => (
                            <motion.a
                              key={item.label}
                              href="#"
                              className="block rounded-lg p-3 transition-colors hover:bg-white/5"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: idx * 0.05 }}
                            >
                              <div className="font-medium text-white">{item.label}</div>
                              <div className="text-xs text-white/50">{item.desc}</div>
                            </motion.a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* NORMAL LINKS */}
          <motion.button
            className="text-white/70 transition-colors hover:text-white"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Pricing
          </motion.button>

          <motion.button
            className="text-white/70 transition-colors hover:text-white"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Docs
          </motion.button>

        </nav>

        {/* AUTH BUTTONS */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* 🔥 Now routes to /login */}
          <Link
            to="/login"
            className="text-sm text-white/70 transition-colors hover:text-white"
          >
            Log in
          </Link>

          <Button
            size="sm"
            className="rounded-full px-6 font-medium shadow-lg bg-white text-black hover:bg-white/90"
          >
            Get Started
          </Button>
        </motion.div>

      </div>
    </header>
  )
}
