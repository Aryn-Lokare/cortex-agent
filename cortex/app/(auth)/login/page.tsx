"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signInWithEmail, signInWithGoogle } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { GoogleIcon } from "@/components/icons/google";

function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const searchParams = useSearchParams();
  const authError = searchParams.get("error");

  async function handleEmailSignIn(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await signInWithEmail(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError(null);
    const result = await signInWithGoogle();
    if (result?.error) {
      setError(result.error);
      setGoogleLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[400px]">
      {/* Logo / Wordmark */}
      <div className="mb-8 text-center">
        <h1 className="text-heading-2 text-foreground">Cortex</h1>
        <p className="text-body-sm text-muted-foreground mt-2">
          Sign in to your account
        </p>
      </div>

      {/* Auth Card — ex-auth-form-card: white surface, rounded-xl, padding lg */}
      <div className="rounded-xl bg-card p-6 shadow-notion-soft border border-border">
        {/* Error messages */}
        {(error || authError) && (
          <div
            id="auth-error"
            className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-body-sm text-destructive"
          >
            {error || "Authentication failed. Please try again."}
          </div>
        )}

        {/* Email/Password Form */}
        <form action={handleEmailSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-body-sm text-foreground">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="h-10 rounded-[4px] border-[#ddd] bg-card text-body-sm placeholder:text-[#a39e98] focus:shadow-notion-soft"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-body-sm text-foreground">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="h-10 rounded-[4px] border-[#ddd] bg-card text-body-sm placeholder:text-[#a39e98] focus:shadow-notion-soft"
            />
          </div>

          <Button
            id="sign-in-button"
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-full bg-[#0075de] text-white text-button hover:bg-[#005bab] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Signing in…
              </span>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <Separator className="bg-[#e6e6e6]" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-caption text-muted-foreground">
            or continue with
          </span>
        </div>

        {/* Google OAuth */}
        <Button
          id="google-sign-in-button"
          type="button"
          variant="outline"
          disabled={googleLoading}
          onClick={handleGoogleSignIn}
          className="w-full h-10 rounded-full border-[#e6e6e6] bg-card text-foreground text-button hover:bg-[#f6f5f4] active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {googleLoading ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Connecting…
            </span>
          ) : (
            <span className="flex items-center gap-3">
              <GoogleIcon className="h-5 w-5" />
              Continue with Google
            </span>
          )}
        </Button>
      </div>

      {/* Sign up link */}
      <p className="mt-6 text-center text-body-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-[#0075de] hover:text-[#005bab] transition-colors"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-[400px] text-center p-6 text-body-sm text-muted-foreground">
          Loading...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
