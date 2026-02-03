"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, User, Loader2 } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AIChatPanelProps {
  sessionId: string;
  problemId: string;
}

export function AIChatPanel({ sessionId, problemId }: AIChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [messagesRemaining, setMessagesRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load chat history when problem changes
  useEffect(() => {
    async function loadHistory() {
      setInitialLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/exam/chat/history?sessionId=${sessionId}&problemId=${problemId}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || "Failed to load chat");
        }

        setEnabled(data.enabled);
        setMessages(data.messages || []);
        setMessagesRemaining(data.messagesRemaining);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load chat");
        setEnabled(false);
      } finally {
        setInitialLoading(false);
      }
    }

    loadHistory();
  }, [sessionId, problemId]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/exam/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          problemId,
          message: userMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to send message");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      setMessagesRemaining(data.messagesRemaining);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
      // Remove the optimistic user message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (initialLoading) {
    return (
      <div className="w-80 border-l flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!enabled) {
    return null;
  }

  const isLimitReached = messagesRemaining !== null && messagesRemaining <= 0;

  return (
    <div className="w-80 border-l flex flex-col bg-muted/30">
      {/* Header */}
      <div className="p-3 border-b bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">AI Assistant</span>
          </div>
          {messagesRemaining !== null && (
            <span className="text-xs text-muted-foreground">
              {messagesRemaining} {messagesRemaining === 1 ? "message" : "messages"} left
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">
            Ask the AI for help with this problem
          </div>
        )}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.role === "assistant" && (
              <Bot className="h-5 w-5 text-primary shrink-0 mt-1" />
            )}
            <div
              className={`rounded-lg px-3 py-2 max-w-[85%] text-sm ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background border"
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
            {message.role === "user" && (
              <User className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <Bot className="h-5 w-5 text-primary shrink-0 mt-1" />
            <div className="bg-background border rounded-lg px-3 py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="px-3 pb-2">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t bg-background">
        {isLimitReached ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            Message limit reached
          </p>
        ) : (
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              rows={2}
              className="resize-none text-sm"
              disabled={loading}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={loading || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
