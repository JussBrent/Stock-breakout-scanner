import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, Pencil, X, Save, Loader2, Eye, TrendingUp, AlertCircle, Tag, Calendar } from "lucide-react"
import { apiFetch } from "@/lib/apiFetch"

// ── Types ─────────────────────────────────────────────────────────────────────
interface WatchItem {
  id: string
  symbol: string
  setup_type: string | null
  priority: "high" | "medium" | "low"
  notes: string | null
  target_price: number | null
  stop_price: number | null
  added_at: string
  is_active: boolean
}

type WatchItemCreate = Omit<WatchItem, "id" | "added_at">

const SETUP_TYPES = [
  "flat_top_breakout", "bull_flag", "high_tight_flag", "ascending_wedge",
  "cup_and_handle", "base_breakout", "vwap_reclaim", "ema8_bounce",
  "earnings_gap", "sector_momentum", "other"
]

const PRIORITY_COLORS = {
  high: "text-red-400 bg-red-500/10 border-red-500/20",
  medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  low: "text-white/40 bg-white/5 border-white/10",
}

const BLANK: WatchItemCreate = {
  symbol: "",
  setup_type: null,
  priority: "medium",
  notes: null,
  target_price: null,
  stop_price: null,
  is_active: true,
}

// ── API helpers ───────────────────────────────────────────────────────────────
async function getWatchList(): Promise<WatchItem[]> {
  return apiFetch("/api/admin/watchlist")
}

async function addWatchItem(item: WatchItemCreate): Promise<WatchItem> {
  return apiFetch("/api/admin/watchlist", { method: "POST", body: JSON.stringify(item) })
}

async function updateWatchItem(id: string, item: Partial<WatchItemCreate>): Promise<WatchItem> {
  return apiFetch(`/api/admin/watchlist/${id}`, { method: "PATCH", body: JSON.stringify(item) })
}

async function deleteWatchItem(id: string): Promise<void> {
  return apiFetch(`/api/admin/watchlist/${id}`, { method: "DELETE" })
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function SeanWatchListTab() {
  const [items, setItems] = useState<WatchItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [form, setForm] = useState<WatchItemCreate>({ ...BLANK })

  const fetchItems = async () => {
    try {
      setLoading(true)
      const data = await getWatchList()
      setItems(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load watch list")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems() }, [])

  const openNew = () => {
    setEditingId(null)
    setForm({ ...BLANK })
    setShowForm(true)
  }

  const openEdit = (item: WatchItem) => {
    setEditingId(item.id)
    setForm({
      symbol: item.symbol,
      setup_type: item.setup_type,
      priority: item.priority,
      notes: item.notes,
      target_price: item.target_price,
      stop_price: item.stop_price,
      is_active: item.is_active,
    })
    setShowForm(true)
  }

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm({ ...BLANK }) }

  const set = (k: keyof WatchItemCreate, v: unknown) =>
    setForm(prev => ({ ...prev, [k]: v }))

  const handleSave = async () => {
    if (!form.symbol.trim()) { setError("Symbol is required"); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        symbol: form.symbol.toUpperCase().trim(),
        setup_type: form.setup_type || null,
        notes: form.notes || null,
      }
      if (editingId) {
        const updated = await updateWatchItem(editingId, payload)
        setItems(prev => prev.map(i => i.id === editingId ? updated : i))
      } else {
        const created = await addWatchItem(payload)
        setItems(prev => [created, ...prev])
      }
      closeForm()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Remove from watch list?")) return
    try {
      await deleteWatchItem(id)
      setItems(prev => prev.filter(i => i.id !== id))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed")
    }
  }

  const filtered = filterPriority === "all"
    ? items
    : items.filter(i => i.priority === filterPriority)

  const activeCt = items.filter(i => i.is_active).length

  return (
    <div className="space-y-4">

      {/* Stats */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Watching", value: items.length, icon: Eye, color: "text-white/60" },
            { label: "Active", value: activeCt, icon: TrendingUp, color: "text-emerald-400" },
            { label: "High Priority", value: items.filter(i => i.priority === "high").length, icon: AlertCircle, color: "text-red-400" },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-lg bg-white/3 border border-white/8">
              <div className="flex items-center gap-1.5 mb-1">
                <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                <span className="text-[11px] text-white/40 uppercase tracking-wider">{s.label}</span>
              </div>
              <p className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1">
          {["all", "high", "medium", "low"].map(p => (
            <button key={p}
              onClick={() => setFilterPriority(p)}
              className={`px-2.5 py-1 text-xs rounded-lg border transition-colors capitalize
                ${filterPriority === p
                  ? "bg-white/10 border-white/20 text-white"
                  : "bg-transparent border-white/8 text-white/30 hover:text-white/60"
                }`}
            >{p === "all" ? "All" : p + " priority"}</button>
          ))}
        </div>
        {!showForm && (
          <button onClick={openNew}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-500 hover:bg-emerald-600 text-black font-medium rounded-lg transition-colors">
            <Plus className="h-3.5 w-3.5" /> Add to Watch List
          </button>
        )}
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
            {error}
            <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="p-5 rounded-xl bg-white/2 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
                {editingId ? "Edit Watch Entry" : "Add to Watch List"}
              </h3>
              <button onClick={closeForm} className="text-white/30 hover:text-white"><X className="h-4 w-4" /></button>
            </div>

            {/* Row 1: Symbol / Setup / Priority */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-white/40 mb-1">Symbol *</label>
                <input value={form.symbol} onChange={e => set("symbol", e.target.value.toUpperCase())}
                  placeholder="NVDA" className="input-field w-full" autoFocus />
              </div>
              <div>
                <label className="block text-[11px] text-white/40 mb-1">Setup Type</label>
                <select value={form.setup_type ?? ""} onChange={e => set("setup_type", e.target.value || null)} className="input-field w-full">
                  <option value="">-- Select --</option>
                  {SETUP_TYPES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                </select>
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

            {/* Row 2: Target / Stop */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-white/40 mb-1">Target Price</label>
                <input type="number" step="0.01" value={form.target_price ?? ""}
                  onChange={e => set("target_price", e.target.value ? Number(e.target.value) : null)}
                  placeholder="185.00" className="input-field w-full" />
              </div>
              <div>
                <label className="block text-[11px] text-white/40 mb-1">Stop / Invalidation</label>
                <input type="number" step="0.01" value={form.stop_price ?? ""}
                  onChange={e => set("stop_price", e.target.value ? Number(e.target.value) : null)}
                  placeholder="162.00" className="input-field w-full" />
              </div>
            </div>

            {/* Notes — feeds AI */}
            <div>
              <label className="block text-[11px] text-emerald-400/70 mb-1">
                Notes (feeds Sean's AI training — describe the setup, catalyst, why it's on watch)
              </label>
              <textarea value={form.notes ?? ""} rows={3}
                onChange={e => set("notes", e.target.value || null)}
                placeholder="Tight 3-week base near ATH, watching for volume breakout above $175 with sector in uptrend. Catalyst: earnings next week..."
                className="input-field w-full resize-none text-xs" />
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_active" checked={form.is_active}
                onChange={e => set("is_active", e.target.checked)}
                className="accent-emerald-500" />
              <label htmlFor="is_active" className="text-xs text-white/50">Active (include in AI training context)</label>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button onClick={closeForm} className="px-3 py-1.5 text-sm rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving || !form.symbol.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</> : <><Save className="h-3.5 w-3.5" /> {editingId ? "Update" : "Add"}</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-white/30" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Eye className="h-10 w-10 text-white/10 mx-auto mb-3" />
          <p className="text-white/30 text-sm">No stocks on watch list yet</p>
          <p className="text-white/20 text-xs mt-1">Add tickers Sean is watching to train the AI on his focus areas.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(item => {
            const pc = PRIORITY_COLORS[item.priority]
            return (
              <motion.div key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: item.is_active ? 1 : 0.4 }}
                className="group flex items-start gap-3 p-3.5 rounded-xl border border-white/8 bg-white/2 hover:border-white/15 transition-colors">
                {/* Priority badge */}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border capitalize shrink-0 mt-0.5 ${pc}`}>
                  {item.priority}
                </span>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-sm font-mono">{item.symbol}</span>
                    {!item.is_active && <span className="text-[10px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded">INACTIVE</span>}
                    {item.setup_type && (
                      <span className="text-[11px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Tag className="h-2.5 w-2.5" />
                        {item.setup_type.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[11px] text-white/30">
                    {item.target_price && <span className="text-emerald-400/70">target ${item.target_price}</span>}
                    {item.stop_price && <span className="text-red-400/70">stop ${item.stop_price}</span>}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-2.5 w-2.5" />
                      {new Date(item.added_at).toLocaleDateString()}
                    </span>
                  </div>
                  {item.notes && (
                    <p className="text-xs text-white/40 mt-1 leading-relaxed line-clamp-2">{item.notes}</p>
                  )}
                </div>
                {/* Actions */}
                <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(item)}
                    className="p-1.5 rounded-md hover:bg-white/5 text-white/40 hover:text-white transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-md hover:bg-red-500/10 text-white/25 hover:text-red-400 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
