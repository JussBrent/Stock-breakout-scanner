import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import {
  Wallet, Link2, TrendingUp, TrendingDown, DollarSign,
  RefreshCw, ExternalLink, Clock, ArrowUpRight, ArrowDownRight,
  Plus,
} from "lucide-react"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { TradeModal } from "@/components/dashboard/TradeModal"
import {
  snaptradeGetStatus,
  snaptradeRegister,
  snaptradeGetConnectUrl,
  snaptradeGetHoldings,
  snaptradeGetActivities,
  snaptradeGetBalances,
  snaptradeDisconnect,
  type SnapTradeAccount,
  type SnapTradeHolding,
  type SnapTradeActivity,
} from "@/lib/api"
import { cn } from "@/lib/utils"

type ConnectionState = "loading" | "unregistered" | "no_accounts" | "connected"

export default function PortfolioPage() {
  const [connectionState, setConnectionState] = useState<ConnectionState>("loading")
  const [accounts, setAccounts] = useState<SnapTradeAccount[]>([])
  const [holdings, setHoldings] = useState<Array<{ account: SnapTradeAccount; holdings: SnapTradeHolding[] }>>([])
  const [activities, setActivities] = useState<SnapTradeActivity[]>([])
  const [balances, setBalances] = useState<Record<string, { cash: number; buying_power: number }>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Trade modal state
  const [tradeModalOpen, setTradeModalOpen] = useState(false)
  const [tradeSymbol, setTradeSymbol] = useState("")

  const openTradeModal = (symbol = "") => {
    setTradeSymbol(symbol)
    setTradeModalOpen(true)
  }

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

  const loadPortfolioData = useCallback(async () => {
    if (connectionState !== "connected") return
    setLoading(true)
    setError(null)
    try {
      const [holdingsData, activitiesData] = await Promise.all([
        snaptradeGetHoldings(),
        snaptradeGetActivities(),
      ])
      setHoldings(holdingsData.holdings || [])
      setActivities(activitiesData.activities || [])

      // Load balances for each account
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
        } catch {
          // Skip failed balance fetches
        }
      }
      setBalances(balanceMap)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load portfolio data")
    } finally {
      setLoading(false)
    }
  }, [connectionState, accounts])

  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  useEffect(() => {
    if (connectionState === "connected") {
      loadPortfolioData()
    }
  }, [connectionState, loadPortfolioData])

  const handleRegister = async () => {
    setLoading(true)
    setError(null)
    try {
      await snaptradeRegister()
      setConnectionState("no_accounts")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm("Disconnect all brokerage accounts? This will revoke all permissions including Robinhood.")) return
    setLoading(true)
    setError(null)
    try {
      await snaptradeDisconnect()
      setConnectionState("unregistered")
      setAccounts([])
      setHoldings([])
      setActivities([])
      setBalances({})
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to disconnect")
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    setLoading(true)
    setError(null)
    try {
      const { redirect_url } = await snaptradeGetConnectUrl()
      window.open(redirect_url, "_blank", "width=800,height=700")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to get connect URL")
    } finally {
      setLoading(false)
    }
  }

  // Flatten all holdings for display
  const allPositions = holdings.flatMap((h) => {
    const positionList = Array.isArray(h.holdings) ? h.holdings : []
    return positionList.map((pos) => ({
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

      <div className="ml-[72px]">
        {/* Header */}
        <header className="fixed top-0 left-[72px] right-0 z-40 border-b border-white/5 bg-linear-to-r from-neutral-950 via-neutral-900 to-neutral-950 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="p-2 rounded-lg bg-linear-to-br from-emerald-500/20 to-teal-500/20 ring-1 ring-white/10">
                <Wallet className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white tracking-tight">Portfolio</h1>
                <p className="text-xs text-neutral-400 font-light">
                  Brokerage accounts, holdings, and trade history
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              {connectionState === "connected" && (
                <>
                  <Button
                    size="sm"
                    onClick={() => openTradeModal()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    New Order
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleConnect}
                    className="border-white/10 text-white/70 hover:text-white hover:bg-white/5"
                  >
                    <Link2 className="h-3.5 w-3.5 mr-1.5" />
                    Link Account
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadPortfolioData}
                    disabled={loading}
                    className="border-white/10 text-white/70 hover:text-white hover:bg-white/5"
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} />
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnect}
                    disabled={loading}
                    className="border-red-500/20 text-red-400/70 hover:text-red-400 hover:bg-red-500/10"
                  >
                    Disconnect
                  </Button>
                </>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="bg-red-500/10 border-red-500/30 p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </Card>
            </motion.div>
          )}

          {/* Onboarding States */}
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
                        Link your brokerage account to view your portfolio, track positions, and place trades directly from the scanner.
                      </p>
                    </div>
                    <Button
                      onClick={handleRegister}
                      disabled={loading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
                    >
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
                        Your account is set up. Now connect your broker — Robinhood, TD Ameritrade, Interactive Brokers, and 15+ more supported.
                      </p>
                    </div>
                    <Button
                      onClick={handleConnect}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {loading ? "Opening..." : "Connect Brokerage"}
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          )}

          {/* Connected State — Portfolio View */}
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
                  <p className="text-xs text-white/40 mt-2">{allPositions.length} positions</p>
                </Card>

                <Card className="bg-white/2 border-white/10 shadow-xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-white/60">Open P&L</p>
                    {totalPnl >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-400" />
                    )}
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

              {/* Holdings & Activities */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 gap-6">
                {/* Holdings */}
                <div>
                  <h2 className="text-lg font-semibold text-white mb-4">Positions</h2>
                  {allPositions.length === 0 ? (
                    <Card className="bg-white/2 border-white/10 shadow-xl p-8 text-center">
                      <p className="text-white/40">No open positions</p>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {allPositions.map((pos, i) => {
                        const symbolData = pos.symbol?.symbol as string | { symbol?: string } | undefined
                        const symbol = (typeof symbolData === "object" ? symbolData?.symbol : symbolData) || "—"
                        const value = (pos.units || 0) * (pos.price || 0)
                        const pnl = pos.open_pnl || 0

                        return (
                          <Card key={`${symbol}-${i}`} className="bg-white/2 border-white/10 shadow-xl p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold text-white">{symbol}</span>
                                  <Badge className="bg-white/5 text-white/50 text-[10px]">
                                    {pos.accountName}
                                  </Badge>
                                </div>
                                <p className="text-xs text-white/50">
                                  {pos.units} shares @ ${pos.price?.toFixed(2)}
                                </p>
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
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Recent Activity */}
                <div>
                  <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
                  {activities.length === 0 ? (
                    <Card className="bg-white/2 border-white/10 shadow-xl p-8 text-center">
                      <p className="text-white/40">No recent activity</p>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {activities.slice(0, 20).map((activity, i) => {
                        const actSymbol = activity.symbol?.symbol as string | { symbol?: string } | undefined
                        const symbol = (typeof actSymbol === "object" ? actSymbol?.symbol : actSymbol) || "—"
                        const isBuy = activity.action?.toLowerCase().includes("buy")

                        return (
                          <Card key={activity.id || i} className="bg-white/2 border-white/10 shadow-xl p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold text-white">{symbol}</span>
                                  <Badge className={cn(
                                    "text-[10px]",
                                    isBuy
                                      ? "bg-emerald-500/20 text-emerald-400"
                                      : "bg-red-500/20 text-red-400"
                                  )}>
                                    {activity.action || activity.type || "—"}
                                  </Badge>
                                </div>
                                <p className="text-xs text-white/50">
                                  {activity.units} shares @ ${activity.price?.toFixed(2)}
                                </p>
                              </div>
                              <div className="text-right">
                                {activity.amount != null && (
                                  <p className="text-sm font-medium text-white">
                                    ${Math.abs(activity.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </p>
                                )}
                                {activity.trade_date && (
                                  <p className="text-[10px] text-white/40 flex items-center justify-end gap-1 mt-1">
                                    <Clock className="h-2.5 w-2.5" />
                                    {new Date(activity.trade_date).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </main>
      </div>

      {/* Trade Modal */}
      <TradeModal
        open={tradeModalOpen}
        onClose={() => setTradeModalOpen(false)}
        symbol={tradeSymbol}
      />
    </div>
  )
}
