"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ChatMessage } from "@/lib/types";
import { generateCortexResponse } from "@/app/dashboard/chat/actions";
import {
  ArrowLeft,
  SendHorizonal,
  Sparkles,
  User,
} from "lucide-react";

interface ChatPageProps {
  userId: string;
  existingSessionId: string | null;
  existingMessages: ChatMessage[];
}

const quickActions = [
  "Create a post",
  "Plan a campaign",
  "Update brand voice",
  "Analyze performance",
];

export function ChatPage({
  userId,
  existingSessionId,
  existingMessages,
}: ChatPageProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(existingMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(
    existingSessionId
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Listen for realtime message inserts from background agents
  useEffect(() => {
    if (!sessionId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`chat_messages_realtime_${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);


  async function handleSend(content?: string) {
    const text = content ?? input.trim();
    if (!text || isLoading) return;

    setInput("");
    setIsLoading(true);

    const supabase = createClient();
    let currentSessionId = sessionId;

    try {
      // Create session on first message
      if (!currentSessionId) {
        const sessionTitle =
          text.length > 50 ? text.substring(0, 50) + "…" : text;

        const { data: newSession, error: sessionError } = await supabase
          .from("chat_sessions")
          .insert({
            user_id: userId,
            title: sessionTitle,
            last_message_preview: text,
            message_count: 0,
          })
          .select()
          .single();

        if (sessionError) throw sessionError;
        currentSessionId = newSession.id;
        setSessionId(currentSessionId);

        // Update URL without full navigation
        window.history.replaceState(
          null,
          "",
          `/dashboard/chat?session=${currentSessionId}`
        );
      }

      // Insert user message
      const { data: userMsg, error: userMsgError } = await supabase
        .from("chat_messages")
        .insert({
          session_id: currentSessionId,
          user_id: userId,
          role: "user",
          content: text,
        })
        .select()
        .single();

      if (userMsgError) throw userMsgError;
      setMessages((prev) => [...prev, userMsg as ChatMessage]);

      // Call Server Action to generate Groq response
      const assistantMsg = await generateCortexResponse(
        userId,
        currentSessionId!,
        text
      );
      setMessages((prev) => [...prev, assistantMsg]);

      if (assistantMsg.pipelineRunId) {
        setTimeout(() => {
          router.push(`/dashboard/pipeline/${assistantMsg.pipelineRunId}`);
        }, 1000);
      }
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* ─── Header ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-5 py-3">
        <Link
          href="/dashboard"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h1 className="text-body-sm font-semibold text-foreground">
            Ask Cortex
          </h1>
          <p className="text-eyebrow text-muted-foreground">
            Your AI brand assistant
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#1aae39] animate-pulse" />
          <span className="text-eyebrow text-muted-foreground">Online</span>
        </div>
      </div>

      {/* ─── Quick Actions ──────────────────────────────── */}
      {messages.length === 0 && (
        <div className="px-5 py-4 border-b border-border bg-card/50">
          <p className="text-eyebrow text-muted-foreground mb-2.5 uppercase tracking-wider">
            Quick actions
          </p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <button
                key={action}
                onClick={() => handleSend(action)}
                className="rounded-full border border-border bg-card px-3.5 py-1.5 text-caption text-foreground transition-all hover:bg-muted hover:border-primary/30 active:scale-[0.98]"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Messages ───────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 mb-5">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-heading-3 text-foreground mb-2">
              Hey! I&apos;m Cortex
            </h2>
            <p className="text-body-sm text-muted-foreground max-w-md">
              Your AI brand assistant. Ask me to create posts, plan campaigns,
              update your brand voice, or anything else related to your social
              media strategy.
            </p>
          </div>
        )}

        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Avatar */}
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                  msg.role === "assistant"
                    ? "bg-primary/10"
                    : "bg-muted"
                }`}
              >
                {msg.role === "assistant" ? (
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[75%] rounded-xl px-4 py-2.5 text-body-sm ${
                  msg.role === "assistant"
                    ? "bg-card border border-border text-foreground"
                    : "bg-primary/10 text-foreground"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="rounded-xl border border-border bg-card px-4 py-3">
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ─── Input Bar ──────────────────────────────────── */}
      <div className="border-t border-border bg-card px-5 py-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 max-w-3xl mx-auto"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Cortex anything..."
            disabled={isLoading}
            className="flex-1 h-10 rounded-lg border border-input bg-background px-3.5 text-body-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all hover:bg-primary/80 active:scale-[0.95] disabled:opacity-40 disabled:pointer-events-none"
          >
            <SendHorizonal className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
