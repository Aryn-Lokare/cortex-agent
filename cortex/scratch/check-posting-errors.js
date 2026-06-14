const { createAdminClient } = require("../lib/supabase/service");

async function checkTasks() {
  try {
    const supabase = createAdminClient();
    const { data: tasks, error } = await supabase
      .from("agent_tasks")
      .select("*")
      .eq("agent", "posting")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Error fetching tasks:", error.message);
      return;
    }

    console.log("=== Recent Posting Tasks ===");
    if (tasks.length === 0) {
      console.log("No posting tasks found.");
    } else {
      tasks.forEach((t) => {
        console.log(`ID: ${t.id}`);
        console.log(`Title: ${t.title}`);
        console.log(`Status: ${t.status}`);
        console.log(`Progress: ${t.progress}%`);
        console.log(`Created At: ${t.created_at}`);
        console.log(`Updated At: ${t.updated_at}`);
        console.log("------------------------");
      });
    }
  } catch (err) {
    console.error("Crash:", err);
  }
}

checkTasks();
