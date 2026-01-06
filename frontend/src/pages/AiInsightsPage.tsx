import { useState } from "react"
import { motion } from "framer-motion"
import { Brain, Zap } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AiAdvice } from "@/components/dashboard/AiAdvice"
import { Sidebar } from "@/components/dashboard/Sidebar"

export default function AiInsightsPage() {
  const [selectedModel, setSelectedModel] = useState<"gpt-4" | "gpt-3.5-turbo">("gpt-4")

  return (
    <div className="min-h-screen bg-black">
      <Sidebar />

      {/* Main */}
      <div className="ml-[72px]">
        <header className="fixed top-0 left-[72px] right-0 z-40 border-b border-white/5 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 ring-1 ring-white/10">
                <Brain className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white tracking-tight">AI Stock Advisor</h1>
                <p className="text-xs text-neutral-400 font-light">
                  Ask the AI about stocks, patterns, and trading strategies
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <div>
                <p className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1.5 font-medium">
                  AI Model
                </p>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value as "gpt-4" | "gpt-3.5-turbo")}
                  className="bg-neutral-900/80 border border-white/10 text-white rounded-lg px-3.5 py-2 text-sm hover:bg-neutral-800/80 hover:border-white/20 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-medium"
                >
                  <option value="gpt-4">GPT-4 (Recommended)</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </select>
              </div>

              {selectedModel === "gpt-4" && (
                <Badge className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 border border-amber-500/30 px-3 py-1.5 h-fit rounded-lg font-medium">
                  <Zap className="h-3.5 w-3.5 mr-1.5" />
                  Premium
                </Badge>
              )}
            </motion.div>
          </div>
        </header>

        <main className="pt-24 p-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-white/[0.02] border-white/10 shadow-xl h-[600px] overflow-hidden">
              <AiAdvice />
            </Card>
          </motion.div>

          {/* Model Info Footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 gap-4 mt-6"
          >
            <Card className="bg-white/[0.02] border-white/10 shadow-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-blue-500/15">
                  <Brain className="h-4 w-4 text-blue-400" />
                </div>
                <h3 className="text-sm font-semibold text-white">GPT-4</h3>
              </div>
              <ul className="text-xs text-white/60 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> More accurate analysis
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Better pattern recognition
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Advanced risk assessment
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Premium support
                </li>
              </ul>
            </Card>

            <Card className="bg-white/[0.02] border-white/10 shadow-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-cyan-500/15">
                  <Zap className="h-4 w-4 text-cyan-400" />
                </div>
                <h3 className="text-sm font-semibold text-white">GPT-3.5 Turbo</h3>
              </div>
              <ul className="text-xs text-white/60 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Faster responses
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Lower cost
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Good for quick analysis
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Real-time suggestions
                </li>
              </ul>
            </Card>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
