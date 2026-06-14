"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { PipelineRun, PipelineStep } from "@/lib/types";
import { approveStepAction, rejectStepAction } from "@/app/dashboard/pipeline/actions";
import {
  Target,
  PenTool,
  Image as ImageIcon,
  Send,
  CheckCircle2,
  XCircle,
  Loader2,
  Edit2,
  Check,
  X,
  Globe,
  AtSign,
  Camera,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

interface PipelineReviewProps {
  initialRun: PipelineRun;
  initialSteps: PipelineStep[];
  userId: string;
}

const platformIcons: Record<string, React.ElementType> = {
  twitter: AtSign,
  linkedin: Globe,
  instagram: Camera,
};

export function PipelineReview({ initialRun, initialSteps, userId }: PipelineReviewProps) {
  const router = useRouter();
  const [run, setRun] = useState<PipelineRun>(initialRun);
  const [steps, setSteps] = useState<PipelineStep[]>(initialSteps);
  const [isPending, startTransition] = useTransition();

  // Editing states for each step
  const [editStepId, setEditStepId] = useState<string | null>(null);

  // Strategy edit states
  const [stratPlatform, setStratPlatform] = useState("twitter");
  const [stratCampaign, setStratCampaign] = useState("");
  const [stratTheme, setStratTheme] = useState("");

  // Writing edit states
  const [writeTitle, setWriteTitle] = useState("");
  const [writeContent, setWriteContent] = useState("");

  // Creation edit states
  const [createPrompt, setCreatePrompt] = useState("");

  useEffect(() => {
    const supabase = createClient();

    // Subscribe to run changes
    const runChannel = supabase
      .channel(`run_realtime_${run.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "pipeline_runs",
          filter: `id=eq.${run.id}`,
        },
        (payload) => {
          setRun(payload.new as PipelineRun);
        }
      )
      .subscribe();

    // Subscribe to steps changes
    const stepsChannel = supabase
      .channel(`steps_realtime_${run.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pipeline_steps",
          filter: `run_id=eq.${run.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newStep = payload.new as PipelineStep;
            setSteps((prev) => {
              if (prev.some((s) => s.id === newStep.id)) return prev;
              return [...prev, newStep].sort(
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedStep = payload.new as PipelineStep;
            setSteps((prev) =>
              prev.map((s) => (s.id === updatedStep.id ? updatedStep : s))
            );
          } else if (payload.eventType === "DELETE") {
            setSteps((prev) =>
              prev.filter((s) => s.id !== (payload.old as { id: string }).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(runChannel);
      supabase.removeChannel(stepsChannel);
    };
  }, [run.id]);

  // Set local state when editing is opened
  const startEditing = (step: PipelineStep) => {
    setEditStepId(step.id);
    if (step.agent === "strategy") {
      setStratPlatform(step.output_data?.platform || "twitter");
      setStratCampaign(step.output_data?.campaignName || "");
      setStratTheme(step.output_data?.theme || "");
    } else if (step.agent === "writing") {
      setWriteTitle(step.output_data?.title || "");
      setWriteContent(step.output_data?.content || "");
    } else if (step.agent === "creation") {
      setCreatePrompt(step.output_data?.mediaPrompt || "");
    }
  };

  const handleApprove = async (stepId: string) => {
    let editedOutput: any = null;

    if (editStepId === stepId) {
      const step = steps.find((s) => s.id === stepId);
      if (step?.agent === "strategy") {
        editedOutput = {
          platform: stratPlatform,
          campaignName: stratCampaign,
          theme: stratTheme,
        };
      } else if (step?.agent === "writing") {
        editedOutput = {
          title: writeTitle || null,
          content: writeContent,
        };
      } else if (step?.agent === "creation") {
        editedOutput = {
          mediaPrompt: createPrompt || null,
        };
      }
    }

    startTransition(async () => {
      try {
        await approveStepAction(stepId, run.id, editedOutput);
        setEditStepId(null);
      } catch (err) {
        console.error("Failed to approve step:", err);
      }
    });
  };

  const handleReject = async (stepId: string) => {
    if (!confirm("Are you sure you want to reject this step? This will terminate the marketing pipeline.")) return;

    startTransition(async () => {
      try {
        await rejectStepAction(stepId, run.id);
        setEditStepId(null);
      } catch (err) {
        console.error("Failed to reject step:", err);
      }
    });
  };

  const getStepIcon = (agent: PipelineStep["agent"], status: PipelineStep["status"]) => {
    if (status === "completed" || status === "approved") {
      return <CheckCircle2 className="h-5 w-5 text-emerald-500 bg-background rounded-full" />;
    }
    if (status === "rejected" || status === "failed") {
      return <XCircle className="h-5 w-5 text-red-500 bg-background rounded-full" />;
    }

    switch (agent) {
      case "strategy":
        return <Target className="h-4 w-4" />;
      case "writing":
        return <PenTool className="h-4 w-4" />;
      case "creation":
        return <ImageIcon className="h-4 w-4" />;
      case "posting":
        return <Send className="h-4 w-4" />;
    }
  };

  const getAgentLabel = (agent: PipelineStep["agent"]) => {
    switch (agent) {
      case "strategy":
        return "Strategy Agent";
      case "writing":
        return "Writing Agent";
      case "creation":
        return "Creation Agent";
      case "posting":
        return "Posting Agent";
    }
  };

  const getAgentActivityText = (agent: PipelineStep["agent"]) => {
    switch (agent) {
      case "strategy":
        return "Formulating marketing channels and campaigns...";
      case "writing":
        return "Generating engaging copy aligned with guidelines...";
      case "creation":
        return "Designing custom graphics and visual descriptions...";
      case "posting":
        return "Formatting and uploading final draft assets...";
    }
  };

  // Helper to get step status cleanly
  const getStepStatus = (agentName: PipelineStep["agent"]): PipelineStep["status"] => {
    const s = steps.find((step) => step.agent === agentName);
    return s ? s.status : "pending";
  };

  const stepAgents: PipelineStep["agent"][] = ["strategy", "writing", "creation", "posting"];

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-5 py-3">
        <Link
          href="/dashboard/pipeline"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-body-sm font-semibold text-foreground truncate">
            {run.user_message}
          </h1>
          <p className="text-eyebrow text-muted-foreground">
            Pipeline Run Timeline
          </p>
        </div>
        <div>
          {run.status === "running" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-500 animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Processing
            </span>
          )}
          {run.status === "awaiting_review" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-500">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
              Needs Attention
            </span>
          )}
          {run.status === "completed" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-500">
              <CheckCircle2 className="h-3 w-3" />
              Completed
            </span>
          )}
          {run.status === "failed" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-500">
              <XCircle className="h-3 w-3" />
              Terminated
            </span>
          )}
        </div>
      </div>

      {/* Main Review Timeline Grid */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {stepAgents.map((agent, index) => {
            const step = steps.find((s) => s.agent === agent);
            const stepStatus = step ? step.status : "pending";
            const isActive = stepStatus === "running" || stepStatus === "awaiting_review";
            const isApproved = stepStatus === "approved" || stepStatus === "completed";
            const isRejected = stepStatus === "rejected" || stepStatus === "failed";
            const isWaiting = stepStatus === "pending";

            return (
              <div key={agent} className="relative flex gap-6">
                {/* Timeline connector line */}
                {index < stepAgents.length - 1 && (
                  <div
                    className={`absolute top-8 left-4 -ml-0.5 h-full w-[2px] transition-colors duration-300 ${
                      isApproved ? "bg-emerald-500/30" : "bg-border"
                    }`}
                  />
                )}

                {/* Timeline dot */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                    isApproved
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                      : isRejected
                      ? "border-red-500 bg-red-500/10 text-red-500"
                      : isActive
                      ? "border-primary bg-primary/10 text-primary shadow-[0_0_8px_rgba(var(--primary),0.2)] animate-pulse"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {getStepIcon(agent, stepStatus)}
                </div>

                {/* Step Card */}
                <div className="flex-1 pb-4">
                  <div
                    className={`overflow-hidden rounded-xl border transition-all duration-300 ${
                      isActive
                        ? "border-primary/40 bg-card shadow-notion-hover"
                        : isApproved
                        ? "border-border/60 bg-muted/10 opacity-90"
                        : isRejected
                        ? "border-red-500/20 bg-red-500/[0.02]"
                        : "border-border/40 bg-muted/20 opacity-50"
                    }`}
                  >
                    {/* Card Header */}
                    <div className="flex items-center justify-between border-b border-border/50 px-5 py-3 bg-muted/20">
                      <div>
                        <h3 className="text-body-sm font-semibold text-foreground">
                          {getAgentLabel(agent)}
                        </h3>
                        <p className="text-caption text-muted-foreground">
                          Step {index + 1} of 4
                        </p>
                      </div>
                      {isApproved && (
                        <span className="text-caption text-emerald-600 font-medium flex items-center gap-1">
                          <Check className="h-3.5 w-3.5" /> Approved
                        </span>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-5">
                      {/* 1. RUNNING STATE */}
                      {stepStatus === "running" && (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                          <Loader2 className="h-6 w-6 animate-spin text-primary mb-3" />
                          <p className="text-body-sm text-foreground font-medium">
                            {getAgentLabel(agent)} is working...
                          </p>
                          <p className="text-caption text-muted-foreground mt-0.5">
                            {getAgentActivityText(agent)}
                          </p>
                        </div>
                      )}

                      {/* 2. PENDING/WAITING STATE */}
                      {isWaiting && (
                        <p className="text-body-sm text-muted-foreground italic py-2">
                          Awaiting completion of previous step...
                        </p>
                      )}

                      {/* 3. REJECTED STATE */}
                      {isRejected && (
                        <div className="flex items-start gap-2.5 text-red-500 py-1">
                          <XCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-body-sm font-semibold">Step Rejected</p>
                            <p className="text-caption text-red-400">
                              This marketing pipeline was rejected by the user. Hindsight reflection has been triggered to improve future proposals.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* 4. COMPLETED/APPROVED OR AWAITING REVIEW STATE */}
                      {step && (stepStatus === "awaiting_review" || isApproved) && (
                        <div className="space-y-4">
                          {/* EDITABLE FORM DISPLAY */}
                          {editStepId === step.id ? (
                            <div className="space-y-3 pt-1">
                              {/* Strategy Agent Edit Form */}
                              {agent === "strategy" && (
                                <div className="space-y-3">
                                  <div>
                                    <label className="text-eyebrow text-muted-foreground mb-1 block">Platform</label>
                                    <select
                                      value={stratPlatform}
                                      onChange={(e) => setStratPlatform(e.target.value)}
                                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-caption text-foreground focus:border-primary/50 focus:outline-none"
                                    >
                                      <option value="twitter">X / Twitter</option>
                                      <option value="linkedin">LinkedIn</option>
                                      <option value="instagram">Instagram</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-eyebrow text-muted-foreground mb-1 block">Campaign Association</label>
                                    <input
                                      type="text"
                                      value={stratCampaign}
                                      onChange={(e) => setStratCampaign(e.target.value)}
                                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-caption text-foreground focus:border-primary/50 focus:outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-eyebrow text-muted-foreground mb-1 block">Core Theme/Focus</label>
                                    <textarea
                                      rows={2}
                                      value={stratTheme}
                                      onChange={(e) => setStratTheme(e.target.value)}
                                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-caption text-foreground focus:border-primary/50 focus:outline-none resize-none"
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Writing Agent Edit Form */}
                              {agent === "writing" && (
                                <div className="space-y-3">
                                  <div>
                                    <label className="text-eyebrow text-muted-foreground mb-1 block">Hook/Title (Optional)</label>
                                    <input
                                      type="text"
                                      value={writeTitle}
                                      onChange={(e) => setWriteTitle(e.target.value)}
                                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-caption text-foreground focus:border-primary/50 focus:outline-none"
                                      placeholder="e.g. 5 steps to scaling your marketing..."
                                    />
                                  </div>
                                  <div>
                                    <label className="text-eyebrow text-muted-foreground mb-1 block">Post Content</label>
                                    <textarea
                                      rows={6}
                                      value={writeContent}
                                      onChange={(e) => setWriteContent(e.target.value)}
                                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-caption text-foreground focus:border-primary/50 focus:outline-none"
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Creation Agent Edit Form */}
                              {agent === "creation" && (
                                <div className="space-y-3">
                                  <div>
                                    <label className="text-eyebrow text-muted-foreground mb-1 block">Image Prompt (Flux.1)</label>
                                    <textarea
                                      rows={4}
                                      value={createPrompt}
                                      onChange={(e) => setCreatePrompt(e.target.value)}
                                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-caption text-foreground focus:border-primary/50 focus:outline-none"
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Edit Action Buttons */}
                              <div className="flex gap-2 justify-end pt-2">
                                <button
                                  onClick={() => setEditStepId(null)}
                                  disabled={isPending}
                                  className="rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-caption font-medium text-foreground hover:bg-muted"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleApprove(step.id)}
                                  disabled={isPending}
                                  className="rounded-lg bg-primary px-3 py-1.5 text-caption font-medium text-primary-foreground hover:bg-primary/95 flex items-center gap-1.5"
                                >
                                  {isPending ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Check className="h-3.5 w-3.5" />
                                  )}
                                  Save & Approve
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* STATIC READONLY DISPLAY */
                            <div className="space-y-4">
                              {/* Strategy Agent Output */}
                              {agent === "strategy" && step.output_data && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="rounded-lg border border-border/40 bg-muted/10 p-3">
                                    <span className="text-eyebrow text-muted-foreground block mb-1">Platform</span>
                                    <div className="flex items-center gap-1.5 text-body-sm font-semibold text-foreground capitalize">
                                      {(() => {
                                        const PlatformIcon = platformIcons[step.output_data.platform] || Globe;
                                        return <PlatformIcon className="h-4 w-4 text-primary" />;
                                      })()}
                                      {step.output_data.platform}
                                    </div>
                                  </div>
                                  <div className="rounded-lg border border-border/40 bg-muted/10 p-3 md:col-span-2">
                                    <span className="text-eyebrow text-muted-foreground block mb-1">Campaign</span>
                                    <span className="text-body-sm font-semibold text-foreground">
                                      {step.output_data.campaignName}
                                    </span>
                                  </div>
                                  <div className="rounded-lg border border-border/40 bg-muted/10 p-3 md:col-span-3">
                                    <span className="text-eyebrow text-muted-foreground block mb-1">Theme</span>
                                    <p className="text-body-sm text-foreground">
                                      {step.output_data.theme}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Writing Agent Output */}
                              {agent === "writing" && step.output_data && (
                                <div className="rounded-lg border border-border/40 bg-muted/10 p-4 space-y-2.5">
                                  {step.output_data.title && (
                                    <h4 className="text-body-md font-bold text-foreground">
                                      {step.output_data.title}
                                    </h4>
                                  )}
                                  <p className="text-body-sm text-foreground whitespace-pre-wrap leading-relaxed font-mono select-all">
                                    {step.output_data.content}
                                  </p>
                                </div>
                              )}

                              {/* Creation Agent Output */}
                              {agent === "creation" && step.output_data && (
                                <div className="rounded-lg border border-border/40 bg-muted/10 p-4 space-y-2.5">
                                  {step.output_data.mediaPrompt ? (
                                    <>
                                      <span className="text-eyebrow text-muted-foreground block mb-1">Generated Graphic Prompt (Flux)</span>
                                      <p className="text-body-sm text-foreground italic">
                                        &ldquo;{step.output_data.mediaPrompt}&rdquo;
                                      </p>
                                    </>
                                  ) : (
                                    <p className="text-caption text-muted-foreground italic">
                                      No graphic generated for X/Twitter or LinkedIn since no specific visual keywords were found.
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Posting Agent Output */}
                              {agent === "posting" && (
                                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.02] p-4 text-emerald-800 dark:text-emerald-300">
                                  <p className="text-body-sm">
                                    Draft successfully finalized and loaded to the dashboard **Approval Queue**.
                                  </p>
                                  <Link
                                    href="/dashboard"
                                    className="mt-2.5 inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-caption font-semibold text-white hover:bg-emerald-600 transition-colors shadow-sm"
                                  >
                                    Open Dashboard Queue
                                  </Link>
                                </div>
                              )}

                              {/* Controls (Edit, Accept, Reject) when Awaiting Review */}
                              {stepStatus === "awaiting_review" && (
                                <div className="flex flex-wrap gap-2.5 justify-end border-t border-border/40 pt-4 mt-2">
                                  <button
                                    onClick={() => startEditing(step)}
                                    disabled={isPending}
                                    className="rounded-lg border border-border bg-card px-3.5 py-1.5 text-caption font-medium text-foreground hover:bg-muted flex items-center gap-1.5"
                                  >
                                    <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                                    Edit Proposal
                                  </button>

                                  <button
                                    onClick={() => handleReject(step.id)}
                                    disabled={isPending}
                                    className="rounded-lg border border-red-200 bg-red-500/10 px-3.5 py-1.5 text-caption font-medium text-red-600 hover:bg-red-500/15 flex items-center gap-1.5"
                                  >
                                    <X className="h-4 w-4" />
                                    Reject
                                  </button>

                                  <button
                                    onClick={() => handleApprove(step.id)}
                                    disabled={isPending}
                                    className="rounded-lg bg-primary px-4 py-1.5 text-caption font-medium text-primary-foreground hover:bg-primary/95 flex items-center gap-1.5 shadow-sm"
                                  >
                                    {isPending ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Check className="h-4 w-4" />
                                    )}
                                    Approve & Continue
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
