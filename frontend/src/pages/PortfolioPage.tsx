import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Wallet, Link2, TrendingUp, TrendingDown, DollarSign, RefreshCw, ExternalLink, Clock, ArrowUpRight, ArrowDownRight, Plus, FlaskConical, Zap } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { TradeModal } from "@/components/dashboard/TradeModal"
import { OptionsChain } from "@/components/dashboard/OptionsChain"
import { supabase } from "@/lib/supabase"
import { snaptradeGetStatus, snaptradeRegister, snaptradeGetConnectUrl, snaptradeGetHoldings, snaptradeGetActivities, snaptradeGetBalances, snaptradeUnlinkAccount, snaptradeListAuthorizations, type SnapTradeAccount, type SnapTradeActivity, type SnapTradeAuthorization } from "@/lib/api"
import { cn } from "@/lib/utils"

const API_URL = import.meta.env.VITE_API_URL ?? ""

async function authHeaders() {
  const { data } = await supabase.auth.getSession()
  return { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token}` }
}
async function paperFetch(path: string, opts?: RequestInit) {
  const h = await authHeaders()
  const res = await fetch(API_URL + "/api/paper" + path, { ...opts, headers: { ...h, ...(opts?.headers ?? {}) } })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

type PageTab = "live" | "paper" | "options"

export default function PortfolioPage() {
  const [tab, setTab] = useState<PageTab>("live")
  const [connectionState, setConnectionState] = useState("loading")
  const [accounts, setAccounts] = useState<SnapTradeAccount[]>([])
  const [holdings, setHoldings] = useState<any[]>([])
  const [activities, setActivities] = useState<SnapTradeActivity[]>([])
  const [balances, setBalances] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tradeModalOpen, setTradeModalOpen] = useState(false)
  const [tradeSymbol, setTradeSymbol] = useState("")
  const [paperAccount, setPaperAccount] = useState<any>(null)
  const [paperPositions, setPaperPositions] = useState<any[]>([])
  const [paperOrders, setPaperOrders] = useState<any[]>([])
  const [paperLoading, setPaperLoading] = useState(false)
  const [paperMsg, setPaperMsg] = useState<string | null>(null)
  const [paperSymbol, setPaperSymbol] = useState("AAPL")
  const [paperAction, setPaperAction] = useState<"BUY" | "SELL">("BUY")
  const [paperQty, setPaperQty] = useState(1)
  const [optionsSymbol, setOptionsSymbol] = useState("AAPL")
  const [optionsPaper, setOptionsPaper] = useState(true)
  const [authorizations, setAuthorizations] = useState<SnapTradeAuthorization[]>([])

  const checkStatus = useCallback(async () => {
    try {
      const status = await snaptradeGetStatus()
      if (!status.registered) { setConnectionState("unregistered"); return }
      if (status.accounts_linked === 0) { setConnectionState("no_accounts"); return }
      setConnectionState("connected")
      setAccounts(status.accounts)
      // Fetch authorizations so we always have the correct IDs for unlinking
      snaptradeListAuthorizations().then(setAuthorizations).catch(() => {})
    } catch { setConnectionState("unregistered") }
  }, [])

  const loadPortfolio = useCallback(async () => {
    if (connectionState !== "connected") return
    setLoading(true); setError(null)
    try {
      const [hData, aData] = await Promise.all([snaptradeGetHoldings(), snaptradeGetActivities()])
      setHoldings(hData.holdings || [])
      setActivities(aData.activities || [])
      const bMap: Record<string, any> = {}
      for (const a of accounts) {
        try {
          const b = await snaptradeGetBalances(a.id)
          if (b.balances?.length) bMap[a.id] = { cash: b.balances[0]?.cash || 0 }
        } catch {}
      }
      setBalances(bMap)
    } catch (e) { setError(e instanceof Error ? e.message : "Error") }
    finally { setLoading(false) }
  }, [connectionState, accounts])

  const loadPaper = useCallback(async () => {
    setPaperLoading(true)
    try {
      const [a, p, o] = await Promise.all([paperFetch("/account"), paperFetch("/positions"), paperFetch("/orders?limit=50")])
      setPaperAccount(a.account)
      setPaperPositions(p.positions || [])
      setPaperOrders(o.orders || [])
    } catch {}
    finally { setPaperLoading(false) }
  }, [])

  useEffect(() => { checkStatus() }, [checkStatus])
  useEffect(() => { if (connectionState === "connected") loadPortfolio() }, [connectionState, loadPortfolio])
  useEffect(() => { if (tab === "paper") loadPaper() }, [tab, loadPaper])

  const placePaperOrder = async () => {
    setPaperLoading(true); setPaperMsg(null)
    try {
      const res = await paperFetch("/order", {
        method: "POST",
        body: JSON.stringify({ symbol: paperSymbol.toUpperCase(), action: paperAction, quantity: paperQty, asset_type: "stock" })
      })
      setPaperMsg("Filled: " + paperAction + " " + paperQty + "x " + paperSymbol + " @ $" + res.fill_price?.toFixed(2))
      await loadPaper()
    } catch (e) { setPaperMsg("Error: " + (e instanceof Error ? e.message : "Failed")) }
    finally { setPaperLoading(false) }
  }

  const allPos = holdings.flatMap(h => (Array.isArray(h.holdings) ? h.holdings : []).map((p: any) => ({
    ...p, acctName: h.account?.name || h.account?.institution_name || "Account"
  })))
  const totalVal = allPos.reduce((s, p) => s + (p.units || 0) * (p.price || 0), 0)
  const totalPnl = allPos.reduce((s, p) => s + (p.open_pnl || 0), 0)
  const totalCash = Object.values(balances).reduce((s: number, b: any) => s + (b.cash || 0), 0)
  const paperPnl = paperPositions.reduce((s, p) => s + (p.unrealized_pnl || 0), 0)

  const TABS = [
    { id: "live" as PageTab, label: "Live Portfolio", color: "text-emerald-400", bg: "bg-emerald-600/20" },
    { id: "paper" as PageTab, label: "Paper Trading", color: "text-amber-400", bg: "bg-amber-600/20" },
    { id: "options" as PageTab, label: "Options Chain", color: "text-blue-400", bg: "bg-blue-600/20" },
  ]

  return (
    <div className="min-h-screen bg-black">
      <Sidebar />
      <div className="min-h-screen ml-[var(--sidebar-w,60px)] transition-[margin-left] duration-300 ease-in-out">
        <header className="fixed top-0 left-[var(--sidebar-w,60px)] right-0 z-40 border-b border-white/5 bg-neutral-950/90 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 ring-1 ring-white/10">
                <Wallet className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Portfolio</h1>
                <p className="text-xs text-neutral-400">Brokerage · Paper Trading · Options</p>
              </div>
            </div>
            <div className="flex border border-white/10 rounded-lg overflow-hidden">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={cn("px-4 py-2 text-sm font-medium transition-colors",
                    tab === t.id ? t.bg + " " + t.color : "text-white/40 hover:text-white/70 hover:bg-white/5"
                  )}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="pt-24 p-8 space-y-6">
          {error && (
            <Card className="bg-red-500/10 border-red-500/30 p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </Card>
          )}

          {tab === "live" && (
            <>
              {connectionState !== "connected" && (
                <Card className="bg-white/2 border-white/10 p-12 text-center">
                  {connectionState === "loading" && <RefreshCw className="h-8 w-8 text-white/40 animate-spin mx-auto mb-4" />}
                  {connectionState === "unregistered" && (
                    <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
                      <Wallet className="h-12 w-12 text-emerald-400" />
                      <h2 className="text-xl font-semibold text-white">Connect Your Brokerage</h2>
                      <p className="text-white/50 text-sm">Link Robinhood, TD Ameritrade, IBKR and 15+ brokerages to trade options directly from the scanner.</p>
                      <Button onClick={async () => {
                        setLoading(true)
                        try { await snaptradeRegister(); setConnectionState("no_accounts") }
                        catch (e) { setError(String(e)) }
                        finally { setLoading(false) }
                      }} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        {loading ? "Setting up…" : "Get Started"}
                      </Button>
                    </div>
                  )}
                  {connectionState === "no_accounts" && (
                    <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
                      <Link2 className="h-12 w-12 text-blue-400" />
                      <h2 className="text-xl font-semibold text-white">Link a Brokerage Account</h2>
                      <Button onClick={async () => {
                        const callbackUrl = `${window.location.origin}/snaptrade-callback`
                        const { redirect_url } = await snaptradeGetConnectUrl(callbackUrl)
                        const popup = window.open(redirect_url, "snaptrade-connect", "width=800,height=700,left=200,top=100")

                        // Primary: listen for postMessage from our /snaptrade-callback page
                        const onMessage = (e: MessageEvent) => {
                          if (e.origin !== window.location.origin) return
                          if (e.data?.type === "SNAPTRADE_CONNECTED") {
                            cleanup()
                            checkStatus()
                          }
                        }
                        window.addEventListener("message", onMessage)

                        // Fallback: detect popup close (user closed manually or SnapTrade
                        // redirected somewhere we don't control)
                        const pollInterval = setInterval(() => {
                          if (popup?.closed) { cleanup(); checkStatus() }
                        }, 800)

                        function cleanup() {
                          window.removeEventListener("message", onMessage)
                          clearInterval(pollInterval)
                        }
                      }} className="bg-blue-600 hover:bg-blue-700 text-white">
                        <ExternalLink className="h-4 w-4 mr-2" />Connect Brokerage
                      </Button>
                    </div>
                  )}
                </Card>
              )}
              {connectionState === "connected" && (
                <>
                  <div className="flex gap-3 justify-end">
                    <Button size="sm" onClick={() => setTradeModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      <Plus className="h-3.5 w-3.5 mr-1.5" />New Order
                    </Button>
                    <Button variant="outline" size="sm" onClick={loadPortfolio} disabled={loading}
                      className="border-white/10 text-white/70 hover:text-white">
                      <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} />Refresh
                    </Button>
                  </div>
                  {/* Connected Brokerages — authorizations list is the source of truth for unlink IDs */}
                  <Card className="bg-white/2 border-white/10 p-4">
                    <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Connected Brokerages</p>
                    <div className="space-y-2">
                      {(authorizations.length > 0 ? authorizations : accounts).map((item, i) => {
                        const isAuth = authorizations.length > 0
                        const authId = isAuth ? (item as SnapTradeAuthorization).id : (item as SnapTradeAccount).brokerage_authorization
                        const label = isAuth
                          ? ((item as SnapTradeAuthorization).brokerage?.name ?? "Brokerage")
                          : ((item as SnapTradeAccount).institution_name || (item as SnapTradeAccount).name)
                        const sub = isAuth ? "" : (item as SnapTradeAccount).number
                        return (
                          <div key={isAuth ? (item as SnapTradeAuthorization).id : (item as SnapTradeAccount).id} className="flex items-center justify-between px-3 py-2.5 bg-white/3 border border-white/8 rounded-lg">
                            <div>
                              <p className="text-sm font-semibold text-white">{label}</p>
                              {sub && <p className="text-xs text-white/40">{sub}</p>}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                if (!authId) { setError("Authorization ID not found — try refreshing the page."); return }
                                if (!confirm(`Unlink ${label}? This will remove the brokerage connection.`)) return
                                try { await snaptradeUnlinkAccount(authId); await checkStatus() }
                                catch (e) { setError(e instanceof Error ? e.message : "Failed to unlink") }
                              }}
                              className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 h-7 px-3 text-xs"
                            >
                              Unlink
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </Card>

                  <div className="grid grid-cols-4 gap-4">
                    <Card className="bg-white/2 border-white/10 p-6">
                      <p className="text-sm text-white/60 mb-2">Portfolio Value</p>
                      <p className="text-3xl font-bold text-white">{'$'}{totalVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </Card>
                    <Card className="bg-white/2 border-white/10 p-6">
                      <p className="text-sm text-white/60 mb-2">Open P&amp;L</p>
                      <p className={cn("text-3xl font-bold", totalPnl >= 0 ? "text-emerald-400" : "text-red-400")}>
                        {totalPnl >= 0 ? "+" : ""}{totalPnl.toFixed(2)}
                      </p>
                    </Card>
                    <Card className="bg-white/2 border-white/10 p-6">
                      <p className="text-sm text-white/60 mb-2">Cash</p>
                      <p className="text-3xl font-bold text-white">{'$'}{totalCash.toFixed(2)}</p>
                    </Card>
                    <Card className="bg-white/2 border-white/10 p-6">
                      <p className="text-sm text-white/60 mb-2">Accounts</p>
                      <p className="text-3xl font-bold text-white">{accounts.length}</p>
                    </Card>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h2 className="text-lg font-semibold text-white mb-4">Positions</h2>
                      {allPos.length === 0
                        ? <Card className="bg-white/2 border-white/10 p-8 text-center text-white/40">No open positions</Card>
                        : <div className="space-y-3">{allPos.map((p, i) => {
                            const sym = (typeof p.symbol?.symbol === "object" ? p.symbol?.symbol?.symbol : p.symbol?.symbol) || "—"
                            const pnl = p.open_pnl || 0
                            return (
                              <Card key={i} className="bg-white/2 border-white/10 p-4 cursor-pointer hover:border-emerald-500/30"
                                onClick={() => { setOptionsSymbol(sym); setTab("options") }}>
                                <div className="flex justify-between">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-white">{sym}</span>
                                      <Badge className="text-[10px] bg-white/5 text-white/50">{p.acctName}</Badge>
                                    </div>
                                    <p className="text-xs text-white/50">{p.units}sh @ {'$'}{p.price?.toFixed(2)}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className={cn("text-sm font-bold", pnl >= 0 ? "text-emerald-400" : "text-red-400")}>
                                      {pnl >= 0 ? "+" : ""}{'$'}{pnl.toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                              </Card>
                            )
                          })}</div>
                      }
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white mb-4">Activity</h2>
                      {activities.length === 0
                        ? <Card className="bg-white/2 border-white/10 p-8 text-center text-white/40">No recent activity</Card>
                        : <div className="space-y-3">{activities.slice(0, 15).map((a, i) => {
                            const sym = (typeof a.symbol?.symbol === "object" ? (a.symbol?.symbol as any)?.symbol : a.symbol?.symbol) || "—"
                            const buy = (a.action as string)?.toLowerCase().includes("buy")
                            return (
                              <Card key={i} className="bg-white/2 border-white/10 p-4">
                                <div className="flex justify-between">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-white">{sym}</span>
                                      <Badge className={cn("text-[10px]", buy ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400")}>{(a.action as string) || "—"}</Badge>
                                    </div>
                                    <p className="text-xs text-white/50">{(a as any).units}sh @ {'$'}{(a as any).price?.toFixed(2)}</p>
                                  </div>
                                  {(a as any).trade_date && (
                                    <p className="text-[10px] text-white/40 flex items-center gap-1">
                                      <Clock className="h-2.5 w-2.5" />{new Date((a as any).trade_date).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </Card>
                            )
                          })}</div>
                      }
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {tab === "paper" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-amber-500/5 border-amber-500/20 p-6">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-amber-300/70 font-mono uppercase">Paper Cash</p>
                    <FlaskConical className="h-4 w-4 text-amber-400" />
                  </div>
                  <p className="text-3xl font-bold text-amber-400 font-mono">
                    {'$'}{(paperAccount?.balance || 100000).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-amber-300/50 mt-1">
                    Started {'$'}{(paperAccount?.starting_balance || 100000).toLocaleString()}
                  </p>
                </Card>
                <Card className={cn("border p-6", paperPnl >= 0 ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20")}>
                  <p className="text-xs text-white/60 mb-1">Unrealized P&amp;L</p>
                  <p className={cn("text-3xl font-bold", paperPnl >= 0 ? "text-emerald-400" : "text-red-400")}>
                    {paperPnl >= 0 ? "+" : ""}{'$'}{paperPnl.toFixed(2)}
                  </p>
                  <p className="text-xs text-white/40 mt-1">{paperPositions.length} open positions</p>
                </Card>
                <Card className="bg-white/2 border-white/10 p-6">
                  <p className="text-xs text-white/60 mb-3">Quick Actions</p>
                  <div className="flex flex-col gap-2">
                    <Button size="sm" variant="outline" onClick={loadPaper} disabled={paperLoading}
                      className="border-white/10 text-white/70 text-xs">
                      <RefreshCw className={cn("h-3 w-3 mr-1", paperLoading && "animate-spin")} />Refresh
                    </Button>
                    <Button size="sm" variant="outline"
                      onClick={async () => {
                        if (!confirm("Reset to $100,000?")) return
                        await paperFetch("/reset", { method: "POST", body: "{}" })
                        await loadPaper()
                      }}
                      className="border-red-500/20 text-red-400/70 hover:text-red-400 text-xs">
                      Reset Account
                    </Button>
                  </div>
                </Card>
              </div>

              <Card className="bg-white/2 border-white/10 p-6">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-amber-400" />Place Paper Order
                </h3>
                {paperMsg && (
                  <div className={cn("mb-3 text-xs font-mono px-3 py-2 rounded border",
                    paperMsg.startsWith("Filled") ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                  )}>{paperMsg}</div>
                )}
                <div className="flex gap-3 items-end flex-wrap">
                  <div>
                    <label className="text-xs text-white/50 font-mono block mb-1">Symbol</label>
                    <input value={paperSymbol} onChange={e => setPaperSymbol(e.target.value.toUpperCase())}
                      className="bg-zinc-800 border border-zinc-700 text-white font-mono text-sm rounded px-3 py-2 w-28 focus:border-amber-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 font-mono block mb-1">Action</label>
                    <div className="flex border border-zinc-700 rounded overflow-hidden">
                      {(["BUY", "SELL"] as const).map(a => (
                        <button key={a} onClick={() => setPaperAction(a)}
                          className={cn("px-4 py-2 text-sm font-mono transition-colors",
                            paperAction === a ? a === "BUY" ? "bg-emerald-600 text-white" : "bg-red-600 text-white" : "text-zinc-400 hover:text-white"
                          )}>{a}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-white/50 font-mono block mb-1">Qty</label>
                    <input type="number" min={1} value={paperQty} onChange={e => setPaperQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="bg-zinc-800 border border-zinc-700 text-white font-mono text-sm rounded px-3 py-2 w-20 focus:border-amber-500 focus:outline-none" />
                  </div>
                  <Button onClick={placePaperOrder} disabled={paperLoading}
                    className={cn("font-mono", paperAction === "BUY" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-red-600 hover:bg-red-500")}>
                    {paperLoading ? "…" : paperAction + " Paper"}
                  </Button>
                  <button onClick={() => { setOptionsSymbol(paperSymbol); setTab("options"); setOptionsPaper(true) }}
                    className="text-xs font-mono text-amber-400 border border-amber-500/30 px-3 py-2 rounded hover:bg-amber-500/10">
                    <Zap className="h-3 w-3 inline mr-1" />Options
                  </button>
                </div>
                <p className="text-xs text-amber-400/60 font-mono mt-3">Fills at live Polygon price · virtual money only</p>
              </Card>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h2 className="text-lg font-semibold text-white mb-3">Open Positions</h2>
                  {paperPositions.length === 0
                    ? <Card className="bg-white/2 border-white/10 p-8 text-center text-white/40 text-sm">No open positions</Card>
                    : <div className="space-y-2">{paperPositions.map(p => {
                        const pnl = p.unrealized_pnl || 0
                        return (
                          <Card key={p.id} className="bg-white/2 border-white/10 p-4 cursor-pointer hover:border-blue-500/30"
                            onClick={() => { setOptionsSymbol(p.symbol); setTab("options") }}>
                            <div className="flex justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white font-mono">{p.ticker}</span>
                                  <Badge className={cn("text-[10px]", p.asset_type === "option" ? "bg-purple-500/20 text-purple-400" : "bg-white/5 text-white/50")}>{p.asset_type}</Badge>
                                </div>
                                <p className="text-xs text-white/50">{p.quantity}x @ {'$'}{p.avg_price?.toFixed(2)}</p>
                              </div>
                              <div className="text-right">
                                <p className={cn("text-sm font-bold", pnl >= 0 ? "text-emerald-400" : "text-red-400")}>
                                  {pnl >= 0 ? "+" : ""}{'$'}{pnl.toFixed(2)}
                                </p>
                                {p.current_price && <p className="text-xs text-white/40">now {'$'}{p.current_price.toFixed(2)}</p>}
                              </div>
                            </div>
                          </Card>
                        )
                      })}</div>
                  }
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white mb-3">Order History</h2>
                  {paperOrders.length === 0
                    ? <Card className="bg-white/2 border-white/10 p-8 text-center text-white/40 text-sm">No orders yet</Card>
                    : <div className="space-y-2 max-h-96 overflow-y-auto">{paperOrders.map(o => (
                        <Card key={o.id} className="bg-white/2 border-white/10 p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-white text-sm">{o.ticker}</span>
                                <Badge className={cn("text-[10px]", o.action === "BUY" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400")}>{o.action}</Badge>
                              </div>
                              <p className="text-xs text-white/40">{o.quantity}x @ {'$'}{o.fill_price?.toFixed(2)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-white font-mono">{'$'}{o.total_value?.toFixed(2)}</p>
                              <p className="text-[10px] text-white/30">{new Date(o.executed_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </Card>
                      ))}</div>
                  }
                </div>
              </div>
            </motion.div>
          )}

          {tab === "options" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center gap-4 flex-wrap">
                <input value={optionsSymbol} onChange={e => setOptionsSymbol(e.target.value.toUpperCase())}
                  className="bg-zinc-900 border border-zinc-700 text-white font-mono text-lg rounded px-4 py-2 w-32 focus:border-emerald-500 focus:outline-none"
                  placeholder="AAPL" />
                <div className="flex border border-zinc-700 rounded overflow-hidden">
                  <button onClick={() => setOptionsPaper(true)}
                    className={cn("px-3 py-1.5 text-sm font-mono", optionsPaper ? "bg-amber-600/20 text-amber-400" : "text-zinc-400 hover:text-white")}>
                    Paper
                  </button>
                  <button onClick={() => setOptionsPaper(false)}
                    className={cn("px-3 py-1.5 text-sm font-mono", !optionsPaper ? "bg-emerald-600/20 text-emerald-400" : "text-zinc-400 hover:text-white")}>
                    Live {accounts.length === 0 ? "(connect first)" : ""}
                  </button>
                </div>
                {!optionsPaper && accounts.length === 0 && (
                  <p className="text-xs text-amber-400 font-mono">Connect a brokerage on the Live tab first</p>
                )}
              </div>
              <OptionsChain
                symbol={optionsSymbol}
              />
            </motion.div>
          )}
        </main>
      </div>
      <TradeModal open={tradeModalOpen} onClose={() => setTradeModalOpen(false)} symbol={tradeSymbol} />
    </div>
  )
                        }
