import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Brain, Send, Loader, X, Plus, AlertCircle, Maximize2 } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { callOpenAI } from "@/lib/openai"
import { useSuggestedPrompts } from "@/hooks/useSuggestedPrompts"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

const STORAGE_KEY = "sean-popup-chat"

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  content: "Hey! I'm Sean. Ask me anything about the stocks you're looking at — setups, entries, risk management.",
  timestamp: new Date(),
}

function loadMessages(): Message[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return [WELCOME]
    const parsed = JSON.parse(raw)
    return parsed.map((m: Message) => ({ ...m, timestamp: new Date(m.timestamp) }))
  } catch {
    return [WELCOME]
  }
}

export function SeanPopup() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>(loadMessages)
  const [value, setValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const suggestedPrompts = useSuggestedPrompts()

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    }
  }, [messages])

  useEffect(() => {
    if (open) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
    }
  }, [open, messages])

  const adjustTextarea = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "44px"
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [])

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isTyping) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setValue("")
    if (textareaRef.current) textareaRef.current.style.height = "44px"
    setIsTyping(true)
    setError(null)

    try {
      const history = [...messages, userMsg].slice(-10).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }))
      const reply = await callOpenAI(history, "sean-v1")
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: reply, timestamp: new Date() },
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get response")
    } finally {
      setIsTyping(false)
    }
  }

  const clearChat = () => {
    setMessages([WELCOME])
    setError(null)
  }

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30 flex items-center justify-center hover:from-emerald-400 hover:to-emerald-500 transition-colors"
            aria-label="Open Sean AI"
          >
            <Brain className="h-6 w-6 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Popup panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-h-[580px] flex flex-col rounded-2xl bg-neutral-950 border border-white/10 shadow-2xl shadow-black/60 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-neutral-900/80 backdrop-blur-xl shrink-0">
              <div className="p-1.5 rounded-lg bg-emerald-500/15">
                <Brain className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">Sean</p>
                <p className="text-[11px] text-neutral-400">AI Stock Advisor</p>
              </div>
              <div className="flex items-center gap-1">
                <Link
                  to="/ai-insights"
                  onClick={() => setOpen(false)}
                  title="Open full view"
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Maximize2 className="h-4 w-4" />
                </Link>
                <button
                  onClick={clearChat}
                  title="New chat"
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent min-h-0">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn("flex gap-2.5", msg.role === "assistant" ? "justify-start" : "justify-end")}
                >
                  {msg.role === "assistant" && (
                    <div className="shrink-0 w-7 h-7 rounded-lg bg-emerald-500/10 ring-1 ring-white/5 flex items-center justify-center mt-0.5">
                      <Brain className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[82%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed",
                      msg.role === "assistant"
                        ? "bg-neutral-900 text-neutral-100 ring-1 ring-white/5"
                        : "bg-emerald-500/10 text-neutral-100 ring-1 ring-emerald-500/20",
                    )}
                  >
                    <p className="whitespace-pre-wrap font-light">{msg.content}</p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-2.5 justify-start">
                  <div className="shrink-0 w-7 h-7 rounded-lg bg-emerald-500/10 ring-1 ring-white/5 flex items-center justify-center">
                    <Brain className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <div className="flex items-center gap-2 px-3.5 py-2.5 bg-neutral-900 rounded-xl ring-1 ring-white/5">
                    <Loader className="h-3 w-3 text-emerald-400 animate-spin" />
                    <span className="text-xs text-neutral-400">Analyzing…</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested prompts */}
            <div className="px-4 pt-2 pb-1 flex gap-1.5 flex-wrap shrink-0">
              {suggestedPrompts.slice(0, 3).map((prompt) => (
                <button
                  key={prompt.label}
                  onClick={() => {
                    setValue(prompt.text)
                    textareaRef.current?.focus()
                  }}
                  className="px-2.5 py-1 text-[11px] rounded-full bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-all"
                >
                  {prompt.label}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="px-4 pb-4 pt-2 shrink-0">
              <div className="flex gap-2 items-end bg-neutral-900/60 rounded-xl ring-1 ring-white/10 focus-within:ring-emerald-500/30 transition-all overflow-hidden px-3 py-2">
                <textarea
                  ref={textareaRef}
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value)
                    adjustTextarea()
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      send(value)
                    }
                  }}
                  placeholder="Ask about a stock, setup, or strategy…"
                  rows={1}
                  style={{ height: "44px" }}
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-neutral-500 resize-none focus:outline-none leading-relaxed font-light py-2"
                />
                <Button
                  size="sm"
                  onClick={() => send(value)}
                  disabled={!value.trim() || isTyping}
                  className="h-8 w-8 p-0 shrink-0 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 rounded-lg mb-0.5"
                >
                  {isTyping ? (
                    <Loader className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
