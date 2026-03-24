import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BookOpen, Plus, Trash2, Pencil, ToggleLeft, ToggleRight, X, Save, Clock, Tag, ShieldAlert, Youtube, Loader2, FileText } from "lucide-react"
import { AppSidebar } from "@/components/dashboard/Sidebar"
import { useAuth } from "@/hooks/useAuth"
import {
  getTrainingContent,
  createTrainingContent,
  updateTrainingContent,
  deleteTrainingContent,
  toggleTrainingContent,
  importYoutubeTranscript,
  TrainingContent,
} from "@/lib/api"

type FormMode = "closed" | "manual" | "youtube" | "edit"

export default function AiTrainingPage() {
  const { isAdmin, loading: authLoading } = useAuth()
  const [items, setItems] = useState<TrainingContent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Unified form state
  const [formMode, setFormMode] = useState<FormMode>("closed")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formTitle, setFormTitle] = useState("")
  const [formContent, setFormContent] = useState("")
  const [formTags, setFormTags] = useState("")
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [saving, setSaving] = useState(false)

  const fetchItems = async () => {
    try {
      setLoading(true)
      const data = await getTrainingContent()
      setItems(data)
      setError(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load training content")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) fetchItems()
  }, [isAdmin])

  const closeForm = () => {
    setFormMode("closed")
    setEditingId(null)
    setFormTitle("")
    setFormContent("")
    setFormTags("")
    setYoutubeUrl("")
  }

  const openEdit = (item: TrainingContent) => {
    setEditingId(item.id)
    setFormTitle(item.title)
    setFormContent(item.content)
    setFormTags(item.tags.join(", "))
    setFormMode("edit")
  }

  const handleSave = async () => {
    if (!formTitle.trim() || !formContent.trim()) return
    setSaving(true)
    try {
      const tags = formTags.split(",").map((t) => t.trim()).filter(Boolean)
      if (editingId) {
        const updated = await updateTrainingContent(editingId, { title: formTitle, content: formContent, tags })
        setItems((prev) => prev.map((i) => (i.id === editingId ? updated : i)))
      } else {
        const created = await createTrainingContent({ title: formTitle, content: formContent, source_type: "transcript", tags })
        setItems((prev) => [created, ...prev])
      }
      closeForm()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const handleYoutubeImport = async () => {
    if (!youtubeUrl.trim()) return
    setSaving(true)
    try {
      const tags = formTags.split(",").map((t) => t.trim()).filter(Boolean)
      const created = await importYoutubeTranscript(youtubeUrl.trim(), tags)
      setItems((prev) => [created, ...prev])
      closeForm()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to import YouTube transcript")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this training content?")) return
    try {
      await deleteTrainingContent(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed")
    }
  }

  const handleToggle = async (id: string) => {
    try {
      const updated = await toggleTrainingContent(id)
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Toggle failed")
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen bg-black text-white items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-white/40" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen bg-black text-white">
        <AppSidebar />
        <main className="flex-1 ml-[72px] flex items-center justify-center">
          <div className="text-center space-y-3">
            <ShieldAlert className="h-12 w-12 text-red-400 mx-auto" />
            <h1 className="text-xl font-bold">Admin Access Required</h1>
            <p className="text-white/40 text-sm">You don't have permission to access this page.</p>
          </div>
        </main>
      </div>
    )
  }

  const activeCount = items.filter((i) => i.is_active).length
  const isFormOpen = formMode !== "closed"

  return (
    <div className="flex min-h-screen bg-black text-white">
      <AppSidebar />
      <main className="flex-1 ml-[72px] p-6 overflow-y-auto max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2.5">
              <BookOpen className="h-6 w-6 text-emerald-400" />
              Sean's Knowledge Base
            </h1>
            <p className="text-white/40 text-sm mt-0.5">
              {items.length} entries &middot; {activeCount} active
            </p>
          </div>
          {!isFormOpen && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFormMode("youtube")}
                className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-lg border border-white/10 transition-colors"
              >
                <Youtube className="h-3.5 w-3.5 text-red-400" />
                YouTube
              </button>
              <button
                onClick={() => setFormMode("manual")}
                className="flex items-center gap-1.5 px-3 py-2 text-sm bg-emerald-500 hover:bg-emerald-600 text-black font-medium rounded-lg transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            </div>
          )}
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
                {error}
                <button onClick={() => setError(null)} className="ml-2 hover:text-red-300">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <AnimatePresence>
          {isFormOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-6 p-5 rounded-xl bg-white/[0.02] border border-white/10"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
                  {formMode === "youtube" ? "Import from YouTube" : formMode === "edit" ? "Edit Content" : "Add Content"}
                </h2>
                <button onClick={closeForm} className="text-white/30 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                {formMode === "youtube" ? (
                  <>
                    <input
                      type="text"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-emerald-500/50"
                      autoFocus
                    />
                    <p className="text-[11px] text-white/25">Video must have captions enabled. Transcript is auto-fetched and the title is pulled from YouTube.</p>
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="Title — e.g., Flat Top Breakout Strategy"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-emerald-500/50"
                      autoFocus
                    />
                    <textarea
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      placeholder="Paste the video transcript or trading knowledge here..."
                      rows={8}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-emerald-500/50 resize-y font-mono leading-relaxed"
                    />
                  </>
                )}

                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="Tags (comma-separated) — e.g., breakouts, entries, risk"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-emerald-500/50"
                />

                <div className="flex justify-end gap-2 pt-1">
                  <button onClick={closeForm} className="px-3 py-1.5 text-sm rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={formMode === "youtube" ? handleYoutubeImport : handleSave}
                    disabled={saving || (formMode === "youtube" ? !youtubeUrl.trim() : !formTitle.trim() || !formContent.trim())}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
                    ) : formMode === "youtube" ? (
                      <><Youtube className="h-3.5 w-3.5" /> Import</>
                    ) : (
                      <><Save className="h-3.5 w-3.5" /> {editingId ? "Update" : "Save"}</>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-5 w-5 animate-spin text-white/30" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="h-10 w-10 text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm">No training content yet</p>
            <p className="text-white/20 text-xs mt-1">Add a transcript or import from YouTube to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: item.is_active ? 1 : 0.5 }}
                className={`group p-4 rounded-xl border transition-colors ${
                  item.is_active
                    ? "bg-white/[0.02] border-white/8 hover:border-white/15"
                    : "bg-transparent border-white/5"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Source icon */}
                  <div className="mt-0.5 shrink-0">
                    {item.source_type === "youtube" ? (
                      <Youtube className="h-4 w-4 text-red-400/60" />
                    ) : (
                      <FileText className="h-4 w-4 text-white/20" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium text-white truncate">{item.title}</h3>
                      {!item.is_active && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/30 shrink-0">OFF</span>
                      )}
                    </div>
                    <p className="text-xs text-white/30 line-clamp-2 leading-relaxed">{item.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-white/20">
                      <span className="flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                      {item.tags.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Tag className="h-2.5 w-2.5" />
                          {item.tags.join(", ")}
                        </span>
                      )}
                      <span>{(item.content.length / 1000).toFixed(1)}k chars</span>
                    </div>
                  </div>

                  {/* Actions — visible on hover */}
                  <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleToggle(item.id)}
                      className="p-1.5 rounded-md hover:bg-white/5 transition-colors"
                      title={item.is_active ? "Deactivate" : "Activate"}
                    >
                      {item.is_active ? (
                        <ToggleRight className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-white/25" />
                      )}
                    </button>
                    <button
                      onClick={() => openEdit(item)}
                      className="p-1.5 rounded-md hover:bg-white/5 transition-colors text-white/40 hover:text-white"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-md hover:bg-red-500/10 transition-colors text-white/25 hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
