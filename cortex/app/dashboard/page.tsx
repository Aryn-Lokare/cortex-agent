import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-[480px]">
        {/* Welcome card */}
        <div className="rounded-xl bg-card p-8 shadow-notion-soft border border-border text-center">
          {/* Avatar circle */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#0075de]/10 text-[#0075de]">
            <svg
              className="h-8 w-8"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>

          <h1 className="text-heading-2 text-foreground mb-2">
            Welcome to Cortex
          </h1>
          <p className="text-body-md text-muted-foreground mb-2">
            You&apos;re signed in as
          </p>
          <p className="text-body-sm font-medium text-foreground mb-8 break-all">
            {user?.email}
          </p>

          {/* User metadata */}
          {user?.user_metadata?.full_name && (
            <div className="mb-8 rounded-md bg-background px-4 py-3 text-body-sm text-muted-foreground">
              <span className="text-eyebrow text-[#a39e98] uppercase tracking-wider">
                Name
              </span>
              <p className="mt-1 font-medium text-foreground">
                {user.user_metadata.full_name}
              </p>
            </div>
          )}

          <form action={signOut}>
            <Button
              id="sign-out-button"
              type="submit"
              variant="outline"
              className="w-full h-10 rounded-full border-[#e6e6e6] bg-card text-foreground text-button hover:bg-[#f6f5f4] active:scale-[0.98] transition-all"
            >
              Sign out
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-caption text-[#a39e98]">
          This is a placeholder dashboard. Your workspace will appear here once
          set up.
        </p>
      </div>
    </div>
  );
}
