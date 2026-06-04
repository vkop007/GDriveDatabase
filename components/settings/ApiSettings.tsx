"use client";

import { useState } from "react";
import { generateApiKey, deleteApiKey } from "../../app/actions";
import { toast } from "sonner";
import CopyButton from "../CopyButton";
import { Key, RefreshCw, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import OnboardingGuide, { type OnboardingStep } from "../OnboardingGuide";

interface ApiSettingsProps {
  initialApiKey: string | null;
}

export default function ApiSettings({ initialApiKey }: ApiSettingsProps) {
  const [apiKey, setApiKey] = useState<string | null>(initialApiKey);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (
      apiKey &&
      !confirm(
        "Are you sure? This will invalidate the existing API Key immediately."
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const key = await generateApiKey();
      setApiKey(key);
      toast.success("API Key generated successfully");
    } catch {
      toast.error("Failed to generate API Key");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete your API Key?")) {
      return;
    }

    try {
      setLoading(true);
      await deleteApiKey();
      setApiKey(null);
      toast.success("API Key deleted successfully");
    } catch {
      toast.error("Failed to delete API Key");
    } finally {
      setLoading(false);
    }
  };

  const onboardingSteps: OnboardingStep[] = [
    {
      title: "Generate API key",
      description: "Create the bearer token used by external apps.",
      status: apiKey ? "complete" : "current",
      icon: "key",
      action: !apiKey ? (
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Key className="h-4 w-4" />
          )}
          Generate key
        </button>
      ) : undefined,
    },
    {
      title: "Copy key",
      description: "Store it in your app as a server-side secret.",
      status: apiKey ? "current" : "locked",
      icon: "database",
    },
    {
      title: "Call the API",
      description: "Use Authorization: Bearer with your database and table IDs.",
      status: apiKey ? "current" : "locked",
      icon: "rows",
      href: "/dashboard/apidocs",
      actionLabel: "Open docs",
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 dark:border-neutral-800 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800 dark:shadow-none">
      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/30 to-blue-600/10 flex items-center justify-center border border-blue-500/20">
            <Key className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
              API Access
            </h2>
            <p className="text-slate-500 text-sm dark:text-neutral-400">
              Manage your API Key for programmatic access
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 text-slate-500 py-8 dark:text-neutral-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading...</span>
          </div>
        ) : (
          <div className="space-y-6 mt-6">
            {!apiKey && (
              <OnboardingGuide
                title="Finish API access"
                description="Generate a key once your Drive data model is ready, then call the generated endpoints from your app."
                steps={onboardingSteps}
                compact
              />
            )}

            {apiKey ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase block mb-2 dark:text-neutral-500">
                    Current API Key
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm text-green-700 break-all dark:border-neutral-700 dark:bg-neutral-950/50 dark:text-green-400">
                      {apiKey}
                    </div>
                    <CopyButton text={apiKey} label="API Key" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200 dark:border-neutral-800">
                  <button
                    onClick={handleGenerate}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-sm font-medium transition-all border border-slate-200 hover:border-slate-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-white dark:border-neutral-700 dark:hover:border-neutral-600"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Regenerate Key
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl text-sm font-medium transition-all border border-red-500/20 hover:border-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Key
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-amber-700 text-sm dark:text-amber-200">
                    You don&apos;t have an active API Key. Generate one to start
                    using the API.
                  </p>
                </div>
                <button
                  onClick={handleGenerate}
                  className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white px-6 py-2.5 rounded-xl transition-all text-sm font-medium shadow-lg shadow-primary/25 hover:shadow-primary/40"
                >
                  <Key className="w-4 h-4" />
                  Generate API Key
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
