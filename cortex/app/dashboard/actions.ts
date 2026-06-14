"use server";

import { createClient } from "@/lib/supabase/server";
import { inngest } from "@/lib/inngest/client";
import { runPostingAgent, runHindsightAgent } from "@/lib/agents";
import { revalidatePath } from "next/cache";

/**
 * Helper to fetch authenticated user or throw error
 */
async function getAuthUser(supabase: any) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized: Please sign in.");
  }
  return user;
}

/**
 * Approve a post from the Approval Queue and trigger the Posting Agent.
 */
export async function approvePostAction(postId: string, approvalQueueId: string) {
  const supabase = await createClient();
  const user = await getAuthUser(supabase);

  // 1. Fetch Post details
  const { data: post, error: postErr } = await supabase
    .from("posts")
    .select("*")
    .eq("id", postId)
    .single();

  if (postErr || !post) {
    throw new Error("Post not found: " + (postErr?.message || ""));
  }

  // 2. Update Approval Queue status
  await supabase
    .from("approval_queue")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", approvalQueueId);

  // 3. Update Post status to approved
  await supabase
    .from("posts")
    .update({
      status: "approved",
    })
    .eq("id", postId);

  // 4. Trigger Posting Agent via Inngest (with local async fallback)
  try {
    await inngest.send({
      name: "cortex/post.approve",
      data: {
        userId: user.id,
        postId,
        content: post.content,
        platform: post.platform,
      },
    });
  } catch (err) {
    console.warn("Inngest trigger failed. Falling back to direct async execution.", err);
    // Execute direct async function (don't await so it runs in background)
    runPostingAgent(user.id, postId, post.content, post.platform).catch(console.error);
  }

  revalidatePath("/dashboard");
}

/**
 * Reject a post from the Approval Queue and trigger Hindsight Reflection.
 */
export async function rejectPostAction(postId: string, approvalQueueId: string) {
  const supabase = await createClient();
  const user = await getAuthUser(supabase);

  // 1. Fetch Post details
  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("id", postId)
    .single();

  if (!post) {
    throw new Error("Post not found.");
  }

  // 2. Update Approval Queue status
  await supabase
    .from("approval_queue")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", approvalQueueId);

  // 3. Revert post back to draft
  await supabase
    .from("posts")
    .update({
      status: "draft",
    })
    .eq("id", postId);

  // 4. Trigger Hindsight Reflection (with local async fallback)
  try {
    await inngest.send({
      name: "cortex/hindsight.reflect",
      data: {
        userId: user.id,
        postId,
        content: post.content,
        triggerType: "rejection",
      },
    });
  } catch (err) {
    console.warn("Inngest trigger failed. Falling back to direct async execution.", err);
    runHindsightAgent(user.id, postId, post.content, "rejection").catch(console.error);
  }

  revalidatePath("/dashboard");
}

/**
 * Edit a post's content and trigger Hindsight reflection.
 */
export async function editPostAction(postId: string, updatedData: { title?: string; content: string; platform?: string; campaign_id?: string }) {
  const supabase = await createClient();
  const user = await getAuthUser(supabase);

  // 1. Fetch original content
  const { data: post } = await supabase
    .from("posts")
    .select("content")
    .eq("id", postId)
    .single();

  if (!post) {
    throw new Error("Post not found.");
  }

  const originalContent = post.content;

  // 2. Update post
  const { error } = await supabase
    .from("posts")
    .update({
      title: updatedData.title || null,
      content: updatedData.content,
      platform: updatedData.platform,
      campaign_id: updatedData.campaign_id || null,
    })
    .eq("id", postId);

  if (error) {
    throw new Error("Failed to edit post: " + error.message);
  }

  // 3. Trigger Hindsight on User Edit if content changed
  if (originalContent !== updatedData.content) {
    try {
      await inngest.send({
        name: "cortex/hindsight.reflect",
        data: {
          userId: user.id,
          postId,
          content: originalContent,
          triggerType: "edit",
          editedContent: updatedData.content,
        },
      });
    } catch (err) {
      console.warn("Inngest trigger failed. Falling back to direct async execution.", err);
      runHindsightAgent(user.id, postId, originalContent, "edit", updatedData.content).catch(console.error);
    }
  }

  revalidatePath("/dashboard");
}

/**
 * Publish an approved/scheduled post immediately.
 */
export async function publishPostNowAction(postId: string) {
  const supabase = await createClient();
  const user = await getAuthUser(supabase);

  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("id", postId)
    .single();

  if (!post) {
    throw new Error("Post not found.");
  }

  // Update status to approved/scheduled and trigger
  await supabase
    .from("posts")
    .update({
      status: "approved",
    })
    .eq("id", postId);

  try {
    await inngest.send({
      name: "cortex/post.approve",
      data: {
        userId: user.id,
        postId,
        content: post.content,
        platform: post.platform,
      },
    });
  } catch (err) {
    console.warn("Inngest trigger failed. Falling back to direct async execution.", err);
    runPostingAgent(user.id, postId, post.content, post.platform).catch(console.error);
  }

  revalidatePath("/dashboard");
}
