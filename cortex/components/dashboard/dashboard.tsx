"use client";

import type {
  ChatSession,
  AgentTask,
  ApprovalItem,
  Learning,
  AgentActivityRow,
  DashboardCounts,
} from "@/lib/types";
import { TopSummaryBar } from "./top-summary-bar";
import { ChatHistoryPanel } from "./chat-history-panel";
import { ActiveWork } from "./active-work";
import { ApprovalQueue } from "./approval-queue";
import { RecentLearnings } from "./recent-learnings";
import { AgentActivityPanel } from "./agent-activity-panel";

interface DashboardProps {
  userId: string;
  counts: DashboardCounts;
  chatSessions: ChatSession[];
  agentTasks: AgentTask[];
  pendingApprovals: ApprovalItem[];
  recentLearnings: Learning[];
  agentActivity: AgentActivityRow[];
}

export function Dashboard({
  userId,
  counts,
  chatSessions,
  agentTasks,
  pendingApprovals,
  recentLearnings,
  agentActivity,
}: DashboardProps) {
  return (
    <div className="flex h-full overflow-hidden">
      {/* ─── Central Workspace ─────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopSummaryBar counts={counts} />

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-5">
            {/* Chat History */}
            <ChatHistoryPanel
              initialSessions={chatSessions}
              userId={userId}
            />

            {/* Active Work + Approvals side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <ActiveWork initialTasks={agentTasks} userId={userId} />
              <ApprovalQueue
                initialApprovals={pendingApprovals}
                userId={userId}
              />
            </div>

            {/* Recent Learnings */}
            <RecentLearnings initialLearnings={recentLearnings} />
          </div>
        </div>
      </div>

      {/* ─── Right Panel: Agent Activity ───────────────── */}
      <AgentActivityPanel
        initialActivity={agentActivity}
        userId={userId}
      />
    </div>
  );
}
