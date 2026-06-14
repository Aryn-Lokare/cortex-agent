import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  getChatSessions,
  getAgentTasks,
  getPendingApprovals,
  getRecentLearnings,
  getAgentActivity,
  getDashboardCounts,
  initializeAgentActivity,
} from "@/lib/queries";
import { Dashboard } from "@/components/dashboard/dashboard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Initialize agent activity rows if this is the user's first visit
  await initializeAgentActivity(user.id);

  // Fetch all dashboard data in parallel
  const [chatSessions, agentTasks, pendingApprovals, recentLearnings, agentActivity, counts] =
    await Promise.all([
      getChatSessions(user.id),
      getAgentTasks(user.id),
      getPendingApprovals(user.id),
      getRecentLearnings(user.id),
      getAgentActivity(user.id),
      getDashboardCounts(user.id),
    ]);

  return (
    <Dashboard
      userId={user.id}
      counts={counts}
      chatSessions={chatSessions}
      agentTasks={agentTasks}
      pendingApprovals={pendingApprovals}
      recentLearnings={recentLearnings}
      agentActivity={agentActivity}
    />
  );
}
