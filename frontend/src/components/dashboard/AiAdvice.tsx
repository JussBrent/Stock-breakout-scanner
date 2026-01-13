"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Brain, Send, Loader, Sparkles, TrendingUp, BarChart3, Menu, X, Plus, Trash2, Clock, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { callOpenAI, AIModel, getModelInfo } from "@/lib/openai"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

interface CommandSuggestion {
  icon: React.ReactNode
  label: string
  description: string
  prefix: string
}

interface UseAutoResizeTextareaProps {
  minHeight: number
  maxHeight?: number
}

interface AiAdviceProps {
  selectedModel: AIModel
}

const STORAGE_KEY = 'ai-conversations'

function useAutoResizeTextarea({ minHeight, maxHeight }: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current
      if (!textarea) return

      if (reset) {
        textarea.style.height = `${minHeight}px`
        return
      }

      textarea.style.height = `${minHeight}px`
      const newHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY))

      textarea.style.height = `${newHeight}px`
    },
    [minHeight, maxHeight],
  )

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = `${minHeight}px`
    }
  }, [minHeight])

  useEffect(() => {
    const handleResize = () => adjustHeight()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [adjustHeight])

  return { textareaRef, adjustHeight }
}

export function AiAdvice({ selectedModel }: AiAdviceProps) {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "default",
      title: "New Conversation",
      messages: [
        {
          id: "1",
          role: "assistant",
          content: `Hello! I'm ${getModelInfo(selectedModel).name}, your AI stock trading advisor. I specialize in breakout patterns, EMA analysis, and technical indicators. How can I help you today?`,
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ])
  const [currentConversationId, setCurrentConversationId] = useState("default")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [value, setValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [activeSuggestion, setActiveSuggestion] = useState<number>(-1)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const commandPaletteRef = useRef<HTMLDivElement>(null)

  const currentConversation = conversations.find((c) => c.id === currentConversationId) || conversations[0]
  const messages = currentConversation?.messages || []

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60,
    maxHeight: 200,
  })

  const commandSuggestions: CommandSuggestion[] = [
    {
      icon: <TrendingUp className="w-4 h-4" />,
      label: "Analyze Stock",
      description: "Get technical analysis for a stock",
      prefix: "/analyze",
    },
    {
      icon: <BarChart3 className="w-4 h-4" />,
      label: "Market Trends",
      description: "View current market trends",
      prefix: "/trends",
    },
    {
      icon: <Sparkles className="w-4 h-4" />,
      label: "Strategy",
      description: "Get trading strategy advice",
      prefix: "/strategy",
    },
  ]

  // Load conversations from localStorage on mount
  useEffect(() => {
    const savedConversations = localStorage.getItem(STORAGE_KEY)
    if (savedConversations) {
      try {
        const parsed = JSON.parse(savedConversations)
        const conversationsWithDates = parsed.map((conv: any) => ({
          ...conv,
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
        }))
        setConversations(conversationsWithDates)
        setCurrentConversationId(conversationsWithDates[0]?.id || "default")
      } catch (err) {
        console.error('Failed to load conversations:', err)
      }
    }
  }, [])

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
    }
  }, [conversations])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (value.startsWith("/") && !value.includes(" ")) {
      setShowCommandPalette(true)

      const matchingSuggestionIndex = commandSuggestions.findIndex((cmd) => cmd.prefix.startsWith(value))

      if (matchingSuggestionIndex >= 0) {
        setActiveSuggestion(matchingSuggestionIndex)
      } else {
        setActiveSuggestion(-1)
      }
    } else {
      setShowCommandPalette(false)
    }
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const commandButton = document.querySelector("[data-command-button]")

      if (
        commandPaletteRef.current &&
        !commandPaletteRef.current.contains(target) &&
        !commandButton?.contains(target)
      ) {
        setShowCommandPalette(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showCommandPalette) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setActiveSuggestion((prev) => (prev < commandSuggestions.length - 1 ? prev + 1 : 0))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setActiveSuggestion((prev) => (prev > 0 ? prev - 1 : commandSuggestions.length - 1))
      } else if (e.key === "Tab" || e.key === "Enter") {
        e.preventDefault()
        if (activeSuggestion >= 0) {
          const selectedCommand = commandSuggestions[activeSuggestion]
          setValue(selectedCommand.prefix + " ")
          setShowCommandPalette(false)
          textareaRef.current?.focus()
        }
      } else if (e.key === "Escape") {
        e.preventDefault()
        setShowCommandPalette(false)
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (value.trim()) {
        handleSendMessage()
      }
    }
  }

  const handleSendMessage = async () => {
    if (!value.trim() || isTyping) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: value,
      timestamp: new Date(),
    }

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === currentConversationId
          ? {
              ...conv,
              messages: [...conv.messages, userMessage],
              updatedAt: new Date(),
              title: getConversationTitle([...conv.messages, userMessage]),
            }
          : conv,
      ),
    )

    setValue("")
    adjustHeight(true)
    setShowCommandPalette(false)
    textareaRef.current?.focus()
    setIsTyping(true)
    setError(null)

    try {
      // Get current conversation messages for context
      const currentConv = conversations.find(c => c.id === currentConversationId)
      const conversationHistory = (currentConv?.messages || []).slice(-10).map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }))

      // Add current user message
      conversationHistory.push({ role: 'user', content: value })

      // Call OpenAI API
      const response = await callOpenAI(conversationHistory, selectedModel)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      }

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === currentConversationId
            ? {
                ...conv,
                messages: [...conv.messages, assistantMessage],
                updatedAt: new Date(),
              }
            : conv,
        ),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get AI response')
      console.error('AI Error:', err)
    } finally {
      setIsTyping(false)
    }
  }

  const createNewConversation = () => {
    const newId = Date.now().toString()
    const newConversation: Conversation = {
      id: newId,
      title: "New Conversation",
      messages: [
        {
          id: "1",
          role: "assistant",
          content: `Hello! I'm ${getModelInfo(selectedModel).name}, your AI stock trading advisor. I specialize in breakout patterns, EMA analysis, and technical indicators. How can I help you today?`,
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setConversations((prev) => [newConversation, ...prev])
    setCurrentConversationId(newId)
    setSidebarOpen(false)
  }

  const deleteConversation = (id: string) => {
    const newConversations = conversations.filter((c) => c.id !== id)
    if (newConversations.length === 0) {
      createNewConversation()
    } else {
      setConversations(newConversations)
      if (currentConversationId === id) {
        setCurrentConversationId(newConversations[0].id)
      }
    }
  }

  const getConversationTitle = (msgs: Message[]) => {
    const firstUserMessage = msgs.find((m) => m.role === "user")
    if (firstUserMessage) {
      return firstUserMessage.content.substring(0, 30) + (firstUserMessage.content.length > 30 ? "..." : "")
    }
    return "New Conversation"
  }

  const selectCommandSuggestion = (index: number) => {
    const selectedCommand = commandSuggestions[index]
    setValue(selectedCommand.prefix + " ")
    setShowCommandPalette(false)
    textareaRef.current?.focus()
  }

  return (
    <div className="flex h-full relative overflow-hidden bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
      {/* Sidebar - Part of main layout */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: sidebarOpen ? 256 : 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 120 }}
        className="bg-neutral-900/95 border-r border-white/10 flex flex-col overflow-hidden"
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-white/10 flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={createNewConversation}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-lg border border-white/10 hover:border-emerald-500/30 text-white text-sm font-medium transition-all"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </motion.button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto space-y-2 p-3 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
          {conversations.map((conv) => (
            <motion.div
              key={conv.id}
              whileHover={{ x: 4 }}
              className={cn(
                "group relative px-3 py-2.5 rounded-lg cursor-pointer transition-all",
                currentConversationId === conv.id
                  ? "bg-emerald-500/10 border border-emerald-500/30"
                  : "hover:bg-white/5 border border-transparent",
              )}
              onClick={() => {
                setCurrentConversationId(conv.id)
                setSidebarOpen(false)
              }}
            >
              <div className="flex items-start gap-2 min-w-0">
                <Clock className="h-3.5 w-3.5 text-neutral-500 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white truncate font-medium">{conv.title}</p>
                  <p className="text-[11px] text-neutral-500">
                    {conv.messages.length} messages
                  </p>
                </div>
              </div>
              <motion.button
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                onClick={(e) => {
                  e.stopPropagation()
                  deleteConversation(conv.id)
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </motion.button>
            </motion.div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-white/10 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(false)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-neutral-400 hover:text-white text-sm transition-colors"
          >
            <X className="h-4 w-4" />
            Close
          </button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Header with Menu Button */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10 bg-neutral-900/60 backdrop-blur-xl">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Menu className="h-5 w-5 text-white" />
          </motion.button>
          <div>
            <p className="text-xs text-neutral-400 font-light">Current Chat</p>
            <h2 className="text-sm font-semibold text-white truncate max-w-xs">
              {currentConversation?.title || "New Conversation"}
            </h2>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-hidden px-6 py-8 max-w-5xl mx-auto w-full flex flex-col relative z-10">
          {/* Chat Messages with refined styling */}
          <div className="flex-1 overflow-y-auto space-y-5 mb-6 pr-2 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className={cn("flex gap-3.5", message.role === "assistant" ? "justify-start" : "justify-end")}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500/10 to-blue-500/10 ring-1 ring-white/5 flex items-center justify-center">
                    <Brain className="h-4 w-4 text-emerald-400" />
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[75%] px-4 py-3.5 rounded-xl backdrop-blur-sm transition-all",
                    message.role === "assistant"
                      ? "bg-neutral-900/60 text-neutral-100 ring-1 ring-white/5"
                      : "bg-emerald-500/10 text-neutral-100 ring-1 ring-emerald-500/20",
                  )}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap font-light">{message.content}</p>
                  <p className="text-[11px] text-neutral-500 mt-2.5 font-mono">
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>

                {message.role === "user" && (
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500/10 to-blue-500/10 ring-1 ring-white/5 flex items-center justify-center">
                    <span className="text-xs font-medium text-emerald-400">You</span>
                  </div>
                )}
              </motion.div>
            ))}

            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="flex gap-3.5 justify-start"
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500/10 to-blue-500/10 ring-1 ring-white/5 flex items-center justify-center">
                  <Brain className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="flex items-center gap-2.5 px-4 py-3.5 bg-neutral-900/60 rounded-xl ring-1 ring-white/5 backdrop-blur-sm">
                  <Loader className="h-3.5 w-3.5 text-emerald-400 animate-spin" />
                  <p className="text-sm text-neutral-400 font-light">Analyzing...</p>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area with professional styling */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <AnimatePresence>
              {showCommandPalette && (
                <motion.div
                  ref={commandPaletteRef}
                  className="absolute left-0 right-0 bottom-full mb-3 backdrop-blur-xl bg-neutral-900/95 rounded-xl shadow-2xl ring-1 ring-white/10 overflow-hidden"
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="p-1.5">
                    {commandSuggestions.map((suggestion, index) => (
                      <motion.div
                        key={suggestion.prefix}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all cursor-pointer",
                          activeSuggestion === index
                            ? "bg-emerald-500/10 text-white ring-1 ring-emerald-500/20"
                            : "text-neutral-400 hover:bg-white/5 hover:text-white",
                        )}
                        onClick={() => selectCommandSuggestion(index)}
                        whileHover={{ x: 2 }}
                      >
                        <div
                          className={cn(
                            "p-1.5 rounded-md transition-colors",
                            activeSuggestion === index ? "bg-emerald-500/20 text-emerald-400" : "bg-neutral-800/50",
                          )}
                        >
                          {suggestion.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{suggestion.label}</div>
                          <div className="text-xs text-neutral-500">{suggestion.description}</div>
                        </div>
                        <kbd className="px-2 py-1 text-[10px] font-mono bg-neutral-800/50 rounded border border-white/5">
                          {suggestion.prefix}
                        </kbd>
                      </motion.div>
                    ))}
                  </div>
                  <div className="px-3 py-2 bg-neutral-950/50 border-t border-white/5">
                    <p className="text-[11px] text-neutral-500 font-mono">
                      Use <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-[10px]">↑</kbd>{" "}
                      <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-[10px]">↓</kbd> to navigate,{" "}
                      <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-[10px]">Enter</kbd> to select
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative backdrop-blur-xl bg-neutral-900/60 rounded-xl ring-1 ring-white/10 shadow-xl overflow-hidden transition-all focus-within:ring-emerald-500/30">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value)
                  adjustHeight()
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask about stocks, patterns, or type / for commands..."
                className="w-full px-5 py-4 bg-transparent text-white placeholder:text-neutral-500 resize-none focus:outline-none text-sm leading-relaxed font-light"
                rows={1}
              />
              <div className="flex items-center justify-between px-3 py-2.5 border-t border-white/5 bg-neutral-950/30">
                <div className="flex items-center gap-2">
                  <button
                    data-command-button
                    onClick={() => setShowCommandPalette(!showCommandPalette)}
                    className="text-neutral-400 hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/5"
                  >
                    <Sparkles className="h-4 w-4" />
                  </button>
                  <span className="text-[11px] text-neutral-500 font-mono">
                    Press <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-[10px]">/</kbd> for commands
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={handleSendMessage}
                  disabled={!value.trim() || isTyping}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed h-8 px-4 rounded-lg"
                >
                  {isTyping ? (
                    <Loader className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5 mr-1.5" />
                      <span className="text-sm font-medium">Send</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
