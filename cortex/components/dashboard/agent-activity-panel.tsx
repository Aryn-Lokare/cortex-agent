"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AgentActivityRow, AgentName } from "@/lib/types";
import {
  Brain,
  Target,
  PenTool,
  ImageIcon,
  Send,
  Lightbulb,
  Activity,
} from "lucide-react";

interface AgentActivityPanelProps {
  initialActivity: AgentActivityRow[];
  userId: string;
}

const agentConfig: Record<
  AgentName,
  { icon: React.ElementType; accent: string; bg: string }
> = {
  orchestrator: {
    icon: Brain,
    accent: "text-[#9b6fd6]",
    bg: "bg-[#d6b6f6]/15",
  },
  strategy: {
    icon: Target,
    accent: "text-[#2a9d99]",
    bg: "bg-[#2a9d99]/10",
  },
  writing: {
    icon: PenTool,
    accent: "text-[#dd5b00]",
    bg: "bg-[#dd5b00]/10",
  },
  creation: {
    icon: ImageIcon,
    accent: "text-[#ff64c8]",
    bg: "bg-[#ff64c8]/10",
  },
  posting: {
    icon: Send,
    accent: "text-[#0075de]",
    bg: "bg-[#0075de]/10",
  },
  hindsight: {
    icon: Lightbulb,
    accent: "text-[#1aae39]",
    bg: "bg-[#1aae39]/10",
  },
};

const statusDot: Record<string, string> = {
  active: "bg-[#1aae39]",
  idle: "bg-muted-foreground/30",
  waiting: "bg-amber-400",
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Fixed agent display order
const agentOrder: AgentName[] = [
  "orchestrator",
  "strategy",
  "writing",
  "creation",
  "posting",
  "hindsight",
];

export function AgentActivityPanel({
  initialActivity,
  userId,
}: AgentActivityPanelProps) {
  const [activity, setActivity] =
    useState<AgentActivityRow[]>(initialActivity);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("agent_activity_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "agent_activity",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (
            payload.eventType === "UPDATE" ||
            payload.eventType === "INSERT"
          ) {
            const updated = payload.new as AgentActivityRow;
            setActivity((prev) => {
              const exists = prev.some((a) => a.id === updated.id);
              if (exists) {
                return prev.map((a) => (a.id === updated.id ? updated : a));
              }
              return [...prev, updated];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Sort agents in fixed order
  const sortedActivity = agentOrder
    .map((name) => activity.find((a) => a.agent === name))
    .filter(Boolean) as AgentActivityRow[];

  return (
    <div className="flex flex-col h-full border-l border-border bg-card/50 w-80 shrink-0">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
          <Activity className="h-3.5 w-3.5 text-primary" />
        </div>
        <h2 className="text-title text-foreground">Agent Activity</h2>
      </div>

      {/* Agent cards */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {sortedActivity.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mb-3">
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-body-sm text-muted-foreground">
              Initializing agents…
            </p>
            <p className="text-caption text-muted-foreground/60 mt-0.5">
              Agent status will appear here
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {sortedActivity.map((agent) => {
              const config = agentConfig[agent.agent];
              const AgentIcon = config.icon;
              const isActive = agent.status === "active";

              return (
                <div
                  key={agent.id}
                  className={`rounded-lg border border-border p-3 transition-all ${
                    isActive ? "bg-card shadow-sm" : "bg-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.bg}`}
                    >
                      <AgentIcon className={`h-4 w-4 ${config.accent}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-body-sm font-medium text-foreground capitalize">
                          {agent.agent}
                        </span>
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            statusDot[agent.status] ?? statusDot.idle
                          } ${isActive ? "animate-pulse" : ""}`}
                        />
                      </div>
                      <p className="text-caption text-muted-foreground truncate mt-0.5">
                        {agent.current_task ?? "Idle"}
                      </p>
                    </div>
                    <span className="text-eyebrow text-muted-foreground/40 shrink-0">
                      {timeAgo(agent.last_active_at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
