import { groq } from "@/lib/groq/client";
import { createAdminClient } from "@/lib/supabase/service";
import type { AgentName, AgentStatus, TaskStatus, Platform, LearningType, BrandProfile, Learning } from "@/lib/types";

// ==========================================
// Admin query helpers (bypass RLS for background agent context)
// ==========================================

async function getBrandProfileAdmin(userId: string): Promise<BrandProfile | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("brand_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("getBrandProfile (admin) error:", error.message);
    return null;
  }
  return data as BrandProfile | null;
}

async function getRecentLearningsAdmin(userId: string): Promise<Learning[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("learnings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("getRecentLearnings (admin) error:", error.message);
    return [];
  }
  return (data ?? []) as Learning[];
}

// ==========================================
// DB State Helpers
// ==========================================

export async function updateAgentActivity(
  userId: string,
  agent: AgentName,
  status: AgentStatus,
  currentTask: string | null
) {
  const supabase = createAdminClient();
  await supabase
    .from("agent_activity")
    .upsert(
      {
        user_id: userId,
        agent,
        status,
        current_task: currentTask,
        last_active_at: new Date().toISOString(),
      },
      { onConflict: "user_id,agent" }
    );
}

export async function createAgentTask(
  userId: string,
  title: string,
  agent: AgentName
): Promise<string> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("agent_tasks")
    .insert({
      user_id: userId,
      title,
      agent,
      status: "queued" as TaskStatus,
      progress: 0,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to create agent task:", error.message);
    throw error;
  }
  return data.id;
}

export async function updateAgentTask(
  taskId: string,
  progress: number,
  status: TaskStatus
) {
  const supabase = createAdminClient();
  await supabase
    .from("agent_tasks")
    .update({
      progress,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId);
}

// ==========================================
// Sub-Agent: Strategy Agent
// ==========================================
export async function runStrategyAgent(
  userId: string,
  userMessage: string,
  taskId: string
): Promise<{ campaignName: string; platform: Platform; theme: string }> {
  await updateAgentActivity(userId, "strategy", "active", "Formulating campaign structure...");
  await updateAgentTask(taskId, 15, "in_progress");

  // Call LLM to categorize the topic and determine campaign association
  const messages = [
    {
      role: "system",
      content: `You are the Strategy Agent. Your job is to analyze the user's content request and determine:
1. The target platform (must be one of: 'twitter', 'linkedin', 'instagram').
2. The campaign/theme name.
3. The core message focus.

Respond ONLY in JSON format:
{
  "platform": "twitter" | "linkedin" | "instagram",
  "campaignName": "Campaign name here",
  "theme": "Core theme description"
}`,
    },
    {
      role: "user",
      content: userMessage,
    },
  ];

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages,
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
  const platform = (parsed.platform || "twitter").toLowerCase() as Platform;
  const campaignName = parsed.campaignName || "General Content";
  const theme = parsed.theme || "Product announcement";

  await updateAgentTask(taskId, 30, "in_progress");
  await updateAgentActivity(userId, "strategy", "idle", null);

  return { campaignName, platform, theme };
}

// ==========================================
// Sub-Agent: Writing Agent
// ==========================================
export async function runWritingAgent(
  userId: string,
  userMessage: string,
  platform: Platform,
  theme: string,
  taskId: string
): Promise<{ title: string; content: string }> {
  await updateAgentActivity(userId, "writing", "active", "Generating platform copy...");
  await updateAgentTask(taskId, 45, "in_progress");

  const brand = await getBrandProfileAdmin(userId);
  const learnings = await getRecentLearningsAdmin(userId);
  const learningsText = learnings.length > 0
    ? learnings.map(l => `- [Confidence ${Math.floor(l.confidence * 100)}%]: ${l.insight}`).join("\n")
    : "None recorded yet.";

  const systemPrompt = `You are the Writing Agent for Cortex.
Generate social media copy based on user requirements, matching the brand guidelines and past hindsight learnings.

Brand Voice: ${brand?.brand_voice || "Empathetic and bold"}
Tone: ${brand?.tone_preferences || "Professional"}
Style: ${brand?.writing_style_parameters || "Concise and punchy"}
Constraints: ${brand?.content_constraints || "No jargon"}

Hindsight Learnings (MUST obey these rules):
${learningsText}

Generate a post for the platform: ${platform.toUpperCase()}.
Message theme: ${theme}

Respond ONLY in JSON format:
{
  "title": "Short title or hook here (can be null)",
  "content": "Full post copy here"
}`;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ];

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages,
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
  const title = parsed.title || null;
  const content = parsed.content || "";

  await updateAgentTask(taskId, 65, "in_progress");
  await updateAgentActivity(userId, "writing", "idle", null);

  return { title, content };
}

// ==========================================
// Sub-Agent: Creation Agent
// ==========================================
export async function runCreationAgent(
  userId: string,
  content: string,
  platform: Platform,
  taskId: string
): Promise<{ mediaPrompt: string | null }> {
  await updateAgentActivity(userId, "creation", "active", "Drafting graphic details...");
  await updateAgentTask(taskId, 80, "in_progress");

  // If Twitter or LinkedIn, we don't always generate media, but Instagram always needs an image
  if (platform !== "instagram" && !content.toLowerCase().includes("image") && !content.toLowerCase().includes("graphic")) {
    await updateAgentTask(taskId, 90, "in_progress");
    await updateAgentActivity(userId, "creation", "idle", null);
    return { mediaPrompt: null };
  }

  // Create prompt for Fal.ai / Flux
  const messages = [
    {
      role: "system",
      content: `You are the Creation Agent. Based on the social post copy, write a highly descriptive visual prompt for a graphics generator (Flux.1) that illustrates the post topic.
Keep it clean, brand-safe, and visually modern.

Respond ONLY in JSON format:
{
  "prompt": "Detailed graphic prompt here"
}`,
    },
    { role: "user", content },
  ];

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages,
    temperature: 0.6,
    response_format: { type: "json_object" },
  });

  const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
  const mediaPrompt = parsed.prompt || "A clean marketing banner illustrating digital collaboration.";

  await updateAgentTask(taskId, 90, "in_progress");
  await updateAgentActivity(userId, "creation", "idle", null);

  return { mediaPrompt };
}

// ==========================================
// Main Orchestrator Agent
// ==========================================
// ==========================================
// Main Orchestrator Agent
// ==========================================
export async function runOrchestratorAgent(
  userId: string,
  sessionId: string,
  userMessage: string,
  runId: string
) {
  await updateAgentActivity(userId, "orchestrator", "active", "Processing user prompt...");
  const taskId = await createAgentTask(userId, "Running pipeline: " + userMessage.substring(0, 30) + "...", "orchestrator");
  await updateAgentTask(taskId, 5, "in_progress");

  try {
    const supabase = createAdminClient();

    // 1. Create or ensure the pipeline_runs entry is running
    await supabase
      .from("pipeline_runs")
      .update({
        status: "running",
        current_step: "strategy",
        updated_at: new Date().toISOString(),
      })
      .eq("id", runId);

    // 2. Create the pipeline_steps entry for Strategy
    const { data: stepData, error: stepErr } = await supabase
      .from("pipeline_steps")
      .insert({
        run_id: runId,
        user_id: userId,
        agent: "strategy",
        status: "running",
        input_data: { userMessage },
      })
      .select("id")
      .single();

    if (stepErr) throw stepErr;
    const stepId = stepData.id;

    // 3. Run Strategy Agent
    const strategy = await runStrategyAgent(userId, userMessage, taskId);

    // 4. Save Strategy Output and set status to awaiting_review
    await supabase
      .from("pipeline_steps")
      .update({
        status: "awaiting_review",
        output_data: strategy,
        updated_at: new Date().toISOString(),
      })
      .eq("id", stepId);

    await supabase
      .from("pipeline_runs")
      .update({
        status: "awaiting_review",
        current_step: "strategy",
        updated_at: new Date().toISOString(),
      })
      .eq("id", runId);

    await updateAgentTask(taskId, 100, "completed");
    await updateAgentActivity(userId, "orchestrator", "idle", null);

    // Append Assistant Message to Chat
    const chatMessageText = `I have started the marketing pipeline! We are currently at the **Strategy** stage.
    
Please review and approve the strategy proposal to move to the Writing stage:
[Review Pipeline Run](/dashboard/pipeline/${runId})`;

    await supabase
      .from("chat_messages")
      .insert({
        session_id: sessionId,
        user_id: userId,
        role: "assistant",
        content: chatMessageText,
      });

    await supabase
      .from("chat_sessions")
      .update({
        last_message_preview: chatMessageText.substring(0, 80) + "...",
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

  } catch (err: any) {
    console.error("Strategy pipeline orchestration failed:", err);
    await updateAgentTask(taskId, 100, "failed");
    await updateAgentActivity(userId, "orchestrator", "idle", null);

    const supabase = createAdminClient();
    await supabase
      .from("pipeline_runs")
      .update({
        status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", runId);

    await supabase
      .from("chat_messages")
      .insert({
        session_id: sessionId,
        user_id: userId,
        role: "assistant",
        content: `Error starting pipeline: ${err.message || "Unknown error"}.`,
      });
  }
}

export async function advancePipeline(
  userId: string,
  runId: string,
  stepAgent: "writing" | "creation" | "posting"
) {
  const supabase = createAdminClient();
  const taskId = await createAgentTask(
    userId,
    `Running ${stepAgent} agent...`,
    stepAgent
  );
  await updateAgentTask(taskId, 10, "in_progress");

  let stepId: string | undefined;

  try {
    // 1. Fetch current run and steps to get previous outputs
    const { data: runData, error: runErr } = await supabase
      .from("pipeline_runs")
      .select("*")
      .eq("id", runId)
      .single();

    if (runErr || !runData) throw new Error("Pipeline run not found");

    const { data: steps, error: stepsErr } = await supabase
      .from("pipeline_steps")
      .select("*")
      .eq("run_id", runId)
      .order("created_at", { ascending: true });

    if (stepsErr || !steps) throw new Error("Pipeline steps not found");

    // Get or create the step for the current agent
    let currentStep = steps.find((s) => s.agent === stepAgent);
    stepId = currentStep?.id;

    if (!currentStep) {
      const { data: newStep, error: newStepErr } = await supabase
        .from("pipeline_steps")
        .insert({
          run_id: runId,
          user_id: userId,
          agent: stepAgent,
          status: "running",
        })
        .select()
        .single();
      if (newStepErr) throw newStepErr;
      currentStep = newStep;
      stepId = newStep.id;
    } else {
      await supabase
        .from("pipeline_steps")
        .update({ status: "running" })
        .eq("id", stepId);
    }

    if (stepAgent === "writing") {
      // Writing Agent needs the Strategy output.
      const strategyStep = steps.find((s) => s.agent === "strategy" && s.status === "approved");
      if (!strategyStep) throw new Error("Approved strategy step not found");

      const strategyOutput = strategyStep.output_data;
      const writing = await runWritingAgent(
        userId,
        runData.user_message,
        strategyOutput.platform,
        strategyOutput.theme,
        taskId
      );

      // Save output
      await supabase
        .from("pipeline_steps")
        .update({
          status: "awaiting_review",
          output_data: writing,
          updated_at: new Date().toISOString(),
        })
        .eq("id", stepId);

      await supabase
        .from("pipeline_runs")
        .update({
          status: "awaiting_review",
          current_step: "writing",
          updated_at: new Date().toISOString(),
        })
        .eq("id", runId);

    } else if (stepAgent === "creation") {
      // Creation Agent needs the Writing output.
      const writingStep = steps.find((s) => s.agent === "writing" && s.status === "approved");
      if (!writingStep) throw new Error("Approved writing step not found");

      const writingOutput = writingStep.output_data;
      const strategyStep = steps.find((s) => s.agent === "strategy" && s.status === "approved");
      if (!strategyStep) throw new Error("Approved strategy step not found");

      const creation = await runCreationAgent(
        userId,
        writingOutput.content,
        strategyStep.output_data.platform,
        taskId
      );

      // Save output
      await supabase
        .from("pipeline_steps")
        .update({
          status: "awaiting_review",
          output_data: creation,
          updated_at: new Date().toISOString(),
        })
        .eq("id", stepId);

      await supabase
        .from("pipeline_runs")
        .update({
          status: "awaiting_review",
          current_step: "creation",
          updated_at: new Date().toISOString(),
        })
        .eq("id", runId);

    } else if (stepAgent === "posting") {
      // Posting Agent needs Strategy, Writing, and Creation outputs.
      const strategyStep = steps.find((s) => s.agent === "strategy" && s.status === "approved");
      const writingStep = steps.find((s) => s.agent === "writing" && s.status === "approved");
      const creationStep = steps.find((s) => s.agent === "creation" && s.status === "approved");

      if (!strategyStep || !writingStep || !creationStep) {
        throw new Error("Missing approved inputs for posting stage");
      }

      const strategyOutput = strategyStep.output_data;
      const writingOutput = writingStep.output_data;
      const creationOutput = creationStep.output_data;

      // 1. Create campaign if needed, or fetch existing
      let campaignId = null;
      const { data: campaignData } = await supabase
        .from("campaigns")
        .select("id")
        .eq("user_id", userId)
        .eq("name", strategyOutput.campaignName)
        .maybeSingle();

      if (campaignData) {
        campaignId = campaignData.id;
      } else {
        const { data: newCampaign } = await supabase
          .from("campaigns")
          .insert({
            user_id: userId,
            name: strategyOutput.campaignName,
            goal: "Grow engagement on " + strategyOutput.platform,
            audience: "General audience",
            status: "planning",
          })
          .select("id")
          .single();
        if (newCampaign) campaignId = newCampaign.id;
      }

      // 2. Insert Post
      const { data: postData, error: postErr } = await supabase
        .from("posts")
        .insert({
          user_id: userId,
          campaign_id: campaignId,
          title: writingOutput.title,
          content: writingOutput.content,
          platform: strategyOutput.platform,
          status: "draft",
        })
        .select("id")
        .single();

      if (postErr) throw postErr;

      // 3. Insert into Approval Queue
      const approvalPayload = {
        user_id: userId,
        content_preview: writingOutput.title || writingOutput.content.substring(0, 100) + "...",
        content_full: JSON.stringify({
          post_id: postData.id,
          content: writingOutput.content,
          media_prompt: creationOutput.mediaPrompt,
        }),
        platform: strategyOutput.platform,
        status: "pending",
      };

      const { error: approvalErr } = await supabase
        .from("approval_queue")
        .insert(approvalPayload);

      if (approvalErr) throw approvalErr;

      // Update step status
      await supabase
        .from("pipeline_steps")
        .update({
          status: "completed",
          output_data: { post_id: postData.id, ...approvalPayload },
          updated_at: new Date().toISOString(),
        })
        .eq("id", stepId);

      // Update run status
      await supabase
        .from("pipeline_runs")
        .update({
          status: "completed",
          current_step: "posting",
          updated_at: new Date().toISOString(),
        })
        .eq("id", runId);
    }

    await updateAgentTask(taskId, 100, "completed");
    await updateAgentActivity(userId, stepAgent, "idle", null);

  } catch (err: any) {
    console.error(`Pipeline step ${stepAgent} failed:`, err);
    await updateAgentTask(taskId, 100, "failed");
    await updateAgentActivity(userId, stepAgent, "idle", null);

    if (stepId) {
      await supabase
        .from("pipeline_steps")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", stepId);
    }

    await supabase
      .from("pipeline_runs")
      .update({
        status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", runId);
  }
}


// ==========================================
// Posting Agent & Real LinkedIn Publisher
// ==========================================
export async function runPostingAgent(
  userId: string,
  postId: string,
  content: string,
  platform: Platform
) {
  await updateAgentActivity(userId, "posting", "active", `Initiating post execution for ${platform}...`);
  const taskId = await createAgentTask(userId, `Posting to ${platform}...`, "posting");
  await updateAgentTask(taskId, 10, "in_progress");

  try {
    const supabase = createAdminClient();

    if (platform === "linkedin") {
      // 1. LinkedIn Auth & Credentials check
      const linkedInAccessToken = (process.env.LINKEDIN_ACCESS_TOKEN || "").trim().replace(/^['"]|['"]$/g, "");
      let activeToken = linkedInAccessToken;

      // Fallback: Check profile tokens in DB
      if (!activeToken) {
        const brand = await getBrandProfileAdmin(userId);
        if (brand?.oauth_tokens && brand.oauth_tokens.linkedin) {
          activeToken = brand.oauth_tokens.linkedin.trim().replace(/^['"]|['"]$/g, "");
        }
      }

      // 2. Real API Posting if token is present and not mock
      if (activeToken && !activeToken.startsWith("mock_")) {
        await updateAgentActivity(userId, "posting", "active", "Fetching LinkedIn profile details...");
        await updateAgentTask(taskId, 30, "in_progress");

        // Fetch User URN
        let authorUrn = "";
        try {
          const profileRes = await fetch("https://api.linkedin.com/v2/me", {
            headers: {
              Authorization: `Bearer ${activeToken}`,
              "X-Restli-Protocol-Version": "2.0.0",
            },
          });

          if (!profileRes.ok) {
            console.warn(`v2/me failed with status ${profileRes.status}. Trying v2/userinfo...`);
            // Fallback for newer UserInfo endpoint
            const infoRes = await fetch("https://api.linkedin.com/v2/userinfo", {
              headers: { Authorization: `Bearer ${activeToken}` },
            });
            if (infoRes.ok) {
              const info = await infoRes.json();
              authorUrn = `urn:li:person:${info.sub}`;
            } else {
              const v2MeBody = await profileRes.text();
              const userInfoBody = await infoRes.text();
              throw new Error(
                `Profile fetch failed. v2/me status: ${profileRes.status}, body: ${v2MeBody}. v2/userinfo status: ${infoRes.status}, body: ${userInfoBody}`
              );
            }
          } else {
            const profile = await profileRes.json();
            authorUrn = `urn:li:person:${profile.id}`;
          }
        } catch (e: any) {
          console.error("LinkedIn User Info Fetch Failed:", e);
          throw new Error(`Failed to fetch LinkedIn profile: ${e.message}`);
        }

        await updateAgentActivity(userId, "posting", "active", "Publishing share to LinkedIn feed...");
        await updateAgentTask(taskId, 60, "in_progress");

        // Publish to LinkedIn UGC API
        const publishRes = await fetch("https://api.linkedin.com/v2/ugcPosts", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${activeToken}`,
            "X-Restli-Protocol-Version": "2.0.0",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            author: authorUrn,
            lifecycleState: "PUBLISHED",
            specificContent: {
              "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {
                  "text": content,
                },
                "shareMediaCategory": "NONE",
              },
            },
            visibility: {
              "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
            },
          }),
        });

        if (!publishRes.ok) {
          const errMsg = await publishRes.text();
          throw new Error(`LinkedIn publishing failed: ${errMsg}`);
        }

        await updateAgentTask(taskId, 90, "in_progress");
      } else {
        // Mock LinkedIn Posting with visual delay
        console.log("No real LinkedIn token configured. Running Mock LinkedIn publisher.");
        await simulateMockPostDelay(userId, taskId, "LinkedIn");
      }
    } else {
      // Mock Posting for X/Twitter or Instagram
      await simulateMockPostDelay(userId, taskId, platform === "twitter" ? "X / Twitter" : "Instagram");
    }

    // 3. Finalize Post details in DB
    await supabase
      .from("posts")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
      })
      .eq("id", postId);

    await updateAgentTask(taskId, 100, "completed");
    await updateAgentActivity(userId, "posting", "idle", null);

    // Trigger asynchronous Hindsight reflection learning on success
    // In actual code, we float this promise so it doesn't block completion
    runHindsightAgent(userId, postId, content, "approval").catch((err) =>
      console.error("Hindsight reflection error:", err)
    );

  } catch (err: any) {
    console.error(`Posting agent failed for ${platform}:`, err);
    await updateAgentTask(taskId, 100, "failed");
    await updateAgentActivity(userId, "posting", "idle", null);
    throw err;
  }
}

async function simulateMockPostDelay(userId: string, taskId: string, platformLabel: string) {
  await updateAgentActivity(userId, "posting", "active", `Establishing secure tunnel to ${platformLabel}...`);
  await updateAgentTask(taskId, 30, "in_progress");
  await new Promise((resolve) => setTimeout(resolve, 800));

  await updateAgentActivity(userId, "posting", "active", `Uploading assets and metadata to ${platformLabel}...`);
  await updateAgentTask(taskId, 60, "in_progress");
  await new Promise((resolve) => setTimeout(resolve, 800));

  await updateAgentActivity(userId, "posting", "active", `Finalizing deployment on ${platformLabel}...`);
  await updateAgentTask(taskId, 90, "in_progress");
  await new Promise((resolve) => setTimeout(resolve, 500));
}

// ==========================================
// Hindsight Learning Layer (Reflection)
// ==========================================
export async function runHindsightAgent(
  userId: string,
  postId: string,
  content: string,
  triggerType: "approval" | "rejection" | "edit",
  editedContent?: string
) {
  await updateAgentActivity(userId, "hindsight", "active", "Reflecting on post feedback...");
  const taskId = await createAgentTask(userId, `Hindsight reflection on ${triggerType}`, "hindsight");
  await updateAgentTask(taskId, 20, "in_progress");

  try {
    const supabase = createAdminClient();

    let prompt = "";
    if (triggerType === "edit" && editedContent) {
      prompt = `Compare these two versions of a social post:
Original Draft: "${content}"
User Edited: "${editedContent}"

Reflect on what the user adjusted. Did they make it shorter? Did they change specific words, tone style, formatting, or remove tags?
Distill this change into a single, direct, actionable writing rule rule for future posts.`;
    } else if (triggerType === "rejection") {
      prompt = `The user rejected this drafted social post: "${content}".
Reflect on why this draft was unacceptable. What did it get wrong?
Distill this into a brand constraint rule of what to avoid.`;
    } else {
      // Approval: validate current style
      prompt = `The user approved this drafted post: "${content}".
Reflect on why this post succeeded and what highlights the tone quality.
Distill this success into a positive style recommendation.`;
    }

    const messages = [
      {
        role: "system",
        content: `You are the Hindsight Learning Agent. Your job is to analyze user feedback (approvals, rejections, edits) and distill a structured brand guideline learning.
Choose a category: "writing_preference" | "audience_insight" | "tone_adjustment" | "content_pattern".
Provide a confidence score between 0 and 1.

Respond ONLY in JSON format:
{
  "insight": "Concise, actionable guideline rule (e.g. 'Use bullet points for lists on LinkedIn')",
  "category": "writing_preference" | "audience_insight" | "tone_adjustment" | "content_pattern",
  "confidence": 0.85
}`,
      },
      { role: "user", content: prompt },
    ];

    await updateAgentTask(taskId, 50, "in_progress");

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
    const insight = parsed.insight || "";
    const category = parsed.category || "writing_preference";
    const confidence = parsed.confidence || 0.5;

    if (insight.trim()) {
      await supabase.from("learnings").insert({
        user_id: userId,
        insight,
        type: category as LearningType,
        confidence,
        source: `User feedback (${triggerType})`,
      });
    }

    await updateAgentTask(taskId, 100, "completed");
    await updateAgentActivity(userId, "hindsight", "idle", null);

  } catch (err) {
    console.error("Hindsight reflection failed:", err);
    await updateAgentTask(taskId, 100, "failed");
    await updateAgentActivity(userId, "hindsight", "idle", null);
  }
}
