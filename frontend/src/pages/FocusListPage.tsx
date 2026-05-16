import { useState, useEffect, useCallback, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { TradingViewWidget } from "@/components/dashboard/TradingViewWidget"
import { EmbeddedOptionsChain } from "@/components/dashboard/EmbeddedOptionsChain"
import { OptionsTradePanel } from "@/components/dashboard/OptionsTradePanel"
import type { OptionsContract } from "@/components/dashboard/OptionsChain"
import {
  getWatchlist, addToWatchlist, removeFromWatchlist,
  getWatchlistPrices, getLastScan, updateWatchlistItem,
  aiScanSymbol,
  type WatchlistItem, type TickerPrice, type LastScan, type AISymbolAnalysis,
} from "@/lib/api"
import {
  Heart, X, Plus, Star, Loader2,
  RefreshCw, Bell, BellOff, TrendingUp, TrendingDown,
  Minus, ChevronRight, Sparkles,
} from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

// ── Helpers ────────────────────────────────────────────────────────────────────

function scoreColor(s: number) {
  return s >= 70 ? "text-emerald-400" : s >= 45 ? "text-yellow-400" : "text-red-400"
}

function DirectionDot({ scan }: { scan: LastScan | null }) {
  if (!scan) return <span className="h-2 w-2 rounded-full bg-white/20 inline-block" />
  const bullish = scan.price > scan.ema21 && scan.ema21 > scan.ema50
  return (
    <span
      title={bullish ? "Last scan: bullish" : "Last scan: bearish"}
      className={cn("h-2 w-2 rounded-full inline-block shrink-0", bullish ? "bg-emerald-400" : "bg-red-400")}
    />
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ListItem({
  item,
  price,
  lastScan,
  selected,
  onClick,
  onRemove,
}: {
  item: WatchlistItem
  price?: TickerPrice
  lastScan: LastScan | null
  selected: boolean
  onClick: () => void
  onRemove: () => void
}) {
  const change = price?.change_pct ?? null
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3 rounded-xl border transition-all duration-150 group relative",
        selected
          ? "bg-pink-500/10 border-pink-500/30"
          : "bg-white/2 border-white/5 hover:bg-white/5 hover:border-white/15"
      )}
    >
      <div className="flex items-center gap-3">
        <DirectionDot scan={lastScan} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">{item.symbol}</span>
            {item.alert_enabled && item.alert_price && (
              <Bell className="h-3 w-3 text-yellow-400 shrink-0" />
            )}
          </div>
          <p className="text-xs text-white/40 truncate">
            Added {new Date(item.added_at).toLocaleDateString()}
          </p>
        </div>
        <div className="text-right shrink-0">
          {price ? (
            <>
              <p className="text-sm font-semibold text-white">${price.price.toFixed(2)}</p>
              <p className={cn("text-xs font-medium", change !== null && change >= 0 ? "text-emerald-400" : "text-red-400")}>
                {change !== null ? `${change >= 0 ? "+" : ""}${change.toFixed(2)}%` : "—"}
              </p>
            </>
          ) : (
            <p className="text-xs text-white/30">—</p>
          )}
        </div>
        <ChevronRight className={cn("h-4 w-4 shrink-0 text-white/20 transition-transform", selected && "rotate-90 text-pink-400")} />
      </div>
      {selected && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-pink-400 rounded-r" />
      )}
      <button
        onClick={e => { e.stopPropagation(); onRemove() }}
        className="absolute top-2 right-8 hidden group-hover:flex p-1 rounded hover:bg-white/10"
      >
        <X className="h-3 w-3 text-white/40" />
      </button>
    </button>
  )
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

function AlertSection({
  symbol,
  alertEnabled,
  alertPrice,
  onSave,
}: {
  symbol: string
  alertEnabled: boolean
  alertPrice?: number | null
  onSave: (enabled: boolean, price: number | null) => void
}) {
  const [enabled, setEnabled] = useState(alertEnabled)
  const [price, setPrice] = useState(alertPrice?.toString() ?? "")
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const parsedPrice = parseFloat(price)
    const priceVal = !isNaN(parsedPrice) && parsedPrice > 0 ? parsedPrice : null
    await onSave(enabled, priceVal)
    setSaving(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-yellow-400" />
          <span className="text-sm font-semibold text-white/80">Price Alert</span>
        </div>
        <button
          onClick={() => setEnabled(e => !e)}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border",
            enabled
              ? "bg-yellow-500/20 border-yellow-500/30 text-yellow-400"
              : "bg-white/5 border-white/10 text-white/40"
          )}
        >
          {enabled ? <Bell className="h-3 w-3" /> : <BellOff className="h-3 w-3" />}
          {enabled ? "On" : "Off"}
        </button>
      </div>
      {enabled && (
        <div className="flex gap-2">
          <Input
            placeholder="Alert price (e.g. 185.00)"
            value={price}
            onChange={e => setPrice(e.target.value)}
            type="number"
            step="0.01"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9 text-sm"
          />
          <Button
            onClick={handleSave}
            disabled={saving}
            size="sm"
            className="bg-yellow-600 hover:bg-yellow-500 text-white h-9 shrink-0"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
          </Button>
        </div>
      )}
      {!enabled && alertEnabled && alertPrice && (
        <p className="text-xs text-white/30">Previous alert at ${alertPrice.toFixed(2)}</p>
      )}
    </div>
  )
}

function NotesSection({
  symbol,
  initialNotes,
  onSave,
}: {
  symbol: string
  initialNotes?: string | null
  onSave: (notes: string) => void
}) {
  const [notes, setNotes] = useState(initialNotes ?? "")
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle")
  const debouncedNotes = useDebounce(notes, 1000)
  const didMount = useRef(false)

  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return }
    setStatus("saving")
    const t = setTimeout(async () => {
      await onSave(debouncedNotes)
      setStatus("saved")
      setTimeout(() => setStatus("idle"), 1500)
    }, 0)
    return () => clearTimeout(t)
  }, [debouncedNotes, onSave])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-white/80">Notes</span>
        {status === "saving" && <span className="text-xs text-white/30">Saving…</span>}
        {status === "saved" && <span className="text-xs text-emerald-400">Saved ✓</span>}
      </div>
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder={`Notes for ${symbol}…`}
        rows={3}
        className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-white/20"
      />
    </div>
  )
}

function EmaRow({ label, ema, price, color }: { label: string; ema: number; price: number; color: string }) {
  const above = price > ema
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
      <span className="text-xs text-white/50">{label}</span>
      <div className="flex items-center gap-3">
        <span className={cn("text-xs font-mono", color)}>${ema.toFixed(2)}</span>
        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded", above ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400")}>
          {above ? "▲ above" : "▼ below"}
        </span>
      </div>
    </div>
  )
}

// ── Detail Panel ───────────────────────────────────────────────────────────────

function DetailPanel({
  item,
  lastScan,
  onAlertSave,
  onNotesSave,
}: {
  item: WatchlistItem
  lastScan: LastScan | null
  onAlertSave: (enabled: boolean, price: number | null) => void
  onNotesSave: (notes: string) => void
}) {
  const [aiResult, setAiResult] = useState<AISymbolAnalysis | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [optionsContract, setOptionsContract] = useState<OptionsContract | null>(null)
  const [optionsPanelOpen, setOptionsPanelOpen] = useState(false)

  const handleScan = async () => {
    setScanning(true)
    setScanError(null)
    try {
      const result = await aiScanSymbol(item.symbol)
      setAiResult(result)
    } catch (e: unknown) {
      setScanError(e instanceof Error ? e.message : "Scan failed")
    } finally {
      setScanning(false)
    }
  }

  // Determine direction for banner and options chain
  const direction = (aiResult?.direction as "Long" | "Short" | null | undefined)
    ?? (lastScan && lastScan.price > lastScan.ema21 && lastScan.ema21 > lastScan.ema50 ? "Long" as const : null)

  const entry = aiResult?.suggested_entry ?? null
  const stop = aiResult?.suggested_stop ?? null
  const target = aiResult?.suggested_target ?? null
  const currentPrice = aiResult?.price ?? lastScan?.price ?? 0

  return (
    <div className="h-full overflow-y-auto space-y-5 pr-1">
      {/* TradingView chart */}
      <div className="rounded-xl overflow-hidden bg-black/60 border border-white/10 h-[380px]">
        <TradingViewWidget
          symbol={item.symbol}
          interval="D"
          theme="dark"
          height={380}
          entry={entry}
          stop={stop}
          target={target}
          direction={direction ?? undefined}
        />
      </div>

      {/* Options recommendation banner */}
      {direction ? (
        <div className={cn(
          "rounded-xl border px-4 py-3 flex items-center justify-between gap-4 flex-wrap",
          direction === "Long" ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"
        )}>
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xl shrink-0">{direction === "Long" ? "📈" : "📉"}</span>
            <div>
              <p className={cn("font-semibold text-sm", direction === "Long" ? "text-emerald-400" : "text-red-400")}>
                {direction === "Long" ? "CALLS recommended" : "PUTS recommended"}
              </p>
              <p className="text-xs text-white/50">
                {aiResult?.key_factors?.[0] ?? aiResult?.trend ?? (direction === "Long" ? "Bullish signal from last scan" : "Bearish signal from last scan")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs shrink-0">
            <div className="text-center">
              <p className="text-white/40 mb-0.5">Strike</p>
              <p className="text-white font-semibold">ATM / Slight OTM</p>
            </div>
            {aiResult?.suggested_expiry && (
              <div className="text-center">
                <p className="text-white/40 mb-0.5">Expiry</p>
                <p className="text-white font-semibold">{aiResult.suggested_expiry}</p>
              </div>
            )}
            {aiResult?.confidence && (
              <div className="text-center">
                <p className="text-white/40 mb-0.5">Confidence</p>
                <p className={cn("font-semibold", scoreColor(aiResult.confidence))}>{aiResult.confidence}%</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex items-center gap-3">
          <span className="text-lg">⚠️</span>
          <p className="text-sm text-white/50">No strong options signal — run AI scan for directional analysis</p>
        </div>
      )}

      {/* AI Scan / Last scan analysis */}
      <div className="bg-white/3 border border-white/10 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Analysis</h4>
          </div>
          <Button
            onClick={handleScan}
            disabled={scanning}
            size="sm"
            className="bg-emerald-700 hover:bg-emerald-600 text-white h-8 px-3 text-xs"
          >
            {scanning ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
            {scanning ? "Scanning…" : "Run AI Scan"}
          </Button>
        </div>

        {scanError && <p className="text-xs text-red-400">{scanError}</p>}

        {aiResult ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className={cn("border px-3 py-1 text-sm font-bold",
                aiResult.direction === "Long" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" :
                aiResult.direction === "Short" ? "bg-red-500/20 text-red-400 border-red-500/40" :
                "bg-white/10 text-white/60 border-white/20"
              )}>
                {aiResult.direction === "Long" ? <TrendingUp className="h-3.5 w-3.5 mr-1 inline" /> : aiResult.direction === "Short" ? <TrendingDown className="h-3.5 w-3.5 mr-1 inline" /> : <Minus className="h-3.5 w-3.5 mr-1 inline" />}
                {aiResult.direction ?? "Neutral"}
              </Badge>
              <span className={cn("text-3xl font-bold", scoreColor(aiResult.opportunity_score))}>{aiResult.opportunity_score}</span>
              <span className="text-xs text-white/40">Confidence {aiResult.confidence}%</span>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">{aiResult.analysis}</p>
            {aiResult.key_factors.length > 0 && (
              <div className="space-y-1.5">
                {aiResult.key_factors.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-white/60">
                    <span className="mt-1 h-1 w-1 rounded-full bg-primary/60 shrink-0" />{f}
                  </div>
                ))}
              </div>
            )}
            {/* Trade levels */}
            {(entry || stop || target) && (
              <div className="grid grid-cols-3 gap-2 pt-2">
                {[
                  { label: "Entry", val: entry, cls: "border-cyan-500/20 bg-cyan-500/10 text-cyan-400" },
                  { label: "Stop", val: stop, cls: "border-red-500/20 bg-red-500/10 text-red-400" },
                  { label: "Target", val: target, cls: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" },
                ].map(({ label, val, cls }) => (
                  <div key={label} className={cn("rounded-lg border p-2 text-center", cls)}>
                    <p className="text-[10px] font-semibold uppercase opacity-70 mb-0.5">{label}</p>
                    <p className="text-base font-bold text-white">{val ? `$${val.toFixed(2)}` : "—"}</p>
                  </div>
                ))}
              </div>
            )}
            {aiResult.suggested_expiry && (
              <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-2">
                <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider">Contract Expiry</span>
                <span className="text-sm font-bold text-white ml-auto">{aiResult.suggested_expiry}</span>
              </div>
            )}
          </div>
        ) : lastScan ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className="bg-white/10 border border-white/20 text-white/60 text-xs">
                {lastScan.setup_type.replace("_", " ")}
              </Badge>
              <span className={cn("text-2xl font-bold", scoreColor(lastScan.breakout_score))}>{lastScan.breakout_score}</span>
              <span className="text-xs text-white/30">Score · {new Date(lastScan.scanned_at).toLocaleDateString()}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/5 rounded-lg p-2">
                <p className="text-white/40 mb-0.5">Trigger Price</p>
                <p className="font-semibold text-white">${lastScan.trigger_price.toFixed(2)}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-2">
                <p className="text-white/40 mb-0.5">Distance</p>
                <p className="font-semibold text-cyan-400">{lastScan.distance_pct.toFixed(2)}%</p>
              </div>
            </div>
            {lastScan.notes && lastScan.notes.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {lastScan.notes.map((n, i) => (
                  <span key={i} className="px-2 py-0.5 bg-white/5 rounded text-[10px] text-white/50">{n}</span>
                ))}
              </div>
            )}
            <p className="text-xs text-white/30 italic">Run AI Scan for directional analysis and trade levels</p>
          </div>
        ) : (
          <p className="text-sm text-white/40">No scan history. Click "Run AI Scan" to analyze.</p>
        )}
      </div>

      {/* EMA relationships */}
      {lastScan && (
        <div className="bg-white/3 border border-white/10 rounded-xl p-4 space-y-1">
          <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Price vs EMAs</h4>
          <EmaRow label="vs EMA 21" ema={lastScan.ema21} price={lastScan.price} color="text-cyan-300" />
          <EmaRow label="vs EMA 50" ema={lastScan.ema50} price={lastScan.price} color="text-yellow-300" />
          <EmaRow label="vs EMA 200" ema={lastScan.ema200} price={lastScan.price} color="text-purple-300" />
        </div>
      )}

      {/* Embedded options chain */}
      <div className="bg-white/3 border border-white/10 rounded-xl p-4">
        <EmbeddedOptionsChain
          ticker={item.symbol}
          currentPrice={currentPrice || lastScan?.price || 1}
          entryPrice={entry}
          stopPrice={stop}
          direction={direction ?? null}
          onTradeClick={(contract) => {
            setOptionsContract(contract)
            setOptionsPanelOpen(true)
          }}
        />
      </div>

      {/* Price alert */}
      <div className="bg-white/3 border border-white/10 rounded-xl p-4">
        <AlertSection
          symbol={item.symbol}
          alertEnabled={item.alert_enabled}
          alertPrice={item.alert_price}
          onSave={onAlertSave}
        />
      </div>

      {/* Notes */}
      <div className="bg-white/3 border border-white/10 rounded-xl p-4">
        <NotesSection
          symbol={item.symbol}
          initialNotes={item.notes}
          onSave={onNotesSave}
        />
      </div>

      {/* OptionsTradePanel */}
      {optionsPanelOpen && (
        <OptionsTradePanel
          ticker={item.symbol}
          isOpen={optionsPanelOpen}
          onClose={() => { setOptionsPanelOpen(false); setOptionsContract(null) }}
          initialContract={optionsContract ?? undefined}
        />
      )}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function FocusListPage() {
  const [focusItems, setFocusItems] = useState<WatchlistItem[]>([])
  const [prices, setPrices] = useState<Record<string, TickerPrice>>({})
  const [lastScans, setLastScans] = useState<Record<string, LastScan | null>>({})
  const [loading, setLoading] = useState(true)
  const [pricesLoading, setPricesLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)
  const [newSymbol, setNewSymbol] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [adding, setAdding] = useState(false)

  const selectedItem = focusItems.find(i => i.symbol === selectedSymbol) ?? null

  const fetchWatchlist = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const items = await getWatchlist()
      setFocusItems(items)
      return items
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load watchlist")
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPrices = useCallback(async (symbols: string[]) => {
    if (!symbols.length) return
    setPricesLoading(true)
    try {
      const data = await getWatchlistPrices(symbols)
      setPrices(data)
    } finally {
      setPricesLoading(false)
    }
  }, [])

  const fetchLastScans = useCallback(async (symbols: string[]) => {
    const results = await Promise.allSettled(
      symbols.map(async (sym) => {
        const scan = await getLastScan(sym)
        return { sym, scan }
      })
    )
    const map: Record<string, LastScan | null> = {}
    for (const r of results) {
      if (r.status === "fulfilled") map[r.value.sym] = r.value.scan
    }
    setLastScans(map)
  }, [])

  useEffect(() => {
    fetchWatchlist().then((items) => {
      const syms = items.map(i => i.symbol)
      fetchPrices(syms)
      fetchLastScans(syms)
    })
  }, [fetchWatchlist, fetchPrices, fetchLastScans])

  const handleRemove = async (symbol: string) => {
    try {
      await removeFromWatchlist(symbol)
      setFocusItems(prev => prev.filter(i => i.symbol !== symbol))
      if (selectedSymbol === symbol) setSelectedSymbol(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to remove")
    }
  }

  const handleAdd = async () => {
    const sym = newSymbol.trim().toUpperCase()
    if (!sym || !/^[A-Z]{1,10}$/.test(sym)) {
      setError("Enter a valid symbol (letters only, max 10 chars)")
      return
    }
    try {
      setAdding(true)
      setError(null)
      const newItem = await addToWatchlist(sym)
      setFocusItems(prev => [newItem, ...prev])
      setNewSymbol("")
      setShowAddForm(false)
      setSelectedSymbol(sym)
      // Fetch price + last scan for new item
      fetchPrices([sym])
      fetchLastScans([sym])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add")
    } finally {
      setAdding(false)
    }
  }

  const handleAlertSave = async (symbol: string, enabled: boolean, price: number | null) => {
    try {
      await updateWatchlistItem(symbol, { alert_enabled: enabled, alert_price: price })
      setFocusItems(prev => prev.map(i => i.symbol === symbol ? { ...i, alert_enabled: enabled, alert_price: price ?? undefined } : i))
    } catch {
      setError("Failed to save alert")
    }
  }

  const handleNotesSave = async (symbol: string, notes: string) => {
    try {
      await updateWatchlistItem(symbol, { notes })
      setFocusItems(prev => prev.map(i => i.symbol === symbol ? { ...i, notes } : i))
    } catch {
      // silent
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <Sidebar />

      <div className="min-h-screen ml-[var(--sidebar-w,60px)] flex flex-col transition-[margin-left] duration-300 ease-in-out">
        {/* Header */}
        <header className="fixed top-0 left-[var(--sidebar-w,60px)] right-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-xl transition-[left] duration-300 ease-in-out">
          <div className="flex h-16 items-center justify-between px-6">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-500/15 ring-1 ring-white/10">
                <Star className="h-5 w-5 text-pink-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Focus List</h1>
                <p className="text-xs text-neutral-400 font-light">{focusItems.length} stocks monitored</p>
              </div>
            </motion.div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const syms = focusItems.map(i => i.symbol)
                  fetchPrices(syms)
                }}
                disabled={pricesLoading}
                className="p-2 text-white/30 hover:text-white transition-colors"
                title="Refresh prices"
              >
                <RefreshCw className={cn("h-4 w-4", pricesLoading && "animate-spin")} />
              </button>
              <Button
                onClick={() => setShowAddForm(s => !s)}
                className="bg-pink-600 hover:bg-pink-500 text-white h-9 px-4 text-sm"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Stock
              </Button>
            </div>
          </div>
        </header>

        <div className="flex flex-1 pt-16 h-screen">
          {/* Left panel — list */}
          <div className="w-[320px] xl:w-[360px] shrink-0 border-r border-white/5 flex flex-col overflow-hidden">
            {/* Add form */}
            {showAddForm && (
              <div className="px-3 pt-3 pb-2 border-b border-white/5">
                <div className="flex gap-2">
                  <Input
                    placeholder="Symbol (AAPL, TSLA…)"
                    value={newSymbol}
                    onChange={e => setNewSymbol(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === "Enter" && handleAdd()}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9 text-sm"
                    disabled={adding}
                    maxLength={10}
                  />
                  <Button onClick={handleAdd} disabled={!newSymbol.trim() || adding} className="bg-pink-600 text-white hover:bg-pink-500 h-9 shrink-0">
                    {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Add"}
                  </Button>
                </div>
                {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
              </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 text-pink-400 animate-spin mb-3" />
                  <p className="text-sm text-white/40">Loading…</p>
                </div>
              ) : focusItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                  <Heart className="h-10 w-10 text-white/10 mb-3" />
                  <p className="text-white/40 text-sm">Your focus list is empty</p>
                  <button onClick={() => setShowAddForm(true)} className="mt-3 text-xs text-pink-400 hover:text-pink-300 underline">
                    Add your first stock
                  </button>
                </div>
              ) : (
                focusItems.map(item => (
                  <ListItem
                    key={item.symbol}
                    item={item}
                    price={prices[item.symbol]}
                    lastScan={lastScans[item.symbol] ?? null}
                    selected={selectedSymbol === item.symbol}
                    onClick={() => setSelectedSymbol(prev => prev === item.symbol ? null : item.symbol)}
                    onRemove={() => handleRemove(item.symbol)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right panel — detail */}
          <div className="flex-1 overflow-hidden">
            {selectedItem ? (
              <div className="h-full overflow-y-auto px-6 py-5">
                <div className="flex items-center gap-3 mb-5">
                  <h2 className="text-2xl font-bold text-white">{selectedItem.symbol}</h2>
                  {prices[selectedItem.symbol] && (() => {
                    const p = prices[selectedItem.symbol]
                    return (
                      <>
                        <span className="text-xl font-semibold text-white/80">${p.price.toFixed(2)}</span>
                        <span className={cn("text-sm font-semibold", p.change_pct >= 0 ? "text-emerald-400" : "text-red-400")}>
                          {p.change_pct >= 0 ? "+" : ""}{p.change_pct.toFixed(2)}%
                        </span>
                      </>
                    )
                  })()}
                  <Badge className="bg-pink-500/15 text-pink-400 border border-pink-500/30 text-xs ml-auto">
                    Focus List
                  </Badge>
                </div>
                <DetailPanel
                  item={selectedItem}
                  lastScan={lastScans[selectedItem.symbol] ?? null}
                  onAlertSave={(enabled, price) => handleAlertSave(selectedItem.symbol, enabled, price)}
                  onNotesSave={(notes) => handleNotesSave(selectedItem.symbol, notes)}
                />
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center px-8">
                <div className="p-4 rounded-2xl bg-white/3 border border-white/5 mb-4">
                  <Star className="h-10 w-10 text-white/15" />
                </div>
                <p className="text-white/40 text-base font-medium mb-1">Select a stock to view details</p>
                <p className="text-white/25 text-sm">Click any ticker in the left panel</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
