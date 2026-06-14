import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getAnalyticsSnapshots } from "@/lib/queries";
import { AnalyticsManager } from "@/components/dashboard/analytics-manager";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if we have analytics snapshots for 'all'
  let allSnapshots = await getAnalyticsSnapshots(user.id, "all");

  // If no snapshots exist, seed 14 days of mock historical metrics
  if (allSnapshots.length === 0) {
    const seedData: any[] = [];
    const platforms = ["all", "twitter", "linkedin", "instagram"];
    
    // Seed metrics for last 14 days
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      platforms.forEach((platform) => {
        let baseFollowers = 1200;
        let baseImpressions = 5000;
        let baseEngagement = 3.2;
        let baseClicks = 150;

        if (platform === "twitter") {
          baseFollowers = 800;
          baseImpressions = 3200;
          baseEngagement = 2.8;
          baseClicks = 90;
        } else if (platform === "linkedin") {
          baseFollowers = 300;
          baseImpressions = 1500;
          baseEngagement = 4.5;
          baseClicks = 40;
        } else if (platform === "instagram") {
          baseFollowers = 100;
          baseImpressions = 300;
          baseEngagement = 5.2;
          baseClicks = 20;
        }

        // Add minor randomness for organic curve look
        const factor = 1 + (Math.sin(i) * 0.1) + (Math.cos(i * 1.5) * 0.05);
        
        seedData.push({
          user_id: user.id,
          platform,
          metric_date: dateStr,
          followers_count: Math.floor(baseFollowers + (13 - i) * (platform === "all" ? 25 : 8) * factor),
          impressions_count: Math.floor(baseImpressions * factor),
          engagement_rate: parseFloat((baseEngagement * factor).toFixed(2)),
          clicks_count: Math.floor(baseClicks * factor),
        });
      });
    }

    const { error: seedError } = await supabase
      .from("analytics_snapshots")
      .upsert(seedData, { onConflict: "user_id,platform,metric_date" });

    if (seedError) {
      console.error("Seeding analytics error:", seedError.message);
    } else {
      // Re-fetch snapshots
      allSnapshots = await getAnalyticsSnapshots(user.id, "all");
    }
  }

  // Fetch individual platform snapshots for the graphs
  const [twitterSnapshots, linkedinSnapshots, instagramSnapshots] = await Promise.all([
    getAnalyticsSnapshots(user.id, "twitter"),
    getAnalyticsSnapshots(user.id, "linkedin"),
    getAnalyticsSnapshots(user.id, "instagram"),
  ]);

  return (
    <AnalyticsManager
      userId={user.id}
      initialSnapshots={{
        all: allSnapshots,
        twitter: twitterSnapshots,
        linkedin: linkedinSnapshots,
        instagram: instagramSnapshots,
      }}
    />
  );
}
