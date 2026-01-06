import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { mockTradeHistory, mockSearchHistory } from "@/lib/mock-data"
import { BarChart3, TrendingUp, TrendingDown, Search, DollarSign, Calendar, LineChart } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

export default function AnalyticsPage() {
  const totalTrades = mockTradeHistory.length
  const closedTrades = mockTradeHistory.filter((t) => t.status === "closed").length
  const openTrades = mockTradeHistory.filter((t) => t.status === "open").length
  const totalProfitLoss = mockTradeHistory
    .filter((t) => t.profitLoss)
    .reduce((sum, t) => sum + (t.profitLoss || 0), 0)

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "stock_analysis":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50"
      case "pattern":
        return "bg-purple-500/20 text-purple-400 border-purple-500/50"
      case "comparison":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/50"
      default:
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "closed":
        return "bg-emerald-500/20 text-emerald-400"
      case "open":
        return "bg-blue-500/20 text-blue-400"
      default:
        return "bg-yellow-500/20 text-yellow-400"
    }
  }

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
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20 ring-1 ring-white/10">
                <LineChart className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white tracking-tight">Analytics Dashboard</h1>
                <p className="text-xs text-neutral-400 font-light">
                  Track trades, performance, and AI insights usage
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <Badge className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-400 border border-orange-500/30 px-3 py-1.5 h-fit rounded-lg font-medium">
                <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                Performance
              </Badge>
            </motion.div>
          </div>
        </header>

        <main className="pt-24 p-8 space-y-6">
          {/* Summary Cards */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-4 gap-4">
            <Card className="bg-white/[0.02] border-white/10 shadow-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-white/60">Total Trades</p>
                <TrendingUp className="h-4 w-4 text-blue-400" />
              </div>
              <p className="text-3xl font-bold text-white">{totalTrades}</p>
              <p className="text-xs text-white/40 mt-2">{closedTrades} closed, {openTrades} open</p>
            </Card>

            <Card className="bg-white/[0.02] border-white/10 shadow-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-white/60">Total P&L</p>
                <DollarSign className="h-4 w-4 text-emerald-400" />
              </div>
              <p className={cn("text-3xl font-bold", totalProfitLoss >= 0 ? "text-emerald-400" : "text-red-400")}>
                {totalProfitLoss >= 0 ? "+" : ""}${totalProfitLoss.toFixed(2)}
              </p>
              <p className="text-xs text-white/40 mt-2">From closed trades</p>
            </Card>

            <Card className="bg-white/[0.02] border-white/10 shadow-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-white/60">AI Queries</p>
                <Search className="h-4 w-4 text-purple-400" />
              </div>
              <p className="text-3xl font-bold text-white">{mockSearchHistory.length}</p>
              <p className="text-xs text-white/40 mt-2">Advice requests</p>
            </Card>

            <Card className="bg-white/[0.02] border-white/10 shadow-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-white/60">Win Rate</p>
                <TrendingUp className="h-4 w-4 text-cyan-400" />
              </div>
              <p className="text-3xl font-bold text-white">
                {closedTrades > 0 ? ((closedTrades / totalTrades) * 100).toFixed(0) : 0}%
              </p>
              <p className="text-xs text-white/40 mt-2">Closed positions</p>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 gap-6">
            {/* Trade History */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Trade History</h2>
              <div className="space-y-3">
                {mockTradeHistory.map((trade) => (
                  <Card key={trade.id} className="bg-white/[0.02] border-white/10 shadow-xl p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-white">{trade.symbol}</span>
                          <Badge className={getStatusColor(trade.status)}>
                            {trade.status === "open" && <span className="inline-block w-2 h-2 rounded-full bg-current mr-1" />}
                            {trade.status.charAt(0).toUpperCase() + trade.status.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-sm text-white/60 mb-2">{trade.action}</p>
                        <div className="flex gap-4 text-xs text-white/50">
                          {trade.entry && <span>Entry: ${trade.entry.toFixed(2)}</span>}
                          {trade.exit && <span>Exit: ${trade.exit.toFixed(2)}</span>}
                        </div>
                      </div>

                      <div className="text-right">
                        {trade.profitLoss !== undefined && (
                          <p
                            className={cn(
                              "text-sm font-bold",
                              trade.profitLoss >= 0 ? "text-emerald-400" : "text-red-400"
                            )}
                          >
                            {trade.profitLoss >= 0 ? "+" : ""}${trade.profitLoss.toFixed(2)}
                          </p>
                        )}
                        <p className="text-xs text-white/40 mt-1">
                          {Math.floor((Date.now() - trade.date.getTime()) / (24 * 60 * 60 * 1000))} days ago
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* AI Search History */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Recent AI Queries</h2>
              <div className="space-y-3">
                {mockSearchHistory.map((search) => (
                  <Card key={search.id} className="bg-white/[0.02] border-white/10 shadow-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {search.symbol && <span className="font-bold text-white">{search.symbol}</span>}
                          <Badge className={getCategoryColor(search.category)}>
                            {search.category.replace("_", " ").charAt(0).toUpperCase() +
                              search.category.replace("_", " ").slice(1)}
                          </Badge>
                        </div>
                        <p className="text-sm text-white/80 line-clamp-2">{search.query}</p>
                      </div>

                      <p className="text-xs text-white/40 whitespace-nowrap flex-shrink-0">
                        {search.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Query Breakdown */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-white/[0.02] border-white/10 shadow-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6">AI Query Breakdown</h3>
            <div className="grid grid-cols-4 gap-4">
              {[
                { category: "Stock Analysis", count: mockSearchHistory.filter((s) => s.category === "stock_analysis").length, color: "bg-blue-500/20 text-blue-400" },
                { category: "Pattern Analysis", count: mockSearchHistory.filter((s) => s.category === "pattern").length, color: "bg-purple-500/20 text-purple-400" },
                { category: "Comparisons", count: mockSearchHistory.filter((s) => s.category === "comparison").length, color: "bg-cyan-500/20 text-cyan-400" },
                { category: "General", count: mockSearchHistory.filter((s) => s.category === "general").length, color: "bg-emerald-500/20 text-emerald-400" },
              ].map((item) => (
                <div key={item.category} className={`rounded-lg p-4 ${item.color}`}>
                  <p className="text-xs font-medium opacity-75 mb-2">{item.category}</p>
                  <p className="text-2xl font-bold">{item.count}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {((item.count / mockSearchHistory.length) * 100).toFixed(0)}%
                  </p>
                </div>
              ))}
            </div>
          </Card>          
          </motion.div>
        </main>
      </div>
    </div>
  )
}
