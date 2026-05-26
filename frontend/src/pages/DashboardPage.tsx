// Dashboard v4 -- Professional trading terminal style (DeepVue-inspired)
import { useEffect, useState, useCallback, useRef } from "react"
import {
  RefreshCw, TrendingUp, TrendingDown, BarChart2, Activity, Zap,
  ChevronUp, ChevronDown, AlertCircle,
} from "lucide-react"
import { Sidebar } from "@/components/dashboard/Sidebar"
import {
  getDashboardAll, refreshDashboard, snaptradeGetBalances,
  type DashboardTopSetup, type DashboardSector, type DashboardSentiment,
} from "@/lib/api"
import { cn } from "@/lib/utils"

// -- Color helpers ------------------------------------------------------------

function chgColor(v: number | null | undefined, text = true): string {
  const val = v ?? 0
  const pos = text ? "text-[#22c55e]" : "bg-[#22c55e]"
  const neg = text ? "text-[#ef4444]" : "bg-[#ef4444]"
  const neu = text ? "text-[#a1a1aa]" : "bg-[#3f3f46]"
  return val > 0 ? pos : val < 0 ? neg : neu
}

function heatCell(pct: number): string {
  if (pct >= 2)    return "bg-[#166534] text-[#4ade80]"
  if (pct >= 1)    return "bg-[#14532d] text-[#86efac]"
  if (pct >= 0.3)  return "bg-[#052e16] text-[#bbf7d0]"
  if (pct >= 0)    return "bg-[#18181b] text-[#71717a]"
  if (pct >= -0.3) return "bg-[#1c0a0a] text-[#fca5a5]"
  if (pct >= -1)   return "bg-[#450a0a] text-[#fca5a5]"
  if (pct >= -2)   return "bg-[#7f1d1d] text-[#fca5a5]"
  return "bg-[#991b1b] text-white"
}

function scoreColor(s: number): string {
  if (s >= 85) return "text-[#22c55e]"
  if (s >= 70) return "text-[#86efac]"
  if (s >= 55) return "text-[#eab308]"
  return "text-[#f97316]"
}

function sentLabel(s: DashboardSentiment | null): { label: string; color: string } {
  const score = s?.sentiment_score ?? 50
  if (score >= 70) return { label: "BULLISH",            color: "#22c55e" }
  if (score >= 55) return { label: "CAUTIOUSLY BULLISH", color: "#86efac" }
  if (score >= 45) return { label: "NEUTRAL",            color: "#eab308" }
  if (score >= 30) return { label: "CAUTIOUSLY BEARISH", color: "#f97316" }
  return             { label: "BEARISH",                 color: "#ef4444" }
}

// Returns true when we have real (non-stale) sector data
function hasRealData(sectors: DashboardSector[], sentiment: DashboardSentiment | null): boolean {
  if (!sectors.length) return false
  const hasGoodSector = sectors.some(s => (s.change_pct ?? -100) > -50)
  const hasGoodSentiment = sentiment !== null && (sentiment.spy_change ?? 0) !== 0
  return hasGoodSector || hasGoodSentiment
}

// -- Ticker strip -------------------------------------------------------------

function TickerStrip({ sentiment }: { sentiment: DashboardSentiment | null }) {
  const items = [
    { sym: "SPY", v: sentiment?.spy_change },
    { sym: "QQQ", v: sentiment?.qqq_change },
    { sym: "IWM", v: sentiment?.iwm_change },
    { sym: "VIX", v: sentiment?.vix, raw: true },
  ]
  return (
    <div className="flex items-center gap-6 px-4 py-1.5 bg-[#0a0a0a] border-b border-[#27272a] text-xs font-mono">
      {items.map(({ sym, v, raw }) => {
        const val = v ?? 0
        const cls = raw ? "text-[#a1a1aa]" : chgColor(val)
        const sign = (!raw && val > 0) ? "+" : ""
        return (
          <span key={sym} className="flex items-center gap-1">
            <span className="text-[#71717a]">{sym}</span>
            <span className={cls}>{sign}{val?.toFixed(2)}{raw ? "" : "%"}</span>
          </span>
        )
      })}
      {sentiment && (
        <span className="ml-auto text-[#52525b]">{sentiment.market_notes}</span>
      )}
    </div>
  )
}

// -- Main page ----------------------------------------------------------------

export default function DashboardPage() {
  const [setups, setSetups] = useState<DashboardTopSetup[]>([])
  const [sectors, setSectors] = useState<DashboardSector[]>([])
  const [sentiment, setSentiment] = useState<DashboardSentiment | null>(null)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [dataDate, setDataDate] = useState("")
  const [marketClosed, setMarketClosed] = useState(false)
  const [buyingPower, setBuyingPower] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = useCallback(() => {
    setScanning(false)
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }, [])

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const d = await getDashboardAll()
      const newSectors = d.sectors || []
      const newSentiment = d.sentiment || null
      setSetups(d.top_setups || [])
      setSectors(newSectors)
      setSentiment(newSentiment)
      setMarketClosed(d.market_closed ?? false)
      setDataDate(d.data_date ?? "")
      // Stop polling as soon as we have real (non-stale) data
      if (hasRealData(newSectors, newSentiment)) {
        stopPolling()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load")
    } finally {
      if (!silent) setLoading(false)
    }
  }, [stopPolling])

  useEffect(() => {
    const init = async () => {
      await load()
      try {
        setScanning(true)
        await refreshDashboard()
        // Poll every 8s for up to 320s (40 polls = covers the 4-min background refresh)
        let n = 0
        pollRef.current = setInterval(async () => {
          n++
          await load(true)
          if (n >= 40) { stopPolling() }
        }, 8000)
      } catch { setScanning(false) }
    }
    init()
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    snaptradeGetBalances("all").then((d: any) => {
      const cash = (d?.balances || []).reduce((s: number, b: any) => s + (b?.cash || 0), 0)
      if (cash > 0) setBuyingPower(cash)
    }).catch(() => {})
  }, [])

  const handleRefresh = async () => {
    setScanning(true)
    try {
      await refreshDashboard()
      let n = 0
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = setInterval(async () => {
        n++
        await load(true)
        if (n >= 40) { stopPolling() }
      }, 8000)
    } catch { setScanning(false) }
  }

  const topSectors = [...sectors].sort((a, b) => (b.change_pct || 0) - (a.change_pct || 0)).slice(0, 5)
  const sent = sentLabel(sentiment)

  return (
    <div className="min-h-screen bg-[#09090b] text-[#e4e4e7]">
      <Sidebar />
      <div className="ml-[var(--sidebar-w,60px)] flex flex-col min-h-screen transition-[margin-left] duration-300">

        {/* -- Top bar -- */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#09090b] border-b border-[#27272a] shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold text-white tracking-wide uppercase">ORBIS Dashboard</h1>
            {marketClosed && dataDate && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#27272a] text-[#71717a]">
                CLOSED · {dataDate}
              </span>
            )}
            {scanning && (
              <span className="text-[10px] text-[#3b82f6] flex items-center gap-1 font-mono">
                <RefreshCw className="h-3 w-3 animate-spin" />SCANNING
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {buyingPower !== null && (
              <div className="text-xs font-mono">
                <span className="text-[#52525b]">BUYING POWER </span>
                <span className="text-[#22c55e] font-semibold">
                  ${buyingPower.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
            <button
              onClick={() => load()}
              disabled={loading}
              className="text-[10px] font-mono uppercase px-2.5 py-1 border border-[#3f3f46] text-[#a1a1aa] hover:text-white hover:border-[#71717a] rounded transition-colors disabled:opacity-40"
            >
              <RefreshCw className={cn("h-3 w-3 inline mr-1", loading && "animate-spin")} />RELOAD
            </button>
            <button
              onClick={handleRefresh}
              disabled={scanning}
              className="text-[10px] font-mono uppercase px-2.5 py-1 bg-[#1d4ed8] hover:bg-[#2563eb] text-white rounded transition-colors disabled:opacity-60 flex items-center gap-1"
            >
              <Zap className="h-3 w-3" />{scanning ? "SCANNING..." : "REFRESH SCAN"}
            </button>
          </div>
        </div>

        {/* -- Ticker strip -- */}
        <TickerStrip sentiment={sentiment} />

        {/* -- Error banner -- */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-2 bg-[#450a0a] border-b border-[#7f1d1d] text-xs text-[#fca5a5]">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />{error}
          </div>
        )}

        {/* -- Main content -- */}
        <div className="flex flex-1 overflow-hidden">

          {/* -- Left: Sentiment + Setups -- */}
          <div className="flex flex-col flex-1 overflow-y-auto">

            {/* Sentiment row */}
            <div className="flex items-center gap-6 px-4 py-2.5 border-b border-[#27272a] bg-[#0d0d0f] shrink-0">
              <div className="flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-[#52525b]" />
                <span className="text-[10px] text-[#52525b] uppercase tracking-wider font-mono">Market Sentiment</span>
              </div>
              {sentiment ? (
                <>
                  <span className="text-sm font-bold font-mono" style={{ color: sent.color }}>{sent.label}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-24 h-1.5 bg-[#27272a] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${sentiment.sentiment_score}%`, backgroundColor: sent.color }} />
                    </div>
                    <span className="text-xs font-mono text-[#71717a]">{sentiment.sentiment_score?.toFixed(0)}/100</span>
                  </div>
                </>
              ) : (
                <span className="text-xs text-[#52525b] font-mono">{loading ? "LOADING..." : "NO DATA"}</span>
              )}
            </div>

            {/* Setups table header */}
            <div className="grid grid-cols-[28px_1fr_80px_60px_80px] gap-0 px-4 py-1.5 border-b border-[#27272a] bg-[#0a0a0a] shrink-0">
              {["#", "SYMBOL / SETUP", "PRICE", "CHG", "AI SCORE"].map(h => (
                <span key={h} className="text-[10px] text-[#52525b] uppercase tracking-wider font-mono">{h}</span>
              ))}
            </div>

            {/* Setups rows */}
            <div className="flex-1 divide-y divide-[#1c1c1e]">
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <div key={i} className="h-14 animate-pulse bg-[#0d0d0f]" />
                ))
              ) : setups.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-xs text-[#52525b] font-mono">
                  {scanning ? "SCANNING FOR SETUPS..." : "NO SETUPS · CLICK REFRESH SCAN"}
                </div>
              ) : setups.map((s) => (
                <div key={s.symbol} className="grid grid-cols-[28px_1fr_80px_60px_80px] gap-0 px-4 py-3 hover:bg-[#0d0d0f] transition-colors group">
                  <span className="text-[11px] font-mono text-[#52525b] flex items-center">{s.rank}</span>
                  <div className="flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white font-mono">{s.symbol}</span>
                      {s.company_name && s.company_name !== s.symbol && (
                        <span className="text-[11px] text-[#71717a] truncate max-w-[140px]">{s.company_name}</span>
                      )}
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1c1c1e] text-[#a1a1aa] font-mono border border-[#27272a]">{s.setup_type}</span>
                      {s.group_breakout && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e3a5f] text-[#93c5fd] font-mono">GROUP BO</span>}
                      {s.is_extended && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#431407] text-[#fdba74] font-mono">EXT</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[11px] text-[#52525b] font-mono">
                      {s.sector && <span>{s.sector}</span>}
                      {s.etf_group && <span className="text-[#60a5fa]">{s.etf_group}</span>}
                      {s.analysis && <span className="hidden group-hover:inline truncate max-w-xs text-[#71717a]">{s.analysis}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-xs font-mono text-white">${s.price?.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className={`text-xs font-mono ${chgColor(s.price_change_pct)}`}>
                      {(s.price_change_pct ?? 0) >= 0 ? "+" : ""}{s.price_change_pct?.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className={`text-sm font-bold font-mono ${scoreColor(s.ai_score)}`}>{s.ai_score?.toFixed(0)}</span>
                    {s.risk_level && <span className="text-[10px] text-[#52525b] font-mono">{s.risk_level.toUpperCase()}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* -- Right panel -- */}
          <div className="w-[280px] shrink-0 border-l border-[#27272a] flex flex-col overflow-y-auto">

            {/* Best Sectors */}
            <div className="border-b border-[#27272a] shrink-0">
              <div className="flex items-center gap-2 px-3 py-2 bg-[#0a0a0a]">
                <BarChart2 className="h-3 w-3 text-[#52525b]" />
                <span className="text-[10px] text-[#52525b] uppercase tracking-wider font-mono">Best Sectors</span>
              </div>
              <div className="divide-y divide-[#1c1c1e]">
                {loading ? (
                  [1,2,3,4,5].map(i => <div key={i} className="h-9 animate-pulse bg-[#0d0d0f]" />)
                ) : topSectors.length === 0 ? (
                  <div className="px-3 py-4 text-[11px] text-[#52525b] font-mono text-center">
                    {scanning ? "SCANNING..." : "NO DATA"}
                  </div>
                ) : topSectors.map(s => (
                  <div key={s.sector} className="flex items-center justify-between px-3 py-2 hover:bg-[#0d0d0f]">
                    <div>
                      <div className="text-xs font-mono text-[#e4e4e7]">{s.sector}</div>
                      <div className="text-[10px] font-mono text-[#52525b]">{s.etf_symbol}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      {(s.change_pct || 0) >= 0
                        ? <ChevronUp className="h-3 w-3 text-[#22c55e]" />
                        : <ChevronDown className="h-3 w-3 text-[#ef4444]" />}
                      <span className={`text-xs font-mono font-bold ${chgColor(s.change_pct)}`}>
                        {(s.change_pct || 0) >= 0 ? "+" : ""}{(s.change_pct || 0).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Heatmap */}
            <div className="flex-1 shrink-0">
              <div className="flex items-center gap-2 px-3 py-2 bg-[#0a0a0a] border-b border-[#27272a]">
                <Activity className="h-3 w-3 text-[#52525b]" />
                <span className="text-[10px] text-[#52525b] uppercase tracking-wider font-mono">Sector Heatmap</span>
              </div>
              {loading ? (
                <div className="h-40 animate-pulse bg-[#0d0d0f]" />
              ) : sectors.length === 0 ? (
                <div className="p-4 text-[11px] text-[#52525b] font-mono text-center">
                  {scanning ? "FETCHING..." : "NO DATA"}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-px p-px bg-[#18181b]">
                  {[...sectors]
                    .sort((a, b) => (b.change_pct || 0) - (a.change_pct || 0))
                    .map(s => (
                      <div key={s.sector} className={`p-2 flex flex-col gap-0.5 ${heatCell(s.change_pct || 0)}`}>
                        <span className="text-[10px] font-bold font-mono">{s.etf_symbol}</span>
                        <span className="text-[9px] opacity-70 leading-tight truncate">{s.sector}</span>
                        <span className="text-[11px] font-bold font-mono">
                          {(s.change_pct || 0) >= 0 ? "+" : ""}{(s.change_pct || 0).toFixed(2)}%
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
