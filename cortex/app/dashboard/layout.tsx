import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/sidebar";
import { redirect } from "next/navigation";
import { getBrandProfile } from "@/lib/queries";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Redirect to onboarding if no brand profile exists
  const profile = await getBrandProfile(user.id);
  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        userEmail={user?.email ?? ""}
        userName={user?.user_metadata?.full_name ?? null}
      />
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
