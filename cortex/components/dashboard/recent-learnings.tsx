"use client";

import type { Learning, LearningType } from "@/lib/types";
import { Lightbulb } from "lucide-react";

interface RecentLearningsProps {
  initialLearnings: Learning[];
}

const typeConfig: Record<
  LearningType,
  { dot: string; label: string }
> = {
  writing_preference: { dot: "bg-[#dd5b00]", label: "Writing" },
  audience_insight: { dot: "bg-[#2a9d99]", label: "Audience" },
  tone_adjustment: { dot: "bg-[#d6b6f6]", label: "Tone" },
  content_pattern: { dot: "bg-[#0075de]", label: "Pattern" },
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function RecentLearnings({ initialLearnings }: RecentLearningsProps) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-notion-soft">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#d6b6f6]/15">
          <Lightbulb className="h-3.5 w-3.5 text-[#9b6fd6]" />
        </div>
        <h2 className="text-title text-foreground">Recent Learnings</h2>
        {initialLearnings.length > 0 && (
          <span className="ml-auto text-eyebrow text-muted-foreground tabular-nums">
            {initialLearnings.length}
          </span>
        )}
      </div>

      {/* Learnings list */}
      <div className="max-h-[280px] overflow-y-auto">
        {initialLearnings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mb-3">
              <Lightbulb className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-body-sm text-muted-foreground">
              No learnings yet
            </p>
            <p className="text-caption text-muted-foreground/60 mt-0.5">
              Cortex learns from your feedback over time
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {initialLearnings.map((learning) => {
              const config = typeConfig[learning.type];
              const confidencePct = Math.round(learning.confidence * 100);
              return (
                <li key={learning.id} className="px-5 py-3">
                  <p className="text-body-sm text-foreground mb-2">
                    {learning.insight}
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Type badge */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-2 w-2 rounded-full ${config.dot}`}
                      />
                      <span className="text-eyebrow text-muted-foreground">
                        {config.label}
                      </span>
                    </div>
                    {/* Confidence */}
                    <div className="flex items-center gap-1.5">
                      <div className="h-1 w-12 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#0075de]/60 transition-all"
                          style={{ width: `${confidencePct}%` }}
                        />
                      </div>
                      <span className="text-eyebrow text-muted-foreground/60 tabular-nums">
                        {confidencePct}%
                      </span>
                    </div>
                    {/* Source */}
                    <span className="text-eyebrow text-muted-foreground/50 capitalize">
                      {learning.source}
                    </span>
                    {/* Time */}
                    <span className="ml-auto text-eyebrow text-muted-foreground/40">
                      {timeAgo(learning.created_at)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
