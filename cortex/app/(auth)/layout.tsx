import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in — Cortex AI",
  description: "Sign in to your Cortex AI account.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-background px-4 py-12">
      {children}
    </div>
  );
}
