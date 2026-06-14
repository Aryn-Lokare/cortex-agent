"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DashboardCounts } from "@/lib/types";
import { ClipboardCheck, CalendarClock, Zap, Lightbulb } from "lucide-react";

interface TopSummaryBarProps {
  counts: DashboardCounts;
  userId?: string;
}

const metrics = [
  {
    key: "pendingApprovals" as const,
    label: "Pending Approvals",
    icon: ClipboardCheck,
    dotColor: "bg-amber-400",
  },
  {
    key: "scheduledPosts" as const,
    label: "Scheduled Posts",
    icon: CalendarClock,
    dotColor: "bg-[#0075de]",
  },
  {
    key: "activeTasks" as const,
    label: "Active Tasks",
    icon: Zap,
    dotColor: "bg-[#1aae39]",
  },
  {
    key: "learningCount" as const,
    label: "Learnings",
    icon: Lightbulb,
    dotColor: "bg-[#d6b6f6]",
  },
];

export function TopSummaryBar({ counts, userId }: TopSummaryBarProps) {
  const [countsState, setCountsState] = useState<DashboardCounts>(counts);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    const fetchCounts = async () => {
      const [approvals, posts, tasks, learnings] = await Promise.all([
        supabase
          .from("approval_queue")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("status", "pending"),
        supabase
          .from("agent_tasks")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("agent", "posting")
          .in("status", ["queued", "in_progress"]),
        supabase
          .from("agent_tasks")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("status", "in_progress"),
        supabase
          .from("learnings")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
      ]);

      setCountsState({
        pendingApprovals: approvals.count ?? 0,
        scheduledPosts: posts.count ?? 0,
        activeTasks: tasks.count ?? 0,
        learningCount: learnings.count ?? 0,
      });
    };

    // Listen to changes in approval_queue, agent_tasks, learnings
    const approvalsChannel = supabase
      .channel("summary_approvals_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "approval_queue",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchCounts();
        }
      )
      .subscribe();

    const tasksChannel = supabase
      .channel("summary_tasks_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "agent_tasks",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchCounts();
        }
      )
      .subscribe();

    const learningsChannel = supabase
      .channel("summary_learnings_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "learnings",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(approvalsChannel);
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(learningsChannel);
    };
  }, [userId]);

  return (
    <div className="flex items-center gap-3 px-6 py-3 border-b border-border bg-card/50">
      {metrics.map((m) => (
        <div
          key={m.key}
          className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 shadow-sm transition-colors hover:bg-muted"
        >
          <span className={`h-2 w-2 rounded-full ${m.dotColor}`} />
          <m.icon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-eyebrow text-foreground">{countsState[m.key]}</span>
          <span className="text-eyebrow text-muted-foreground">{m.label}</span>
        </div>
      ))}
    </div>
  );
}

