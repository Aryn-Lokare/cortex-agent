import { inngest } from "./client";
import { runOrchestratorAgent, runPostingAgent, runHindsightAgent, advancePipeline } from "@/lib/agents";

// 1. Orchestrate Workflow (Main Agent pipeline)
export const orchestrateAgentPipeline = inngest.createFunction(
  {
    id: "orchestrate-agent-pipeline",
    name: "Cortex Orchestrate Pipeline",
    triggers: [{ event: "cortex/orchestrate" }],
  },
  async ({ event }) => {
    const { userId, sessionId, userMessage, runId } = event.data;
    await runOrchestratorAgent(userId, sessionId, userMessage, runId);
    return { success: true };
  }
);

// 2. Posting Agent Workflow (Publishes to X, LinkedIn, Instagram)
export const postingAgentWorkflow = inngest.createFunction(
  {
    id: "posting-agent-workflow",
    name: "Cortex Posting Agent",
    triggers: [{ event: "cortex/post.approve" }],
  },
  async ({ event }) => {
    const { userId, postId, content, platform } = event.data;
    await runPostingAgent(userId, postId, content, platform);
    return { success: true };
  }
);

// 3. Hindsight Reflection Workflow
export const hindsightReflectionWorkflow = inngest.createFunction(
  {
    id: "hindsight-reflection-workflow",
    name: "Cortex Hindsight Reflection",
    triggers: [{ event: "cortex/hindsight.reflect" }],
  },
  async ({ event }) => {
    const { userId, postId, content, triggerType, editedContent } = event.data;
    await runHindsightAgent(userId, postId, content, triggerType, editedContent);
    return { success: true };
  }
);

// 4. Advance Pipeline Workflow
export const advancePipelineWorkflow = inngest.createFunction(
  {
    id: "advance-pipeline-workflow",
    name: "Cortex Advance Pipeline",
    triggers: [{ event: "cortex/pipeline.advance" }],
  },
  async ({ event }) => {
    const { userId, runId, stepAgent } = event.data;
    await advancePipeline(userId, runId, stepAgent);
    return { success: true };
  }
);

