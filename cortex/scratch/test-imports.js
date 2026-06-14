// Diagnostics script to test module imports
try {
  console.log("1. Loading groq client...");
  require("../lib/groq/client");
  console.log("✓ Groq client loaded.");

  console.log("2. Loading supabase server client...");
  require("../lib/supabase/server");
  console.log("✓ Supabase server client loaded.");

  console.log("3. Loading queries...");
  require("../lib/queries");
  console.log("✓ Queries loaded.");

  console.log("4. Loading agents...");
  require("../lib/agents");
  console.log("✓ Agents loaded successfully.");

  console.log("5. Loading Inngest functions...");
  require("../lib/inngest/functions");
  console.log("✓ Inngest functions loaded successfully.");

  console.log("✓ All modules imported successfully without syntax or runtime initialization errors.");
} catch (error) {
  console.error("✗ Crash detected during initialization:", error);
}
