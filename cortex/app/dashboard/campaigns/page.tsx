import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getCampaigns, getPosts } from "@/lib/queries";
import { CampaignManager } from "@/components/dashboard/campaign-manager";

export default async function CampaignsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [campaigns, posts] = await Promise.all([
    getCampaigns(user.id),
    getPosts(user.id),
  ]);

  return (
    <CampaignManager
      userId={user.id}
      initialCampaigns={campaigns}
      posts={posts}
    />
  );
}
