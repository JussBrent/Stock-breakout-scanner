import { useState, useEffect } from "react"
import {
  Plus, Trash2, Pencil, X, Save, Loader2, Eye,
  TrendingUp, AlertCircle, Target, Calendar, ChevronDown, ChevronUp,
  ArrowUpRight, Minus
} from "lucide-react"
import { supabase } from "@/lib/supabase"

async function adminFetch(path: string, opts?: RequestInit) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  const base = import.meta.env.VITE_API_URL ?? ""
  const res = await fetch(base + path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts?.headers,
    },
  })
  if (!res.ok) throw new Error(await res.text())
  if (res.status === 204 || opts?.method === "DELETE") return null as unknown
  return res.json()
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface WatchItem {
  id: string
  symbol: string
  direction: "long" | "short"
  setup_type: string | null
  priority: "high" | "medium" | "low"
  is_active: boolean
  added_at: string
  // Breakout-specific
  entry_type: "breakout" | "pullback"
  breakout_level: number | null
  ema_level: string | null
  // Option contract
  contract_type: "call" | "put" | null
  strike_price: number | null
  expiration_date: string | null
  // Multiple targets
  target1: number | null
  target2: number | null
  target3: number | null
  stop_price: number | null
  // Session
  session_date: string | null
  notes: string | null
  // Legacy fields kept for compatibility
  entry_trigger: number | null
  target_price: number | null
  why_watching: string | null
  catalyst: string | null
  sector_context: string | null
  ideal_entry_notes: string | null
  risk_notes: string | null
  outcome: string | null
  outcome_notes: string | null
  dte_min: number | null
  dte_max: number | null
  delta_target: number | null
  contracts_qty: number | null
}

type WatchItemCreate = Omit<WatchItem, "id" | "added_at">

const BLANK: WatchItemCreate = {
  symbol: "", direction: "long", setup_type: null, priority: "high",
  is_active: true, entry_type: "breakout",
  breakout_level: null, ema_level: null,
  contract_type: "call", strike_price: null, expiration_date: null,
  target1: null, target2: null, target3: null, stop_price: null,
  session_date: new Date().toISOString().split("T")[0],
  notes: null,
  // legacy
  entry_trigger: null, target_price: null,
  why_watching: null, catalyst: null, sector_context: null,
  ideal_entry_notes: null, risk_notes: null,
  outcome: null, outcome_notes: null,
  dte_min: null, dte_max: null, delta_target: null, contracts_qty: null,
}

const PRIORITY_COLORS: Record<string, string> = {
  high: "text-red-400 bg-red-500/10 border-red-500/20",
  medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  low: "text-white/40 bg-white/5 border-white/10",
}

// Parse "Jun 18" or "Jun 18 2026" → YYYY-MM-DD
function parseExpiry(raw: string): string | null {
  if (!raw.trim()) return null
  const months: Record<string,string> = {
    jan:"01",feb:"02",mar:"03",apr:"04",may:"05",jun:"06",
    jul:"07",aug:"08",sep:"09",oct:"10",nov:"11",dec:"12"
  }
  const m = raw.trim().match(/^([A-Za-z]{3})\s+(\d{1,2})(?:\s+(\d{4}))?$/i)
  if (!m) return null
  const mo = months[m[1].toLowerCase()]
  if (!mo) return null
  const yr = m[3] ?? new Date().getFullYear().toString()
  return `${yr}-${mo}-${m[2].padStart(2,"0")}`
}

// Format stored YYYY-MM-DD → "Jun 18"
function fmtExpiry(d: string | null): string {
  if (!d) return ""
  const [, mo, day] = d.split("-")
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  return `${months[parseInt(mo)-1]} ${parseInt(day)}`
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function SeanWatchListTab() {
  const [items, setItems] = useState<WatchItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState("all")
  const [expiryRaw, setExpiryRaw] = useState("")
  const [form, setForm] = useState<WatchItemCreate>({ ...BLANK })

  const load = async () => {
    try {
      setLoading(true)
      const data = await adminFetch("/api/admin/watchlist")
      setItems(data || [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Load failed")
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openNew = () => {
    setEditingId(null)
    const today = new Date().toISOString().split("T")[0]
    setForm({ ...BLANK, session_date: today })
    setExpiryRaw("")
    setShowForm(true)
  }

  const openEdit = (it: WatchItem) => {
    setEditingId(it.id)
    setForm({ ...it } as WatchItemCreate)
    setExpiryRaw(fmtExpiry(it.expiration_date))
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false); setEditingId(null)
    setForm({ ...BLANK }); setExpiryRaw("")
  }

  const set = (k: keyof WatchItemCreate, v: unknown) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    if (!form.symbol.trim()) { setError("Symbol required"); return }
    setSaving(true)
    try {
      const parsed = parseExpiry(expiryRaw)
      const payload = {
        ...form,
        symbol: form.symbol.toUpperCase().trim(),
        expiration_date: parsed,
        // sync legacy fields
        entry_trigger: form.breakout_level,
        target_price: form.target1,
      }
      if (editingId) {
        const u = await adminFetch(`/api/admin/watchlist/${editingId}`, { method: "PATCH", body: JSON.stringify(payload) })
        setItems(p => p.map(i => i.id === editingId ? u : i))
      } else {
        const c = await adminFetch("/api/admin/watchlist", { method: "POST", body: JSON.stringify(payload) })
        setItems(p => [c, ...p])
      }
      closeForm()
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Save failed") }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Remove from watch list?")) return
    try {
      await adminFetch(`/api/admin/watchlist/${id}`, { method: "DELETE" })
      setItems(p => p.filter(i => i.id !== id))
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Delete failed") }
  }

  // Group by session date for display
  const filtered = filterType === "all" ? items
    : filterType === "breakout" ? items.filter(i => (i.entry_type ?? "breakout") === "breakout")
    : filterType === "pullback" ? items.filter(i => i.entry_type === "pullback")
    : items.filter(i => i.priority === filterType)

  const grouped = filtered.reduce((acc, item) => {
    const key = item.session_date ?? item.added_at?.split("T")[0] ?? "No date"
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {} as Record<string, WatchItem[]>)

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  return (
    <div className="space-y-4">
      {/* Stats row */}
      {items.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Watching", value: items.length, color: "text-white/60" },
            { label: "Breakouts", value: items.filter(i => (i.entry_type ?? "breakout") === "breakout").length, color: "text-emerald-400" },
            { label: "Pullbacks", value: items.filter(i => i.entry_type === "pullback").length, color: "text-cyan-400" },
            { label: "Active", value: items.filter(i => i.is_active).length, color: "text-white/40" },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-lg bg-white/3 border border-white/8">
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">{s.label}</p>
              <p className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1">
          {[
            { id: "all", label: "All" },
            { id: "breakout", label: "Breakouts" },
            { id: "pullback", label: "Pullbacks" },
          ].map(f => (
            <button key={f.id} onClick={() => setFilterType(f.id)}
              className={`px-2.5 py-1 text-xs rounded-md border transition-colors
                ${filterType === f.id ? "bg-white/10 border-white/20 text-white" : "bg-transparent border-white/8 text-white/30 hover:text-white/60"}`}>
              {f.label}
            </button>
          ))}
        </div>
        {!showForm && (
          <button onClick={openNew}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white/10 hover:bg-white/15 border border-white/15 text-white font-medium rounded-md transition-colors">
            <Plus className="h-3.5 w-3.5" /> Add Entry
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
          {error}<button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* ── Add/Edit Form ─────────────────────────────────────── */}
      {showForm && (
        <div className="p-5 rounded-lg bg-[#0d0d0d] border border-white/12 space-y-4">
          <div className="flex items-center justify-between border-b border-white/8 pb-3">
            <span className="text-sm font-semibold text-white tracking-tight">
              {editingId ? "Edit Entry" : "Add Focus List Entry"}
            </span>
            <button onClick={closeForm} className="text-white/30 hover:text-white"><X className="h-4 w-4" /></button>
          </div>

          {/* Entry type toggle */}
          <div className="flex gap-1 p-1 bg-white/5 rounded-md border border-white/8 w-fit">
            <button
              onClick={() => set("entry_type", "breakout")}
              className={`px-4 py-1.5 text-xs font-medium rounded transition-all ${form.entry_type === "breakout" ? "bg-white/12 text-white" : "text-white/40 hover:text-white/70"}`}>
              Breakout Setup
            </button>
            <button
              onClick={() => set("entry_type", "pullback")}
              className={`px-4 py-1.5 text-xs font-medium rounded transition-all ${form.entry_type === "pullback" ? "bg-white/12 text-white" : "text-white/40 hover:text-white/70"}`}>
              Pullback / EMA Bounce
            </button>
          </div>

          {/* Row 1: Symbol + Session Date + Priority */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-white/40 mb-1">Symbol *</label>
              <input value={form.symbol} onChange={e => set("symbol", e.target.value.toUpperCase())}
                placeholder="BTDR" className="input-field w-full text-base font-mono font-bold" autoFocus />
            </div>
            <div>
              <label className="block text-[11px] text-white/40 mb-1">Session Date</label>
              <input type="date" value={form.session_date ?? ""} onChange={e => set("session_date", e.target.value || null)}
                className="input-field w-full" />
            </div>
            <div>
              <label className="block text-[11px] text-white/40 mb-1">Priority</label>
              <select value={form.priority} onChange={e => set("priority", e.target.value)} className="input-field w-full">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Breakout fields */}
          {form.entry_type === "breakout" && (
            <div className="space-y-3 p-4 rounded-lg bg-white/2 border border-white/8">
              <p className="text-[11px] text-white/40 uppercase tracking-wider font-medium">Breakout Details</p>

              {/* Breakout level */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-white/40 mb-1">Break Over (level)</label>
                  <input type="number" step="0.01" value={form.breakout_level ?? ""}
                    onChange={e => set("breakout_level", e.target.value ? +e.target.value : null)}
                    placeholder="15.23" className="input-field w-full font-mono" />
                </div>
                <div>
                  <label className="block text-[11px] text-white/40 mb-1">Direction</label>
                  <select value={form.direction} onChange={e => set("direction", e.target.value)} className="input-field w-full">
                    <option value="long">Long (Calls)</option>
                    <option value="short">Short (Puts)</option>
                  </select>
                </div>
              </div>

              {/* Option contract */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-white/40 mb-1">Contract Type</label>
                  <select value={form.contract_type ?? "call"} onChange={e => set("contract_type", e.target.value || null)} className="input-field w-full">
                    <option value="call">Call</option>
                    <option value="put">Put</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-white/40 mb-1">Strike Price</label>
                  <input type="number" step="0.5" value={form.strike_price ?? ""}
                    onChange={e => set("strike_price", e.target.value ? +e.target.value : null)}
                    placeholder="16" className="input-field w-full font-mono" />
                </div>
                <div>
                  <label className="block text-[11px] text-white/40 mb-1">Expiry (e.g. Jun 18)</label>
                  <input value={expiryRaw} onChange={e => setExpiryRaw(e.target.value)}
                    placeholder="Jun 18" className="input-field w-full font-mono" />
                  {expiryRaw && parseExpiry(expiryRaw) && (
                    <p className="text-[10px] text-emerald-400/60 mt-0.5">→ {parseExpiry(expiryRaw)}</p>
                  )}
                  {expiryRaw && !parseExpiry(expiryRaw) && (
                    <p className="text-[10px] text-red-400/60 mt-0.5">Use "Mon DD" format</p>
                  )}
                </div>
              </div>

              {/* Targets */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-emerald-400/70 mb-1">Target 1</label>
                  <input type="number" step="0.01" value={form.target1 ?? ""}
                    onChange={e => set("target1", e.target.value ? +e.target.value : null)}
                    placeholder="16" className="input-field w-full font-mono" />
                </div>
                <div>
                  <label className="block text-[11px] text-emerald-400/50 mb-1">Target 2</label>
                  <input type="number" step="0.01" value={form.target2 ?? ""}
                    onChange={e => set("target2", e.target.value ? +e.target.value : null)}
                    placeholder="17" className="input-field w-full font-mono" />
                </div>
                <div>
                  <label className="block text-[11px] text-emerald-400/30 mb-1">Target 3</label>
                  <input type="number" step="0.01" value={form.target3 ?? ""}
                    onChange={e => set("target3", e.target.value ? +e.target.value : null)}
                    placeholder="18" className="input-field w-full font-mono" />
                </div>
              </div>
            </div>
          )}

          {/* Pullback fields */}
          {form.entry_type === "pullback" && (
            <div className="space-y-3 p-4 rounded-lg bg-white/2 border border-white/8">
              <p className="text-[11px] text-white/40 uppercase tracking-wider font-medium">Pullback / EMA Bounce Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-white/40 mb-1">EMA / Level</label>
                  <input value={form.ema_level ?? ""}
                    onChange={e => set("ema_level", e.target.value || null)}
                    placeholder="8 ema" className="input-field w-full font-mono" />
                  <p className="text-[10px] text-white/20 mt-0.5">e.g. "8 ema", "21 ema", "VWAP", "key support"</p>
                </div>
                <div>
                  <label className="block text-[11px] text-white/40 mb-1">Direction</label>
                  <select value={form.direction} onChange={e => set("direction", e.target.value)} className="input-field w-full">
                    <option value="long">Long</option>
                    <option value="short">Short</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-emerald-400/70 mb-1">Target 1</label>
                  <input type="number" step="0.01" value={form.target1 ?? ""}
                    onChange={e => set("target1", e.target.value ? +e.target.value : null)}
                    placeholder="" className="input-field w-full font-mono" />
                </div>
                <div>
                  <label className="block text-[11px] text-emerald-400/50 mb-1">Target 2</label>
                  <input type="number" step="0.01" value={form.target2 ?? ""}
                    onChange={e => set("target2", e.target.value ? +e.target.value : null)}
                    placeholder="" className="input-field w-full font-mono" />
                </div>
                <div>
                  <label className="block text-[11px] text-red-400/70 mb-1">Stop / Invalidation</label>
                  <input type="number" step="0.01" value={form.stop_price ?? ""}
                    onChange={e => set("stop_price", e.target.value ? +e.target.value : null)}
                    placeholder="" className="input-field w-full font-mono" />
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-[11px] text-white/40 mb-1">Notes / Reasoning (for AI training)</label>
            <textarea value={form.notes ?? ""} rows={2}
              onChange={e => set("notes", e.target.value || null)}
              placeholder="Why Sean is watching this, catalyst, sector context..."
              className="input-field w-full resize-none text-xs" />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="wl_active" checked={form.is_active}
              onChange={e => set("is_active", e.target.checked)} className="accent-emerald-500" />
            <label htmlFor="wl_active" className="text-xs text-white/40">Active (include in AI training context)</label>
          </div>

          <div className="flex justify-end gap-2 pt-1 border-t border-white/8">
            <button onClick={closeForm} className="px-3 py-1.5 text-sm rounded-md text-white/40 hover:text-white hover:bg-white/5 transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.symbol.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-md bg-white/10 hover:bg-white/15 border border-white/15 text-white font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving…</> : <><Save className="h-3.5 w-3.5" />{editingId ? "Update" : "Save"}</>}
            </button>
          </div>
        </div>
      )}

      {/* ── List ────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-white/30" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Eye className="h-10 w-10 text-white/10 mx-auto mb-3" />
          <p className="text-white/30 text-sm">No entries yet</p>
          <p className="text-white/20 text-xs mt-1">Add Sean's focus list — breakout levels, option contracts, and targets.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDates.map(dateKey => (
            <div key={dateKey}>
              {/* Date header */}
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-3 w-3 text-white/20" />
                <span className="text-[11px] text-white/30 font-mono uppercase tracking-wider">
                  {dateKey === new Date().toISOString().split("T")[0] ? "Today · " : ""}
                  {new Date(dateKey + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </span>
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-[10px] text-white/20">{grouped[dateKey].length} entries</span>
              </div>

              <div className="space-y-1.5">
                {grouped[dateKey].map(item => {
                  const pc = PRIORITY_COLORS[item.priority]
                  const isExpanded = expandedId === item.id
                  const isBreakout = (item.entry_type ?? "breakout") === "breakout"
                  const hasOption = item.contract_type && item.strike_price

                  return (
                    <div key={item.id}
                      className={`rounded-lg border border-white/8 bg-white/2 hover:border-white/15 transition-colors overflow-hidden ${!item.is_active ? "opacity-40" : ""}`}>

                      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}>

                        {/* Symbol */}
                        <span className="font-bold text-white text-sm font-mono w-16 shrink-0">{item.symbol}</span>

                        {/* Type badge */}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${isBreakout ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/8" : "text-cyan-400 border-cyan-500/20 bg-cyan-500/8"}`}>
                          {isBreakout ? "BREAKOUT" : "PULLBACK"}
                        </span>

                        {/* Main detail */}
                        <div className="flex-1 min-w-0 flex items-center gap-3 text-xs text-white/50 font-mono flex-wrap">
                          {isBreakout && item.breakout_level && (
                            <span>break over <span className="text-white/80">${item.breakout_level}</span></span>
                          )}
                          {!isBreakout && item.ema_level && (
                            <span>off the <span className="text-cyan-400/80">{item.ema_level}</span></span>
                          )}
                          {hasOption && (
                            <span className="text-white/60">
                              <span className="text-white/90">{item.strike_price}{item.contract_type === "call" ? "c" : "p"}</span>
                              {item.expiration_date && <span className="text-white/40"> {fmtExpiry(item.expiration_date)}</span>}
                            </span>
                          )}
                          {(item.target1 || item.target2 || item.target3) && (
                            <span className="text-emerald-400/70">
                              → {[item.target1, item.target2, item.target3].filter(Boolean).map(t => `$${t}`).join(", ")}
                            </span>
                          )}
                        </div>

                        {/* Priority dot */}
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0 capitalize ${pc}`}>{item.priority}</span>

                        {isExpanded
                          ? <ChevronUp className="h-3.5 w-3.5 text-white/30 shrink-0" />
                          : <ChevronDown className="h-3.5 w-3.5 text-white/20 shrink-0" />}
                      </div>

                      {/* Expanded */}
                      {isExpanded && (
                        <div className="border-t border-white/5 px-4 py-3 space-y-2">
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            {isBreakout && item.breakout_level && (
                              <div><p className="text-[10px] text-white/30 uppercase mb-0.5">Break Level</p><p className="text-white/70 font-mono">${item.breakout_level}</p></div>
                            )}
                            {!isBreakout && item.ema_level && (
                              <div><p className="text-[10px] text-white/30 uppercase mb-0.5">EMA / Level</p><p className="text-cyan-400/70 font-mono">{item.ema_level}</p></div>
                            )}
                            {hasOption && (
                              <div>
                                <p className="text-[10px] text-white/30 uppercase mb-0.5">Contract</p>
                                <p className="text-white/70 font-mono">
                                  {item.strike_price}{item.contract_type === "call" ? "c" : "p"} {fmtExpiry(item.expiration_date)}
                                </p>
                              </div>
                            )}
                            {(item.target1 || item.target2 || item.target3) && (
                              <div>
                                <p className="text-[10px] text-white/30 uppercase mb-0.5">Targets</p>
                                <div className="flex gap-2">
                                  {[item.target1, item.target2, item.target3].filter(Boolean).map((t, i) => (
                                    <span key={i} className="text-emerald-400/70 font-mono">${t}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {item.stop_price && (
                              <div><p className="text-[10px] text-white/30 uppercase mb-0.5">Stop</p><p className="text-red-400/70 font-mono">${item.stop_price}</p></div>
                            )}
                          </div>
                          {item.notes && (
                            <div>
                              <p className="text-[10px] text-white/30 uppercase mb-0.5">Notes</p>
                              <p className="text-xs text-white/50 leading-relaxed">{item.notes}</p>
                            </div>
                          )}
                          <div className="flex justify-end gap-1.5 pt-1">
                            <button onClick={() => openEdit(item)}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-md text-white/40 hover:text-white hover:bg-white/5 transition-colors">
                              <Pencil className="h-3 w-3" /> Edit
                            </button>
                            <button onClick={() => handleDelete(item.id)}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-md text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                              <Trash2 className="h-3 w-3" /> Remove
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
