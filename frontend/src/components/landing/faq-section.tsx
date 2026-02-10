"use client"

import { Component as RadialOrbit } from "@/components/ui/radial-orbit"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const faqs = [
  {
    question: "How does the AI strength scoring work?",
    answer:
      "Our AI analyzes multiple technical factors including price action, volume patterns, moving averages, and breakout quality to generate a 0-100 strength score. Higher scores indicate setups that more closely match your coach's winning patterns.",
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

const orbitItems = [
  { id: 1, name: "Chart 1", src: "/pfp1.jpg" },
  { id: 2, name: "Chart 2", src: "/pfp2.jpg" },
  { id: 3, name: "Chart 3", src: "/pfp3.jpg" },
  { id: 4, name: "Chart 4", src: "/pfp4.jpg" },
  { id: 5, name: "Chart 5", src: "/pfp5.jpg" },
  { id: 6, name: "Chart 6", src: "/pfp6.jpg" },
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="relative bg-black py-24 lg:py-32">
      {/* Stock market simulation background */}
      <div className="absolute inset-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-radial from-neutral-900/40 via-black to-black" />
        
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -right-1/4 w-[600px] h-[600px] bg-gradient-to-bl from-emerald-900/20 via-neutral-900/10 to-transparent rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-neutral-800/20 via-neutral-900/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        {/* Matrix of changing stock numbers */}
        <div className="absolute inset-0 overflow-hidden opacity-20 font-mono text-xs">
          {/* Column 1 */}
          <div className="absolute left-[10%] top-0 flex flex-col gap-4">
            <div className="text-emerald-400 animate-pulse" style={{ animationDuration: '2s' }}>+2.45%</div>
            <div className="text-red-400 animate-pulse" style={{ animationDuration: '2.3s', animationDelay: '0.2s' }}>-1.23%</div>
            <div className="text-emerald-400 animate-pulse" style={{ animationDuration: '1.8s', animationDelay: '0.4s' }}>+0.89%</div>
            <div className="text-emerald-400 animate-pulse" style={{ animationDuration: '2.1s', animationDelay: '0.6s' }}>+3.12%</div>
            <div className="text-red-400 animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '0.8s' }}>-0.56%</div>
          </div>
          
          {/* Column 2 */}
          <div className="absolute left-[30%] top-0 flex flex-col gap-4">
            <div className="text-neutral-400 animate-pulse" style={{ animationDuration: '2.2s' }}>$124.50</div>
            <div className="text-emerald-400 animate-pulse" style={{ animationDuration: '1.9s', animationDelay: '0.3s' }}>+1.67%</div>
            <div className="text-neutral-400 animate-pulse" style={{ animationDuration: '2.4s', animationDelay: '0.5s' }}>$89.23</div>
            <div className="text-red-400 animate-pulse" style={{ animationDuration: '2s', animationDelay: '0.7s' }}>-2.34%</div>
            <div className="text-emerald-400 animate-pulse" style={{ animationDuration: '2.3s', animationDelay: '0.9s' }}>+4.56%</div>
          </div>
          
          {/* Column 3 */}
          <div className="absolute left-[50%] top-0 flex flex-col gap-4">
            <div className="text-red-400 animate-pulse" style={{ animationDuration: '2.1s' }}>-0.91%</div>
            <div className="text-neutral-400 animate-pulse" style={{ animationDuration: '2.3s', animationDelay: '0.2s' }}>$456.78</div>
            <div className="text-emerald-400 animate-pulse" style={{ animationDuration: '1.8s', animationDelay: '0.4s' }}>+2.34%</div>
            <div className="text-neutral-400 animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '0.6s' }}>$234.12</div>
            <div className="text-emerald-400 animate-pulse" style={{ animationDuration: '2s', animationDelay: '0.8s' }}>+1.45%</div>
          </div>
          
          {/* Column 4 */}
          <div className="absolute left-[70%] top-0 flex flex-col gap-4">
            <div className="text-emerald-400 animate-pulse" style={{ animationDuration: '2.4s' }}>+3.67%</div>
            <div className="text-red-400 animate-pulse" style={{ animationDuration: '2.1s', animationDelay: '0.3s' }}>-1.89%</div>
            <div className="text-neutral-400 animate-pulse" style={{ animationDuration: '2s', animationDelay: '0.5s' }}>$678.90</div>
            <div className="text-emerald-400 animate-pulse" style={{ animationDuration: '2.2s', animationDelay: '0.7s' }}>+0.78%</div>
            <div className="text-red-400 animate-pulse" style={{ animationDuration: '2.3s', animationDelay: '0.9s' }}>-2.12%</div>
          </div>
          
          {/* Column 5 */}
          <div className="absolute left-[90%] top-0 flex flex-col gap-4">
            <div className="text-neutral-400 animate-pulse" style={{ animationDuration: '2s' }}>$345.67</div>
            <div className="text-emerald-400 animate-pulse" style={{ animationDuration: '2.2s', animationDelay: '0.2s' }}>+2.90%</div>
            <div className="text-red-400 animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '0.4s' }}>-0.45%</div>
            <div className="text-emerald-400 animate-pulse" style={{ animationDuration: '1.9s', animationDelay: '0.6s' }}>+1.23%</div>
            <div className="text-neutral-400 animate-pulse" style={{ animationDuration: '2.1s', animationDelay: '0.8s' }}>$567.89</div>
          </div>
        </div>
        
        {/* Floating stock tickers */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute top-[10%] text-emerald-400/30 font-mono text-sm font-bold"
            style={{ animation: 'slideRight 12s linear infinite' }}
          >
            NVDA +5.2% | TSLA +3.4% | AAPL +2.1% | MSFT +1.8% | NET +4.5%
          </div>
          <div 
            className="absolute top-[25%] text-neutral-400/30 font-mono text-sm font-bold"
            style={{ animation: 'slideLeft 16s linear infinite' }}
          >
            UBER +2.8% | ROKU +3.6% | SNAP +1.9% | SQ +4.2% | ABNB +2.3%
          </div>
          <div 
            className="absolute top-[40%] text-emerald-400/30 font-mono text-sm font-bold"
            style={{ animation: 'slideRight 14s linear infinite' }}
          >
            AMD +4.3% | SHOP +2.7% | PLTR +6.1% | COIN +3.9% | RBLX +5.7%
          </div>
          <div 
            className="absolute top-[55%] text-neutral-400/30 font-mono text-sm font-bold"
            style={{ animation: 'slideLeft 18s linear infinite' }}
          >
            CRWD +3.5% | DDOG +4.8% | ZS +2.9% | PANW +3.1% | FTNT +2.6%
          </div>
          <div 
            className="absolute top-[70%] text-emerald-400/30 font-mono text-sm font-bold"
            style={{ animation: 'slideRight 20s linear infinite' }}
          >
            META +1.9% | GOOGL +2.5% | AMZN +3.2% | SQ +4.6% | PYPL +1.7%
          </div>
          <div 
            className="absolute top-[85%] text-neutral-400/30 font-mono text-sm font-bold"
            style={{ animation: 'slideLeft 15s linear infinite' }}
          >
            DIS +2.4% | NFLX +3.8% | SPOT +4.1% | TTD +5.3% | PINS +2.8%
          </div>
        </div>
        
        {/* Subtle grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:80px_80px]" />
        
        {/* Add custom keyframes */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes slideRight {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100vw);
            }
          }
          
          @keyframes slideLeft {
            0% {
              transform: translateX(100vw);
            }
            100% {
              transform: translateX(-100%);
            }
          }
        `}} />
      </div>
      
      <div className="mx-auto max-w-7xl px-6 sm:px-8 relative z-10">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-24">
          {/* Left: Radial Orbit */}
          <div className="flex items-center justify-center">
            <div className="relative">
              <RadialOrbit orbitItems={orbitItems} stageSize={400} imageSize={80} />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="text-5xl font-bold text-white mb-2">2,000+</div>
                  <div className="text-sm text-gray-400">Stocks Scanned</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: FAQ List */}
          <div>
            <div className="mb-12">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-emerald-400">
                Frequently Asked Questions
              </p>
              <h2 className="font-serif text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
                Everything you need to know
              </h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm overflow-hidden transition-colors hover:border-emerald-500/30"
                >
                  <button
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    className="flex w-full items-center justify-between gap-4 p-6 text-left"
                  >
                    <span className="font-semibold text-white text-lg">{faq.question}</span>
                    <motion.svg
                      animate={{ rotate: openIndex === index ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="h-5 w-5 shrink-0 text-emerald-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </motion.svg>
                  </button>
                  <AnimatePresence initial={false}>
                    {openIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="px-6 pb-6 text-gray-400 leading-relaxed">{faq.answer}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
