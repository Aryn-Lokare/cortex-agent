"use client";

import type { DashboardCounts } from "@/lib/types";
import { ClipboardCheck, CalendarClock, Zap, Lightbulb } from "lucide-react";

interface TopSummaryBarProps {
  counts: DashboardCounts;
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

export function TopSummaryBar({ counts }: TopSummaryBarProps) {
  return (
    <div className="flex items-center gap-3 px-6 py-3 border-b border-border bg-card/50">
      {metrics.map((m) => (
        <div
          key={m.key}
          className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 shadow-sm transition-colors hover:bg-muted"
        >
          <span className={`h-2 w-2 rounded-full ${m.dotColor}`} />
          <m.icon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-eyebrow text-foreground">{counts[m.key]}</span>
          <span className="text-eyebrow text-muted-foreground">{m.label}</span>
        </div>
      ))}
    </div>
  );
}
