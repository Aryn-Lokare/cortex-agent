"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { ChatSession } from "@/lib/types";
import { Sparkles, MessageSquare, ArrowRight } from "lucide-react";

interface ChatHistoryPanelProps {
  initialSessions: ChatSession[];
  userId: string;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function ChatHistoryPanel({
  initialSessions,
  userId,
}: ChatHistoryPanelProps) {
  const [sessions, setSessions] = useState<ChatSession[]>(initialSessions);

  // Subscribe to realtime updates on chat_sessions
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("chat_sessions_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_sessions",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setSessions((prev) => [payload.new as ChatSession, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setSessions((prev) =>
              prev
                .map((s) =>
                  s.id === (payload.new as ChatSession).id
                    ? (payload.new as ChatSession)
                    : s
                )
                .sort(
                  (a, b) =>
                    new Date(b.updated_at).getTime() -
                    new Date(a.updated_at).getTime()
                )
            );
          } else if (payload.eventType === "DELETE") {
            setSessions((prev) =>
              prev.filter(
                (s) => s.id !== (payload.old as { id: string }).id
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <div className="rounded-xl border border-border bg-card shadow-notion-soft">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          <h2 className="text-title text-foreground">Cortex Chat</h2>
        </div>
        <Link
          href="/dashboard/chat"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-eyebrow text-primary-foreground font-medium transition-all hover:bg-primary/80 active:scale-[0.98]"
        >
          Chat with Cortex
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Session list */}
      <div className="max-h-[280px] overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-body-sm text-muted-foreground">
              No conversations yet
            </p>
            <p className="text-caption text-muted-foreground/60 mt-1">
              Start your first conversation with Cortex
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {sessions.map((session) => (
              <li key={session.id}>
                <Link
                  href={`/dashboard/chat?session=${session.id}`}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-body-sm font-medium text-foreground truncate">
                      {session.title}
                    </p>
                    {session.last_message_preview && (
                      <p className="text-caption text-muted-foreground truncate mt-0.5">
                        {session.last_message_preview}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-eyebrow text-muted-foreground/60">
                      {timeAgo(session.updated_at)}
                    </span>
                    {session.message_count > 0 && (
                      <span className="text-eyebrow text-muted-foreground/50 tabular-nums">
                        {session.message_count} msg{session.message_count !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
