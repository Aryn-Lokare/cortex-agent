"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ApprovalItem } from "@/lib/types";
import { ClipboardCheck, Check, X, AtSign, Globe, Camera } from "lucide-react";

interface ApprovalQueueProps {
  initialApprovals: ApprovalItem[];
  userId: string;
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const platformIcons: Record<string, React.ElementType> = {
  twitter: AtSign,
  linkedin: Globe,
  instagram: Camera,
};

const platformColors: Record<string, string> = {
  twitter: "text-[#62aef0]",
  linkedin: "text-[#0075de]",
  instagram: "text-[#ff64c8]",
};

export function ApprovalQueue({
  initialApprovals,
  userId,
}: ApprovalQueueProps) {
  const [approvals, setApprovals] = useState<ApprovalItem[]>(initialApprovals);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("approval_queue_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "approval_queue",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const item = payload.new as ApprovalItem;
            if (item.status === "pending") {
              setApprovals((prev) => [item, ...prev]);
            }
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as ApprovalItem;
            if (updated.status !== "pending") {
              setApprovals((prev) => prev.filter((a) => a.id !== updated.id));
            }
          } else if (payload.eventType === "DELETE") {
            setApprovals((prev) =>
              prev.filter((a) => a.id !== (payload.old as { id: string }).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  async function handleAction(id: string, status: "approved" | "rejected") {
    const supabase = createClient();
    const { error } = await supabase
      .from("approval_queue")
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq("id", id);

    if (!error) {
      setApprovals((prev) => prev.filter((a) => a.id !== id));
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-notion-soft">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400/10">
          <ClipboardCheck className="h-3.5 w-3.5 text-amber-500" />
        </div>
        <h2 className="text-title text-foreground">Approval Queue</h2>
        {approvals.length > 0 && (
          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400/15 px-1.5 text-eyebrow font-medium text-amber-600 tabular-nums">
            {approvals.length}
          </span>
        )}
      </div>

      {/* Approval list */}
      <div className="max-h-[260px] overflow-y-auto">
        {approvals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mb-3">
              <Check className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-body-sm text-muted-foreground">All caught up</p>
            <p className="text-caption text-muted-foreground/60 mt-0.5">
              No content awaiting review
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {approvals.map((item) => {
              const PlatformIcon = platformIcons[item.platform] ?? ClipboardCheck;
              return (
                <li key={item.id} className="px-5 py-3">
                  <div className="flex items-start gap-2 mb-2">
                    <PlatformIcon
                      className={`h-4 w-4 shrink-0 mt-0.5 ${
                        platformColors[item.platform] ?? "text-muted-foreground"
                      }`}
                    />
                    <p className="text-body-sm text-foreground line-clamp-2 flex-1">
                      {item.content_preview}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-eyebrow text-muted-foreground/60">
                      {timeAgo(item.created_at)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAction(item.id, "approved")}
                        className="flex h-7 items-center gap-1 rounded-md bg-[#1aae39]/10 px-2.5 text-eyebrow font-medium text-[#1aae39] transition-colors hover:bg-[#1aae39]/20 active:scale-[0.97]"
                      >
                        <Check className="h-3 w-3" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(item.id, "rejected")}
                        className="flex h-7 items-center gap-1 rounded-md bg-destructive/10 px-2.5 text-eyebrow font-medium text-destructive transition-colors hover:bg-destructive/20 active:scale-[0.97]"
                      >
                        <X className="h-3 w-3" />
                        Reject
                      </button>
                    </div>
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
