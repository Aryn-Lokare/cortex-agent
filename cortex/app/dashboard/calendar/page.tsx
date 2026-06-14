import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getPosts, getCampaigns, getBrandProfile } from "@/lib/queries";
import { CalendarView } from "@/components/dashboard/calendar-view";

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [posts, campaigns, profile] = await Promise.all([
    getPosts(user.id),
    getCampaigns(user.id),
    getBrandProfile(user.id),
  ]);

  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <CalendarView
      userId={user.id}
      initialPosts={posts}
      campaigns={campaigns}
      profile={profile}
    />
  );
}
