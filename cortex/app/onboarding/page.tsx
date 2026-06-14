import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getBrandProfile } from "@/lib/queries";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // If the user already completed onboarding, redirect to dashboard
  const profile = await getBrandProfile(user.id);
  if (profile) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#FAF8F5] via-white to-[#F2EFE9] dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <OnboardingWizard
        userId={user.id}
        defaultEmail={user.email ?? ""}
        defaultName={user.user_metadata?.full_name ?? ""}
      />
    </div>
  );
}
