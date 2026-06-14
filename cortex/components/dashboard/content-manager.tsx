"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Post, Campaign, PostStatus } from "@/lib/types";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Check,
  Send,
  AtSign,
  Globe,
  Camera,
  Filter,
  Sparkles,
  MessageCircle,
  ThumbsUp,
  Share2,
  Eye,
  X,
  Clock,
} from "lucide-react";

interface ContentManagerProps {
  userId: string;
  initialPosts: Post[];
  campaigns: Campaign[];
}

const platformIcons: Record<string, React.ElementType> = {
  twitter: AtSign,
  linkedin: Globe,
  instagram: Camera,
};

const platformColors: Record<string, string> = {
  twitter: "bg-black text-white hover:bg-neutral-900",
  linkedin: "bg-[#0077b5] text-white hover:bg-[#005a8a]",
  instagram: "bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white",
};

export function ContentManager({
  userId,
  initialPosts,
  campaigns,
}: ContentManagerProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [activeTab, setActiveTab] = useState<PostStatus>("draft");
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [campaignFilter, setCampaignFilter] = useState<string>("all");

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // Form states
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postPlatform, setPostPlatform] = useState<"twitter" | "linkedin" | "instagram">("twitter");
  const [postCampaign, setPostCampaign] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");

  // Subscribing to Supabase realtime updates for posts
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("posts-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts", filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setPosts((prev) => [payload.new as Post, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setPosts((prev) =>
              prev.map((post) => (post.id === payload.new.id ? (payload.new as Post) : post))
            );
          } else if (payload.eventType === "DELETE") {
            setPosts((prev) => prev.filter((post) => post.id === payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Handle operations
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    const supabase = createClient();
    const newPost = {
      user_id: userId,
      title: postTitle.trim() || null,
      content: postContent,
      platform: postPlatform,
      campaign_id: postCampaign || null,
      status: "draft" as PostStatus,
    };

    const { data, error } = await supabase.from("posts").insert(newPost).select().single();
    if (error) {
      console.error("Create post error:", error.message);
    } else {
      setIsCreateOpen(false);
      resetForm();
    }
  };

  const handleEditPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost || !postContent.trim()) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("posts")
      .update({
        title: postTitle.trim() || null,
        content: postContent,
        platform: postPlatform,
        campaign_id: postCampaign || null,
      })
      .eq("id", selectedPost.id);

    if (error) {
      console.error("Update post error:", error.message);
    } else {
      setIsEditOpen(false);
      setSelectedPost(null);
      resetForm();
    }
  };

  const handleStatusChange = async (postId: string, newStatus: PostStatus, extra = {}) => {
    const supabase = createClient();
    const updateData: any = { status: newStatus, ...extra };
    if (newStatus === "published") {
      updateData.published_at = new Date().toISOString();
    }
    const { error } = await supabase.from("posts").update(updateData).eq("id", postId);
    if (error) {
      console.error("Update post status error:", error.message);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) {
      console.error("Delete post error:", error.message);
    }
  };

  const openScheduleModal = (post: Post) => {
    setSelectedPost(post);
    setScheduleDate("");
    setIsScheduleOpen(true);
  };

  const handleSchedulePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost || !scheduleDate) return;

    await handleStatusChange(selectedPost.id, "scheduled", {
      scheduled_at: new Date(scheduleDate).toISOString(),
    });
    setIsScheduleOpen(false);
    setSelectedPost(null);
  };

  const openEditModal = (post: Post) => {
    setSelectedPost(post);
    setPostTitle(post.title || "");
    setPostContent(post.content);
    setPostPlatform(post.platform);
    setPostCampaign(post.campaign_id || "");
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setPostTitle("");
    setPostContent("");
    setPostPlatform("twitter");
    setPostCampaign("");
  };

  // Filter and Search Logic
  const filteredPosts = posts.filter((post) => {
    const matchesTab = post.status === activeTab;
    const matchesSearch =
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.title && post.title.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPlatform = platformFilter === "all" || post.platform === platformFilter;
    const matchesCampaign = campaignFilter === "all" || post.campaign_id === campaignFilter;

    return matchesTab && matchesSearch && matchesPlatform && matchesCampaign;
  });

  // Generate realistic analytics metrics based on id for published posts
  const getSimulatedMetrics = (postId: string) => {
    const code = postId.charCodeAt(0) + postId.charCodeAt(1) || 100;
    return {
      impressions: code * 25,
      likes: Math.floor(code * 1.5),
      replies: Math.floor(code * 0.2),
      clicks: Math.floor(code * 0.4),
    };
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* ─── Page Header ────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
        <div>
          <h1 className="text-heading-2 font-bold text-foreground">Content Library</h1>
          <p className="text-caption text-muted-foreground">
            Manage your drafts, schedule queue, and evaluate published content
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
          Create Post
        </button>
      </div>

      {/* ─── Search & Filters Bar ──────────────────────── */}
      <div className="border-b border-border bg-card/60 px-6 py-3 flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search content or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-md border border-input bg-background text-body-sm placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {/* Platform filter */}
          <div className="flex items-center gap-1 border border-input bg-card rounded-md px-2.5 h-9 text-body-sm text-foreground w-1/2 sm:w-auto">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="bg-transparent border-none outline-none text-body-sm w-full"
            >
              <option value="all">All Platforms</option>
              <option value="twitter">X / Twitter</option>
              <option value="linkedin">LinkedIn</option>
              <option value="instagram">Instagram</option>
            </select>
          </div>
          {/* Campaign filter */}
          <div className="flex items-center gap-1 border border-input bg-card rounded-md px-2.5 h-9 text-body-sm text-foreground w-1/2 sm:w-auto">
            <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
              className="bg-transparent border-none outline-none text-body-sm w-full"
            >
              <option value="all">All Campaigns</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ─── Status Tabs ────────────────────────────────── */}
      <div className="flex border-b border-border bg-card px-6">
        {(["draft", "approved", "scheduled", "published"] as PostStatus[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-body-sm capitalize transition-all border-b-2 -mb-[2px] font-medium ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
            <span className="ml-1.5 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-bold">
              {posts.filter((p) => p.status === tab).length}
            </span>
          </button>
        ))}
      </div>

      {/* ─── Content Grid / List ────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#f6f5f4] dark:bg-neutral-900/40">
        {filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center border-2 border-dashed border-border rounded-xl p-8 bg-card">
            <Clock className="h-10 w-10 text-muted-foreground mb-3 animate-pulse" />
            <h3 className="text-body-sm font-semibold text-foreground capitalize">
              No {activeTab} posts
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              There are no posts here matching your filters. Create a new post or change your filter keywords.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPosts.map((post) => {
              const PlatformIcon = platformIcons[post.platform] || Globe;
              const campaign = campaigns.find((c) => c.id === post.campaign_id);

              return (
                <div
                  key={post.id}
                  className="bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Card Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-md flex items-center justify-center ${
                            platformColors[post.platform]
                          }`}
                        >
                          <PlatformIcon className="h-4 w-4" />
                        </div>
                        {campaign && (
                          <span className="text-[10px] bg-primary/5 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-semibold">
                            {campaign.name}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Content */}
                    {post.title && (
                      <h3 className="text-body-sm font-bold text-foreground mb-1">
                        {post.title}
                      </h3>
                    )}
                    <p className="text-caption text-foreground/80 whitespace-pre-wrap line-clamp-4 mb-4">
                      {post.content}
                    </p>
                  </div>

                  {/* Actions & Metrics */}
                  <div className="border-t border-border pt-4 mt-auto">
                    {/* Metrics for Published Tab */}
                    {post.status === "published" && (
                      <div className="grid grid-cols-4 gap-2 text-center text-caption text-muted-foreground mb-3">
                        <div>
                          <div className="flex items-center gap-1 justify-center font-semibold text-foreground">
                            <Eye className="h-3 w-3 text-neutral-400" />
                            {getSimulatedMetrics(post.id).impressions}
                          </div>
                          <span className="text-[9px] uppercase font-bold tracking-wider">Views</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 justify-center font-semibold text-foreground">
                            <ThumbsUp className="h-3 w-3 text-neutral-400" />
                            {getSimulatedMetrics(post.id).likes}
                          </div>
                          <span className="text-[9px] uppercase font-bold tracking-wider">Likes</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 justify-center font-semibold text-foreground">
                            <MessageCircle className="h-3 w-3 text-neutral-400" />
                            {getSimulatedMetrics(post.id).replies}
                          </div>
                          <span className="text-[9px] uppercase font-bold tracking-wider">Comments</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 justify-center font-semibold text-foreground">
                            <Share2 className="h-3 w-3 text-neutral-400" />
                            {getSimulatedMetrics(post.id).clicks}
                          </div>
                          <span className="text-[9px] uppercase font-bold tracking-wider">Clicks</span>
                        </div>
                      </div>
                    )}

                    {/* Schedule timestamp */}
                    {post.status === "scheduled" && post.scheduled_at && (
                      <div className="flex items-center gap-1 text-xs text-[#dd5b00] mb-3 font-medium">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Scheduled: {new Date(post.scheduled_at).toLocaleString()}</span>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditModal(post)}
                          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex gap-1.5">
                        {post.status === "draft" && (
                          <>
                            <button
                              onClick={() => handleStatusChange(post.id, "approved")}
                              className="flex items-center gap-1 text-xs bg-green-50 text-[#1aae39] border border-green-200 hover:bg-green-100 px-3 py-1.5 rounded-full font-medium transition-all"
                            >
                              <Check className="h-3 w-3" />
                              Approve
                            </button>
                            <button
                              onClick={() => openScheduleModal(post)}
                              className="flex items-center gap-1 text-xs bg-[#FAF8F5] dark:bg-neutral-800 border border-border hover:bg-[#F2EFE9] px-3 py-1.5 rounded-full font-medium transition-all text-neutral-700 dark:text-neutral-200"
                            >
                              <Calendar className="h-3 w-3" />
                              Schedule
                            </button>
                          </>
                        )}

                        {post.status === "approved" && (
                          <>
                            <button
                              onClick={() => openScheduleModal(post)}
                              className="flex items-center gap-1 text-xs bg-[#FAF8F5] dark:bg-neutral-800 border border-border hover:bg-[#F2EFE9] px-3 py-1.5 rounded-full font-medium transition-all text-neutral-700 dark:text-neutral-200"
                            >
                              <Calendar className="h-3 w-3" />
                              Schedule
                            </button>
                            <button
                              onClick={() => handleStatusChange(post.id, "published")}
                              className="flex items-center gap-1 text-xs bg-primary text-white hover:bg-primary-hover px-3 py-1.5 rounded-full font-semibold transition-all shadow-sm"
                            >
                              <Send className="h-3 w-3" />
                              Publish
                            </button>
                          </>
                        )}

                        {post.status === "scheduled" && (
                          <button
                            onClick={() => handleStatusChange(post.id, "published")}
                            className="flex items-center gap-1 text-xs bg-primary text-white hover:bg-primary-hover px-3 py-1.5 rounded-full font-semibold transition-all shadow-sm"
                          >
                            <Send className="h-3 w-3" />
                            Publish Now
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Modal dialogs ────────────────────────────── */}
      {/* Create / Edit Modal */}
      {(isCreateOpen || isEditOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-xl border border-border shadow-notion-elevated p-6 space-y-4 relative animate-fade-in">
            <button
              onClick={() => {
                setIsCreateOpen(false);
                setIsEditOpen(false);
                setSelectedPost(null);
                resetForm();
              }}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground p-1 rounded-md"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-body-sm font-bold text-foreground">
              {isCreateOpen ? "Create New Draft" : "Edit Post"}
            </h3>

            <form
              onSubmit={isCreateOpen ? handleCreatePost : handleEditPost}
              className="space-y-4 text-body-sm"
            >
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Title (Optional)</label>
                <input
                  type="text"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="Draft post title..."
                  className="w-full h-10 px-3 rounded-[4px] border border-[#ddd] bg-card text-body-sm placeholder:text-[#a39e98] focus:border-[#0075de] focus:ring-1 focus:ring-[#0075de] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Content</label>
                <textarea
                  rows={4}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Write your post content here..."
                  required
                  className="w-full p-3 rounded-[4px] border border-[#ddd] bg-card text-body-sm placeholder:text-[#a39e98] focus:border-[#0075de] focus:ring-1 focus:ring-[#0075de] focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Platform</label>
                  <select
                    value={postPlatform}
                    onChange={(e) => setPostPlatform(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-[4px] border border-[#ddd] bg-card text-body-sm focus:border-[#0075de] focus:outline-none"
                  >
                    <option value="twitter">X / Twitter</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="instagram">Instagram</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Link Campaign</label>
                  <select
                    value={postCampaign}
                    onChange={(e) => setPostCampaign(e.target.value)}
                    className="w-full h-10 px-3 rounded-[4px] border border-[#ddd] bg-card text-body-sm focus:border-[#0075de] focus:outline-none"
                  >
                    <option value="">None</option>
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setIsEditOpen(false);
                    setSelectedPost(null);
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

      {/* Schedule Modal */}
      {isScheduleOpen && selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-card w-full max-w-sm rounded-xl border border-border shadow-notion-elevated p-6 space-y-4 relative animate-fade-in">
            <button
              onClick={() => {
                setIsScheduleOpen(false);
                setSelectedPost(null);
              }}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground p-1 rounded-md"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-body-sm font-bold text-foreground">Schedule Post</h3>

            <form onSubmit={handleSchedulePost} className="space-y-4 text-body-sm">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Choose Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-[4px] border border-[#ddd] bg-card text-body-sm focus:border-[#0075de] focus:ring-1 focus:ring-[#0075de] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsScheduleOpen(false);
                    setSelectedPost(null);
                  }}
                  className="px-4 py-2 border border-border rounded-full hover:bg-muted text-foreground transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-white hover:bg-primary-hover rounded-full font-semibold transition-all shadow-sm"
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
