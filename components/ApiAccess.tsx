"use client";

import Link from "next/link";
import { useState } from "react";

export default function ApiAccess({
  databaseId,
  tableId,
}: {
  databaseId?: string;
  tableId?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const origin =
    typeof window === "undefined" ? "" : window.location.origin;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm text-slate-500 transition-colors hover:text-slate-950 dark:text-neutral-400 dark:hover:text-white"
      >
        API Access
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 text-slate-950 shadow-2xl shadow-slate-900/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white dark:shadow-black/40 sm:p-6">
        <h2 className="text-xl font-bold mb-4">API Access</h2>
        <p className="text-slate-600 text-sm mb-6 dark:text-neutral-400">
          Use your API Key to access your database programmatically. Include it
          in the <code>Authorization: Bearer</code> header. API keys in URL
          query parameters are rejected.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase block mb-2 dark:text-neutral-500">
              API Endpoints
            </label>
            <div className="space-y-2">
              <div className="bg-slate-50 border border-slate-200 rounded p-3 text-sm font-mono text-slate-700 break-all dark:bg-neutral-950 dark:border-neutral-800 dark:text-neutral-300">
                <span className="text-purple-400">GET/POST</span> {origin}
                /api/v1/{databaseId || "[DATABASE_ID]"}/
                {tableId || "[TABLE_ID]"}
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded p-3 text-sm font-mono text-slate-700 break-all dark:bg-neutral-950 dark:border-neutral-800 dark:text-neutral-300">
                <span className="text-purple-400">GET/PATCH/DELETE</span>{" "}
                {origin}
                /api/v1/{databaseId || "[DATABASE_ID]"}/
                {tableId || "[TABLE_ID]"}
                /[DOC_ID]
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2 dark:text-neutral-500">
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
            <label className="text-xs font-medium text-slate-500 uppercase block mb-2 dark:text-neutral-500">
              Auth Header
            </label>
            <div className="bg-slate-50 border border-slate-200 rounded p-3 text-sm font-mono text-slate-700 break-all dark:bg-neutral-950 dark:border-neutral-800 dark:text-neutral-300">
              Authorization: Bearer YOUR_API_KEY
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 uppercase block mb-2 dark:text-neutral-500">
              API Key
            </label>
            <div className="bg-slate-50 border border-slate-200 rounded p-4 text-center dark:bg-neutral-950 dark:border-neutral-800">
              <p className="text-sm text-slate-600 mb-3 dark:text-neutral-400">
                Manage your API Key in Settings
              </p>
              <Link
                href="/dashboard/settings"
                className="inline-block bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                Go to Settings
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-500 hover:text-slate-950 text-sm transition-colors dark:text-neutral-400 dark:hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
