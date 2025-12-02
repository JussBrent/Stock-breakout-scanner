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
  { id: 1, name: "Chart 1", src: "/src/assets/pfp1.jpg" },
  { id: 2, name: "Chart 2", src: "/src/assets/pfp2.jpg" },
  { id: 3, name: "Chart 3", src: "/src/assets/pfp3.jpg" },
  { id: 4, name: "Chart 4", src: "/src/assets/pfp4.jpg" },
  { id: 5, name: "Chart 5", src: "/src/assets/pfp5.jpg" },
  { id: 6, name: "Chart 6", src: "/src/assets/pfp6.jpg" },
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="relative bg-black py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
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
