"use server";

import { createClient } from "@/lib/supabase/server";
import { inngest } from "@/lib/inngest/client";
import { getPipelineRunWithSteps } from "@/lib/queries";

export async function approveStepAction(
  stepId: string,
  runId: string,
  editedOutput?: any
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // 1. Fetch step
  const { data: step, error: stepErr } = await supabase
    .from("pipeline_steps")
    .select("*")
    .eq("id", stepId)
    .single();

  if (stepErr || !step) throw new Error("Step not found");
  if (step.status === "approved") return { success: true };

  const finalOutput = editedOutput ?? step.output_data;

  // If there was an edit, trigger hindsight learning on edit
  if (editedOutput && JSON.stringify(editedOutput) !== JSON.stringify(step.output_data)) {
    let originalText = "";
    let editedText = "";
    if (step.agent === "strategy") {
      originalText = JSON.stringify(step.output_data);
      editedText = JSON.stringify(editedOutput);
    } else if (step.agent === "writing") {
      originalText = step.output_data?.content || "";
      editedText = editedOutput?.content || "";
    } else if (step.agent === "creation") {
      originalText = step.output_data?.mediaPrompt || "";
      editedText = editedOutput?.mediaPrompt || "";
    }

    if (originalText && editedText && originalText !== editedText) {
      await inngest.send({
        name: "cortex/hindsight.reflect",
        data: {
          userId: user.id,
          postId: "",
          content: originalText,
          triggerType: "edit",
          editedContent: editedText,
        },
      });
    }
  }

  // 2. Update current step to approved
  const { error: updateStepErr } = await supabase
    .from("pipeline_steps")
    .update({
      status: "approved",
      output_data: finalOutput,
      updated_at: new Date().toISOString(),
    })
    .eq("id", stepId);

  if (updateStepErr) throw updateStepErr;

  // Determine next step agent
  let nextAgent: "writing" | "creation" | "posting" | null = null;
  if (step.agent === "strategy") nextAgent = "writing";
  else if (step.agent === "writing") nextAgent = "creation";
  else if (step.agent === "creation") nextAgent = "posting";

  if (nextAgent) {
    // Update run current_step and status to running
    await supabase
      .from("pipeline_runs")
      .update({
        status: "running",
        current_step: nextAgent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", runId);

    // Create next step placeholder as pending
    await supabase
      .from("pipeline_steps")
      .insert({
        run_id: runId,
        user_id: user.id,
        agent: nextAgent,
        status: "pending",
      });

    // Trigger Inngest advance event
    await inngest.send({
      name: "cortex/pipeline.advance",
      data: {
        userId: user.id,
        runId,
        stepAgent: nextAgent,
      },
    });
  } else {
    // If nextAgent is null, it means we approved posting, which is the final step
    await supabase
      .from("pipeline_runs")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", runId);
  }

  return { success: true };
}

export async function rejectStepAction(
  stepId: string,
  runId: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // 1. Update step to rejected
  const { data: step, error: stepErr } = await supabase
    .from("pipeline_steps")
    .update({
      status: "rejected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", stepId)
    .select()
    .single();

  if (stepErr || !step) throw new Error("Step not found");

  // 2. Update run to failed
  await supabase
    .from("pipeline_runs")
    .update({
      status: "failed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", runId);

  // 3. Trigger hindsight reflection on rejection
  let contentToReflect = "";
  if (step.agent === "strategy") {
    contentToReflect = JSON.stringify(step.output_data);
  } else if (step.agent === "writing") {
    contentToReflect = step.output_data?.content || "";
  } else if (step.agent === "creation") {
    contentToReflect = step.output_data?.mediaPrompt || "";
  }

  if (contentToReflect) {
    await inngest.send({
      name: "cortex/hindsight.reflect",
      data: {
        userId: user.id,
        postId: "",
        content: contentToReflect,
        triggerType: "rejection",
      },
    });
  }

  return { success: true };
}

export async function getPipelineRunAction(runId: string) {
  return getPipelineRunWithSteps(runId);
}
