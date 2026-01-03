import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { AiAdvice } from "@/components/dashboard/AiAdvice"
import { Brain, Zap } from "lucide-react"

export default function AiInsightsPage() {
  const [selectedModel, setSelectedModel] = useState<"gpt-4" | "gpt-3.5-turbo">("gpt-4")

  return (
    <div className="min-h-screen bg-black">
      <Sidebar />

      <div className="ml-64">
        {/* Header */}
        <header className="fixed top-0 left-64 right-0 z-50 border-b border-white/10 bg-black/95 backdrop-blur-xl">
          <div className="flex h-20 items-center justify-between px-8">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-blue-500/15">
                <Brain className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  AI Stock Advisor
                </h1>
                <p className="text-sm text-white/60 mt-0.5">Ask the AI about stocks, patterns, and trading strategies</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-white/60 mb-1">AI Model</p>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value as "gpt-4" | "gpt-3.5-turbo")}
                  className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-1.5 text-sm hover:bg-white/10 transition-colors"
                >
                  <option value="gpt-4">GPT-4 (Recommended)</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </select>
              </div>

              {selectedModel === "gpt-4" && (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/50 h-fit">
                  <Zap className="h-3 w-3 mr-1.5" />
                  Premium
                </Badge>
              )}
            </div>
          </div>
        </header>

        <main className="pt-32 p-8">
          <Card className="bg-white/[0.02] border-white/10 shadow-xl h-96">
            <AiAdvice />
          </Card>

          {/* Model Info Footer */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <Card className="bg-white/[0.02] border-white/10 shadow-xl p-6">
              <h3 className="text-sm font-semibold text-white mb-3">GPT-4</h3>
              <ul className="text-xs text-white/60 space-y-2">
                <li>✓ More accurate analysis</li>
                <li>✓ Better pattern recognition</li>
                <li>✓ Advanced risk assessment</li>
                <li>✓ Premium support</li>
              </ul>
            </Card>

            <Card className="bg-white/[0.02] border-white/10 shadow-xl p-6">
              <h3 className="text-sm font-semibold text-white mb-3">GPT-3.5 Turbo</h3>
              <ul className="text-xs text-white/60 space-y-2">
                <li>✓ Faster responses</li>
                <li>✓ Lower cost</li>
                <li>✓ Good for quick analysis</li>
                <li>✓ Real-time suggestions</li>
              </ul>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
