// ============================================================
// Cortex Dashboard — TypeScript Types
// Mirrors the Supabase schema defined in supabase/migration.sql
// ============================================================

export type AgentName =
  | "orchestrator"
  | "strategy"
  | "writing"
  | "creation"
  | "posting"
  | "hindsight";

export type TaskStatus =
  | "queued"
  | "in_progress"
  | "completing"
  | "completed"
  | "failed";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export type Platform = "twitter" | "linkedin" | "instagram";

export type LearningType =
  | "writing_preference"
  | "audience_insight"
  | "tone_adjustment"
  | "content_pattern";

export type AgentStatus = "active" | "idle" | "waiting";

export type MessageRole = "user" | "assistant";

// ─── Row types ────────────────────────────────────────────────

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  last_message_preview: string | null;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  role: MessageRole;
  content: string;
  created_at: string;
}

export interface AgentTask {
  id: string;
  user_id: string;
  title: string;
  agent: AgentName;
  status: TaskStatus;
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface ApprovalItem {
  id: string;
  user_id: string;
  content_preview: string;
  content_full: string | null;
  platform: Platform;
  status: ApprovalStatus;
  created_at: string;
  reviewed_at: string | null;
}

export interface Learning {
  id: string;
  user_id: string;
  insight: string;
  type: LearningType;
  confidence: number;
  source: string;
  created_at: string;
}

export interface AgentActivityRow {
  id: string;
  user_id: string;
  agent: AgentName;
  status: AgentStatus;
  current_task: string | null;
  last_active_at: string;
}

// ─── Dashboard aggregate counts ───────────────────────────────

export interface DashboardCounts {
  pendingApprovals: number;
  scheduledPosts: number;
  activeTasks: number;
  learningCount: number;
}

// ─── Brand Profile ────────────────────────────────────────────

export interface BrandProfile {
  user_id: string;
  user_name: string;
  brand_name: string;
  brand_description: string;
  brand_voice: string;
  tone_preferences: string;
  writing_style_parameters: string;
  content_constraints: string;
  connected_accounts: string[];
  oauth_tokens: Record<string, string>;
  created_at: string;
  updated_at: string;
}

// ─── Campaigns ────────────────────────────────────────────────

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  goal: string;
  audience: string;
  start_date: string | null;
  end_date: string | null;
  status: "planning" | "active" | "completed";
  progress: number;
  created_at: string;
  updated_at: string;
}

// ─── Posts ────────────────────────────────────────────────────

export type PostStatus = "draft" | "approved" | "scheduled" | "published";

export interface Post {
  id: string;
  user_id: string;
  campaign_id: string | null;
  title: string | null;
  content: string;
  platform: "twitter" | "linkedin" | "instagram";
  status: PostStatus;
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Analytics Snapshots ──────────────────────────────────────

export interface AnalyticsSnapshot {
  id: string;
  user_id: string;
  platform: "all" | "twitter" | "linkedin" | "instagram";
  metric_date: string;
  followers_count: number;
  engagement_rate: number;
  impressions_count: number;
  clicks_count: number;
  created_at: string;
}
