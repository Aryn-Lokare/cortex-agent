"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AgentTask } from "@/lib/types";
import { Zap, Clock } from "lucide-react";

interface ActiveWorkProps {
  initialTasks: AgentTask[];
  userId: string;
}

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  in_progress: { bg: "bg-[#0075de]/10", text: "text-[#0075de]", label: "In Progress" },
  queued: { bg: "bg-muted", text: "text-muted-foreground", label: "Queued" },
  completing: { bg: "bg-[#1aae39]/10", text: "text-[#1aae39]", label: "Completing" },
};

const agentColors: Record<string, string> = {
  orchestrator: "bg-[#d6b6f6]",
  strategy: "bg-[#2a9d99]",
  writing: "bg-[#dd5b00]",
  creation: "bg-[#ff64c8]",
  posting: "bg-[#0075de]",
  hindsight: "bg-[#1aae39]",
};

function elapsedTime(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export function ActiveWork({ initialTasks, userId }: ActiveWorkProps) {
  const [tasks, setTasks] = useState<AgentTask[]>(initialTasks);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("agent_tasks_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "agent_tasks",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newTask = payload.new as AgentTask;
            if (["queued", "in_progress", "completing"].includes(newTask.status)) {
              setTasks((prev) => [newTask, ...prev]);
            }
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as AgentTask;
            if (["completed", "failed"].includes(updated.status)) {
              setTasks((prev) => prev.filter((t) => t.id !== updated.id));
            } else {
              setTasks((prev) =>
                prev.map((t) => (t.id === updated.id ? updated : t))
              );
            }
          } else if (payload.eventType === "DELETE") {
            setTasks((prev) =>
              prev.filter((t) => t.id !== (payload.old as { id: string }).id)
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
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1aae39]/10">
          <Zap className="h-3.5 w-3.5 text-[#1aae39]" />
        </div>
        <h2 className="text-title text-foreground">Active Work</h2>
        {tasks.length > 0 && (
          <span className="ml-auto text-eyebrow text-muted-foreground tabular-nums">
            {tasks.length}
          </span>
        )}
      </div>

      {/* Task list */}
      <div className="max-h-[260px] overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mb-3">
              <Zap className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-body-sm text-muted-foreground">
              No active tasks
            </p>
            <p className="text-caption text-muted-foreground/60 mt-0.5">
              Cortex agents are standing by
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {tasks.map((task) => {
              const style = statusStyles[task.status] ?? statusStyles.queued;
              return (
                <li key={task.id} className="px-5 py-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-body-sm font-medium text-foreground truncate">
                      {task.title}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-eyebrow font-medium ${style.bg} ${style.text}`}
                    >
                      {style.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        agentColors[task.agent] ?? "bg-muted"
                      }`}
                    />
                    <span className="text-eyebrow text-muted-foreground capitalize">
                      {task.agent}
                    </span>
                    <Clock className="ml-auto h-3 w-3 text-muted-foreground/50" />
                    <span className="text-eyebrow text-muted-foreground/50 tabular-nums">
                      {elapsedTime(task.created_at)}
                    </span>
                  </div>
                  {/* Progress bar */}
                  {task.status === "in_progress" && (
                    <div className="mt-2 h-1 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#0075de] transition-all duration-500"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
