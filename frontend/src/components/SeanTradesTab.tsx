import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus, Trash2, Pencil, X, Save, Loader2, TrendingUp, TrendingDown,
  ChevronDown, ChevronUp, Trophy, AlertTriangle, Clock, DollarSign
} from "lucide-react"
import {
  getSeanTrades, submitSeanTrade, updateSeanTrade, deleteSeanTrade,
  SeanTrade, SeanTradeCreate,
} from "@/lib/api"

// ── Setup type options ──────────────────────────────────────────────────────
const SETUP_TYPES = [
  "flat_top_breakout", "bull_flag", "high_tight_flag", "ascending_wedge",
  "cup_and_handle", "base_breakout", "vwap_reclaim", "ema8_bounce",
  "earnings_gap", "sector_momentum", "other"
]

const OUTCOME_COLORS = {
  win:       "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  loss:      "text-red-400    bg-red-500/10    border-red-500/20",
  breakeven: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  open:      "text-blue-400   bg-blue-500/10   border-blue-500/20",
}

// ── Blank form state ─────────────────────────────────────────────────────────
const BLANK: SeanTradeCreate = {
  symbol: "", direction: "long", setup_type: "", breakout_score: undefined,
  entry_price: 0, exit_price: undefined, stop_price: undefined, gain_pct: undefined,
  contract_type: undefined, strike_price: undefined, expiration_date: undefined,
  contracts_held: undefined, premium_paid: undefined, premium_exit: undefined,
  outcome: "open",
  why_took_trade: "", looked_wrong_but: "", looked_right_but: "", key_lesson: "",
  traded_at: new Date().toISOString().split("T")[0],
}

export default function SeanTradesTab() {
  const [trades, setTrades]       = useState<SeanTrade[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [saving, setSaving]       = useState(false)
  const [showForm, setShowForm]   = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterOutcome, setFilterOutcome] = useState<string>("all")
  const [form, setForm]           = useState<SeanTradeCreate>({ ...BLANK })
  const [isOptions, setIsOptions] = useState(false)

  const fetchTrades = async () => {
    try {
      setLoading(true)
      const opts = filterOutcome !== "all" ? { outcome: filterOutcome } : {}
      const data = await getSeanTrades({ ...opts, limit: 200 })
      setTrades(data.trades)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load trades")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTrades() }, [filterOutcome])

  const openNew = () => {
    setEditingId(null)
    setForm({ ...BLANK })
    setIsOptions(false)
    setShowForm(true)
  }

  const openEdit = (t: SeanTrade) => {
    setEditingId(t.id)
    setForm({
      symbol: t.symbol, direction: t.direction,
      setup_type: t.setup_type ?? "", breakout_score: t.breakout_score ?? undefined,
      entry_price: t.entry_price, exit_price: t.exit_price ?? undefined,
      stop_price: t.stop_price ?? undefined, gain_pct: t.gain_pct ?? undefined,
      contract_type: t.contract_type ?? undefined,
      strike_price: t.strike_price ?? undefined,
      expiration_date: t.expiration_date ?? undefined,
      contracts_held: t.contracts_held ?? undefined,
      premium_paid: t.premium_paid ?? undefined,
      premium_exit: t.premium_exit ?? undefined,
      outcome: t.outcome,
      why_took_trade: t.why_took_trade ?? "",
      looked_wrong_but: t.looked_wrong_but ?? "",
      looked_right_but: t.looked_right_but ?? "",
      key_lesson: t.key_lesson ?? "",
      traded_at: t.traded_at?.split("T")[0] ?? "",
    })
    setIsOptions(!!t.contract_type)
    setShowForm(true)
  }

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm({ ...BLANK }) }

  const set = (k: keyof SeanTradeCreate, v: unknown) =>
    setForm(prev => ({ ...prev, [k]: v }))

  const handleSave = async () => {
    if (!form.symbol || !form.entry_price) {
      setError("Symbol and entry price are required"); return
    }
    setSaving(true)
    try {
      const payload: SeanTradeCreate = {
        ...form,
        symbol: form.symbol.toUpperCase().trim(),
        setup_type: form.setup_type || undefined,
        contract_type: isOptions ? form.contract_type : undefined,
        strike_price: isOptions ? form.strike_price : undefined,
        expiration_date: isOptions ? form.expiration_date : undefined,
        contracts_held: isOptions ? form.contracts_held : undefined,
        premium_paid: isOptions ? form.premium_paid : undefined,
        premium_exit: isOptions ? form.premium_exit : undefined,
        why_took_trade: form.why_took_trade || undefined,
        looked_wrong_but: form.looked_wrong_but || undefined,
        looked_right_but: form.looked_right_but || undefined,
        key_lesson: form.key_lesson || undefined,
      }
      if (editingId) {
        const updated = await updateSeanTrade(editingId, payload)
        setTrades(prev => prev.map(t => t.id === editingId ? updated : t))
      } else {
        const created = await submitSeanTrade(payload)
        setTrades(prev => [created, ...prev])
      }
      closeForm()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this trade?")) return
    try {
      await deleteSeanTrade(id)
      setTrades(prev => prev.filter(t => t.id !== id))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed")
    }
  }

  // ── Stats bar ────────────────────────────────────────────────────────────
  const wins      = trades.filter(t => t.outcome === "win")
  const losses    = trades.filter(t => t.outcome === "loss")
  const closed    = trades.filter(t => ["win","loss","breakeven"].includes(t.outcome))
  const winRate   = closed.length > 0 ? Math.round((wins.length / closed.length) * 100) : null
  const avgWin    = wins.length > 0 ? (wins.reduce((s,t) => s + (t.gain_pct ?? 0), 0) / wins.length) : null
  const avgLoss   = losses.length > 0 ? (losses.reduce((s,t) => s + (t.gain_pct ?? 0), 0) / losses.length) : null

  return (
    <div className="space-y-4">

      {/* Stats bar */}
      {trades.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Win Rate", value: winRate !== null ? `${winRate}%` : "--", icon: Trophy, color: "text-emerald-400" },
            { label: "Total Trades", value: trades.length, icon: Clock, color: "text-white/60" },
            { label: "Avg Win", value: avgWin !== null ? `+${avgWin.toFixed(1)}%` : "--", icon: TrendingUp, color: "text-emerald-400" },
            { label: "Avg Loss", value: avgLoss !== null ? `${avgLoss.toFixed(1)}%` : "--", icon: TrendingDown, color: "text-red-400" },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl bg-white/3 border border-white/8">
              <div className="flex items-center gap-1.5 mb-1">
                <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                <span className="text-[11px] text-white/40 uppercase tracking-wider">{s.label}</span>
              </div>
              <p className={`text-lg font-bold ${s.color}`}>{String(s.value)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1">
          {["all","win","loss","breakeven","open"].map(o => (
            <button key={o}
              onClick={() => setFilterOutcome(o)}
              className={`px-2.5 py-1 text-xs rounded-lg border transition-colors capitalize
                ${filterOutcome === o
                  ? "bg-white/10 border-white/20 text-white"
                  : "bg-transparent border-white/8 text-white/30 hover:text-white/60"
                }`}
            >{o}</button>
          ))}
        </div>
        {!showForm && (
          <button onClick={openNew}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-500 hover:bg-emerald-600 text-black font-medium rounded-lg transition-colors">
            <Plus className="h-3.5 w-3.5" /> Log Trade
          </button>
        )}
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
            {error}
            <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
            className="p-5 rounded-xl bg-white/2 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
                {editingId ? "Edit Trade" : "Log New Trade"}
              </h3>
              <button onClick={closeForm} className="text-white/30 hover:text-white"><X className="h-4 w-4" /></button>
            </div>

            {/* Row 1: Symbol / Direction / Setup / Score */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-white/40 mb-1">Symbol *</label>
                <input value={form.symbol} onChange={e => set("symbol", e.target.value.toUpperCase())}
                  placeholder="NVDA" className="input-field w-full" autoFocus />
              </div>
              <div>
                <label className="block text-[11px] text-white/40 mb-1">Direction</label>
                <select value={form.direction} onChange={e => set("direction", e.target.value)} className="input-field w-full">
                  <option value="long">Long</option>
                  <option value="short">Short</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-white/40 mb-1">Setup Type</label>
                <select value={form.setup_type} onChange={e => set("setup_type", e.target.value)} className="input-field w-full">
                  <option value="">-- Select --</option>
                  {SETUP_TYPES.map(s => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-white/40 mb-1">Breakout Score (0-100)</label>
                <input type="number" min={0} max={100} value={form.breakout_score ?? ""}
                  onChange={e => set("breakout_score", e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="85" className="input-field w-full" />
              </div>
            </div>

            {/* Row 2: Prices */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-white/40 mb-1">Entry Price *</label>
                <input type="number" step="0.01" value={form.entry_price || ""}
                  onChange={e => set("entry_price", Number(e.target.value))}
                  placeholder="142.50" className="input-field w-full" />
              </div>
              <div>
                <label className="block text-[11px] text-white/40 mb-1">Exit Price</label>
                <input type="number" step="0.01" value={form.exit_price ?? ""}
                  onChange={e => set("exit_price", e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="158.00" className="input-field w-full" />
              </div>
              <div>
                <label className="block text-[11px] text-white/40 mb-1">Stop Price</label>
                <input type="number" step="0.01" value={form.stop_price ?? ""}
                  onChange={e => set("stop_price", e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="138.00" className="input-field w-full" />
              </div>
              <div>
                <label className="block text-[11px] text-white/40 mb-1">Outcome</label>
                <select value={form.outcome} onChange={e => set("outcome", e.target.value)} className="input-field w-full">
                  <option value="open">Open</option>
                  <option value="win">Win</option>
                  <option value="loss">Loss</option>
                  <option value="breakeven">Breakeven</option>
                </select>
              </div>
            </div>

            {/* Options toggle */}
            <div>
              <button onClick={() => setIsOptions(p => !p)}
                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">
                <DollarSign className="h-3 w-3" />
                {isOptions ? "Hide" : "Add"} Options Contract
                {isOptions ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            </div>

            {/* Options fields */}
            <AnimatePresence>
              {isOptions && (
                <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
                  className="overflow-hidden">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1 pb-1 px-3 rounded-lg bg-blue-500/5 border border-blue-500/15">
                    <div>
                      <label className="block text-[11px] text-white/40 mb-1">Call / Put</label>
                      <select value={form.contract_type ?? ""} onChange={e => set("contract_type", e.target.value || undefined)} className="input-field w-full">
                        <option value="">-- Select --</option>
                        <option value="call">Call</option>
                        <option value="put">Put</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-white/40 mb-1">Strike Price</label>
                      <input type="number" step="0.5" value={form.strike_price ?? ""}
                        onChange={e => set("strike_price", e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="145.00" className="input-field w-full" />
                    </div>
                    <div>
                      <label className="block text-[11px] text-white/40 mb-1">Expiration Date</label>
                      <input type="date" value={form.expiration_date ?? ""}
                        onChange={e => set("expiration_date", e.target.value || undefined)}
                        className="input-field w-full" />
                    </div>
                    <div>
                      <label className="block text-[11px] text-white/40 mb-1">Contracts</label>
                      <input type="number" min={1} value={form.contracts_held ?? ""}
                        onChange={e => set("contracts_held", e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="5" className="input-field w-full" />
                    </div>
                    <div>
                      <label className="block text-[11px] text-white/40 mb-1">Premium Paid (per contract)</label>
                      <input type="number" step="0.01" value={form.premium_paid ?? ""}
                        onChange={e => set("premium_paid", e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="2.85" className="input-field w-full" />
                    </div>
                    <div>
                      <label className="block text-[11px] text-white/40 mb-1">Premium Exit (per contract)</label>
                      <input type="number" step="0.01" value={form.premium_exit ?? ""}
                        onChange={e => set("premium_exit", e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="6.40" className="input-field w-full" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Teaching labels — the AI training gold */}
            <div className="space-y-2">
              <p className="text-[11px] text-white/30 uppercase tracking-wider">Teaching Labels (feeds Sean's AI training)</p>
              <div>
                <label className="block text-[11px] text-emerald-400/70 mb-1">Why you took this trade</label>
                <textarea value={form.why_took_trade ?? ""} rows={2}
                  onChange={e => set("why_took_trade", e.target.value)}
                  placeholder="Clear flat top, 3-week tight base, vol dry-up, above all key EMAs..."
                  className="input-field w-full resize-none text-xs" />
              </div>
              <div>
                <label className="block text-[11px] text-yellow-400/70 mb-1">Looked wrong but worked (false-negative lesson)</label>
                <textarea value={form.looked_wrong_but ?? ""} rows={2}
                  onChange={e => set("looked_wrong_but", e.target.value)}
                  placeholder="Base felt a bit loose but the sector was ripping and the market was strong..."
                  className="input-field w-full resize-none text-xs" />
              </div>
              <div>
                <label className="block text-[11px] text-red-400/70 mb-1">Looked right but failed (false-positive lesson)</label>
                <textarea value={form.looked_right_but ?? ""} rows={2}
                  onChange={e => set("looked_right_but", e.target.value)}
                  placeholder="Perfect flat top pattern but market topped out that exact day, no follow through..."
                  className="input-field w-full resize-none text-xs" />
              </div>
              <div>
                <label className="block text-[11px] text-blue-400/70 mb-1">Key lesson / what to watch for</label>
                <textarea value={form.key_lesson ?? ""} rows={2}
                  onChange={e => set("key_lesson", e.target.value)}
                  placeholder="Always check the market environment first. A great setup in a bad market is still a bad trade..."
                  className="input-field w-full resize-none text-xs" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-white/40 mb-1">Trade Date</label>
              <input type="date" value={form.traded_at?.split("T")[0] ?? ""}
                onChange={e => set("traded_at", e.target.value)}
                className="input-field" />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button onClick={closeForm} className="px-3 py-1.5 text-sm rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving || !form.symbol || !form.entry_price}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</> : <><Save className="h-3.5 w-3.5" /> {editingId ? "Update" : "Log Trade"}</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trade List */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-white/30" /></div>
      ) : trades.length === 0 ? (
        <div className="text-center py-16">
          <TrendingUp className="h-10 w-10 text-white/10 mx-auto mb-3" />
          <p className="text-white/30 text-sm">No trades logged yet</p>
          <p className="text-white/20 text-xs mt-1">Log Sean's first trade to start training the AI.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {trades.map(t => {
            const isExpanded = expandedId === t.id
            const colorClass = OUTCOME_COLORS[t.outcome] ?? OUTCOME_COLORS.open
            const gainStr = t.gain_pct != null ? `${t.gain_pct > 0 ? "+" : ""}${t.gain_pct.toFixed(1)}%` : null
            const isOpt = !!t.contract_type
            return (
              <motion.div key={t.id} layout initial={{ opacity:0 }} animate={{ opacity:1 }}
                className="group rounded-xl border border-white/8 bg-white/2 hover:border-white/15 transition-colors overflow-hidden">
                {/* Card header */}
                <div className="flex items-center gap-3 p-3.5 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : t.id)}>
                  {/* Outcome badge */}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border capitalize ${colorClass}`}>
                    {t.outcome}
                  </span>
                  {/* Symbol + setup */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm">{t.symbol}</span>
                      <span className="text-[11px] text-white/40 capitalize">{t.direction}</span>
                      {t.setup_type && <span className="text-[11px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded">{t.setup_type.replace(/_/g," ")}</span>}
                      {isOpt && <span className="text-[11px] text-blue-400/70 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">{t.contract_type?.toUpperCase()} ${t.strike_price} exp {t.expiration_date}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[11px] text-white/30">
                      <span>entry ${t.entry_price}</span>
                      {t.exit_price && <span>→ ${t.exit_price}</span>}
                      {gainStr && <span className={t.gain_pct! > 0 ? "text-emerald-400" : "text-red-400"}>{gainStr}</span>}
                      {isOpt && t.premium_paid && <span>prem ${t.premium_paid}{t.premium_exit ? ` → $${t.premium_exit}` : ""}</span>}
                      {t.breakout_score != null && <span>score {t.breakout_score}</span>}
                    </div>
                  </div>
                  {/* Right side */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-white/20">{new Date(t.traded_at).toLocaleDateString()}</span>
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-white/30" /> : <ChevronDown className="h-3.5 w-3.5 text-white/20" />}
                  </div>
                </div>
                {/* Expanded: teaching labels */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }}
                      className="overflow-hidden border-t border-white/5">
                      <div className="p-4 space-y-2.5">
                        {t.why_took_trade && (
                          <div><p className="text-[10px] text-emerald-400/70 uppercase tracking-wider mb-0.5">Why Took It</p>
                          <p className="text-xs text-white/50 leading-relaxed">{t.why_took_trade}</p></div>
                        )}
                        {t.looked_wrong_but && (
                          <div><p className="text-[10px] text-yellow-400/70 uppercase tracking-wider mb-0.5">Looked Wrong But Worked</p>
                          <p className="text-xs text-white/50 leading-relaxed">{t.looked_wrong_but}</p></div>
                        )}
                        {t.looked_right_but && (
                          <div><p className="text-[10px] text-red-400/70 uppercase tracking-wider mb-0.5">Looked Right But Failed</p>
                          <p className="text-xs text-white/50 leading-relaxed">{t.looked_right_but}</p></div>
                        )}
                        {t.key_lesson && (
                          <div><p className="text-[10px] text-blue-400/70 uppercase tracking-wider mb-0.5">Key Lesson</p>
                          <p className="text-xs text-white/50 leading-relaxed">{t.key_lesson}</p></div>
                        )}
                        {!t.why_took_trade && !t.looked_wrong_but && !t.looked_right_but && !t.key_lesson && (
                          <p className="text-xs text-white/20 italic">No teaching labels added yet. Edit to add AI training context.</p>
                        )}
                        <div className="flex justify-end gap-1.5 pt-1">
                          <button onClick={() => openEdit(t)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors">
                            <Pencil className="h-3 w-3" /> Edit
                          </button>
                          <button onClick={() => handleDelete(t.id)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                            <Trash2 className="h-3 w-3" /> Delete
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
