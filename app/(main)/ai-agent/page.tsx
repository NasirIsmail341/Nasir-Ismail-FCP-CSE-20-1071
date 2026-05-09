"use client"

import { useEffect, useRef, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Send,
  Sparkles,
  User,
  Loader2,
  Home,
  Calculator,
  Search,
  Calendar,
  TrendingUp,
  MapPin,
} from "lucide-react"
import { cn } from "@/lib/utils"

const suggestedQuestions = [
  { icon: Search, text: "Find apartments for rent in Manhattan under $3000/mo" },
  { icon: Home, text: "What penthouses are available for sale?" },
  { icon: Calculator, text: "Calculate mortgage for a $500,000 home" },
  { icon: TrendingUp, text: "What are the market trends in Brooklyn?" },
  { icon: Calendar, text: "Schedule a viewing for property" },
  { icon: MapPin, text: "Find commercial spaces near downtown" },
]

function AIAgentContent() {
  const searchParams = useSearchParams()
  const propertyId = searchParams.get("property")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [inputValue, setInputValue] = useState("")

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/ai/chat" }),
  })

  const isStreaming = status === "streaming" || status === "submitted"

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Handle property context
  useEffect(() => {
    if (propertyId && messages.length === 0) {
      setInputValue(`Tell me more about property ${propertyId}`)
    }
  }, [propertyId, messages.length])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isStreaming) return

    const message = inputValue
    setInputValue("")
    await sendMessage({ text: message })
  }

  const handleSuggestionClick = async (text: string) => {
    if (isStreaming) return
    setInputValue("")
    await sendMessage({ text })
  }

  // Extract text from message parts
  const getMessageText = (message: (typeof messages)[0]): string => {
    if (!message.parts || !Array.isArray(message.parts)) return ""
    return message.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("")
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-background/95 px-4 py-4 backdrop-blur-lg">
        <div className="rounded-full bg-primary/10 p-2">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="font-semibold text-foreground">PropGenius AI</h1>
          <p className="text-xs text-muted-foreground">Your property assistant</p>
        </div>
        <Badge variant="secondary" className="ml-auto">
          {isStreaming ? "Thinking..." : "Online"}
        </Badge>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-lg space-y-4">
          {messages.length === 0 ? (
            <div className="space-y-6 py-8">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">
                  Hi! I&apos;m your PropGenius AI
                </h2>
                <p className="mt-2 text-muted-foreground">
                  I can help you find properties, estimate prices, calculate mortgages, and more.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Try asking:</p>
                <div className="grid gap-2">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(q.text)}
                      className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-secondary"
                    >
                      <div className="rounded-full bg-primary/10 p-2">
                        <q.icon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm text-foreground">{q.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const text = getMessageText(message)
              if (!text) return null

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback
                      className={cn(
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-primary/10 text-primary"
                      )}
                    >
                      {message.role === "user" ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <Card
                    className={cn(
                      "max-w-[85%]",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card"
                    )}
                  >
                    <CardContent className="p-3">
                      <p className="whitespace-pre-wrap text-sm">{text}</p>
                    </CardContent>
                  </Card>
                </div>
              )
            })
          )}

          {isStreaming && messages.length > 0 && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary">
                  <Sparkles className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <Card className="bg-card">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Thinking...
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-background/95 px-4 py-4 backdrop-blur-lg">
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-lg gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about properties, pricing, mortgages..."
            className="flex-1"
            disabled={isStreaming}
          />
          <Button type="submit" size="icon" disabled={!inputValue.trim() || isStreaming}>
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default function AIAgentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <AIAgentContent />
    </Suspense>
  )
}
