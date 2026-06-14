"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Campaign, Post } from "@/lib/types";
import {
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Megaphone,
  Users,
  Target,
  TrendingUp,
  X,
  Loader2,
  Sparkles,
  CheckCircle,
} from "lucide-react";

interface CampaignManagerProps {
  userId: string;
  initialCampaigns: Campaign[];
  posts: Post[];
}

export function CampaignManager({
  userId,
  initialCampaigns,
  posts,
}: CampaignManagerProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  // Form states
  const [campaignName, setCampaignName] = useState("");
  const [campaignDesc, setCampaignDesc] = useState("");
  const [campaignGoal, setCampaignGoal] = useState("");
  const [campaignAudience, setCampaignAudience] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [campaignStatus, setCampaignStatus] = useState<"planning" | "active" | "completed">("planning");
  const [campaignProgress, setCampaignProgress] = useState(0);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("campaigns-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "campaigns", filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setCampaigns((prev) => [payload.new as Campaign, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setCampaigns((prev) =>
              prev.map((c) => (c.id === payload.new.id ? (payload.new as Campaign) : c))
            );
          } else if (payload.eventType === "DELETE") {
            setCampaigns((prev) => prev.filter((c) => c.id === payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName.trim() || !campaignGoal.trim() || !campaignAudience.trim()) return;

    const supabase = createClient();
    const newCampaign = {
      user_id: userId,
      name: campaignName.trim(),
      description: campaignDesc.trim() || null,
      goal: campaignGoal.trim(),
      audience: campaignAudience.trim(),
      start_date: startDate || null,
      end_date: endDate || null,
      status: campaignStatus,
      progress: campaignProgress,
    };

    const { error } = await supabase.from("campaigns").insert(newCampaign);
    if (error) {
      console.error("Create campaign error:", error.message);
    } else {
      setIsCreateOpen(false);
      resetForm();
    }
  };

  const handleEditCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign || !campaignName.trim()) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("campaigns")
      .update({
        name: campaignName.trim(),
        description: campaignDesc.trim() || null,
        goal: campaignGoal.trim(),
        audience: campaignAudience.trim(),
        start_date: startDate || null,
        end_date: endDate || null,
        status: campaignStatus,
        progress: campaignProgress,
      })
      .eq("id", selectedCampaign.id);

    if (error) {
      console.error("Update campaign error:", error.message);
    } else {
      setIsEditOpen(false);
      setSelectedCampaign(null);
      resetForm();
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm("Are you sure you want to delete this campaign? All linked content will remain but will be unlinked.")) return;
    const supabase = createClient();
    const { error } = await supabase.from("campaigns").delete().eq("id", campaignId);
    if (error) {
      console.error("Delete campaign error:", error.message);
    }
  };

  const openEditModal = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setCampaignName(campaign.name);
    setCampaignDesc(campaign.description || "");
    setCampaignGoal(campaign.goal);
    setCampaignAudience(campaign.audience);
    setStartDate(campaign.start_date || "");
    setEndDate(campaign.end_date || "");
    setCampaignStatus(campaign.status);
    setCampaignProgress(campaign.progress);
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setCampaignName("");
    setCampaignDesc("");
    setCampaignGoal("");
    setCampaignAudience("");
    setStartDate("");
    setEndDate("");
    setCampaignStatus("planning");
    setCampaignProgress(0);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-50 border-green-200 text-green-700 dark:bg-green-500/10 dark:border-green-500/20 dark:text-green-400";
      case "completed":
        return "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400";
      default:
        return "bg-neutral-50 border-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300";
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* ─── Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
        <div>
          <h1 className="text-heading-2 font-bold text-foreground">Campaigns</h1>
          <p className="text-caption text-muted-foreground">
            Manage goals, timelines, and aggregate content progress for active initiatives
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsCreateOpen(true);
          }}
          className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-body-sm font-semibold text-white hover:bg-primary-hover shadow-sm transition-all"
        >
          <Plus className="h-4 w-4" />
          New Campaign
        </button>
      </div>

      {/* ─── Campaign Summary Badges ─────────────────────────── */}
      <div className="grid grid-cols-3 border-b border-border bg-card/60 divide-x divide-border">
        <div className="px-6 py-3 text-center">
          <span className="text-caption text-muted-foreground uppercase font-medium text-[10px]">Planning</span>
          <p className="text-title font-bold text-foreground mt-0.5">
            {campaigns.filter((c) => c.status === "planning").length}
          </p>
        </div>
        <div className="px-6 py-3 text-center">
          <span className="text-caption text-muted-foreground uppercase font-medium text-[10px]">Active</span>
          <p className="text-title font-bold text-green-600 mt-0.5">
            {campaigns.filter((c) => c.status === "active").length}
          </p>
        </div>
        <div className="px-6 py-3 text-center">
          <span className="text-caption text-muted-foreground uppercase font-medium text-[10px]">Completed</span>
          <p className="text-title font-bold text-blue-600 mt-0.5">
            {campaigns.filter((c) => c.status === "completed").length}
          </p>
        </div>
      </div>

      {/* ─── Campaigns Grid ─────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#f6f5f4] dark:bg-neutral-900/40">
        {campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center border-2 border-dashed border-border rounded-xl p-8 bg-card">
            <Megaphone className="h-10 w-10 text-muted-foreground mb-3 animate-bounce" />
            <h3 className="text-body-sm font-semibold text-foreground">No Campaigns Active</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Launch a marketing campaign to structure your goals, target audiences, timelines, and associate generated social content.
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="mt-4 flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-foreground hover:bg-[#FAF8F5] transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              Create your first campaign
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {campaigns.map((campaign) => {
              const linkedPosts = posts.filter((p) => p.campaign_id === campaign.id);

              return (
                <div
                  key={campaign.id}
                  className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold capitalize ${getStatusBadgeClass(
                          campaign.status
                        )}`}
                      >
                        {campaign.status}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditModal(campaign)}
                          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCampaign(campaign.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Campaign Title & Description */}
                    <h3 className="text-body-sm font-bold text-foreground mb-1">
                      {campaign.name}
                    </h3>
                    {campaign.description && (
                      <p className="text-caption text-muted-foreground mb-4 line-clamp-2">
                        {campaign.description}
                      </p>
                    )}

                    {/* Meta Indicators */}
                    <div className="space-y-2 mb-4 text-caption text-foreground/80">
                      <div className="flex items-start gap-2">
                        <Target className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-[11px] uppercase font-bold text-muted-foreground block leading-none">Goal</strong>
                          <span className="text-xs">{campaign.goal}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Users className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-[11px] uppercase font-bold text-muted-foreground block leading-none">Audience</strong>
                          <span className="text-xs">{campaign.audience}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-[11px] uppercase font-bold text-muted-foreground block leading-none">Timeline</strong>
                          <span className="text-xs">
                            {campaign.start_date
                              ? new Date(campaign.start_date).toLocaleDateString()
                              : "flexible"}{" "}
                            –{" "}
                            {campaign.end_date
                              ? new Date(campaign.end_date).toLocaleDateString()
                              : "flexible"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress & Content Aggregation */}
                  <div className="border-t border-border pt-4 mt-auto">
                    <div className="flex items-center justify-between text-caption text-muted-foreground mb-1.5">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        {linkedPosts.length} posts linked
                      </span>
                      <span className="font-semibold text-foreground">
                        {campaign.progress}% Done
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${campaign.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Modals */}
      {(isCreateOpen || isEditOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-xl border border-border shadow-notion-elevated p-6 space-y-4 relative animate-fade-in">
            <button
              onClick={() => {
                setIsCreateOpen(false);
                setIsEditOpen(false);
                setSelectedCampaign(null);
                resetForm();
              }}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground p-1 rounded-md"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-body-sm font-bold text-foreground">
              {isCreateOpen ? "Create New Campaign" : "Edit Campaign"}
            </h3>

            <form
              onSubmit={isCreateOpen ? handleCreateCampaign : handleEditCampaign}
              className="space-y-3.5 text-body-sm"
            >
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Campaign Name</label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. Summer Product Launch"
                  required
                  className="w-full h-10 px-3 rounded-[4px] border border-[#ddd] bg-card text-body-sm placeholder:text-[#a39e98] focus:border-[#0075de] focus:ring-1 focus:ring-[#0075de] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={campaignDesc}
                  onChange={(e) => setCampaignDesc(e.target.value)}
                  placeholder="Details and context..."
                  className="w-full p-3 rounded-[4px] border border-[#ddd] bg-card text-body-sm placeholder:text-[#a39e98] focus:border-[#0075de] focus:ring-1 focus:ring-[#0075de] focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Core Goal</label>
                  <input
                    type="text"
                    value={campaignGoal}
                    onChange={(e) => setCampaignGoal(e.target.value)}
                    placeholder="e.g. Drive 10k signup clicks"
                    required
                    className="w-full h-10 px-3 rounded-[4px] border border-[#ddd] bg-card text-body-sm placeholder:text-[#a39e98] focus:border-[#0075de] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Target Audience</label>
                  <input
                    type="text"
                    value={campaignAudience}
                    onChange={(e) => setCampaignAudience(e.target.value)}
                    placeholder="e.g. Tech recruiters"
                    required
                    className="w-full h-10 px-3 rounded-[4px] border border-[#ddd] bg-card text-body-sm placeholder:text-[#a39e98] focus:border-[#0075de] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-[4px] border border-[#ddd] bg-card text-body-sm focus:border-[#0075de] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-[4px] border border-[#ddd] bg-card text-body-sm focus:border-[#0075de] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Status</label>
                  <select
                    value={campaignStatus}
                    onChange={(e) => setCampaignStatus(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-[4px] border border-[#ddd] bg-card text-body-sm focus:border-[#0075de] focus:outline-none"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="font-semibold text-foreground">Progress (%)</label>
                    <span className="text-xs font-bold text-primary">{campaignProgress}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={campaignProgress}
                    onChange={(e) => setCampaignProgress(parseInt(e.target.value))}
                    className="w-full h-10 cursor-pointer accent-[#0075de]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setIsEditOpen(false);
                    setSelectedCampaign(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-border rounded-full hover:bg-muted text-foreground transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-white hover:bg-primary-hover rounded-full font-semibold transition-all shadow-sm"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
