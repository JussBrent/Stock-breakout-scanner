import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Brain, Send, Loader, AlertCircle, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { callOpenAI, AIModel, getModelInfo } from "@/lib/openai"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface AiAdviceProps {
  selectedModel: AIModel
}

const STORAGE_KEY = 'ai-chat-history'

export function AiAdvice({ selectedModel }: AiAdviceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load chat history from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem(STORAGE_KEY)
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages)
        // Convert timestamp strings back to Date objects
        const messagesWithDates = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }))
        setMessages(messagesWithDates)
      } catch (err) {
        console.error('Failed to load chat history:', err)
      }
    } else {
      // Show welcome message for new users
      const welcomeMessage: ChatMessage = {
        id: '0',
        role: 'assistant',
        content: `Hello! I'm ${getModelInfo(selectedModel).name}, your AI stock trading advisor. I specialize in breakout patterns, EMA analysis, and technical indicators. How can I help you today?`,
        timestamp: new Date(),
      }
      setMessages([welcomeMessage])
    }
  }, [])

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    }
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim()) return

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setError(null)

    try {
      // Convert messages to OpenAI format
      const conversationHistory = messages.slice(-10).map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }))

      // Add current user message
      conversationHistory.push({ role: 'user', content: input })

      // Call OpenAI API
      const response = await callOpenAI(conversationHistory, selectedModel)

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get AI response')
      console.error('AI Error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearChat = () => {
    if (confirm('Are you sure you want to clear all chat history?')) {
      localStorage.removeItem(STORAGE_KEY)
      const welcomeMessage: ChatMessage = {
        id: '0',
        role: 'assistant',
        content: `Hello! I'm ${getModelInfo(selectedModel).name}, your AI stock trading advisor. I specialize in breakout patterns, EMA analysis, and technical indicators. How can I help you today?`,
        timestamp: new Date(),
      }
      setMessages([welcomeMessage])
      setError(null)
    }
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/15">
            <Brain className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">AI Stock Advisor</h3>
            <p className="text-xs text-white/60">Powered by {getModelInfo(selectedModel).name}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearChat}
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear Chat
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg mb-4">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3 animate-in fade-in slide-in-from-bottom-2",
              message.role === "assistant" ? "justify-start" : "justify-end"
            )}
          >
            {message.role === "assistant" && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Brain className="h-4 w-4 text-blue-400" />
              </div>
            )}

            <div
              className={cn(
                "max-w-[80%] px-4 py-2.5 rounded-lg",
                message.role === "assistant"
                  ? "bg-white/5 text-white border border-white/10"
                  : "bg-primary/20 text-primary-foreground border border-primary/30"
              )}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              <p className="text-xs text-white/40 mt-2">
                {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>

            {message.role === "user" && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">U</span>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Brain className="h-4 w-4 text-blue-400" />
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 rounded-lg border border-white/10">
              <Loader className="h-4 w-4 text-blue-400 animate-spin" />
              <p className="text-sm text-white/60">AI is thinking...</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex gap-2 pt-4 border-t border-white/10">
        <Input
          placeholder="Ask about stocks, patterns, or strategies..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          disabled={isLoading}
          className="bg-white/5 border-white/10 text-white placeholder:text-white/50 focus-visible:ring-blue-500"
        />
        <Button
          onClick={handleSendMessage}
          disabled={isLoading || !input.trim()}
          size="icon"
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
