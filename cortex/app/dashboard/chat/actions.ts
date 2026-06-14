"use server";

import { groq } from "@/lib/groq/client";
import { getBrandProfile, getRecentLearnings } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import type { ChatMessage } from "@/lib/types";
import { inngest } from "@/lib/inngest/client";
import { runOrchestratorAgent } from "@/lib/agents";


export async function generateCortexResponse(
  userId: string,
  sessionId: string,
  userMessage: string
): Promise<ChatMessage & { pipelineRunId?: string }> {
  const supabase = await createClient();

  // 1. Fetch Brand Profile
  const profile = await getBrandProfile(userId);
  const brandName = profile?.brand_name || "Cortex AI";
  const userName = profile?.user_name || "Aryan";
  const brandDesc = profile?.brand_description || "AI-powered social media management.";
  const voice = profile?.brand_voice || "Empathetic, Bold, and Professional";
  const tone = profile?.tone_preferences || "Professional";
  const style = profile?.writing_style_parameters || "Concise and punchy";
  const constraints = profile?.content_constraints || "No jargon";

  // 2. Fetch Hindsight Learnings
  const learnings = await getRecentLearnings(userId);
  const learningsList = learnings.length > 0 
    ? learnings.map(l => `- [Confidence ${Math.floor(l.confidence * 100)}%]: ${l.insight}`).join("\n")
    : "No hindsight insights recorded yet. Learn from user feedback over time.";

  // 3. Fetch recent message history (last 10 messages)
  const { data: history, error: historyError } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(10);

  if (historyError) {
    console.error("Fetch message history error:", historyError.message);
  }

  // Format message history for Groq
  const messages: any[] = [
    {
      role: "system",
      content: `You are Cortex, the autonomous AI Marketing & Brand Orchestrator.
You coordinate brand voice, content generation, and social media posting.

Brand Context:
- User/Owner: ${userName}
- Brand Name: ${brandName}
- Description: ${brandDesc}

Style & Guidelines:
- Voice: ${voice}
- Tone: ${tone}
- Writing Style: ${style}
- Constraints: ${constraints}

Hindsight Insights & Brand Learnings:
${learningsList}

Your role is to respond to the user's request. If the user asks you to write a post, plan campaign concepts, or update guidelines, analyze and perform the task, matching the brand voice and constraints exactly. Keep your responses helpful, conversational, and direct.`,
    },
  ];

  if (history && history.length > 0) {
    history.forEach((msg) => {
      messages.push({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      });
    });
  } else {
    // Add the current user message if it wasn't fetched yet
    messages.push({
      role: "user",
      content: userMessage,
    });
  }

  // 4. Determine if the user is asking to create, draft, write, schedule, or post content/campaigns
  let assistantText = "";
  let isGenerationIntent = false;

  try {
    const intentCheck = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "Analyze the user message. Determine if they are asking to write, draft, generate, schedule, post, or create content (like a post, copy, article, image, or campaign). Respond with ONLY the word 'YES' or 'NO'.",
        },
        { role: "user", content: userMessage },
      ],
      temperature: 0.0,
      max_tokens: 5,
    });

    const checkText = intentCheck.choices[0]?.message?.content?.trim().toUpperCase() || "";
    isGenerationIntent = checkText.includes("YES");
  } catch (err) {
    console.error("Failed to classify user intent:", err);
  }

  let createdRunId: string | undefined;

  if (isGenerationIntent) {
    // Create the pipeline run
    const { data: newRun, error: runErr } = await supabase
      .from("pipeline_runs")
      .insert({
        user_id: userId,
        session_id: sessionId,
        user_message: userMessage,
        status: "running",
        current_step: "strategy",
      })
      .select("id")
      .single();

    if (runErr) {
      console.error("Failed to create pipeline run:", runErr.message);
      throw runErr;
    }

    createdRunId = newRun.id;
    assistantText = `I have initiated the brand orchestrator pipeline to process your content request. Redirecting you to the pipeline page...`;

    // Trigger Inngest workflow (with local async fallback)
    try {
      await inngest.send({
        name: "cortex/orchestrate",
        data: {
          userId,
          sessionId,
          userMessage,
          runId: createdRunId,
        },
      });
    } catch (err) {
      console.warn("Inngest trigger failed. Falling back to direct async execution.", err);
      // Run asynchronously in background without awaiting
      runOrchestratorAgent(userId, sessionId, userMessage, createdRunId).catch(console.error);
    }
  } else {
    // Standard conversational response
    try {
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      });

      assistantText = response.choices[0]?.message?.content || "Sorry, I could not generate a response at this time.";
    } catch (err: any) {
      console.error("Groq API call error:", err);
      assistantText = `Error calling Groq: ${err.message || "Unknown error"}. Make sure your GROQ_API_KEY is active.`;
    }
  }

  // 5. Insert assistant response into chat_messages
  const { data: assistantMsg, error: insertError } = await supabase
    .from("chat_messages")
    .insert({
      session_id: sessionId,
      user_id: userId,
      role: "assistant",
      content: assistantText,
    })
    .select()
    .single();

  if (insertError) {
    console.error("Insert assistant message error:", insertError.message);
    throw new Error(insertError.message);
  }

  // 6. Update session metadata (last preview, count, updated_at)
  const { data: session } = await supabase
    .from("chat_sessions")
    .select("message_count")
    .eq("id", sessionId)
    .single();

  const currentCount = (session?.message_count ?? 0) + 1; // Increment for assistant message

  await supabase
    .from("chat_sessions")
    .update({
      last_message_preview: assistantText.substring(0, 80) + (assistantText.length > 80 ? "..." : ""),
      message_count: currentCount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  return {
    ...(assistantMsg as ChatMessage),
    pipelineRunId: createdRunId,
  };
}


