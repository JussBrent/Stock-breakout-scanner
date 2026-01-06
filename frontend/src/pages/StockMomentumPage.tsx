import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { mockMomentumStocks } from "@/lib/mock-data"
import { TrendingUp, TrendingDown, Zap, Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

export default function StockMomentumPage() {
  return (
    <div className="min-h-screen bg-black">
      <Sidebar />

      <div className="ml-[72px]">
        {/* Header */}
        <header className="fixed top-0 left-[72px] right-0 z-50 border-b border-white/5 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="p-2 rounded-lg bg-gradient-to-br from-teal-500/20 to-cyan-500/20 ring-1 ring-white/10">
                <Activity className="h-5 w-5 text-teal-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white tracking-tight">Stock Momentum</h1>
                <p className="text-xs text-neutral-400 font-light">
                  Real-time momentum analysis and market trends
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <Badge className="bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-teal-400 border border-teal-500/30 px-3 py-1.5 h-fit rounded-lg font-medium">
                <Zap className="h-3.5 w-3.5 mr-1.5" />
                Live Data
              </Badge>
            </motion.div>
          </div>
        </header>

        <main className="pt-24 p-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
            {mockMomentumStocks.map((stock, index) => (
              <motion.div
                key={stock.symbol}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + index * 0.05 }}
              >
                <Card className="bg-white/[0.02] border-white/10 shadow-xl p-6 hover:border-white/20 transition-all duration-200">
                <div className="flex items-center justify-between">
                  {/* Left Section - Stock Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white">{stock.symbol}</h3>
                        <p className="text-sm text-white/60">{stock.company}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          className={cn(
                            "h-fit",
                            stock.trend === "bullish"
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
                              : stock.trend === "bearish"
                                ? "bg-red-500/20 text-red-400 border-red-500/50"
                                : "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                          )}
                        >
                          {stock.trend === "bullish" && <TrendingUp className="h-3 w-3 mr-1" />}
                          {stock.trend === "bearish" && <TrendingDown className="h-3 w-3 mr-1" />}
                          {stock.trend.charAt(0).toUpperCase() + stock.trend.slice(1)}
                        </Badge>

                        <Badge
                          className={cn(
                            stock.changePercent >= 0
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
                              : "bg-red-500/20 text-red-400 border-red-500/50"
                          )}
                        >
                          {stock.changePercent >= 0 ? "+" : ""}
                          {stock.changePercent.toFixed(2)}%
                        </Badge>
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-5 gap-4">
                      <div>
                        <p className="text-xs text-white/50 mb-1">Price</p>
                        <p className="text-lg font-bold text-white">${stock.price.toFixed(2)}</p>
                      </div>

                      <div>
                        <p className="text-xs text-white/50 mb-1">Volume</p>
                        <p className="text-lg font-bold text-white">{stock.volume}</p>
                      </div>

                      <div>
                        <p className="text-xs text-white/50 mb-1">Momentum</p>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-emerald-400"
                              style={{ width: `${stock.momentum}%` }}
                            />
                          </div>
                          <p className="text-lg font-bold text-white w-8">{stock.momentum}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-white/50 mb-1">Breakout Strength</p>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-400 to-blue-400"
                              style={{ width: `${stock.breakoutStrength}%` }}
                            />
                          </div>
                          <p className="text-lg font-bold text-white w-8">{stock.breakoutStrength}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-white/50 mb-1">Efficiency</p>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-400 to-pink-400"
                              style={{ width: `${stock.efficiency}%` }}
                            />
                          </div>
                          <p className="text-lg font-bold text-white w-8">{stock.efficiency}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Section - Action Area */}
                  <div className="ml-6 pl-6 border-l border-white/10 text-right">
                    <div className="mb-4">
                      <p className="text-xs text-white/50 mb-1">Overall Score</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                        {((stock.momentum + stock.breakoutStrength + stock.efficiency) / 3).toFixed(0)}
                      </p>
                    </div>

                    <button className="px-4 py-2 bg-primary/20 text-primary border border-primary/30 rounded-lg text-sm font-medium hover:bg-primary/30 transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Momentum Legend */}
          <Card className="bg-white/[0.02] border-white/10 shadow-xl p-6 mt-8">
            <h3 className="text-lg font-semibold text-white mb-4">Understanding Momentum Metrics</h3>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-white mb-2">Momentum Score (0-100)</h4>
                <p className="text-xs text-white/60">
                  Measures the strength and sustainability of the current trend. Higher values indicate stronger upward or downward momentum.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white mb-2">Breakout Strength (0-100)</h4>
                <p className="text-xs text-white/60">
                  Indicates how convincing the breakout is. Considers volume, price action, and technical confirmation.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white mb-2">Efficiency (0-100)</h4>
                <p className="text-xs text-white/60">
                  Measures how well the stock is moving in its trend direction relative to price volatility.
                </p>
              </div>
            </div>
          </Card>
        </main>
      </div>
    </div>
  )
}
