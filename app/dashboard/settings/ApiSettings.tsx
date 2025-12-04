"use client";

import { useState } from "react";
import { generateApiKey, deleteApiKey } from "../../actions";
import { toast } from "sonner";
import CopyButton from "../../../components/CopyButton";

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
    } catch (error) {
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
    } catch (error) {
      toast.error("Failed to delete API Key");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-4">API Access</h2>
      <p className="text-neutral-400 text-sm mb-6">
        Manage your API Key for programmatic access to your databases. Remember
        to keep your API Key secret.
      </p>

      {loading ? (
        <div className="text-neutral-500 animate-pulse">Loading...</div>
      ) : (
        <div className="space-y-6">
          {apiKey ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-neutral-500 uppercase block mb-2">
                  Current API Key
                </label>
                <div className="flex items-center gap-2">
                  <div className="bg-neutral-950 border border-neutral-800 rounded p-3 text-sm font-mono text-green-400 break-all flex-1">
                    {apiKey}
                  </div>
                  <CopyButton text={apiKey} label="API Key" />
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-neutral-800">
                <button
                  onClick={handleGenerate}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Regenerate Key
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 rounded-lg text-sm font-medium transition-colors"
                >
                  Delete Key
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
                <p className="text-yellow-200 text-sm">
                  You don&apos;t have an active API Key. Generate one to start
                  using the API.
                </p>
              </div>
              <button
                onClick={handleGenerate}
                className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                Generate API Key
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
