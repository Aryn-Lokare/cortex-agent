import { createClient } from "@/lib/supabase/server";
import type {
  ChatSession,
  ChatMessage,
  AgentTask,
  ApprovalItem,
  Learning,
  AgentActivityRow,
  DashboardCounts,
  BrandProfile,
  Campaign,
  Post,
  AnalyticsSnapshot,
  PipelineRun,
  PipelineStep,
} from "@/lib/types";


// ─── Chat ─────────────────────────────────────────────────────

export async function getChatSessions(
  userId: string
): Promise<ChatSession[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("getChatSessions error:", error.message);
    return [];
  }
  return (data ?? []) as ChatSession[];
}

export async function getChatMessages(
  sessionId: string
): Promise<ChatMessage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getChatMessages error:", error.message);
    return [];
  }
  return (data ?? []) as ChatMessage[];
}

// ─── Agent Tasks ──────────────────────────────────────────────

export async function getAgentTasks(
  userId: string
): Promise<AgentTask[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agent_tasks")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["queued", "in_progress", "completing"])
    .order("updated_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("getAgentTasks error:", error.message);
    return [];
  }
  return (data ?? []) as AgentTask[];
}

// ─── Approval Queue ───────────────────────────────────────────

export async function getPendingApprovals(
  userId: string
): Promise<ApprovalItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("approval_queue")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("getPendingApprovals error:", error.message);
    return [];
  }
  return (data ?? []) as ApprovalItem[];
}

// ─── Learnings ────────────────────────────────────────────────

export async function getRecentLearnings(
  userId: string
): Promise<Learning[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("learnings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("getRecentLearnings error:", error.message);
    return [];
  }
  return (data ?? []) as Learning[];
}

// ─── Agent Activity ───────────────────────────────────────────

export async function getAgentActivity(
  userId: string
): Promise<AgentActivityRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agent_activity")
    .select("*")
    .eq("user_id", userId)
    .order("agent", { ascending: true });

  if (error) {
    console.error("getAgentActivity error:", error.message);
    return [];
  }
  return (data ?? []) as AgentActivityRow[];
}

// ─── Initialize Agent Activity Rows ──────────────────────────

export async function initializeAgentActivity(
  userId: string
): Promise<void> {
  const supabase = await createClient();
  const agents = [
    "orchestrator",
    "strategy",
    "writing",
    "creation",
    "posting",
    "hindsight",
  ];
  const rows = agents.map((agent) => ({
    user_id: userId,
    agent,
    status: "idle",
    current_task: null,
  }));

  const { error } = await supabase
    .from("agent_activity")
    .upsert(rows, { onConflict: "user_id,agent" });

  if (error) {
    console.error("initializeAgentActivity error:", error.message);
  }
}

// ─── Dashboard Counts ─────────────────────────────────────────

export async function getDashboardCounts(
  userId: string
): Promise<DashboardCounts> {
  const supabase = await createClient();

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

  return {
    pendingApprovals: approvals.count ?? 0,
    scheduledPosts: posts.count ?? 0,
    activeTasks: tasks.count ?? 0,
    learningCount: learnings.count ?? 0,
  };
}

// ─── Brand Profile ────────────────────────────────────────────

export async function getBrandProfile(
  userId: string
): Promise<BrandProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brand_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("getBrandProfile error:", error.message);
    return null;
  }
  return data as BrandProfile | null;
}

export async function upsertBrandProfile(
  profile: Partial<BrandProfile> & { user_id: string }
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("brand_profiles")
    .upsert(profile, { onConflict: "user_id" });

  if (error) {
    console.error("upsertBrandProfile error:", error.message);
    throw new Error(error.message);
  }
}

// ─── Campaigns ────────────────────────────────────────────────

export async function getCampaigns(userId: string): Promise<Campaign[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getCampaigns error:", error.message);
    return [];
  }
  return (data ?? []) as Campaign[];
}

export async function upsertCampaign(
  campaign: Partial<Campaign> & { user_id: string }
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("campaigns")
    .upsert(campaign, { onConflict: "id" });

  if (error) {
    console.error("upsertCampaign error:", error.message);
    throw new Error(error.message);
  }
}

export async function deleteCampaign(campaignId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("campaigns")
    .delete()
    .eq("id", campaignId);

  if (error) {
    console.error("deleteCampaign error:", error.message);
    throw new Error(error.message);
  }
}

// ─── Posts ────────────────────────────────────────────────────

export async function getPosts(userId: string): Promise<Post[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getPosts error:", error.message);
    return [];
  }
  return (data ?? []) as Post[];
}

export async function upsertPost(
  post: Partial<Post> & { user_id: string }
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("posts")
    .upsert(post, { onConflict: "id" });

  if (error) {
    console.error("upsertPost error:", error.message);
    throw new Error(error.message);
  }
}

export async function deletePost(postId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId);

  if (error) {
    console.error("deletePost error:", error.message);
    throw new Error(error.message);
  }
}

// ─── Analytics ────────────────────────────────────────────────

export async function getAnalyticsSnapshots(
  userId: string,
  platform: string
): Promise<AnalyticsSnapshot[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("analytics_snapshots")
    .select("*")
    .eq("user_id", userId)
    .eq("platform", platform)
    .order("metric_date", { ascending: true });

  if (error) {
    console.error("getAnalyticsSnapshots error:", error.message);
    return [];
  }
  return (data ?? []) as AnalyticsSnapshot[];
}

// ─── Pipeline Runs & Steps ────────────────────────────────────

export async function getPipelineRuns(
  userId: string
): Promise<PipelineRun[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pipeline_runs")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("getPipelineRuns error:", error.message);
    return [];
  }
  return (data ?? []) as PipelineRun[];
}

export async function getPipelineRunWithSteps(
  runId: string
): Promise<{ run: PipelineRun; steps: PipelineStep[] } | null> {
  const supabase = await createClient();

  const [runRes, stepsRes] = await Promise.all([
    supabase
      .from("pipeline_runs")
      .select("*")
      .eq("id", runId)
      .maybeSingle(),
    supabase
      .from("pipeline_steps")
      .select("*")
      .eq("run_id", runId)
      .order("created_at", { ascending: true }),
  ]);

  if (runRes.error) {
    console.error("getPipelineRunWithSteps (run) error:", runRes.error.message);
    return null;
  }
  if (!runRes.data) {
    return null;
  }

  if (stepsRes.error) {
    console.error("getPipelineRunWithSteps (steps) error:", stepsRes.error.message);
    return null;
  }

  return {
    run: runRes.data as PipelineRun,
    steps: (stepsRes.data ?? []) as PipelineStep[],
  };
}

export async function getActivePipelineCount(
  userId: string
): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("pipeline_runs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", ["running", "awaiting_review"]);

  if (error) {
    console.error("getActivePipelineCount error:", error.message);
    return 0;
  }
  return count ?? 0;
}

