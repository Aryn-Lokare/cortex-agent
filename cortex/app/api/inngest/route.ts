import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
  orchestrateAgentPipeline,
  postingAgentWorkflow,
  hindsightReflectionWorkflow,
  advancePipelineWorkflow,
} from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    orchestrateAgentPipeline,
    postingAgentWorkflow,
    hindsightReflectionWorkflow,
    advancePipelineWorkflow,
  ],
});


