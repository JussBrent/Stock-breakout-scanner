import { motion } from "framer-motion"
import { Brain, Target, TrendingUp, BarChart3, Shield } from "lucide-react"

import { Card } from "@/components/ui/card"
import { AiAdvice } from "@/components/dashboard/AiAdvice"
import { Sidebar } from "@/components/dashboard/Sidebar"

export default function AiInsightsPage() {
  return (
    <div className="min-h-screen bg-black">
      <Sidebar />

      <div className="ml-[var(--sidebar-w,60px)] transition-[margin-left] duration-300 ease-in-out">
        <header className="fixed top-0 left-[var(--sidebar-w,60px)] transition-[left] duration-300 ease-in-out right-0 z-40 border-b border-white/5 bg-linear-to-r from-neutral-950 via-neutral-900 to-neutral-950 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="p-2 rounded-lg bg-linear-to-br from-blue-500/20 to-cyan-500/20 ring-1 ring-white/10">
                <Brain className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white tracking-tight">Sean — AI Stock Advisor</h1>
                <p className="text-xs text-neutral-400 font-light">
                  Breakout analysis, technical insights, and trading strategies
                </p>
              </div>
            </motion.div>

          </div>
        </header>

        <main className="pt-24 p-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-white/2 border-white/10 shadow-xl h-[600px] overflow-hidden">
              <AiAdvice selectedModel="sean-v1" />
            </Card>
          </motion.div>

          {/* Capabilities Footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-4 gap-4 mt-6"
          >
            <Card className="bg-white/2 border-white/10 shadow-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/15">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                </div>
                <h3 className="text-sm font-semibold text-white">Breakout Analysis</h3>
              </div>
              <p className="text-xs text-white/60">
                Identifies flat-top, wedge, flag, and base patterns with quality scores.
              </p>
            </Card>

            <Card className="bg-white/2 border-white/10 shadow-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-blue-500/15">
                  <BarChart3 className="h-4 w-4 text-blue-400" />
                </div>
                <h3 className="text-sm font-semibold text-white">Technical Analysis</h3>
              </div>
              <p className="text-xs text-white/60">
                EMA trends, volume confirmation, support/resistance levels.
              </p>
            </Card>

            <Card className="bg-white/2 border-white/10 shadow-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-purple-500/15">
                  <Target className="h-4 w-4 text-purple-400" />
                </div>
                <h3 className="text-sm font-semibold text-white">Actionable Insights</h3>
              </div>
              <p className="text-xs text-white/60">
                Entry points, stop-loss levels, and risk/reward assessments.
              </p>
            </Card>

            <Card className="bg-white/2 border-white/10 shadow-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-amber-500/15">
                  <Shield className="h-4 w-4 text-amber-400" />
                </div>
                <h3 className="text-sm font-semibold text-white">Risk Management</h3>
              </div>
              <p className="text-xs text-white/60">
                Position sizing guidance and volatility-based risk assessment.
              </p>
            </Card>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
