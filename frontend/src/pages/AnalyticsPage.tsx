import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/dashboard/Sidebar"
import {
  getTradeOutcomes, logTradeOutcome, updateTradeOutcome, getAIQueryLog,
  type TradeOutcome, type AIQueryLog,
} from "@/lib/api"
import {
  BookOpen, TrendingUp, TrendingDown, Minus, Target, Calendar,
  Plus, Check, Edit2, ChevronDown, ChevronUp, BarChart2,
  AlertCircle, BarChart3, Search, RefreshCw, Loader2, Trophy,
  ArrowUpRight, ArrowDownRight, Activity, Zap, FileText, X,
  ChevronLeft, ChevronRight, DollarSign, Percent,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Outcome = "win" | "loss" | "breakeven" | "open"
type SetupTag = "FLAT_TOP" | "FLAG" | "WEDGE" | "BASE" | "BREAKOUT" | "PULLBACK" | "OTHER"
type TabId = "dashboard" | "trades" | "log" | "ai"

interface JournalFormState {
  symbol: string; setup_type: SetupTag; entry_price: string; exit_price: string
  outcome: Outcome; notes: string; traded_at: string; shares: string
  is_crowdsource_eligible: boolean
}

const BLANK: JournalFormState = {
  symbol: "", setup_type: "BREAKOUT", entry_price: "", exit_price: "",
  outcome: "open", notes: "", traded_at: new Date().toISOString().split("T")[0], shares: "",
  is_crowdsource_eligible: false,
}

const SETUP_LABELS: Record<SetupTag, string> = {
  FLAT_TOP: "Flat Top", FLAG: "Bull Flag", WEDGE: "Wedge",
  BASE: "Base", BREAKOUT: "Breakout", PULLBACK: "Pullback", OTHER: "Other",
}
const SETUP_EMOJI: Record<SetupTag, string> = {
  FLAT_TOP: "📊", FLAG: "🚩", WEDGE: "📐", BASE: "🏗️", BREAKOUT: "⚡", PULLBACK: "↩️", OTHER: "•",
}

const OC: Record<Outcome, { label: string; color: string; bg: string; dot: string }> = {
  win:       { label: "Win",  color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30", dot: "bg-emerald-400" },
  loss:      { label: "Loss", color: "text-red-400",     bg: "bg-red-500/15 border-red-500/30",         dot: "bg-red-400"     },
  breakeven: { label: "B/E",  color: "text-amber-400",   bg: "bg-amber-500/15 border-amber-500/30",     dot: "bg-amber-400"   },
  open:      { label: "Open", color: "text-sky-400",     bg: "bg-sky-500/15 border-sky-500/30",         dot: "bg-sky-400"     },
}

function fmt(n?: number | null, d = 2) { return n == null ? "—" : n.toFixed(d) }
function gainPct(e: number, x: number) { return ((x - e) / e) * 100 }
function sign(n: number) { return n >= 0 ? "+" : "" }
function pnl(t: TradeOutcome) {
  if (t.gain_pct != null) return t.gain_pct
  if (t.entry_price && t.exit_price) return gainPct(t.entry_price, t.exit_price)
  return null
}

// ─── P&L Calendar ──────────────────────────────────────────────────────────
function PnlCalendar({ trades }: { trades: TradeOutcome[] }) {
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() } })
  const { y, m } = calMonth

  // Build day map: dateStr -> total gain_pct
  const dayMap = useMemo(() => {
    const map: Record<string, number> = {}
    trades.forEach(t => {
      const g = pnl(t)
      if (g == null || !t.traded_at) return
      const d = t.traded_at.split("T")[0]
      map[d] = (map[d] ?? 0) + g
    })
    return map
  }, [trades])

  const firstDay = new Date(y, m, 1).getDay()
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const monthName = new Date(y, m, 1).toLocaleString("default", { month: "long", year: "numeric" })

  const cells: Array<{ day: number | null; date: string | null; val: number | null }> = []
  for (let i = 0; i < firstDay; i++) cells.push({ day: null, date: null, val: null })
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    cells.push({ day: d, date, val: dayMap[date] ?? null })
  }

  function cellBg(val: number | null) {
    if (val == null) return "bg-transparent"
    if (val >= 5) return "bg-emerald-500/70"
    if (val >= 2) return "bg-emerald-500/45"
    if (val > 0)  return "bg-emerald-500/25"
    if (val === 0) return "bg-amber-500/30"
    if (val >= -2) return "bg-red-500/25"
    if (val >= -5) return "bg-red-500/45"
    return "bg-red-500/70"
  }

  const weeks = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setCalMonth(p => { const d = new Date(p.y, p.m - 1); return { y: d.getFullYear(), m: d.getMonth() } })}
          className="p-1 rounded hover:bg-white/8 text-white/40 hover:text-white transition-colors"><ChevronLeft className="h-4 w-4" /></button>
        <span className="text-sm font-semibold text-white">{monthName}</span>
        <button onClick={() => setCalMonth(p => { const d = new Date(p.y, p.m + 1); return { y: d.getFullYear(), m: d.getMonth() } })}
          className="p-1 rounded hover:bg-white/8 text-white/40 hover:text-white transition-colors"><ChevronRight className="h-4 w-4" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weeks.map(w => <div key={w} className="text-[9px] text-white/30 text-center font-semibold uppercase tracking-wider">{w}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, i) => (
          <div key={i} className={`aspect-square rounded-md flex flex-col items-center justify-center relative group cursor-default ${c.day ? "border border-white/5 hover:border-white/20" : ""} ${cellBg(c.val)}`}>
            {c.day && <>
              <span className="text-[10px] text-white/70 font-mono leading-none">{c.day}</span>
              {c.val != null && <span className={`text-[8px] font-mono leading-none mt-0.5 ${c.val >= 0 ? "text-emerald-300" : "text-red-300"}`}>{sign(c.val)}{c.val.toFixed(1)}%</span>}
              {c.val != null && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-neutral-900 border border-white/10 rounded text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                  {c.date}: {sign(c.val)}{c.val.toFixed(2)}%
                </div>
              )}
            </>}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-3 justify-center">
        {[["bg-red-500/70","Big Loss"],["bg-red-500/25","Loss"],["bg-amber-500/30","B/E"],["bg-emerald-500/25","Win"],["bg-emerald-500/70","Big Win"]].map(([bg,label]) => (
          <div key={label} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded-sm ${bg}`} />
            <span className="text-[9px] text-white/30">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Equity Curve ──────────────────────────────────────────────────────────
function EquityCurve({ trades }: { trades: TradeOutcome[] }) {
  const points = useMemo(() => {
    const closed = [...trades].filter(t => t.outcome !== "open" && pnl(t) != null)
      .sort((a, b) => (a.traded_at ?? "").localeCompare(b.traded_at ?? ""))
    let cum = 0
    return [{ cum: 0, date: "" }, ...closed.map(t => { cum += pnl(t)!; return { cum, date: t.traded_at?.split("T")[0] ?? "" } })]
  }, [trades])

  if (points.length < 2) return (
    <div className="flex items-center justify-center h-32 text-white/20 text-xs">Log closed trades to see equity curve</div>
  )

  const vals = points.map(p => p.cum)
  const minV = Math.min(...vals), maxV = Math.max(...vals)
  const range = maxV - minV || 1
  const W = 400, H = 120, PAD = 8
  const toX = (i: number) => PAD + ((i / (points.length - 1)) * (W - PAD * 2))
  const toY = (v: number) => H - PAD - ((v - minV) / range) * (H - PAD * 2)

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(p.cum).toFixed(1)}`).join(" ")
  const fillPath = path + ` L${toX(points.length - 1).toFixed(1)},${H} L${PAD},${H} Z`
  const isUp = vals[vals.length - 1] >= 0
  const color = isUp ? "#10b981" : "#f87171"

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-28" preserveAspectRatio="none">
      <defs>
        <linearGradient id="ecGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={fillPath} fill="url(#ecGrad)" />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" />
      <line x1={PAD} y1={toY(0)} x2={W - PAD} y2={toY(0)} stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4,4"/>
    </svg>
  )
}

// ─── Donut Chart ───────────────────────────────────────────────────────────
function DonutChart({ wins, losses, bes }: { wins: number; losses: number; bes: number }) {
  const total = wins + losses + bes || 1
  const data = [
    { val: wins / total, color: "#10b981", label: "Wins" },
    { val: losses / total, color: "#f87171", label: "Losses" },
    { val: bes / total, color: "#fbbf24", label: "B/E" },
  ].filter(d => d.val > 0)

  const R = 40, cx = 60, cy = 60, strokeW = 16
  let cum = 0
  const arcs = data.map(d => {
    const start = cum * 2 * Math.PI - Math.PI / 2
    cum += d.val
    const end = cum * 2 * Math.PI - Math.PI / 2
    const x1 = cx + R * Math.cos(start), y1 = cy + R * Math.sin(start)
    const x2 = cx + R * Math.cos(end), y2 = cy + R * Math.sin(end)
    const large = d.val > 0.5 ? 1 : 0
    return { ...d, d: `M${x1.toFixed(2)},${y1.toFixed(2)} A${R},${R} 0 ${large},1 ${x2.toFixed(2)},${y2.toFixed(2)}` }
  })

  const winRate = total > 1 ? Math.round((wins / (total)) * 100) : 0

  return (
    <svg viewBox="0 0 120 120" className="w-28 h-28">
      {arcs.map((a, i) => <path key={i} d={a.d} fill="none" stroke={a.color} strokeWidth={strokeW} />)}
      <text x={cx} y={cy - 4} textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">{winRate}%</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="7">win rate</text>
    </svg>
  )
}

// ─── Stats Row ─────────────────────────────────────────────────────────────
function StatsRow({ trades }: { trades: TradeOutcome[] }) {
  const closed = trades.filter(t => t.outcome !== "open")
  const wins = closed.filter(t => t.outcome === "win")
  const losses = closed.filter(t => t.outcome === "loss")
  const bes = closed.filter(t => t.outcome === "breakeven")
  const winRate = closed.length ? (wins.length / closed.length) * 100 : 0
  const pnls = closed.map(t => pnl(t) ?? 0)
  const totalPnl = pnls.reduce((s, v) => s + v, 0)
  const avgGain = wins.length ? wins.map(t => pnl(t) ?? 0).reduce((s, v) => s + v, 0) / wins.length : 0
  const avgLoss = losses.length ? losses.map(t => pnl(t) ?? 0).reduce((s, v) => s + v, 0) / losses.length : 0
  const bestWin = wins.length ? Math.max(...wins.map(t => pnl(t) ?? 0)) : 0
  const worstLoss = losses.length ? Math.min(...losses.map(t => pnl(t) ?? 0)) : 0
  const rr = avgLoss !== 0 ? Math.abs(avgGain / avgLoss) : 0
  const profitFactor = Math.abs(avgLoss) > 0 ? (avgGain * wins.length) / (Math.abs(avgLoss) * losses.length) : 0
  const streak = (() => {
    let best = 0, cur = 0
    ;[...closed].reverse().forEach(t => { if (t.outcome === "win") { cur++; best = Math.max(best, cur) } else cur = 0 })
    return best
  })()

  const stats = [
    { label: "Total Trades", val: trades.length.toString(), icon: <FileText className="h-4 w-4" />, color: "text-white" },
    { label: "Win Rate", val: closed.length ? winRate.toFixed(0) + "%" : "—", icon: <Percent className="h-4 w-4" />, color: winRate >= 50 ? "text-emerald-400" : "text-red-400" },
    { label: "Total P/L", val: closed.length ? sign(totalPnl) + totalPnl.toFixed(1) + "%" : "—", icon: <DollarSign className="h-4 w-4" />, color: totalPnl >= 0 ? "text-emerald-400" : "text-red-400" },
    { label: "Avg Win", val: wins.length ? "+" + avgGain.toFixed(1) + "%" : "—", icon: <ArrowUpRight className="h-4 w-4" />, color: "text-emerald-400" },
    { label: "Avg Loss", val: losses.length ? avgLoss.toFixed(1) + "%" : "—", icon: <ArrowDownRight className="h-4 w-4" />, color: "text-red-400" },
    { label: "Profit Factor", val: profitFactor ? profitFactor.toFixed(2) : "—", icon: <Activity className="h-4 w-4" />, color: profitFactor >= 1.5 ? "text-emerald-400" : profitFactor >= 1 ? "text-amber-400" : "text-red-400" },
    { label: "Avg R:R", val: rr ? rr.toFixed(2) : "—", icon: <BarChart2 className="h-4 w-4" />, color: rr >= 2 ? "text-emerald-400" : rr >= 1 ? "text-amber-400" : "text-red-400" },
    { label: "Best Win", val: bestWin ? "+" + bestWin.toFixed(1) + "%" : "—", icon: <Trophy className="h-4 w-4" />, color: "text-emerald-400" },
    { label: "Worst Loss", val: worstLoss ? worstLoss.toFixed(1) + "%" : "—", icon: <Zap className="h-4 w-4" />, color: "text-red-400" },
    { label: "Win Streak", val: streak ? streak.toString() : "—", icon: <TrendingUp className="h-4 w-4" />, color: "text-amber-400" },
  ]

  return (
    <div className="grid grid-cols-5 gap-3">
      {stats.map(s => (
        <Card key={s.label} className="bg-white/2 border-white/8 p-4 hover:border-white/15 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-white/30">{s.icon}</span>
            <span className="text-[9px] text-white/35 uppercase tracking-wider font-semibold">{s.label}</span>
          </div>
          <p className={`text-xl font-bold font-mono ${s.color}`}>{s.val}</p>
        </Card>
      ))}
    </div>
  )
}

// ─── Setup Breakdown ───────────────────────────────────────────────────────
function SetupBreakdown({ trades }: { trades: TradeOutcome[] }) {
  const closed = trades.filter(t => t.outcome !== "open")
  const bySetup: Record<string, { total: number; wins: number; pnl: number }> = {}
  closed.forEach(t => {
    const k = t.setup_type ?? "OTHER"
    if (!bySetup[k]) bySetup[k] = { total: 0, wins: 0, pnl: 0 }
    bySetup[k].total++
    if (t.outcome === "win") bySetup[k].wins++
    bySetup[k].pnl += pnl(t) ?? 0
  })
  const rows = Object.entries(bySetup).sort((a, b) => b[1].total - a[1].total)
  if (!rows.length) return <div className="text-center text-white/20 text-xs py-8">No closed trades yet</div>

  return (
    <div className="space-y-2">
      {rows.map(([setup, d]) => {
        const wr = d.total ? (d.wins / d.total) * 100 : 0
        const emoji = SETUP_EMOJI[setup as SetupTag] ?? "•"
        const label = SETUP_LABELS[setup as SetupTag] ?? setup
        return (
          <div key={setup} className="flex items-center gap-3 bg-white/2 rounded-xl px-4 py-2.5 border border-white/6">
            <span className="text-base w-6 shrink-0">{emoji}</span>
            <span className="text-xs text-white font-semibold w-24 shrink-0">{label}</span>
            <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
              <div className={`h-full rounded-full ${wr >= 60 ? "bg-emerald-500" : wr >= 40 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: wr + "%" }} />
            </div>
            <span className={`text-xs font-mono w-10 text-right ${wr >= 50 ? "text-emerald-400" : "text-red-400"}`}>{wr.toFixed(0)}%</span>
            <span className="text-xs text-white/40 font-mono w-8 text-right">{d.total}T</span>
            <span className={`text-xs font-mono w-14 text-right ${d.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>{sign(d.pnl)}{d.pnl.toFixed(1)}%</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Trade Log Table ───────────────────────────────────────────────────────
type SortKey = "traded_at" | "symbol" | "gain_pct" | "outcome"

function TradeTable({ trades, onEdit }: { trades: TradeOutcome[]; onEdit: (t: TradeOutcome) => void }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "traded_at", dir: -1 })
  const [expandId, setExpandId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Outcome | "all">("all")

  const filtered = (filter === "all" ? trades : trades.filter(t => t.outcome === filter))
    .slice().sort((a, b) => {
      const av = sort.key === "gain_pct" ? (pnl(a) ?? -999) : sort.key === "traded_at" ? (a.traded_at ?? "") : (a as any)[sort.key] ?? ""
      const bv = sort.key === "gain_pct" ? (pnl(b) ?? -999) : sort.key === "traded_at" ? (b.traded_at ?? "") : (b as any)[sort.key] ?? ""
      return av < bv ? -sort.dir : av > bv ? sort.dir : 0
    })

  const th = (key: SortKey, label: string, extra = "") => (
    <th onClick={() => setSort(s => ({ key, dir: s.key === key ? -s.dir as 1|-1 : -1 }))}
      className={`py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/40 cursor-pointer hover:text-white/70 select-none text-left ${extra}`}>
      {label} {sort.key === key ? (sort.dir === 1 ? "↑" : "↓") : ""}
    </th>
  )

  const FILTERS: Array<{ id: Outcome | "all"; label: string }> = [
    { id: "all", label: "All" }, { id: "open", label: "Open" }, { id: "win", label: "Wins" }, { id: "loss", label: "Losses" }, { id: "breakeven", label: "B/E" },
  ]

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${filter === f.id ? "bg-sky-500/15 border-sky-500/40 text-sky-400" : "border-white/8 text-white/30 hover:text-white/60 hover:border-white/20"}`}>
            {f.label}
            {f.id !== "all" && <span className="ml-1.5 text-[10px] opacity-60">{trades.filter(t => f.id === "all" || t.outcome === f.id).length}</span>}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-white/8 rounded-2xl text-white/25 text-sm">No trades match this filter.</div>
      ) : (
        <div className="border border-white/8 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-white/3 border-b border-white/8">
              <tr>
                {th("traded_at", "Date")}
                {th("symbol", "Symbol")}
                <th className="py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/40 text-left">Setup</th>
                <th className="py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/40 text-right">Entry</th>
                <th className="py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/40 text-right">Exit</th>
                {th("gain_pct", "P/L %", "text-right")}
                {th("outcome", "Result")}
                <th className="py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/40 text-left">Notes</th>
                <th className="py-2.5 px-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => {
                const g = pnl(t)
                const oc = OC[t.outcome as Outcome] ?? OC.open
                const date = t.traded_at ? new Date(t.traded_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }) : "—"
                const setup = t.setup_type ? (SETUP_EMOJI[t.setup_type as SetupTag] ?? "") + " " + (SETUP_LABELS[t.setup_type as SetupTag] ?? t.setup_type) : "—"
                const exp = expandId === t.id
                return [
                  <tr key={t.id} onClick={() => setExpandId(exp ? null : t.id)}
                    className="border-b border-white/5 hover:bg-white/2 cursor-pointer transition-colors">
                    <td className="py-3 px-3 text-xs text-white/50 font-mono whitespace-nowrap">{date}</td>
                    <td className="py-3 px-3 text-sm font-bold text-white font-mono">{t.symbol}</td>
                    <td className="py-3 px-3 text-xs text-white/60">{setup}</td>
                    <td className="py-3 px-3 text-xs font-mono text-white/80 text-right">{t.entry_price ? `$${fmt(t.entry_price)}` : "—"}</td>
                    <td className="py-3 px-3 text-xs font-mono text-white/80 text-right">{t.exit_price ? `$${fmt(t.exit_price)}` : "—"}</td>
                    <td className={`py-3 px-3 text-sm font-bold font-mono text-right ${g == null ? "text-white/20" : g >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {g != null ? sign(g) + g.toFixed(2) + "%" : "—"}
                    </td>
                    <td className="py-3 px-3">
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${oc.bg} ${oc.color}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${oc.dot}`}/>{oc.label}
                      </div>
                    </td>
                    <td className="py-3 px-3 max-w-[160px]">
                      <p className="text-xs text-white/40 truncate">{t.notes || "—"}</p>
                    </td>
                    <td className="py-3 px-3">
                      <button onClick={e => { e.stopPropagation(); onEdit(t) }}
                        className="text-sky-400/60 hover:text-sky-400 transition-colors">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>,
                  exp && (
                    <tr key={t.id + "-exp"} className="bg-white/1 border-b border-white/5">
                      <td colSpan={9} className="px-4 py-3 text-xs text-white/50 leading-relaxed">
                        {t.notes ? <p>{t.notes}</p> : <p className="italic text-white/20">No notes.</p>}
                      </td>
                    </tr>
                  )
                ]
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Trade Form ────────────────────────────────────────────────────────────
function TradeForm({ initial, onSave, onCancel, saving }: {
  initial?: JournalFormState; onSave: (f: JournalFormState) => void
  onCancel: () => void; saving: boolean
}) {
  const [form, setForm] = useState<JournalFormState>(initial ?? BLANK)
  const set = (k: keyof JournalFormState) => (v: string) => setForm(f => ({ ...f, [k]: v }))
  const entry = parseFloat(form.entry_price), exit = parseFloat(form.exit_price)
  const preview = !isNaN(entry) && !isNaN(exit) && entry > 0 ? gainPct(entry, exit) : null

  return (
    <div className="bg-[#0b1120] border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-sky-400" />
          {initial ? "Edit Trade" : "Log a New Trade"}
        </h3>
        <button onClick={onCancel} className="text-white/30 hover:text-white transition-colors"><X className="h-4 w-4" /></button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1.5">Ticker *</label>
          <input value={form.symbol} onChange={e => set("symbol")(e.target.value.toUpperCase())} placeholder="AAPL"
            className="w-full bg-black/40 border border-white/10 text-white font-mono text-sm rounded-lg px-3 py-2.5 focus:border-sky-500 focus:outline-none placeholder-white/20" />
        </div>
        <div>
          <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1.5">Setup Type</label>
          <select value={form.setup_type} onChange={e => set("setup_type")(e.target.value)}
            className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:border-sky-500 focus:outline-none">
            {(Object.keys(SETUP_LABELS) as SetupTag[]).map(k => (
              <option key={k} value={k}>{SETUP_EMOJI[k]} {SETUP_LABELS[k]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1.5">Trade Date</label>
          <input type="date" value={form.traded_at} onChange={e => set("traded_at")(e.target.value)}
            className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:border-sky-500 focus:outline-none" />
        </div>
        <div>
          <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1.5">Entry Price *</label>
          <input type="number" step="0.01" value={form.entry_price} onChange={e => set("entry_price")(e.target.value)} placeholder="0.00"
            className="w-full bg-black/40 border border-white/10 text-white font-mono text-sm rounded-lg px-3 py-2.5 focus:border-sky-500 focus:outline-none placeholder-white/20" />
        </div>
        <div>
          <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1.5">
            Exit Price
            {preview !== null && <span className={`ml-2 font-mono font-bold ${preview >= 0 ? "text-emerald-400" : "text-red-400"}`}>{sign(preview)}{preview.toFixed(2)}%</span>}
          </label>
          <input type="number" step="0.01" value={form.exit_price} onChange={e => set("exit_price")(e.target.value)} placeholder="leave blank if open"
            className="w-full bg-black/40 border border-white/10 text-white font-mono text-sm rounded-lg px-3 py-2.5 focus:border-sky-500 focus:outline-none placeholder-white/20" />
        </div>
        <div>
          <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1.5">Shares / Contracts</label>
          <input type="number" step="1" value={form.shares} onChange={e => set("shares")(e.target.value)} placeholder="optional"
            className="w-full bg-black/40 border border-white/10 text-white font-mono text-sm rounded-lg px-3 py-2.5 focus:border-sky-500 focus:outline-none placeholder-white/20" />
        </div>
        <div className="col-span-3">
          <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-2">Result</label>
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(OC) as Outcome[]).map(o => {
              const cfg = OC[o], active = form.outcome === o
              return (
                <button key={o} onClick={() => set("outcome")(o)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-semibold transition-all ${active ? cfg.bg + " " + cfg.color + " ring-1 ring-current/30" : "border-white/8 text-white/30 hover:border-white/20 hover:text-white/60"}`}>
                  <div className={`w-2 h-2 rounded-full ${cfg.dot}`}/>{cfg.label}
                </button>
              )
            })}
          </div>
        </div>
        <div className="col-span-3">
          <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1.5">Notes / Lessons / Mistakes</label>
          <textarea value={form.notes} onChange={e => set("notes")(e.target.value)} rows={3}
            placeholder="What was the setup? What worked? What didn't? Emotions? Execution mistakes? Lessons for next time?"
            className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:border-sky-500 focus:outline-none placeholder-white/20 resize-none" />
        </div>
        <div className="col-span-3">
          <div className="flex items-start gap-3 bg-sky-500/8 border border-sky-500/20 rounded-xl px-4 py-3">
            <input
              type="checkbox"
              id="crowdsource-toggle"
              checked={form.is_crowdsource_eligible}
              onChange={e => setForm(f => ({ ...f, is_crowdsource_eligible: e.target.checked }))}
              className="mt-0.5 w-4 h-4 rounded accent-sky-500 cursor-pointer shrink-0"
            />
            <label htmlFor="crowdsource-toggle" className="cursor-pointer">
              <span className="text-xs font-semibold text-sky-400 block mb-0.5">
                Contribute anonymously to AI training
              </span>
              <span className="text-[10px] text-white/40 leading-relaxed">
                Share this trade anonymously with the community pool. Your identity is never shared —
                only setup type, score, and outcome are used to improve Sean AI for everyone.
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-white/6">
        <Button variant="outline" size="sm" onClick={onCancel} className="border-white/10 text-white/50 hover:text-white text-xs">Cancel</Button>
        <Button size="sm" disabled={saving || !form.symbol || !form.entry_price} onClick={() => onSave(form)}
          className="bg-sky-600 hover:bg-sky-500 text-white text-xs min-w-[100px]">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Check className="h-3.5 w-3.5 mr-1.5" />Save Trade</>}
        </Button>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function JournalAnalyticsPage() {
  const [trades, setTrades] = useState<TradeOutcome[]>([])
  const [queries, setQueries] = useState<AIQueryLog[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<TradeOutcome | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>("dashboard")

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [td, qd] = await Promise.all([getTradeOutcomes(500), getAIQueryLog(100)])
      setTrades(td.outcomes || [])
      setQueries(qd.queries || [])
    } catch (e) { setError(e instanceof Error ? e.message : "Load failed") }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async (form: JournalFormState) => {
    setSaving(true); setError(null)
    try {
      const entry = parseFloat(form.entry_price)
      const exit = form.exit_price ? parseFloat(form.exit_price) : undefined
      const g = exit != null && entry > 0 ? gainPct(entry, exit) : undefined
      const tradedAt = form.traded_at ? new Date(form.traded_at).toISOString() : undefined
      if (editTarget) {
        await updateTradeOutcome(editTarget.id, { exit_price: exit, gain_pct: g, outcome: form.outcome, notes: form.notes })
      } else {
        await logTradeOutcome({ symbol: form.symbol, setup_type: form.setup_type, entry_price: entry, exit_price: exit, gain_pct: g, outcome: form.outcome, notes: form.notes, traded_at: tradedAt, is_crowdsource_eligible: form.is_crowdsource_eligible })
      }
      setShowForm(false); setEditTarget(null); await load()
    } catch (e) { setError(e instanceof Error ? e.message : "Save failed") }
    finally { setSaving(false) }
  }

  const startEdit = (t: TradeOutcome) => {
    setEditTarget(t)
    setShowForm(true)
    setActiveTab("log")
  }

  const closed = trades.filter(t => t.outcome !== "open")
  const wins = closed.filter(t => t.outcome === "win")
  const losses = closed.filter(t => t.outcome === "loss")
  const bes = closed.filter(t => t.outcome === "breakeven")

  const TABS: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
    { id: "dashboard", label: "Dashboard",   icon: <BarChart3 className="h-3.5 w-3.5" /> },
    { id: "trades",    label: "Trade Log",   icon: <FileText className="h-3.5 w-3.5" /> },
    { id: "log",       label: "Log Trade",   icon: <Plus className="h-3.5 w-3.5" /> },
    { id: "ai",        label: "AI Queries",  icon: <Search className="h-3.5 w-3.5" /> },
  ]

  return (
    <div className="min-h-screen bg-black">
      <Sidebar />
      <div className="min-h-screen ml-[var(--sidebar-w,60px)] transition-[margin-left] duration-300 ease-in-out">

        {/* Header */}
        <header className="fixed top-0 left-[var(--sidebar-w,60px)] transition-[left] duration-300 ease-in-out right-0 z-50 border-b border-white/5 bg-neutral-950/90 backdrop-blur-xl">
          <div className="flex h-14 items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-sky-500/20 to-indigo-500/20 ring-1 ring-white/10">
                <BookOpen className="h-4 w-4 text-sky-400" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-white leading-tight">Trade Journal</h1>
                <p className="text-[10px] text-neutral-500 leading-tight">Full performance tracking · P&L analytics · Setup breakdown</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={load} disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/5 border border-white/8 transition-colors">
                <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />Refresh
              </button>
              <button onClick={() => { setEditTarget(null); setShowForm(true); setActiveTab("log") }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-sky-600 hover:bg-sky-500 text-white transition-colors font-semibold">
                <Plus className="h-3.5 w-3.5" />Log Trade
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-t border-white/5 px-6">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${activeTab === t.id ? "border-sky-500 text-sky-400" : "border-transparent text-white/35 hover:text-white/65"}`}>
                {t.icon}{t.label}
                {t.id === "trades" && trades.length > 0 && (
                  <span className="ml-1 bg-white/10 text-white/50 rounded-full px-1.5 py-0.5 text-[9px] font-mono">{trades.length}</span>
                )}
              </button>
            ))}
          </div>
        </header>

        <main className="pt-[106px] p-6">
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl px-4 py-3 mb-5">
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="h-8 w-8 text-sky-400 animate-spin mb-4" />
              <p className="text-white/40 text-sm">Loading journal…</p>
            </div>
          ) : (
            <>
              {/* ── DASHBOARD TAB ── */}
              {activeTab === "dashboard" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  {trades.length === 0 ? (
                    <div className="text-center py-24 border border-dashed border-white/8 rounded-2xl">
                      <BookOpen className="h-12 w-12 text-white/10 mx-auto mb-4" />
                      <p className="text-white/30 text-sm mb-2">No trades logged yet</p>
                      <p className="text-white/15 text-xs mb-6">Start tracking your trades to see P&L analytics, equity curve, and setup breakdowns</p>
                      <button onClick={() => { setActiveTab("log"); setShowForm(true) }}
                        className="text-xs text-sky-400 border border-sky-500/30 px-5 py-2.5 rounded-xl hover:bg-sky-500/10 transition-colors font-semibold">
                        Log your first trade
                      </button>
                    </div>
                  ) : (
                    <>
                      <StatsRow trades={trades} />

                      <div className="grid grid-cols-3 gap-5">
                        {/* P&L Calendar */}
                        <Card className="col-span-1 bg-white/2 border-white/8 p-5">
                          <h3 className="text-xs font-semibold text-white/70 mb-4 flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-sky-400" />P&L Calendar
                          </h3>
                          <PnlCalendar trades={trades} />
                        </Card>

                        {/* Equity Curve */}
                        <Card className="col-span-2 bg-white/2 border-white/8 p-5">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-semibold text-white/70 flex items-center gap-2">
                              <Activity className="h-3.5 w-3.5 text-emerald-400" />Equity Curve
                            </h3>
                            <span className="text-[10px] text-white/30">{closed.length} closed trades</span>
                          </div>
                          <EquityCurve trades={trades} />
                          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400"/><span className="text-[10px] text-white/40">Cumulative P/L %</span></div>
                            <div className="flex items-center gap-2"><div className="w-4 h-px bg-white/20" style={{ borderStyle: "dashed", borderWidth: "0 0 1px", borderColor: "rgba(255,255,255,0.2)" }}/><span className="text-[10px] text-white/40">Breakeven</span></div>
                          </div>
                        </Card>
                      </div>

                      <div className="grid grid-cols-3 gap-5">
                        {/* Win/Loss Donut */}
                        <Card className="bg-white/2 border-white/8 p-5">
                          <h3 className="text-xs font-semibold text-white/70 mb-4 flex items-center gap-2">
                            <Target className="h-3.5 w-3.5 text-sky-400" />Win / Loss Split
                          </h3>
                          <div className="flex items-center gap-6">
                            <DonutChart wins={wins.length} losses={losses.length} bes={bes.length} />
                            <div className="space-y-2 flex-1">
                              {[
                                { label: "Wins",   count: wins.length,   color: "bg-emerald-400" },
                                { label: "Losses", count: losses.length, color: "bg-red-400" },
                                { label: "B/E",    count: bes.length,    color: "bg-amber-400" },
                                { label: "Open",   count: trades.filter(t => t.outcome === "open").length, color: "bg-sky-400" },
                              ].map(r => (
                                <div key={r.label} className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${r.color}`} />
                                  <span className="text-xs text-white/60">{r.label}</span>
                                  <span className="text-xs font-mono text-white/80 ml-auto">{r.count}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </Card>

                        {/* Setup Breakdown */}
                        <Card className="col-span-2 bg-white/2 border-white/8 p-5">
                          <h3 className="text-xs font-semibold text-white/70 mb-4 flex items-center gap-2">
                            <BarChart2 className="h-3.5 w-3.5 text-indigo-400" />Setup Breakdown
                          </h3>
                          <SetupBreakdown trades={trades} />
                        </Card>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* ── TRADES TAB ── */}
              {activeTab === "trades" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {trades.length === 0 ? (
                    <div className="text-center py-24 border border-dashed border-white/8 rounded-2xl text-white/25 text-sm">
                      No trades yet.
                      <button onClick={() => { setActiveTab("log"); setShowForm(true) }} className="mt-4 block mx-auto text-xs text-sky-400 border border-sky-500/30 px-4 py-2 rounded-lg hover:bg-sky-500/10">Log first trade</button>
                    </div>
                  ) : (
                    <TradeTable trades={trades} onEdit={startEdit} />
                  )}
                </motion.div>
              )}

              {/* ── LOG TRADE TAB ── */}
              {activeTab === "log" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {showForm ? (
                    <TradeForm
                      key={editTarget?.id ?? "new"}
                      initial={editTarget ? {
                        symbol: editTarget.symbol,
                        setup_type: (editTarget.setup_type as SetupTag) ?? "BREAKOUT",
                        entry_price: String(editTarget.entry_price ?? ""),
                        exit_price: String(editTarget.exit_price ?? ""),
                        outcome: (editTarget.outcome as Outcome) ?? "open",
                        notes: editTarget.notes ?? "",
                        traded_at: editTarget.traded_at ? editTarget.traded_at.split("T")[0] : new Date().toISOString().split("T")[0],
                        shares: "",
                        is_crowdsource_eligible: false,
                      } : undefined}
                      onSave={handleSave}
                      onCancel={() => { setShowForm(false); setEditTarget(null) }}
                      saving={saving}
                    />
                  ) : (
                    <div className="text-center py-16">
                      <BookOpen className="h-10 w-10 text-white/10 mx-auto mb-4" />
                      <p className="text-white/30 text-sm mb-4">Ready to log a trade?</p>
                      <button onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-sm rounded-xl font-semibold transition-colors">
                        <Plus className="h-4 w-4" />New Trade Entry
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── AI QUERIES TAB ── */}
              {activeTab === "ai" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { label: "Total Queries",  val: queries.length,                                              color: "text-white",       icon: <Search className="h-4 w-4 text-purple-400" /> },
                      { label: "Stock Analysis", val: queries.filter(q => q.category === "stock_analysis").length, color: "text-blue-400",    icon: <BarChart3 className="h-4 w-4 text-blue-400" /> },
                      { label: "Pattern",        val: queries.filter(q => q.category === "pattern").length,        color: "text-purple-400",  icon: <TrendingUp className="h-4 w-4 text-purple-400" /> },
                      { label: "Risk Mgmt",      val: queries.filter(q => q.category === "risk_management").length,color: "text-orange-400",  icon: <AlertCircle className="h-4 w-4 text-orange-400" /> },
                    ].map(s => (
                      <Card key={s.label} className="bg-white/2 border-white/8 p-5">
                        <div className="flex justify-between mb-2">{s.icon}<span className="text-[10px] text-white/35">{s.label}</span></div>
                        <p className={`text-3xl font-bold font-mono ${s.color}`}>{s.val}</p>
                      </Card>
                    ))}
                  </div>
                  {queries.length === 0 ? (
                    <Card className="bg-white/2 border-white/8 p-10 text-center">
                      <p className="text-white/30">No AI queries yet.</p>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {queries.map(q => (
                        <Card key={q.id} className="bg-white/2 border-white/8 p-4 hover:border-white/15 transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <Badge className="mb-1.5 text-[9px] bg-purple-500/15 text-purple-400 border-purple-500/30">{q.category.replace("_", " ")}</Badge>
                              <p className="text-sm text-white/75 line-clamp-2">{q.query_text}</p>
                            </div>
                            <p className="text-xs text-white/30 whitespace-nowrap shrink-0">
                              {new Date(q.queried_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
