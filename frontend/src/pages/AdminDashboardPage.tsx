import { useEffect, useState, useCallback, useRef } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import {
  Wallet, DollarSign, TrendingUp, TrendingDown, Link2,
  RefreshCw, ExternalLink, ArrowUpRight, ArrowDownRight,
  Target, Brain, Activity,
} from "lucide-react"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { TradingViewWidget } from "@/components/dashboard/TradingViewWidget"
import {
  snaptradeGetStatus,
  snaptradeRegister,
  snaptradeGetConnectUrl,
  snaptradeGetHoldings,
  snaptradeGetBalances,
  type SnapTradeAccount,
  type SnapTradeHolding,
} from "@/lib/api"
import { cn } from "@/lib/utils"

type ConnectionState = "loading" | "unregistered" | "no_accounts" | "connected"

export default function AdminDashboardPage() {
  const [connectionState, setConnectionState] = useState<ConnectionState>("loading")
  const [accounts, setAccounts] = useState<SnapTradeAccount[]>([])
  const [holdings, setHoldings] = useState<Array<{ account: SnapTradeAccount; holdings: SnapTradeHolding[] }>>([])
  const [balances, setBalances] = useState<Record<string, { cash: number; buying_power: number }>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chartSymbol, setChartSymbol] = useState("SPY")
  const symbolDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const switchChartSymbol = useCallback((sym: string) => {
    if (symbolDebounce.current) clearTimeout(symbolDebounce.current)
    symbolDebounce.current = setTimeout(() => setChartSymbol(sym), 150)
  }, [])

  const checkStatus = useCallback(async () => {
    try {
      const status = await snaptradeGetStatus()
      if (!status.registered) {
        setConnectionState("unregistered")
      } else if (status.accounts_linked === 0) {
        setConnectionState("no_accounts")
      } else {
        setConnectionState("connected")
        setAccounts(status.accounts)
      }
    } catch {
      setConnectionState("unregistered")
    }
  }, [])

  const loadData = useCallback(async () => {
    if (connectionState !== "connected") return
    setLoading(true)
    try {
      const holdingsData = await snaptradeGetHoldings()
      setHoldings(holdingsData.holdings || [])

      const balanceMap: Record<string, { cash: number; buying_power: number }> = {}
      for (const acct of accounts) {
        try {
          const bal = await snaptradeGetBalances(acct.id)
          if (bal.balances && bal.balances.length > 0) {
            balanceMap[acct.id] = {
              cash: bal.balances[0]?.cash || 0,
              buying_power: bal.balances[0]?.buying_power || 0,
            }
          }
        } catch { /* skip */ }
      }
      setBalances(balanceMap)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load portfolio data")
    } finally {
      setLoading(false)
    }
  }, [connectionState, accounts])

  useEffect(() => { checkStatus() }, [checkStatus])
  useEffect(() => { if (connectionState === "connected") loadData() }, [connectionState, loadData])

  const handleRegister = async () => {
    setLoading(true)
    try {
      await snaptradeRegister()
      setConnectionState("no_accounts")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    setLoading(true)
    try {
      const { redirect_url } = await snaptradeGetConnectUrl()
      window.open(redirect_url, "_blank", "width=800,height=700")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to open connect URL")
    } finally {
      setLoading(false)
    }
  }

  const allPositions = holdings.flatMap((h) => {
    const list = Array.isArray(h.holdings) ? h.holdings : []
    return list.map((pos) => ({
      ...pos,
      accountName: h.account?.name || h.account?.institution_name || "Account",
    }))
  })

  const totalValue = allPositions.reduce((sum, p) => sum + (p.units || 0) * (p.price || 0), 0)
  const totalPnl = allPositions.reduce((sum, p) => sum + (p.open_pnl || 0), 0)
  const totalCash = Object.values(balances).reduce((sum, b) => sum + (b.cash || 0), 0)

  return (
    <div className="min-h-screen bg-black">
      <Sidebar />

      <div className="ml-[var(--sidebar-w,60px)] transition-[margin-left] duration-300 ease-in-out">
        <header className="fixed top-0 left-[var(--sidebar-w,60px)] transition-[left] duration-300 ease-in-out right-0 z-50 border-b border-white/5 bg-linear-to-r from-neutral-950 via-neutral-900 to-neutral-950 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-8">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-linear-to-br from-emerald-500/20 to-teal-500/20 ring-1 ring-white/10">
                <Wallet className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white tracking-tight">Dashboard</h1>
                <p className="text-xs text-neutral-400 font-light">Portfolio overview & quick access</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
              {connectionState === "connected" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadData}
                  disabled={loading}
                  className="border-white/10 text-white/70 hover:text-white hover:bg-white/5"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} />
                  Refresh
                </Button>
              )}
              <Badge className="bg-linear-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 h-fit rounded-lg font-medium">
                <Wallet className="h-3.5 w-3.5 mr-1.5" />
                {accounts.length} {accounts.length === 1 ? "Account" : "Accounts"}
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

          {/* Onboarding */}
          {(connectionState === "loading" || connectionState === "unregistered" || connectionState === "no_accounts") && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="bg-white/2 border-white/10 shadow-xl p-12 text-center">
                {connectionState === "loading" && (
                  <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="h-8 w-8 text-white/40 animate-spin" />
                    <p className="text-white/60">Checking brokerage connection...</p>
                  </div>
                )}
                {connectionState === "unregistered" && (
                  <div className="flex flex-col items-center gap-6 max-w-md mx-auto">
                    <div className="p-4 rounded-2xl bg-linear-to-br from-emerald-500/20 to-teal-500/20 ring-1 ring-white/10">
                      <Wallet className="h-10 w-10 text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white mb-2">Connect Your Brokerage</h2>
                      <p className="text-white/50 text-sm">
                        Link your broker to view portfolio, track positions, and place trades from one place.
                      </p>
                    </div>
                    <Button onClick={handleRegister} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8">
                      {loading ? "Setting up..." : "Get Started"}
                    </Button>
                  </div>
                )}
                {connectionState === "no_accounts" && (
                  <div className="flex flex-col items-center gap-6 max-w-md mx-auto">
                    <div className="p-4 rounded-2xl bg-linear-to-br from-blue-500/20 to-cyan-500/20 ring-1 ring-white/10">
                      <Link2 className="h-10 w-10 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white mb-2">Link a Brokerage Account</h2>
                      <p className="text-white/50 text-sm">
                        Connect Robinhood, TD Ameritrade, Interactive Brokers, and 15+ more.
                      </p>
                    </div>
                    <Button onClick={handleConnect} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-8">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {loading ? "Opening..." : "Connect Brokerage"}
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          )}

          {/* Connected — Portfolio Summary */}
          {connectionState === "connected" && (
            <>
              {/* Summary Cards */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-4 gap-4">
                <Card className="bg-white/2 border-white/10 shadow-xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-white/60">Portfolio Value</p>
                    <DollarSign className="h-4 w-4 text-emerald-400" />
                  </div>
                  <p className="text-3xl font-bold text-white">
                    ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-white/40 mt-2">{allPositions.length} open positions</p>
                </Card>

                <Card className="bg-white/2 border-white/10 shadow-xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-white/60">Open P&L</p>
                    {totalPnl >= 0
                      ? <TrendingUp className="h-4 w-4 text-emerald-400" />
                      : <TrendingDown className="h-4 w-4 text-red-400" />}
                  </div>
                  <p className={cn("text-3xl font-bold", totalPnl >= 0 ? "text-emerald-400" : "text-red-400")}>
                    {totalPnl >= 0 ? "+" : ""}${totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-white/40 mt-2">Unrealized gains/losses</p>
                </Card>

                <Card className="bg-white/2 border-white/10 shadow-xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-white/60">Cash Available</p>
                    <DollarSign className="h-4 w-4 text-blue-400" />
                  </div>
                  <p className="text-3xl font-bold text-white">
                    ${totalCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-white/40 mt-2">Across all accounts</p>
                </Card>

                <Card className="bg-white/2 border-white/10 shadow-xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-white/60">Linked Accounts</p>
                    <Link2 className="h-4 w-4 text-purple-400" />
                  </div>
                  <p className="text-3xl font-bold text-white">{accounts.length}</p>
                  <p className="text-xs text-white/40 mt-2">
                    {accounts.map((a) => a.institution_name || a.name).filter(Boolean).join(", ") || "Brokerage accounts"}
                  </p>
                </Card>
              </motion.div>

              {/* Positions Table */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">Open Positions</h2>
                  <Link to="/portfolio">
                    <Button variant="outline" size="sm" className="border-white/10 text-white/60 hover:text-white hover:bg-white/5">
                      View Full Portfolio
                    </Button>
                  </Link>
                </div>

                {allPositions.length === 0 ? (
                  <Card className="bg-white/2 border-white/10 shadow-xl p-8 text-center">
                    <p className="text-white/40">No open positions</p>
                  </Card>
                ) : (
                  <Card className="bg-white/2 border-white/10 shadow-xl overflow-hidden">
                    <div className="divide-y divide-white/5">
                      {allPositions.slice(0, 8).map((pos, i) => {
                        const symbolData = pos.symbol?.symbol as string | { symbol?: string } | undefined
                        const symbol = (typeof symbolData === "object" ? symbolData?.symbol : symbolData) || "—"
                        const value = (pos.units || 0) * (pos.price || 0)
                        const pnl = pos.open_pnl || 0

                        return (
                          <div key={`${symbol}-${i}`} className="flex items-center justify-between px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div>
                                <span className="font-bold text-white">{symbol}</span>
                                <p className="text-xs text-white/40 mt-0.5">{pos.units} shares @ ${pos.price?.toFixed(2)}</p>
                              </div>
                              <Badge className="bg-white/5 text-white/40 text-[10px]">{pos.accountName}</Badge>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-white">
                                ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                              <p className={cn("text-xs font-medium flex items-center justify-end gap-0.5", pnl >= 0 ? "text-emerald-400" : "text-red-400")}>
                                {pnl >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </Card>
                )}
              </motion.div>
            </>
          )}

          {/* Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card className="bg-white/2 border-white/10 shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <h2 className="text-lg font-semibold text-white">{chartSymbol} — Live Chart</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  {["SPY", "QQQ", "IWM",
                    ...Array.from(new Set(allPositions.slice(0, 5).map((p) => {
                      const s = p.symbol?.symbol
                      return (typeof s === "object" ? (s as any)?.symbol : s) as string | undefined
                    }).filter((s): s is string => Boolean(s))))
                  ].filter((s, i, arr) => arr.indexOf(s) === i).map((sym) => (
                    <button
                      key={sym}
                      onClick={() => switchChartSymbol(sym)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        chartSymbol === sym
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-white/5 text-white/50 hover:text-white hover:bg-white/10 border border-white/10"
                      }`}
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-[460px]">
                <TradingViewWidget symbol={chartSymbol} interval="D" theme="dark" height={460} />
              </div>
            </Card>
          </motion.div>

          {/* Quick Access */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid grid-cols-3 gap-4">
            <Link to="/scanner">
              <Card className="bg-white/2 border-white/10 shadow-xl p-6 hover:border-white/20 hover:bg-white/4 transition-all cursor-pointer group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-cyan-500/15 group-hover:bg-cyan-500/25 transition-colors">
                    <Target className="h-5 w-5 text-cyan-400" />
                  </div>
                  <h3 className="font-semibold text-white">Scanner</h3>
                </div>
                <p className="text-sm text-white/50">Scan for breakout setups with EMA analysis and quality scores.</p>
              </Card>
            </Link>

            <Link to="/ai-insights">
              <Card className="bg-white/2 border-white/10 shadow-xl p-6 hover:border-white/20 hover:bg-white/4 transition-all cursor-pointer group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-blue-500/15 group-hover:bg-blue-500/25 transition-colors">
                    <Brain className="h-5 w-5 text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-white">Ask Sean</h3>
                </div>
                <p className="text-sm text-white/50">Get AI-powered breakout analysis, setups, and risk management guidance.</p>
              </Card>
            </Link>

            <Link to="/focus-list">
              <Card className="bg-white/2 border-white/10 shadow-xl p-6 hover:border-white/20 hover:bg-white/4 transition-all cursor-pointer group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-pink-500/15 group-hover:bg-pink-500/25 transition-colors">
                    <Activity className="h-5 w-5 text-pink-400" />
                  </div>
                  <h3 className="font-semibold text-white">Focus List</h3>
                </div>
                <p className="text-sm text-white/50">Monitor your watchlist stocks and set price alerts.</p>
              </Card>
            </Link>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
