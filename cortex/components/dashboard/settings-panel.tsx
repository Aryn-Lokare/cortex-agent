"use client";

import { useState, useEffect } from "react";
import { saveBrandProfile } from "@/app/onboarding/actions";
import type { BrandProfile } from "@/lib/types";
import {
  User,
  Volume2,
  Globe,
  Brain,
  Check,
  Loader2,
  AtSign,
  Camera,
  Sliders,
  ShieldAlert,
} from "lucide-react";

interface SettingsPanelProps {
  userId: string;
  profile: BrandProfile;
}

type SettingsTab = "brand" | "guidelines" | "social" | "ai";
type ConnectionStatus = "disconnected" | "connecting" | "connected";

const platformIcons: Record<string, React.ElementType> = {
  twitter: AtSign,
  linkedin: Globe,
  instagram: Camera,
};

const platformColors: Record<string, string> = {
  twitter: "bg-black text-white",
  linkedin: "bg-[#0077b5] text-white",
  instagram: "bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white",
};

export function SettingsPanel({ userId, profile }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("brand");
  const [submitting, setSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form Fields State
  const [userName, setUserName] = useState(profile.user_name);
  const [brandName, setBrandName] = useState(profile.brand_name);
  const [brandDescription, setBrandDescription] = useState(profile.brand_description);

  const [brandVoice, setBrandVoice] = useState(profile.brand_voice);
  const [tonePreferences, setTonePreferences] = useState(profile.tone_preferences);
  const [writingStyleParameters, setWritingStyleParameters] = useState(profile.writing_style_parameters);
  const [contentConstraints, setContentConstraints] = useState(profile.content_constraints);

  // AI & learning preferences
  const [preferredModel, setPreferredModel] = useState("gemini-1.5");
  const [autoApprove, setAutoApprove] = useState(false);
  const [hindsightLearning, setHindsightLearning] = useState(true);

  // Social Connections State
  const [connections, setConnections] = useState<Record<string, ConnectionStatus>>({
    twitter: profile.connected_accounts.includes("twitter") ? "connected" : "disconnected",
    linkedin: profile.connected_accounts.includes("linkedin") ? "connected" : "disconnected",
    instagram: profile.connected_accounts.includes("instagram") ? "connected" : "disconnected",
  });
  const [oauthTokens, setOauthTokens] = useState<Record<string, string>>(profile.oauth_tokens || {});

  // Simulated OAuth popup listener
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === "OAUTH_SUCCESS") {
        const { platform, token } = event.data;

        setConnections((prev) => ({ ...prev, [platform]: "connecting" }));

        setTimeout(() => {
          setConnections((prev) => ({ ...prev, [platform]: "connected" }));
          setOauthTokens((prev) => ({ ...prev, [platform]: token }));
        }, 1200);
      }
    };

    window.addEventListener("message", handleOAuthMessage);
    return () => {
      window.removeEventListener("message", handleOAuthMessage);
    };
  }, []);

  const triggerOAuthPopup = (platform: string) => {
    const width = 500;
    const height = 620;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      `/onboarding/connect/${platform}`,
      `Connect ${platform}`,
      `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`
    );
  };

  const disconnectPlatform = (platform: string) => {
    setConnections((prev) => ({ ...prev, [platform]: "disconnected" }));
    setOauthTokens((prev) => {
      const updated = { ...prev };
      delete updated[platform];
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSaveSuccess(false);

    const connectedAccounts = Object.keys(connections).filter(
      (platform) => connections[platform] === "connected"
    );

    try {
      await saveBrandProfile({
        user_id: userId,
        user_name: userName,
        brand_name: brandName,
        brand_description: brandDescription,
        brand_voice: brandVoice,
        tone_preferences: tonePreferences,
        writing_style_parameters: writingStyleParameters,
        content_constraints: contentConstraints,
        connected_accounts: connectedAccounts,
        oauth_tokens: oauthTokens,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Save settings error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* ─── Header ────────────────────────────────────────── */}
      <div className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-heading-2 font-bold text-foreground">Settings</h1>
          <p className="text-caption text-muted-foreground">
            Configure your brand identity guidelines, AI model weights, and platform tokens
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full font-semibold animate-fade-in">
            <Check className="h-3.5 w-3.5" />
            Changes saved successfully
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* ─── Left Settings Tabs Navigation ──────────────────── */}
        <div className="w-52 border-r border-border bg-card/60 p-4 space-y-1 shrink-0">
          <button
            onClick={() => setActiveTab("brand")}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-body-sm font-semibold transition-all ${
              activeTab === "brand"
                ? "bg-primary/5 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <User className="h-4 w-4" />
            Brand Profile
          </button>
          <button
            onClick={() => setActiveTab("guidelines")}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-body-sm font-semibold transition-all ${
              activeTab === "guidelines"
                ? "bg-primary/5 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Volume2 className="h-4 w-4" />
            Voice Guidelines
          </button>
          <button
            onClick={() => setActiveTab("social")}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-body-sm font-semibold transition-all ${
              activeTab === "social"
                ? "bg-primary/5 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Globe className="h-4 w-4" />
            Social Accounts
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-body-sm font-semibold transition-all ${
              activeTab === "ai"
                ? "bg-primary/5 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Sliders className="h-4 w-4" />
            AI & Preferences
          </button>
        </div>

        {/* ─── Right Tab Contents Forms ───────────────────────── */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#f6f5f4] dark:bg-neutral-900/40">
          <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
            {/* BRAND PROFILE */}
            {activeTab === "brand" && (
              <div className="space-y-4">
                <div className="space-y-1.5 text-body-sm">
                  <label className="font-semibold text-foreground">User Name</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-[4px] border border-[#ddd] bg-card focus:border-[#0075de] focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5 text-body-sm">
                  <label className="font-semibold text-foreground">Brand Name</label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-[4px] border border-[#ddd] bg-card focus:border-[#0075de] focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5 text-body-sm">
                  <label className="font-semibold text-foreground">Brand Description</label>
                  <textarea
                    rows={4}
                    value={brandDescription}
                    onChange={(e) => setBrandDescription(e.target.value)}
                    required
                    className="w-full p-3 rounded-[4px] border border-[#ddd] bg-card focus:border-[#0075de] focus:outline-none resize-none"
                  />
                </div>
              </div>
            )}

            {/* STYLE & VOICE GUIDELINES */}
            {activeTab === "guidelines" && (
              <div className="space-y-4">
                <div className="space-y-1.5 text-body-sm">
                  <label className="font-semibold text-foreground">Brand Voice</label>
                  <input
                    type="text"
                    value={brandVoice}
                    onChange={(e) => setBrandVoice(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-[4px] border border-[#ddd] bg-card focus:border-[#0075de] focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5 text-body-sm">
                  <label className="font-semibold text-foreground">Tone Preferences</label>
                  <input
                    type="text"
                    value={tonePreferences}
                    onChange={(e) => setTonePreferences(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-[4px] border border-[#ddd] bg-card focus:border-[#0075de] focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5 text-body-sm">
                  <label className="font-semibold text-foreground">Writing Style Parameters</label>
                  <input
                    type="text"
                    value={writingStyleParameters}
                    onChange={(e) => setWritingStyleParameters(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-[4px] border border-[#ddd] bg-card focus:border-[#0075de] focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5 text-body-sm">
                  <label className="font-semibold text-foreground">Content Constraints</label>
                  <input
                    type="text"
                    value={contentConstraints}
                    onChange={(e) => setContentConstraints(e.target.value)}
                    className="w-full h-10 px-3 rounded-[4px] border border-[#ddd] bg-card focus:border-[#0075de] focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* SOCIAL CONNECTIONS */}
            {activeTab === "social" && (
              <div className="space-y-4">
                {Object.keys(connections).map((plat) => {
                  const PlatformIcon = platformIcons[plat];
                  const state = connections[plat];

                  return (
                    <div
                      key={plat}
                      className="flex items-center justify-between p-4 rounded-xl border border-border bg-card shadow-sm hover:border-[#ddd] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-md flex items-center justify-center ${platformColors[plat]}`}
                        >
                          <PlatformIcon className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <h4 className="text-body-sm font-semibold text-foreground capitalize">
                            {plat}
                          </h4>
                          <p className="text-caption text-muted-foreground">
                            {state === "connected"
                              ? `Status: Authenticated`
                              : `Status: Offline`}
                          </p>
                        </div>
                      </div>
                      <div>
                        {state === "connected" ? (
                          <button
                            type="button"
                            onClick={() => disconnectPlatform(plat)}
                            className="text-xs border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 px-4 py-1.5 rounded-full transition-all font-semibold"
                          >
                            Disconnect
                          </button>
                        ) : state === "connecting" ? (
                          <button
                            disabled
                            className="flex items-center gap-1.5 text-xs text-neutral-500 bg-neutral-100 px-4 py-1.5 rounded-full font-medium"
                          >
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                            Connecting...
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => triggerOAuthPopup(plat)}
                            className="text-xs border border-border bg-[#FAF8F5] dark:bg-neutral-800 hover:bg-[#F2EFE9] px-4 py-1.5 rounded-full transition-all text-neutral-800 dark:text-neutral-200 font-semibold shadow-sm"
                          >
                            Connect
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* AI & PREFERENCES */}
            {activeTab === "ai" && (
              <div className="space-y-4 text-body-sm">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Preferred AI Engine Model</label>
                  <select
                    value={preferredModel}
                    onChange={(e) => setPreferredModel(e.target.value)}
                    className="w-full h-10 px-3 rounded-[4px] border border-[#ddd] bg-card focus:border-[#0075de] focus:outline-none"
                  >
                    <option value="gemini-1.5">Gemini 1.5 Pro</option>
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="claude-3.5">Claude 3.5 Sonnet</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card shadow-sm">
                  <div>
                    <h4 className="font-semibold text-foreground">Auto-Approve Content</h4>
                    <p className="text-caption text-muted-foreground mt-0.5">
                      Allow agents to bypass the approval queue and post high-confidence updates directly
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoApprove}
                    onChange={(e) => setAutoApprove(e.target.checked)}
                    className="w-4 h-4 cursor-pointer accent-[#0075de]"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card shadow-sm">
                  <div>
                    <h4 className="font-semibold text-foreground">Hindsight Learning Engine</h4>
                    <p className="text-caption text-muted-foreground mt-0.5">
                      Enable post-publishing metric audits to automatically learn tone and formatting preferences
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={hindsightLearning}
                    onChange={(e) => setHindsightLearning(e.target.checked)}
                    className="w-4 h-4 cursor-pointer accent-[#0075de]"
                  />
                </div>
              </div>
            )}

            {/* Save Buttons (for Forms that aren't oauth toggled only, but safe to show) */}
            {activeTab !== "social" && (
              <div className="border-t border-border pt-5 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 text-body-sm text-white bg-primary hover:bg-primary-hover transition-all px-5 py-2.5 rounded-full font-semibold shadow-sm active:scale-[0.98]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving changes...
                    </>
                  ) : (
                    "Save Settings"
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
