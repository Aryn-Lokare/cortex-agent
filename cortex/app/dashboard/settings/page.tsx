import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getBrandProfile } from "@/lib/queries";
import { SettingsPanel } from "@/components/dashboard/settings-panel";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getBrandProfile(user.id);
  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <SettingsPanel
      userId={user.id}
      profile={profile}
    />
  );
}
