import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus, Trash2, Pencil, X, Save, Loader2, Eye,
  TrendingUp, AlertCircle, Tag, Calendar, ChevronDown, ChevronUp, DollarSign
} from "lucide-react"
import { supabase } from "@/lib/supabase"

// ── Inline auth fetch ─────────────────────────────────────────────────────────
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
  entry_trigger: number | null
  target_price: number | null
  stop_price: number | null
  // Options
  contract_type: "call" | "put" | null
  strike_price: number | null
  expiration_date: string | null
  dte_min: number | null
  dte_max: number | null
  delta_target: number | null
  contracts_qty: number | null
  // AI training
  why_watching: string | null
  sector_context: string | null
  catalyst: string | null
  ideal_entry_notes: string | null
  risk_notes: string | null
  outcome: string | null
  outcome_notes: string | null
}

type WatchItemCreate = Omit<WatchItem, "id" | "added_at">

const SETUP_TYPES = [
  "flat_top_breakout","bull_flag","high_tight_flag","ascending_wedge",
  "cup_and_handle","base_breakout","vwap_reclaim","ema8_bounce",
  "earnings_gap","sector_momentum","other"
]

const PRIORITY_COLORS = {
  high:   "text-red-400 bg-red-500/10 border-red-500/20",
  medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  low:    "text-white/40 bg-white/5 border-white/10",
}

const BLANK: WatchItemCreate = {
  symbol:"", direction:"long", setup_type:null, priority:"medium", is_active:true,
  entry_trigger:null, target_price:null, stop_price:null,
  contract_type:null, strike_price:null, expiration_date:null,
  dte_min:null, dte_max:null, delta_target:null, contracts_qty:null,
  why_watching:null, sector_context:null, catalyst:null,
  ideal_entry_notes:null, risk_notes:null, outcome:null, outcome_notes:null,
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function SeanWatchListTab() {
  const [items, setItems]           = useState<WatchItem[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [saving, setSaving]         = useState(false)
  const [showForm, setShowForm]     = useState(false)
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterPri, setFilterPri]   = useState("all")
  const [showOptions, setShowOptions] = useState(false)
  const [form, setForm]             = useState<WatchItemCreate>({ ...BLANK })

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

  const openNew = () => { setEditingId(null); setForm({ ...BLANK }); setShowOptions(false); setShowForm(true) }
  const openEdit = (it: WatchItem) => {
    setEditingId(it.id)
    setForm({ ...it } as WatchItemCreate)
    setShowOptions(!!it.contract_type)
    setShowForm(true)
  }
  const closeForm = () => { setShowForm(false); setEditingId(null); setForm({ ...BLANK }) }
  const set = (k: keyof WatchItemCreate, v: unknown) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    if (!form.symbol.trim()) { setError("Symbol required"); return }
    setSaving(true)
    try {
      const payload = { ...form, symbol: form.symbol.toUpperCase().trim() }
      if (!showOptions) {
        payload.contract_type = null; payload.strike_price = null
        payload.expiration_date = null; payload.dte_min = null
        payload.dte_max = null; payload.delta_target = null; payload.contracts_qty = null
      }
      if (editingId) {
        const u = await adminFetch(`/api/admin/watchlist/${editingId}`, { method:"PATCH", body:JSON.stringify(payload) })
        setItems(p => p.map(i => i.id === editingId ? u : i))
      } else {
        const c = await adminFetch("/api/admin/watchlist", { method:"POST", body:JSON.stringify(payload) })
        setItems(p => [c, ...p])
      }
      closeForm()
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Save failed") }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Remove from watch list?")) return
    try {
      await adminFetch(`/api/admin/watchlist/${id}`, { method:"DELETE" })
      setItems(p => p.filter(i => i.id !== id))
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Delete failed") }
  }

  const filtered = filterPri === "all" ? items : items.filter(i => i.priority === filterPri)

  return (
    <div className="space-y-4">
      {/* Stats */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label:"Watching", value:items.length, icon:Eye, color:"text-white/60" },
            { label:"Active",   value:items.filter(i=>i.is_active).length, icon:TrendingUp, color:"text-emerald-400" },
            { label:"High Priority", value:items.filter(i=>i.priority==="high").length, icon:AlertCircle, color:"text-red-400" },
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
          {["all","high","medium","low"].map(p => (
            <button key={p} onClick={() => setFilterPri(p)}
              className={`px-2.5 py-1 text-xs rounded-lg border transition-colors capitalize
                ${filterPri===p ? "bg-white/10 border-white/20 text-white" : "bg-transparent border-white/8 text-white/30 hover:text-white/60"}`}>
              {p==="all"?"All":p+" pri"}
            </button>
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
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
            {error}<button onClick={()=>setError(null)}><X className="h-4 w-4"/></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
            className="p-5 rounded-xl bg-white/2 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
                {editingId ? "Edit Watch Entry" : "Add to Watch List"}
              </h3>
              <button onClick={closeForm} className="text-white/30 hover:text-white"><X className="h-4 w-4"/></button>
            </div>

            {/* Row 1: Symbol / Direction / Setup / Priority */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-white/40 mb-1">Symbol *</label>
                <input value={form.symbol} onChange={e=>set("symbol",e.target.value.toUpperCase())}
                  placeholder="NVDA" className="input-field w-full" autoFocus />
              </div>
              <div>
                <label className="block text-[11px] text-white/40 mb-1">Direction</label>
                <select value={form.direction} onChange={e=>set("direction",e.target.value)} className="input-field w-full">
                  <option value="long">Long</option>
                  <option value="short">Short</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-white/40 mb-1">Setup Type</label>
                <select value={form.setup_type??""} onChange={e=>set("setup_type",e.target.value||null)} className="input-field w-full">
                  <option value="">-- Select --</option>
                  {SETUP_TYPES.map(s=><option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-white/40 mb-1">Priority</label>
                <select value={form.priority} onChange={e=>set("priority",e.target.value)} className="input-field w-full">
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            {/* Row 2: Price levels */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-white/40 mb-1">Entry Trigger</label>
                <input type="number" step="0.01" value={form.entry_trigger??""} onChange={e=>set("entry_trigger",e.target.value?+e.target.value:null)} placeholder="175.50" className="input-field w-full" />
              </div>
              <div>
                <label className="block text-[11px] text-emerald-400/70 mb-1">Target Price</label>
                <input type="number" step="0.01" value={form.target_price??""} onChange={e=>set("target_price",e.target.value?+e.target.value:null)} placeholder="195.00" className="input-field w-full" />
              </div>
              <div>
                <label className="block text-[11px] text-red-400/70 mb-1">Stop / Invalidation</label>
                <input type="number" step="0.01" value={form.stop_price??""} onChange={e=>set("stop_price",e.target.value?+e.target.value:null)} placeholder="168.00" className="input-field w-full" />
              </div>
            </div>

            {/* Options toggle */}
            <button onClick={()=>setShowOptions(p=>!p)}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">
              <DollarSign className="h-3 w-3"/>
              {showOptions?"Hide":"Add"} Options Contract Details
              {showOptions?<ChevronUp className="h-3 w-3"/>:<ChevronDown className="h-3 w-3"/>}
            </button>

            {/* Options fields */}
            <AnimatePresence>
              {showOptions && (
                <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} className="overflow-hidden">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/15">
                    <div>
                      <label className="block text-[11px] text-white/40 mb-1">Call / Put</label>
                      <select value={form.contract_type??""} onChange={e=>set("contract_type",e.target.value||null)} className="input-field w-full">
                        <option value="">--</option>
                        <option value="call">Call</option>
                        <option value="put">Put</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-white/40 mb-1">Strike Price</label>
                      <input type="number" step="0.5" value={form.strike_price??""} onChange={e=>set("strike_price",e.target.value?+e.target.value:null)} placeholder="175.00" className="input-field w-full" />
                    </div>
                    <div>
                      <label className="block text-[11px] text-white/40 mb-1">Expiration Date</label>
                      <input type="date" value={form.expiration_date??""} onChange={e=>set("expiration_date",e.target.value||null)} className="input-field w-full" />
                    </div>
                    <div>
                      <label className="block text-[11px] text-white/40 mb-1">Contracts</label>
                      <input type="number" min={1} value={form.contracts_qty??""} onChange={e=>set("contracts_qty",e.target.value?+e.target.value:null)} placeholder="5" className="input-field w-full" />
                    </div>
                    <div>
                      <label className="block text-[11px] text-blue-400/70 mb-1">DTE Min (days)</label>
                      <input type="number" min={1} value={form.dte_min??""} onChange={e=>set("dte_min",e.target.value?+e.target.value:null)} placeholder="21" className="input-field w-full" />
                    </div>
                    <div>
                      <label className="block text-[11px] text-blue-400/70 mb-1">DTE Max (days)</label>
                      <input type="number" min={1} value={form.dte_max??""} onChange={e=>set("dte_max",e.target.value?+e.target.value:null)} placeholder="45" className="input-field w-full" />
                    </div>
                    <div>
                      <label className="block text-[11px] text-purple-400/70 mb-1">Delta Target</label>
                      <input type="number" step="0.01" min={0} max={1} value={form.delta_target??""} onChange={e=>set("delta_target",e.target.value?+e.target.value:null)} placeholder="0.40" className="input-field w-full" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Training context */}
            <div className="space-y-2">
              <p className="text-[11px] text-white/30 uppercase tracking-wider">AI Training Context (why Sean watches this)</p>
              <div>
                <label className="block text-[11px] text-emerald-400/70 mb-1">Why watching</label>
                <textarea value={form.why_watching??""} rows={2} onChange={e=>set("why_watching",e.target.value||null)}
                  placeholder="3-week tight base forming near ATH, high RS vs sector, volume contracting..." className="input-field w-full resize-none text-xs" />
              </div>
              <div>
                <label className="block text-[11px] text-blue-400/70 mb-1">Catalyst / driver</label>
                <textarea value={form.catalyst??""} rows={2} onChange={e=>set("catalyst",e.target.value||null)}
                  placeholder="Earnings catalyst next week, sector rotation into tech, AI spend accelerating..." className="input-field w-full resize-none text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-white/40 mb-1">Sector context</label>
                  <input value={form.sector_context??""} onChange={e=>set("sector_context",e.target.value||null)}
                    placeholder="Semis breaking out, XLK leading..." className="input-field w-full text-xs" />
                </div>
                <div>
                  <label className="block text-[11px] text-yellow-400/70 mb-1">Ideal entry notes</label>
                  <input value={form.ideal_entry_notes??""} onChange={e=>set("ideal_entry_notes",e.target.value||null)}
                    placeholder="Buy the open breakout above $175 on vol..." className="input-field w-full text-xs" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-red-400/70 mb-1">Risk / invalidation</label>
                <textarea value={form.risk_notes??""} rows={1} onChange={e=>set("risk_notes",e.target.value||null)}
                  placeholder="Back below 8 EMA or market breaks down = no trade..." className="input-field w-full resize-none text-xs" />
              </div>
            </div>

            {/* Outcome (for completed setups) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-white/40 mb-1">Outcome</label>
                <select value={form.outcome??""} onChange={e=>set("outcome",e.target.value||null)} className="input-field w-full">
                  <option value="">-- Pending --</option>
                  <option value="triggered_win">Triggered — Win</option>
                  <option value="triggered_loss">Triggered — Loss</option>
                  <option value="expired">Expired / Missed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-white/40 mb-1">Outcome notes</label>
                <input value={form.outcome_notes??""} onChange={e=>set("outcome_notes",e.target.value||null)}
                  placeholder="How it played out..." className="input-field w-full text-xs" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="wl_active" checked={form.is_active} onChange={e=>set("is_active",e.target.checked)} className="accent-emerald-500" />
              <label htmlFor="wl_active" className="text-xs text-white/50">Active (include in AI context)</label>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button onClick={closeForm} className="px-3 py-1.5 text-sm rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving||!form.symbol.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                {saving?<><Loader2 className="h-3.5 w-3.5 animate-spin"/>Saving…</>:<><Save className="h-3.5 w-3.5"/>{editingId?"Update":"Add"}</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-white/30"/></div>
      ) : filtered.length===0 ? (
        <div className="text-center py-16">
          <Eye className="h-10 w-10 text-white/10 mx-auto mb-3"/>
          <p className="text-white/30 text-sm">No stocks on watch list yet</p>
          <p className="text-white/20 text-xs mt-1">Add tickers Sean is watching — includes setup type, options details, and reasoning to train the AI.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(item=>{
            const pc = PRIORITY_COLORS[item.priority]
            const isExpanded = expandedId===item.id
            const hasOptions = !!item.contract_type
            return (
              <motion.div key={item.id} layout initial={{opacity:0}} animate={{opacity:item.is_active?1:0.4}}
                className="group rounded-xl border border-white/8 bg-white/2 hover:border-white/15 transition-colors overflow-hidden">
                <div className="flex items-start gap-3 p-3.5 cursor-pointer" onClick={()=>setExpandedId(isExpanded?null:item.id)}>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border capitalize shrink-0 mt-0.5 ${pc}`}>{item.priority}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm font-mono">{item.symbol}</span>
                      <span className="text-[11px] text-white/40 capitalize">{item.direction}</span>
                      {!item.is_active && <span className="text-[10px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded">INACTIVE</span>}
                      {item.setup_type && <span className="text-[11px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded flex items-center gap-1"><Tag className="h-2.5 w-2.5"/>{item.setup_type.replace(/_/g," ")}</span>}
                      {hasOptions && <span className="text-[11px] text-blue-400/70 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">{item.contract_type?.toUpperCase()} ${item.strike_price} {item.expiration_date}</span>}
                      {item.outcome && <span className={`text-[10px] px-1.5 py-0.5 rounded border ${item.outcome.includes('win')?'text-emerald-400 border-emerald-500/20 bg-emerald-500/10':item.outcome.includes('loss')?'text-red-400 border-red-500/20 bg-red-500/10':'text-white/30 border-white/10 bg-white/5'}`}>{item.outcome.replace(/_/g," ")}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[11px] text-white/30">
                      {item.entry_trigger && <span>entry ${item.entry_trigger}</span>}
                      {item.target_price && <span className="text-emerald-400/70">→ ${item.target_price}</span>}
                      {item.stop_price && <span className="text-red-400/70">stop ${item.stop_price}</span>}
                      {item.dte_min && item.dte_max && <span className="text-blue-400/70">DTE {item.dte_min}-{item.dte_max}d</span>}
                      {item.delta_target && <span className="text-purple-400/70">Δ {item.delta_target}</span>}
                      <span className="flex items-center gap-1"><Calendar className="h-2.5 w-2.5"/>{new Date(item.added_at).toLocaleDateString()}</span>
                    </div>
                    {item.why_watching && !isExpanded && <p className="text-xs text-white/40 mt-1 line-clamp-1">{item.why_watching}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isExpanded?<ChevronUp className="h-3.5 w-3.5 text-white/30"/>:<ChevronDown className="h-3.5 w-3.5 text-white/20"/>}
                  </div>
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}}
                      className="overflow-hidden border-t border-white/5">
                      <div className="p-4 space-y-2.5">
                        {item.why_watching && <div><p className="text-[10px] text-emerald-400/70 uppercase tracking-wider mb-0.5">Why Watching</p><p className="text-xs text-white/50 leading-relaxed">{item.why_watching}</p></div>}
                        {item.catalyst && <div><p className="text-[10px] text-blue-400/70 uppercase tracking-wider mb-0.5">Catalyst</p><p className="text-xs text-white/50 leading-relaxed">{item.catalyst}</p></div>}
                        {item.sector_context && <div><p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">Sector Context</p><p className="text-xs text-white/50 leading-relaxed">{item.sector_context}</p></div>}
                        {item.ideal_entry_notes && <div><p className="text-[10px] text-yellow-400/70 uppercase tracking-wider mb-0.5">Ideal Entry</p><p className="text-xs text-white/50 leading-relaxed">{item.ideal_entry_notes}</p></div>}
                        {item.risk_notes && <div><p className="text-[10px] text-red-400/70 uppercase tracking-wider mb-0.5">Risk / Invalidation</p><p className="text-xs text-white/50 leading-relaxed">{item.risk_notes}</p></div>}
                        {item.outcome_notes && <div><p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">Outcome Notes</p><p className="text-xs text-white/50 leading-relaxed">{item.outcome_notes}</p></div>}
                        <div className="flex justify-end gap-1.5 pt-1">
                          <button onClick={()=>openEdit(item)} className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors">
                            <Pencil className="h-3 w-3"/> Edit
                          </button>
                          <button onClick={()=>handleDelete(item.id)} className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                            <Trash2 className="h-3 w-3"/> Delete
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
