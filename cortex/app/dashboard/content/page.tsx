import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getPosts, getCampaigns } from "@/lib/queries";
import { ContentManager } from "@/components/dashboard/content-manager";

export default async function ContentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [posts, campaigns] = await Promise.all([
    getPosts(user.id),
    getCampaigns(user.id),
  ]);

  return (
    <ContentManager
      userId={user.id}
      initialPosts={posts}
      campaigns={campaigns}
    />
  );
}
