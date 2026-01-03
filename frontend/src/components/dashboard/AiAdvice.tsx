import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { mockChatMessages, ChatMessage } from "@/lib/mock-data"
import { Brain, Send, Loader } from "lucide-react"
import { cn } from "@/lib/utils"

export function AiAdvice() {
  const [messages, setMessages] = useState<ChatMessage[]>(mockChatMessages)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

    // Simulate API call
    setTimeout(() => {
      const responses = [
        "That's an excellent observation. Based on current market conditions and the technical pattern you mentioned, here's my analysis...",
        "I'm analyzing that data now. The indicators suggest a potential breakout setup. Let me break down the key factors for you.",
        "Great question! This aligns with the recent momentum in the sector. Here's what the technical and fundamental data reveals...",
        "I can see strong signals in what you're describing. The volume confirmation combined with the price action indicates a bullish setup.",
      ]

      const randomResponse = responses[Math.floor(Math.random() * responses.length)]

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: randomResponse,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1500)
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-blue-500/15">
          <Brain className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">AI Stock Advisor</h3>
          <p className="text-xs text-white/60">Powered by ChatGPT (Mock)</p>
        </div>
      </div>

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
