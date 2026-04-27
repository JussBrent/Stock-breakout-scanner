import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { getTradeOutcomes, getAIQueryLog, type TradeOutcome, type AIQueryLog } from "@/lib/api"
import { BarChart3, TrendingUp, Search, DollarSign, LineChart, RefreshCw, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

export default function AnalyticsPage() {
  const [trades, setTrades] = useState<TradeOutcome[]>([])
  const [queries, setQueries] = useState<AIQueryLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [tradesData, queriesData] = await Promise.all([
        getTradeOutcomes(50),
        getAIQueryLog(50),
      ])
      setTrades(tradesData.outcomes || [])
      setQueries(queriesData.queries || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const closedTrades = trades.filter((t) => t.outcome && t.outcome !== "open")
  const winTrades = trades.filter((t) => t.outcome === "win")
  const totalPnl = trades
    .filter((t) => t.gain_pct != null)
    .reduce((sum, t) => sum + (t.gain_pct || 0), 0)
  const winRate = closedTrades.length > 0 ? (winTrades.length / closedTrades.length) * 100 : 0

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "stock_analysis": return "bg-blue-500/20 text-blue-400 border-blue-500/50"
      case "pattern": return "bg-purple-500/20 text-purple-400 border-purple-500/50"
      case "comparison": return "bg-cyan-500/20 text-cyan-400 border-cyan-500/50"
      case "risk_management": return "bg-orange-500/20 text-orange-400 border-orange-500/50"
      default: return "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
    }
  }

  const getOutcomeColor = (outcome?: string) => {
    switch (outcome) {
      case "win": return "bg-emerald-500/20 text-emerald-400"
      case "loss": return "bg-red-500/20 text-red-400"
      case "breakeven": return "bg-yellow-500/20 text-yellow-400"
      default: return "bg-blue-500/20 text-blue-400"
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <Sidebar />

      <div className="ml-[var(--sidebar-w,60px)] transition-[margin-left] duration-300 ease-in-out">
        <header className="fixed top-0 left-[var(--sidebar-w,60px)] transition-[left] duration-300 ease-in-out right-0 z-50 border-b border-white/5 bg-linear-to-r from-neutral-950 via-neutral-900 to-neutral-950 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-8">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-linear-to-br from-orange-500/20 to-amber-500/20 ring-1 ring-white/10">
                <LineChart className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white tracking-tight">Analytics Dashboard</h1>
                <p className="text-xs text-neutral-400 font-light">Track trades, performance, and AI insights usage</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
              <button
                onClick={loadData}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 border border-white/10 transition-colors"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                Refresh
              </button>
              <Badge className="bg-linear-to-r from-orange-500/20 to-amber-500/20 text-orange-400 border border-orange-500/30 px-3 py-1.5 h-fit rounded-lg font-medium">
                <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                Performance
              </Badge>
            </motion.div>
          </div>
        </header>

        <main className="pt-24 p-8 space-y-6">
          {error && (
            <Card className="bg-red-500/10 border-red-500/30 p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </Card>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="h-8 w-8 text-orange-400 animate-spin mb-4" />
              <p className="text-white/50">Loading analytics...</p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-4 gap-4">
                <Card className="bg-white/2 border-white/10 shadow-xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-white/60">Total Trades</p>
                    <TrendingUp className="h-4 w-4 text-blue-400" />
                  </div>
                  <p className="text-3xl font-bold text-white">{trades.length}</p>
                  <p className="text-xs text-white/40 mt-2">{closedTrades.length} closed, {trades.filter(t => t.outcome === "open").length} open</p>
                </Card>

                <Card className="bg-white/2 border-white/10 shadow-xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-white/60">Total Gain %</p>
                    <DollarSign className="h-4 w-4 text-emerald-400" />
                  </div>
                  <p className={cn("text-3xl font-bold", totalPnl >= 0 ? "text-emerald-400" : "text-red-400")}>
                    {totalPnl >= 0 ? "+" : ""}{totalPnl.toFixed(1)}%
                  </p>
                  <p className="text-xs text-white/40 mt-2">Sum across closed trades</p>
                </Card>

                <Card className="bg-white/2 border-white/10 shadow-xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-white/60">AI Queries</p>
                    <Search className="h-4 w-4 text-purple-400" />
                  </div>
                  <p className="text-3xl font-bold text-white">{queries.length}</p>
                  <p className="text-xs text-white/40 mt-2">Advice requests to Sean</p>
                </Card>

                <Card className="bg-white/2 border-white/10 shadow-xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-white/60">Win Rate</p>
                    <TrendingUp className="h-4 w-4 text-cyan-400" />
                  </div>
                  <p className="text-3xl font-bold text-white">{winRate.toFixed(0)}%</p>
                  <p className="text-xs text-white/40 mt-2">{winTrades.length} wins / {closedTrades.length} closed</p>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 gap-6">
                {/* Trade History */}
                <div>
                  <h2 className="text-lg font-semibold text-white mb-4">Trade History</h2>
                  {trades.length === 0 ? (
                    <Card className="bg-white/2 border-white/10 p-8 text-center">
                      <p className="text-white/40">No trades logged yet</p>
                      <p className="text-xs text-white/25 mt-1">Log trades from the Portfolio page to see them here.</p>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {trades.map((trade) => (
                        <Card key={trade.id} className="bg-white/2 border-white/10 shadow-xl p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-bold text-white">{trade.symbol}</span>
                                <Badge className={getOutcomeColor(trade.outcome)}>
                                  {trade.outcome === "open" && <span className="inline-block w-2 h-2 rounded-full bg-current mr-1" />}
                                  {trade.outcome ? trade.outcome.charAt(0).toUpperCase() + trade.outcome.slice(1) : "Open"}
                                </Badge>
                                {trade.setup_type && (
                                  <Badge className="bg-white/5 text-white/40 text-[10px]">{trade.setup_type}</Badge>
                                )}
                              </div>
                              <div className="flex gap-4 text-xs text-white/50">
                                {trade.entry_price && <span>Entry: ${trade.entry_price.toFixed(2)}</span>}
                                {trade.exit_price && <span>Exit: ${trade.exit_price.toFixed(2)}</span>}
                                {trade.breakout_score != null && <span>Score: {trade.breakout_score}</span>}
                              </div>
                            </div>
                            <div className="text-right">
                              {trade.gain_pct != null && (
                                <p className={cn("text-sm font-bold", trade.gain_pct >= 0 ? "text-emerald-400" : "text-red-400")}>
                                  {trade.gain_pct >= 0 ? "+" : ""}{trade.gain_pct.toFixed(1)}%
                                </p>
                              )}
                              {trade.traded_at && (
                                <p className="text-xs text-white/40 mt-1">
                                  {new Date(trade.traded_at).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* AI Query History */}
                <div>
                  <h2 className="text-lg font-semibold text-white mb-4">Recent AI Queries</h2>
                  {queries.length === 0 ? (
                    <Card className="bg-white/2 border-white/10 p-8 text-center">
                      <p className="text-white/40">No queries yet</p>
                      <p className="text-xs text-white/25 mt-1">Queries to Sean will appear here after your first chat.</p>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {queries.map((q) => (
                        <Card key={q.id} className="bg-white/2 border-white/10 shadow-xl p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={getCategoryColor(q.category)}>
                                  {q.category.replace("_", " ").charAt(0).toUpperCase() + q.category.replace("_", " ").slice(1)}
                                </Badge>
                              </div>
                              <p className="text-sm text-white/80 line-clamp-2">{q.query_text}</p>
                            </div>
                            <p className="text-xs text-white/40 whitespace-nowrap shrink-0">
                              {new Date(q.queried_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Query Breakdown */}
              {queries.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <Card className="bg-white/2 border-white/10 shadow-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-6">AI Query Breakdown</h3>
                    <div className="grid grid-cols-5 gap-4">
                      {[
                        { category: "Stock Analysis", key: "stock_analysis", color: "bg-blue-500/20 text-blue-400" },
                        { category: "Pattern Analysis", key: "pattern", color: "bg-purple-500/20 text-purple-400" },
                        { category: "Comparisons", key: "comparison", color: "bg-cyan-500/20 text-cyan-400" },
                        { category: "Risk Management", key: "risk_management", color: "bg-orange-500/20 text-orange-400" },
                        { category: "General", key: "general", color: "bg-emerald-500/20 text-emerald-400" },
                      ].map((item) => {
                        const count = queries.filter((q) => q.category === item.key).length
                        return (
                          <div key={item.key} className={`rounded-lg p-4 ${item.color}`}>
                            <p className="text-xs font-medium opacity-75 mb-2">{item.category}</p>
                            <p className="text-2xl font-bold">{count}</p>
                            <p className="text-xs opacity-60 mt-1">
                              {queries.length > 0 ? ((count / queries.length) * 100).toFixed(0) : 0}%
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </Card>
                </motion.div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
