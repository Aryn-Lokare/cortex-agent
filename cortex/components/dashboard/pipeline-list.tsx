"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { PipelineRun } from "@/lib/types";
import { GitBranch, ChevronRight, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface PipelineListProps {
  initialRuns: PipelineRun[];
  userId: string;
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function PipelineList({ initialRuns, userId }: PipelineListProps) {
  const [runs, setRuns] = useState<PipelineRun[]>(initialRuns);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("pipeline_runs_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pipeline_runs",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const item = payload.new as PipelineRun;
            setRuns((prev) => [item, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as PipelineRun;
            setRuns((prev) =>
              prev.map((r) => (r.id === updated.id ? updated : r))
            );
          } else if (payload.eventType === "DELETE") {
            setRuns((prev) =>
              prev.filter((r) => r.id !== (payload.old as { id: string }).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const getStatusBadge = (status: PipelineRun["status"]) => {
    switch (status) {
      case "running":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-500 animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            Generating...
          </span>
        );
      case "awaiting_review":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-500">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
            Needs Review
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-500">
            <CheckCircle2 className="h-3 w-3" />
            Ready for Posting
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-500">
            <XCircle className="h-3 w-3" />
            Rejected/Failed
          </span>
        );
      default:
        return null;
    }
  };

  const getStepNumber = (step: PipelineRun["current_step"]) => {
    switch (step) {
      case "strategy":
        return 1;
      case "writing":
        return 2;
      case "creation":
        return 3;
      case "posting":
        return 4;
      default:
        return 1;
    }
  };

  return (
    <div className="space-y-4">
      {runs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-12 text-center shadow-notion-soft">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
            <GitBranch className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-body-lg font-semibold text-foreground">No Marketing Pipelines</h3>
          <p className="text-body-sm text-muted-foreground mt-1 max-w-sm">
            Ask Cortex in the Chat page to draft copy, schedule a post, or plan a campaign to start a review pipeline.
          </p>
          <Link
            href="/dashboard/chat"
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-button font-medium text-primary-foreground hover:bg-primary/95 transition-colors"
          >
            Go to Chat
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-1">
          {runs.map((run) => {
            const stepNum = getStepNumber(run.current_step);
            const progressPercent = (stepNum / 4) * 100;

            return (
              <div
                key={run.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-5 shadow-notion-soft hover:border-primary/20 hover:shadow-notion-hover transition-all"
              >
                {/* Status Bar Indicator */}
                <div
                  className={`absolute top-0 left-0 h-[3px] transition-all duration-300 ${
                    run.status === "completed"
                      ? "bg-emerald-500"
                      : run.status === "failed"
                      ? "bg-red-500"
                      : run.status === "awaiting_review"
                      ? "bg-amber-500"
                      : "bg-blue-500"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      {getStatusBadge(run.status)}
                      <span className="text-caption text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {timeAgo(run.created_at)}
                      </span>
                    </div>

                    <h4 className="text-body-md font-medium text-foreground line-clamp-1">
                      {run.user_message}
                    </h4>

                    {/* Timeline Tracker */}
                    <div className="flex items-center gap-1.5 text-caption text-muted-foreground pt-1">
                      <span className={stepNum >= 1 ? "text-foreground font-semibold" : ""}>Strategy</span>
                      <span className="text-muted-foreground/30">→</span>
                      <span className={stepNum >= 2 ? "text-foreground font-semibold" : ""}>Writing</span>
                      <span className="text-muted-foreground/30">→</span>
                      <span className={stepNum >= 3 ? "text-foreground font-semibold" : ""}>Creation</span>
                      <span className="text-muted-foreground/30">→</span>
                      <span className={stepNum >= 4 ? "text-foreground font-semibold" : ""}>Posting</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    <Link
                      href={`/dashboard/pipeline/${run.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/30 px-3.5 py-1.5 text-caption font-medium text-foreground transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary"
                    >
                      {run.status === "awaiting_review" ? "Review Now" : "View Steps"}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
