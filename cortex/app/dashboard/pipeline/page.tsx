import { PipelineList } from "@/components/dashboard/pipeline-list";
import { getPipelineRuns } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Marketing Pipelines | Cortex AI",
  description: "Review and approve agent outputs step-by-step.",
};

export default async function PipelinePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const initialRuns = await getPipelineRuns(user.id);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-heading-2 font-bold text-foreground">Marketing Pipelines</h1>
        <p className="text-body-sm text-muted-foreground mt-1">
          Review and approve agent outputs step-by-step.
        </p>
      </div>
      <PipelineList initialRuns={initialRuns} userId={user.id} />
    </div>
  );
}
