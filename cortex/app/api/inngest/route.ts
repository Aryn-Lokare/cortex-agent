import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";

// Import your Inngest functions here as you create them:
// import { myFunction } from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    // Register your Inngest functions here:
    // myFunction,
  ],
});
