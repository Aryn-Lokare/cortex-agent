import { PipelineReview } from "@/components/dashboard/pipeline-review";
import { getPipelineRunWithSteps } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    runId: string;
  }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { runId } = await params;
  return {
    title: `Review Pipeline ${runId.substring(0, 8)} | Cortex AI`,
  };
}

export default async function PipelineReviewPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { runId } = await params;
  const result = await getPipelineRunWithSteps(runId);
  
  if (!result) {
    notFound();
  }

  return (
    <PipelineReview
      initialRun={result.run}
      initialSteps={result.steps}
      userId={user.id}
    />
  );
}
