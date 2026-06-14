"use client";

import { use, useState, useEffect } from "react";
import { AtSign, Globe, Camera, ShieldAlert, Calendar } from "lucide-react";

interface Props {
  params: Promise<{ platform: string }>;
}

export default function MockConnectPage({ params }: Props) {
  const resolvedParams = use(params);
  const platform = resolvedParams.platform.toLowerCase();
  const [authorizing, setAuthorizing] = useState(false);

  // Platform details
  const configMap: Record<
    string,
    {
      name: string;
      color: string;
      bg: string;
      icon: React.ElementType;
    }
  > = {
    twitter: {
      name: "X (formerly Twitter)",
      color: "bg-black text-white hover:bg-neutral-900 border-neutral-800",
      bg: "bg-black text-white",
      icon: AtSign,
    },
    linkedin: {
      name: "LinkedIn",
      color: "bg-[#0077b5] text-white hover:bg-[#005a8a] border-[#0077b5]",
      bg: "bg-[#f3f6f8] text-neutral-800",
      icon: Globe,
    },
    instagram: {
      name: "Instagram",
      color: "bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white hover:opacity-90 border-transparent",
      bg: "bg-radial-gradient text-neutral-900",
      icon: Camera,
    },
    "google-calendar": {
      name: "Google Calendar",
      color: "bg-[#1a73e8] text-white hover:bg-[#155cb4] border-transparent",
      bg: "bg-[#f1f3f4] text-neutral-800",
      icon: Calendar,
    },
  };

  const config = configMap[platform] || {
    name: "Social Network",
    color: "bg-neutral-800 text-white hover:bg-neutral-900 border-transparent",
    bg: "bg-white text-neutral-900",
    icon: ShieldAlert,
  };

  const IconComponent = config.icon;

  const handleAuthorize = () => {
    setAuthorizing(true);
    setTimeout(() => {
      const mockToken = `mock_${platform}_token_${Math.random()
        .toString(36)
        .substring(2, 15)}`;

      // Post message back to the opening window
      if (window.opener) {
        window.opener.postMessage(
          {
            type: "OAUTH_SUCCESS",
            platform,
            token: mockToken,
          },
          window.location.origin
        );
      }
      window.close();
    }, 1500);
  };

  const handleCancel = () => {
    window.close();
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between p-6 ${platform === "twitter" ? "bg-black text-neutral-100" : "bg-neutral-50 text-neutral-800"}`}>
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b pb-4 border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg tracking-tight">Cortex</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-500 font-medium">
            OAuth 2.0
          </span>
        </div>
        <div className="text-sm text-neutral-500">Security Verified</div>
      </div>

      {/* Main Consent Form */}
      <div className="max-w-md mx-auto my-auto py-8 text-center space-y-6">
        <div className="flex justify-center items-center gap-4">
          {/* Cortex Logo */}
          <div className="w-16 h-16 rounded-xl bg-neutral-950 flex items-center justify-center shadow-lg border border-neutral-800">
            <span className="text-2xl font-bold text-white">C</span>
          </div>

          <div className="text-neutral-400 font-bold text-xl">↔</div>

          {/* Platform Logo */}
          <div className={`w-16 h-16 rounded-xl flex items-center justify-center shadow-lg border ${platform === "twitter" ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200"}`}>
            <IconComponent className={`w-8 h-8 ${platform === "twitter" ? "text-white" : platform === "linkedin" ? "text-[#0077b5]" : "text-[#d62976]"}`} />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">
            Authorize Cortex?
          </h2>
          <p className="text-sm text-neutral-500 max-w-sm mx-auto">
            <strong>Cortex</strong> is requesting permission to access and publish content on behalf of your <strong>{config.name}</strong> account.
          </p>
        </div>

        {/* Permissions list */}
        <div className={`rounded-xl p-4 text-left text-xs space-y-2 max-w-sm mx-auto border ${platform === "twitter" ? "bg-neutral-900/50 border-neutral-800" : "bg-white border-neutral-200"}`}>
          <div className="font-semibold text-neutral-500 uppercase tracking-wider text-[10px]">
            This application will be able to:
          </div>
          <ul className="list-disc pl-4 space-y-1 text-neutral-600 dark:text-neutral-300">
            <li>See your profile information and account details.</li>
            <li>Publish new content and post updates on your behalf.</li>
            <li>Analyze post performance metrics and engagement.</li>
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 max-w-sm w-full mx-auto border-t pt-4 border-neutral-200 dark:border-neutral-800">
        <button
          onClick={handleAuthorize}
          disabled={authorizing}
          className={`w-full py-3 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 ${config.color} disabled:opacity-50`}
        >
          {authorizing ? (
            <>
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
              Authorizing...
            </>
          ) : (
            `Authorize ${config.name}`
          )}
        </button>
        <button
          onClick={handleCancel}
          disabled={authorizing}
          className={`w-full py-3 rounded-full text-sm font-semibold border transition-all ${platform === "twitter" ? "bg-transparent text-neutral-400 border-neutral-800 hover:bg-neutral-900 hover:text-white" : "bg-transparent text-neutral-600 border-neutral-300 hover:bg-neutral-100 hover:text-neutral-900"}`}
        >
          Cancel and go back
        </button>
      </div>
    </div>
  );
}
