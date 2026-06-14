"use client";

import { useState, useEffect } from "react";
import { saveBrandProfile } from "@/app/onboarding/actions";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle,
  Loader2,
  AtSign,
  Globe,
  Camera,
  Heart,
  Volume2,
  Smile,
  AlertCircle,
} from "lucide-react";

interface OnboardingWizardProps {
  userId: string;
  defaultEmail: string;
  defaultName: string;
}

type Step = 1 | 2 | 3;
type ConnectionStatus = "disconnected" | "connecting" | "connected";

export function OnboardingWizard({
  userId,
  defaultEmail,
  defaultName,
}: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields State
  const [userName, setUserName] = useState(defaultName || "");
  const [brandName, setBrandName] = useState("");
  const [brandDescription, setBrandDescription] = useState("");

  const [brandVoice, setBrandVoice] = useState("");
  const [tonePreferences, setTonePreferences] = useState("");
  const [writingStyleParameters, setWritingStyleParameters] = useState("");
  const [contentConstraints, setContentConstraints] = useState("");

  // Social Connections State
  const [connections, setConnections] = useState<Record<string, ConnectionStatus>>({
    twitter: "disconnected",
    linkedin: "disconnected",
    instagram: "disconnected",
  });
  const [oauthTokens, setOauthTokens] = useState<Record<string, string>>({});

  // Input Validation Error State
  const [validationError, setValidationError] = useState<string | null>(null);

  // Preset Chips definitions
  const voicePresets = [
    { title: "Empathetic & Supportive", desc: "Warm, helpful, understands problems" },
    { title: "Bold & Disruptive", desc: "Direct, witty, challenger mentality" },
    { title: "Technical & Authoritative", desc: "Professional, data-backed, insightful" },
    { title: "Friendly & Conversational", desc: "Lighthearted, energetic, uses emojis" },
  ];

  const tonePresets = [
    "Professional",
    "Casual",
    "Informative",
    "Playful",
    "Empathetic",
    "Humorous",
  ];

  const stylePresets = [
    "Concise & punchy",
    "Detailed & comprehensive",
    "List-oriented (bullet points)",
    "Emoji-rich & social-first",
    "Academic & research-backed",
  ];

  const constraintPresets = [
    "No industry buzzwords",
    "Avoid sales pitch phrasing",
    "Never discuss competitors",
    "No overly complex jargon",
  ];

  // Simulated OAuth popup listener
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      // Security check: only trust same-origin messages
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === "OAUTH_SUCCESS") {
        const { platform, token } = event.data;

        // Transition from connecting to connected
        setConnections((prev) => ({ ...prev, [platform]: "connecting" }));

        // Simulate short verification delay for visual elegance
        setTimeout(() => {
          setConnections((prev) => ({ ...prev, [platform]: "connected" }));
          setOauthTokens((prev) => ({ ...prev, [platform]: token }));
        }, 1500);
      }
    };

    window.addEventListener("message", handleOAuthMessage);
    return () => {
      window.removeEventListener("message", handleOAuthMessage);
    };
  }, []);

  const triggerOAuthPopup = (platform: string) => {
    // Open the mock consent page in a popup centered on screen
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

  // Field helpers to add/remove preset tags
  const toggleSelection = (
    currentValue: string,
    setValue: (val: string) => void,
    preset: string
  ) => {
    const list = currentValue
      ? currentValue.split(",").map((s) => s.trim())
      : [];
    if (list.includes(preset)) {
      const filtered = list.filter((s) => s !== preset);
      setValue(filtered.join(", "));
    } else {
      list.push(preset);
      setValue(list.join(", "));
    }
  };

  const handleNext = () => {
    setValidationError(null);
    if (currentStep === 1) {
      if (!userName.trim() || !brandName.trim() || !brandDescription.trim()) {
        setValidationError("Please fill out all identity fields to continue.");
        return;
      }
    } else if (currentStep === 2) {
      if (
        !brandVoice.trim() ||
        !tonePreferences.trim() ||
        !writingStyleParameters.trim()
      ) {
        setValidationError(
          "Please select or enter guidelines for voice, tone, and writing style."
        );
        return;
      }
    }
    setCurrentStep((prev) => (prev + 1) as Step);
  };

  const handleBack = () => {
    setValidationError(null);
    setCurrentStep((prev) => (prev - 1) as Step);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setValidationError(null);

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
    } catch (err: any) {
      console.error(err);
      setValidationError(err.message || "Failed to save profile. Please try again.");
      setSubmitting(false);
    }
  };

  const activeTabClass = (step: Step) =>
    currentStep === step
      ? "text-primary border-b-2 border-[#0075de] font-semibold"
      : "text-muted-foreground border-b border-transparent";

  return (
    <div className="w-full max-w-2xl bg-card rounded-xl border border-border shadow-notion-soft p-8 space-y-6 relative overflow-hidden backdrop-blur-md bg-opacity-95">
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#ff64c8]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-primary font-medium text-sm">
          <Sparkles className="h-4 w-4 text-[#0075de] animate-pulse" />
          <span>Brand Setup Wizard</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome to Cortex
        </h2>
        <p className="text-sm text-muted-foreground">
          Define your brand context. Cortex uses this information to align writing styles, voice, and guidelines.
        </p>
      </div>

      {/* Stepper indicator */}
      <div className="flex items-center gap-4 text-xs border-b border-[#e6e6e6] pb-3 select-none">
        <span className={activeTabClass(1)}>1. Brand Identity</span>
        <span className="text-[#a39e98]">/</span>
        <span className={activeTabClass(2)}>2. Style Guidelines</span>
        <span className="text-[#a39e98]">/</span>
        <span className={activeTabClass(3)}>3. Social Accounts</span>
      </div>

      {/* Error Alert */}
      {validationError && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Step Contents */}
      <div className="space-y-6 min-h-[320px] transition-all duration-300">
        {/* STEP 1: BRAND IDENTITY */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-2">
              <label htmlFor="userName" className="text-body-sm font-semibold text-foreground">
                Your Name / Owner Name
              </label>
              <input
                id="userName"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full h-10 px-3 rounded-[4px] border border-[#ddd] bg-card text-body-sm placeholder:text-[#a39e98] focus:border-[#0075de] focus:ring-1 focus:ring-[#0075de] focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="brandName" className="text-body-sm font-semibold text-foreground">
                Brand Name
              </label>
              <input
                id="brandName"
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Cortex AI"
                className="w-full h-10 px-3 rounded-[4px] border border-[#ddd] bg-card text-body-sm placeholder:text-[#a39e98] focus:border-[#0075de] focus:ring-1 focus:ring-[#0075de] focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="brandDesc" className="text-body-sm font-semibold text-foreground">
                  Brand / Product Description
                </label>
                <span className="text-[10px] text-muted-foreground uppercase font-medium">
                  {brandDescription.length} chars
                </span>
              </div>
              <textarea
                id="brandDesc"
                rows={4}
                value={brandDescription}
                onChange={(e) => setBrandDescription(e.target.value)}
                placeholder="Describe what your brand/product does, your target audience, and key value propositions..."
                className="w-full p-3 rounded-[4px] border border-[#ddd] bg-card text-body-sm placeholder:text-[#a39e98] focus:border-[#0075de] focus:ring-1 focus:ring-[#0075de] focus:outline-none resize-none"
              />
            </div>
          </div>
        )}

        {/* STEP 2: STYLE GUIDELINES */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-fade-in">
            {/* Brand Voice */}
            <div className="space-y-2">
              <label htmlFor="brandVoice" className="text-body-sm font-semibold text-foreground">
                Brand Voice Description
              </label>
              <input
                id="brandVoice"
                type="text"
                value={brandVoice}
                onChange={(e) => setBrandVoice(e.target.value)}
                placeholder="e.g. bold, authoritative, educational"
                className="w-full h-10 px-3 rounded-[4px] border border-[#ddd] bg-card text-body-sm placeholder:text-[#a39e98] focus:border-[#0075de] focus:ring-1 focus:ring-[#0075de] focus:outline-none"
              />
              <div className="flex flex-wrap gap-2 pt-1">
                {voicePresets.map((preset) => {
                  const isSelected = brandVoice.includes(preset.title);
                  return (
                    <button
                      key={preset.title}
                      type="button"
                      onClick={() => toggleSelection(brandVoice, setBrandVoice, preset.title)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        isSelected
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-background border-[#e6e6e6] text-[#615d59] hover:bg-[#f6f5f4]"
                      }`}
                    >
                      {preset.title}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tone Preferences */}
            <div className="space-y-2">
              <label htmlFor="tonePref" className="text-body-sm font-semibold text-foreground">
                Tone Preferences
              </label>
              <input
                id="tonePref"
                type="text"
                value={tonePreferences}
                onChange={(e) => setTonePreferences(e.target.value)}
                placeholder="e.g. Friendly, Informative, Professional"
                className="w-full h-10 px-3 rounded-[4px] border border-[#ddd] bg-card text-body-sm placeholder:text-[#a39e98] focus:border-[#0075de] focus:ring-1 focus:ring-[#0075de] focus:outline-none"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tonePresets.map((preset) => {
                  const isSelected = tonePreferences.split(", ").includes(preset);
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() =>
                        toggleSelection(tonePreferences, setTonePreferences, preset)
                      }
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                        isSelected
                          ? "bg-primary/10 border-primary text-primary font-medium"
                          : "bg-background border-[#e6e6e6] text-[#615d59] hover:bg-[#f6f5f4]"
                      }`}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Writing Style Parameters */}
            <div className="space-y-2">
              <label htmlFor="styleParams" className="text-body-sm font-semibold text-foreground">
                Writing Style Parameters
              </label>
              <input
                id="styleParams"
                type="text"
                value={writingStyleParameters}
                onChange={(e) => setWritingStyleParameters(e.target.value)}
                placeholder="e.g. Concise, emoji-heavy, lists"
                className="w-full h-10 px-3 rounded-[4px] border border-[#ddd] bg-card text-body-sm placeholder:text-[#a39e98] focus:border-[#0075de] focus:ring-1 focus:ring-[#0075de] focus:outline-none"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {stylePresets.map((preset) => {
                  const isSelected = writingStyleParameters.split(", ").includes(preset);
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() =>
                        toggleSelection(writingStyleParameters, setWritingStyleParameters, preset)
                      }
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                        isSelected
                          ? "bg-primary/10 border-primary text-primary font-medium"
                          : "bg-background border-[#e6e6e6] text-[#615d59] hover:bg-[#f6f5f4]"
                      }`}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content Constraints */}
            <div className="space-y-2">
              <label htmlFor="constraints" className="text-body-sm font-semibold text-foreground">
                Content Constraints (Optional)
              </label>
              <input
                id="constraints"
                type="text"
                value={contentConstraints}
                onChange={(e) => setContentConstraints(e.target.value)}
                placeholder="e.g. Avoid buzzwords, no competitor names"
                className="w-full h-10 px-3 rounded-[4px] border border-[#ddd] bg-card text-body-sm placeholder:text-[#a39e98] focus:border-[#0075de] focus:ring-1 focus:ring-[#0075de] focus:outline-none"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {constraintPresets.map((preset) => {
                  const isSelected = contentConstraints.split(", ").includes(preset);
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() =>
                        toggleSelection(contentConstraints, setContentConstraints, preset)
                      }
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                        isSelected
                          ? "bg-primary/10 border-primary text-primary font-medium"
                          : "bg-background border-[#e6e6e6] text-[#615d59] hover:bg-[#f6f5f4]"
                      }`}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: SOCIAL CONNECTIONS */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center pb-4 max-w-sm mx-auto">
              <p className="text-sm font-semibold text-foreground">
                Connect your Social Channels
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Cortex needs connected platforms to generate content, schedule pipeline tasks, and track performance.
              </p>
            </div>

            {/* Platform Cards */}
            <div className="space-y-3">
              {/* X / Twitter */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card shadow-sm hover:border-[#ddd] transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-neutral-950 flex items-center justify-center border border-neutral-800">
                    <AtSign className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-body-sm font-semibold text-foreground">X (formerly Twitter)</h4>
                    <p className="text-caption text-muted-foreground">Publish posts and analyze reach</p>
                  </div>
                </div>
                <div>
                  {connections.twitter === "connected" ? (
                    <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-200 font-medium">
                      <Check className="h-3.5 w-3.5" />
                      Connected
                    </div>
                  ) : connections.twitter === "connecting" ? (
                    <button
                      disabled
                      className="flex items-center gap-1 text-xs text-neutral-500 bg-neutral-100 px-3 py-1.5 rounded-full font-medium"
                    >
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0075de]" />
                      Connecting...
                    </button>
                  ) : (
                    <button
                      onClick={() => triggerOAuthPopup("twitter")}
                      className="text-xs border border-border bg-[#FAF8F5] dark:bg-neutral-800 hover:bg-[#F2EFE9] px-4 py-1.5 rounded-full transition-all text-neutral-800 dark:text-neutral-200 font-semibold"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>

              {/* LinkedIn */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card shadow-sm hover:border-[#ddd] transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#0077b5]/10 flex items-center justify-center">
                    <Globe className="h-5 w-5 text-[#0077b5]" />
                  </div>
                  <div>
                    <h4 className="text-body-sm font-semibold text-foreground">LinkedIn</h4>
                    <p className="text-caption text-muted-foreground">Post professional articles and updates</p>
                  </div>
                </div>
                <div>
                  {connections.linkedin === "connected" ? (
                    <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-200 font-medium">
                      <Check className="h-3.5 w-3.5" />
                      Connected
                    </div>
                  ) : connections.linkedin === "connecting" ? (
                    <button
                      disabled
                      className="flex items-center gap-1 text-xs text-neutral-500 bg-neutral-100 px-3 py-1.5 rounded-full font-medium"
                    >
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0077b5]" />
                      Connecting...
                    </button>
                  ) : (
                    <button
                      onClick={() => triggerOAuthPopup("linkedin")}
                      className="text-xs border border-border bg-[#FAF8F5] dark:bg-neutral-800 hover:bg-[#F2EFE9] px-4 py-1.5 rounded-full transition-all text-neutral-800 dark:text-neutral-200 font-semibold"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>

              {/* Instagram */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card shadow-sm hover:border-[#ddd] transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center">
                    <Camera className="h-5 w-5 text-[#d62976]" />
                  </div>
                  <div>
                    <h4 className="text-body-sm font-semibold text-foreground">Instagram</h4>
                    <p className="text-caption text-muted-foreground">Schedule visual posts and stories</p>
                  </div>
                </div>
                <div>
                  {connections.instagram === "connected" ? (
                    <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-200 font-medium">
                      <Check className="h-3.5 w-3.5" />
                      Connected
                    </div>
                  ) : connections.instagram === "connecting" ? (
                    <button
                      disabled
                      className="flex items-center gap-1 text-xs text-neutral-500 bg-neutral-100 px-3 py-1.5 rounded-full font-medium"
                    >
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0077b5]" />
                      Connecting...
                    </button>
                  ) : (
                    <button
                      onClick={() => triggerOAuthPopup("instagram")}
                      className="text-xs border border-border bg-[#FAF8F5] dark:bg-neutral-800 hover:bg-[#F2EFE9] px-4 py-1.5 rounded-full transition-all text-neutral-800 dark:text-neutral-200 font-semibold"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation Buttons */}
      <div className="flex items-center justify-between border-t border-[#e6e6e6] pt-4">
        {currentStep > 1 ? (
          <button
            onClick={handleBack}
            disabled={submitting}
            className="flex items-center gap-1.5 text-body-sm text-muted-foreground hover:text-foreground hover:bg-[#f6f5f4] transition-all px-3 py-2 rounded-lg font-medium disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        ) : (
          <div />
        )}

        {currentStep < 3 ? (
          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 text-body-sm text-white bg-[#0075de] hover:bg-[#005bab] transition-all px-4 py-2 rounded-full font-semibold shadow-sm active:scale-[0.98]"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-1.5 text-body-sm text-white bg-[#0075de] hover:bg-[#005bab] transition-all px-5 py-2.5 rounded-full font-semibold shadow-sm active:scale-[0.98] disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Completing setup...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Complete Setup
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
