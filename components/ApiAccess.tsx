"use client";

import { useState, useEffect } from "react";
import { generateApiKey } from "../app/actions";
import { toast } from "sonner";

export default function ApiAccess({
  databaseId,
  tableId,
}: {
  databaseId?: string;
  tableId?: string;
}) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    console.log("Its Calling: " + window.location.origin);
    setOrigin(window.location.origin);
  }, []);

  const handleGenerate = async () => {
    try {
      const key = await generateApiKey();
      setApiKey(key);
      toast.success("API Key generated successfully");
    } catch (error) {
      toast.error("Failed to generate API Key");
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm text-neutral-400 hover:text-white transition-colors"
      >
        API Access
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
        <h2 className="text-xl font-bold mb-4">API Access</h2>
        <p className="text-neutral-400 text-sm mb-6">
          Use this API Key to access your database programmatically. Include it
          in the <code>x-api-key</code> header.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-neutral-500 uppercase block mb-2">
              API Endpoints
            </label>
            <div className="space-y-2">
              <div className="bg-neutral-950 border border-neutral-800 rounded p-3 text-sm font-mono text-neutral-300 break-all">
                <span className="text-purple-400">GET/POST</span> {origin}
                /api/v1/{databaseId || "[DATABASE_ID]"}/
                {tableId || "[TABLE_ID]"}
              </div>
              <div className="bg-neutral-950 border border-neutral-800 rounded p-3 text-sm font-mono text-neutral-300 break-all">
                <span className="text-purple-400">GET/PATCH/DELETE</span>{" "}
                {origin}
                /api/v1/{databaseId || "[DATABASE_ID]"}/
                {tableId || "[TABLE_ID]"}
                /[DOC_ID]
              </div>
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              Replace <code>[DOC_ID]</code> with the document ID.
              {!databaseId && (
                <>
                  {" "}
                  Replace <code>[DATABASE_ID]</code> with the ID found on the
                  database card.
                </>
              )}
              {!tableId && (
                <>
                  {" "}
                  Replace <code>[TABLE_ID]</code> with the ID found on the
                  collection card.
                </>
              )}
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-500 uppercase block mb-2">
              API Key
            </label>
            {apiKey ? (
              <div className="bg-neutral-950 border border-neutral-800 rounded p-3 text-sm font-mono text-green-400 break-all">
                {apiKey}
              </div>
            ) : (
              <button
                onClick={handleGenerate}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-lg transition-colors text-sm font-medium"
              >
                Generate New API Key
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setIsOpen(false)}
            className="text-neutral-400 hover:text-white text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
