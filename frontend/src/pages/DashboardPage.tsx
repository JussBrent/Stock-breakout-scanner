import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import {
  TrendingUp, TrendingDown, RefreshCw, Activity,
  Star, Zap, AlertTriangle, Target, BarChart2, ArrowUpRight, ArrowDownRight,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/dashboard/Sidebar"
import {
  getDashboardAll,
  refreshDashboard,
  type DashboardTopSetup,
  type DashboardSector,
  type DashboardSentiment,
} from "@/lib/api"
import { cn } from "@/lib/utils"

// ── Sentiment helpers ────────────────────────────────────────────────────────

const SENTIMENT_CONFIG: Record<string, { label: string; color: string; bg: string; icon: "bull" | "bear" | "neutral" }> = {
  bullish:              { label: "Bullish",              color: "text-emerald-400", bg: "bg-emerald-900/30 border-emerald-700", icon: "bull" },
  cautiously_bullish:   { label: "Cautiously Bullish",   color: "text-green-400",   bg: "bg-green-900/30 border-green-700",   icon: "bull" },
  neutral:              { label: "Neutral",               color: "text-yellow-400",  bg: "bg-yellow-900/20 border-yellow-700", icon: "neutral" },
  cautiously_bearish:   { label: "Cautiously Bearish",   color: "text-orange-400",  bg: "bg-orange-900/30 border-orange-700", icon: "bear" },
  bearish:              { label: "Bearish",               color: "text-red-400",     bg: "bg-red-900/30 border-red-700",       icon: "bear" },
}

function sentimentColor(score: number): string {
  if (score >= 70) return "#10b981"
  if (score >= 55) return "#22c55e"
  if (score >= 45) return "#eab308"
  if (score >= 30) return "#f97316"
  return "#ef4444"
}

function heatmapColor(changePct: number): string {
  if (changePct >= 2)    return "bg-emerald-600 border-emerald-500"
  if (changePct >= 1)    return "bg-emerald-700/80 border-emerald-600"
  if (changePct >= 0.25) return "bg-emerald-800/60 border-emerald-700"
  if (changePct >= 0)    return "bg-zinc-700/60 border-zinc-600"
  if (changePct >= -0.25) return "bg-red-900/50 border-red-800"
  if (changePct >= -1)   return "bg-red-800/70 border-red-700"
  if (changePct >= -2)   return "bg-red-700/80 border-red-600"
  return "bg-red-600 border-red-500"
}

function scoreColor(score: number): string {
  if (score >= 85) return "text-emerald-400"
  if (score >= 70) return "text-green-400"
  if (score >= 55) return "text-yellow-400"
  return "text-orange-400"
}

function rankBadgeColor(rank: number): string {
  if (rank === 1) return "bg-yellow-500 text-black"
  if (rank === 2) return "bg-zinc-300 text-black"
  if (rank === 3) return "bg-amber-600 text-white"
  return "bg-zinc-700 text-zinc-300"
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [topSetups, setTopSetups] = useState<DashboardTopSetup[]>([])
  const [sectors, setSectors] = useState<DashboardSector[]>([])
  const [sentiment, setSentiment] = useState<DashboardSentiment | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>("")

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getDashboardAll()
      setTopSetups(data.top_setups || [])
      setSectors(data.sectors || [])
      setSentiment(data.sentiment || null)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshDashboard()
      setTimeout(() => load(), 5000) // wait 5s for background task
    } catch (e) {
      setError(e instanceof Error ? e.message : "Refresh failed")
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [load])

  const sentConfig = sentiment ? (SENTIMENT_CONFIG[sentiment.sentiment] || SENTIMENT_CONFIG.neutral) : null
  const topSectors = [...sectors].sort((a, b) => (b.change_pct || 0) - (a.change_pct || 0)).slice(0, 5)
  const breakoutSectors = sectors.filter(s => s.is_breaking_out)

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">

          {/* ── Header ── */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Daily intelligence · AI-scored setups · Market heatmap
                {lastUpdated && <span className="ml-2 opacity-60">· Updated {lastUpdated}</span>}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} />
                Reload
              </Button>
              <Button size="sm" onClick={handleRefresh} disabled={refreshing}
                className="bg-blue-600 hover:bg-blue-700 text-white">
                <Zap className={cn("h-3.5 w-3.5 mr-1.5", refreshing && "animate-pulse")} />
                {refreshing ? "Scanning..." : "Refresh Scan"}
              </Button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-900/30 border border-red-700 p-3 text-sm text-red-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* ── Market Sentiment ── */}
          {sentiment && sentConfig && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card className={cn("border p-4", sentConfig.bg)}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <Activity className={cn("h-5 w-5", sentConfig.color)} />
                    <div>
                      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Market Sentiment</div>
                      <div className={cn("text-xl font-bold", sentConfig.color)}>{sentConfig.label}</div>
                    </div>
                    {/* Score gauge */}
                    <div className="flex items-center gap-2 ml-4">
                      <div className="w-32 h-2.5 rounded-full bg-zinc-700 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${sentiment.sentiment_score}%`, backgroundColor: sentimentColor(sentiment.sentiment_score) }}
                        />
                      </div>
                      <span className={cn("text-sm font-semibold tabular-nums", sentConfig.color)}>
                        {sentiment.sentiment_score?.toFixed(0)}/100
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <StatPill label="SPY" value={sentiment.spy_change} isPercent />
                    <StatPill label="QQQ" value={sentiment.qqq_change} isPercent />
                    <StatPill label="IWM" value={sentiment.iwm_change} isPercent />
                    <StatPill label="VIX" value={sentiment.vix} color="text-zinc-300" />
                  </div>
                </div>
                {sentiment.market_notes && (
                  <div className="mt-2 text-xs text-muted-foreground">{sentiment.market_notes}</div>
                )}
              </Card>
            </motion.div>
          )}

          {sentiment === null && !loading && (
            <Card className="border border-zinc-700 p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Activity className="h-4 w-4" />
                No sentiment data yet — click "Refresh Scan" to generate
              </div>
            </Card>
          )}

          {/* ── Main 2-column grid ── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* ── Top 5 AI Setups (2/3 width) ── */}
            <div className="xl:col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-400" />
                <h2 className="text-base font-semibold">Top 5 AI-Rated Setups Today</h2>
                <Badge variant="outline" className="text-xs ml-auto">
                  {topSetups.length} / 5
                </Badge>
              </div>

              {loading && (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-24 rounded-xl bg-zinc-800/50 animate-pulse" />
                  ))}
                </div>
              )}

              {!loading && topSetups.length === 0 && (
                <Card className="border border-zinc-700 p-8 text-center">
                  <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">No setups generated yet for today.</p>
                  <p className="text-xs text-muted-foreground mt-1">Click "Refresh Scan" to run the AI scanner.</p>
                </Card>
              )}

              {!loading && topSetups.map((setup, idx) => (
                <motion.div
                  key={setup.symbol}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="border border-zinc-700 p-4 hover:border-zinc-500 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {/* Rank badge */}
                        <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5", rankBadgeColor(setup.rank))}>
                          {setup.rank}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-base font-bold">{setup.symbol}</span>
                            {setup.company_name && setup.company_name !== setup.symbol && (
                              <span className="text-xs text-muted-foreground">{setup.company_name}</span>
                            )}
                            <Badge variant="secondary" className="text-xs">{setup.setup_type}</Badge>
                            {setup.group_breakout && (
                              <Badge className="bg-blue-700/50 text-blue-300 border-blue-600 text-xs">
                                <Zap className="h-2.5 w-2.5 mr-1" />Group Breakout
                              </Badge>
                            )}
                            {setup.is_sideways && (
                              <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-600">Sideways</Badge>
                            )}
                            {setup.is_extended && (
                              <Badge variant="outline" className="text-xs text-orange-400 border-orange-600">Extended</Badge>
                            )}
                          </div>
                          <div className="flex gap-4 mt-1.5 text-xs text-muted-foreground flex-wrap">
                            {setup.sector && <span>{setup.sector}</span>}
                            {setup.etf_group && <span className="text-blue-400">ETF: {setup.etf_group}</span>}
                            {setup.price != null && (
                              <span className="text-foreground font-medium">${setup.price?.toFixed(2)}</span>
                            )}
                            {setup.price_change_pct != null && (
                              <span className={setup.price_change_pct >= 0 ? "text-emerald-400" : "text-red-400"}>
                                {setup.price_change_pct >= 0 ? "+" : ""}{setup.price_change_pct?.toFixed(2)}%
                              </span>
                            )}
                          </div>
                          {setup.analysis && (
                            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{setup.analysis}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={cn("text-2xl font-bold tabular-nums", scoreColor(setup.ai_score))}>
                          {setup.ai_score?.toFixed(0)}
                        </div>
                        <div className="text-xs text-muted-foreground">AI Score</div>
                        {setup.confidence && (
                          <Badge variant="outline" className="text-xs mt-1">{setup.confidence}</Badge>
                        )}
                        {setup.risk_level && (
                          <div className="text-xs text-muted-foreground mt-1">Risk: {setup.risk_level}</div>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* ── Best Sectors sidebar (1/3 width) ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-blue-400" />
                <h2 className="text-base font-semibold">Best Sectors</h2>
              </div>

              {loading && <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-12 rounded-lg bg-zinc-800/50 animate-pulse" />)}</div>}

              {!loading && topSectors.length === 0 && (
                <Card className="border border-zinc-700 p-4 text-center text-sm text-muted-foreground">No data yet</Card>
              )}

              {!loading && topSectors.map((s, idx) => (
                <motion.div key={s.sector} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.06 }}>
                  <Card className="border border-zinc-700 p-3 flex items-center justify-between hover:border-zinc-500 transition-colors">
                    <div>
                      <div className="text-sm font-medium">{s.sector}</div>
                      <div className="text-xs text-muted-foreground">{s.etf_symbol}</div>
                    </div>
                    <div className="text-right">
                      <div className={cn("text-sm font-bold tabular-nums flex items-center gap-1",
                        (s.change_pct || 0) >= 0 ? "text-emerald-400" : "text-red-400",
                      )}>
                        {(s.change_pct || 0) >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                        {(s.change_pct || 0) >= 0 ? "+" : ""}{(s.change_pct || 0).toFixed(2)}%
                      </div>
                      {s.is_breaking_out && (
                        <Badge className="bg-blue-800/50 text-blue-300 border-blue-700 text-xs mt-0.5">Breakout</Badge>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}

              {breakoutSectors.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs font-medium text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Zap className="h-3 w-3" /> Sector Breakouts
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {breakoutSectors.map(s => (
                      <Badge key={s.sector} className="bg-blue-800/40 text-blue-300 border-blue-700 text-xs">
                        {s.etf_symbol} +{(s.change_pct || 0).toFixed(1)}%
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Sector Heatmap ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-purple-400" />
              <h2 className="text-base font-semibold">Sector Heatmap</h2>
              <span className="text-xs text-muted-foreground ml-1">— performance today</span>
            </div>

            {loading && <div className="h-40 rounded-xl bg-zinc-800/50 animate-pulse" />}

            {!loading && sectors.length === 0 && (
              <Card className="border border-zinc-700 p-8 text-center">
                <p className="text-muted-foreground text-sm">No sector data yet. Click "Refresh Scan" to generate.</p>
              </Card>
            )}

            {!loading && sectors.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                {sectors
                  .sort((a, b) => (b.change_pct || 0) - (a.change_pct || 0))
                  .map((s, idx) => (
                    <motion.div
                      key={s.sector}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      className={cn(
                        "rounded-xl border p-3 text-center cursor-default select-none transition-all hover:scale-105",
                        heatmapColor(s.change_pct || 0),
                      )}
                    >
                      <div className="text-xs font-bold text-white">{s.etf_symbol}</div>
                      <div className="text-xs text-white/80 mt-0.5 truncate">{s.sector}</div>
                      <div className={cn("text-sm font-bold mt-1", (s.change_pct || 0) >= 0 ? "text-white" : "text-white")}>
                        {(s.change_pct || 0) >= 0 ? "+" : ""}{(s.change_pct || 0).toFixed(2)}%
                      </div>
                      {s.is_breaking_out && (
                        <div className="text-xs mt-0.5 text-yellow-300">⚡ BO</div>
                      )}
                    </motion.div>
                  ))
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Helper sub-component ─────────────────────────────────────────────────────

function StatPill({
  label,
  value,
  isPercent = false,
  color,
}: {
  label: string
  value?: number | null
  isPercent?: boolean
  color?: string
}) {
  const v = value ?? 0
  const positive = v >= 0
  const cls = color || (positive ? "text-emerald-400" : "text-red-400")
  return (
    <div className="text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("text-sm font-semibold tabular-nums", cls)}>
        {isPercent ? (positive ? "+" : "") : ""}
        {v.toFixed(2)}
        {isPercent ? "%" : ""}
      </div>
    </div>
  )
}
