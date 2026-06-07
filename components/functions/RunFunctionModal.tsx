"use client";

import { useState } from "react";
import { X, Loader2, Play, CheckCircle, AlertCircle } from "lucide-react";
import { runFunction, FunctionInfo } from "@/app/actions/function";

interface RunFunctionModalProps {
  isOpen: boolean;
  onClose: () => void;
  func: FunctionInfo;
  onRan: (id: string, result: string) => void;
}

export default function RunFunctionModal({
  isOpen,
  onClose,
  func,
  onRan,
}: RunFunctionModalProps) {
  const [params, setParams] = useState("{}");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    data?: unknown;
    error?: string;
    needsAuth?: boolean;
    authUrl?: string;
  } | null>(null);

  const handleRun = async () => {
    setIsRunning(true);
    setResult(null);

    try {
      let parsedParams: Record<string, unknown> = {};
      try {
        const parsed = JSON.parse(params);
        if (
          !parsed ||
          typeof parsed !== "object" ||
          Array.isArray(parsed)
        ) {
          setResult({
            success: false,
            error: "Parameters must be a JSON object",
          });
          setIsRunning(false);
          return;
        }
        parsedParams = parsed as Record<string, unknown>;
      } catch {
        setResult({ success: false, error: "Invalid JSON parameters" });
        setIsRunning(false);
        return;
      }

      const response = await runFunction(func.id, parsedParams);
      if (response.success) {
        setResult({ success: true, data: response.result });
        onRan(func.id, JSON.stringify(response.result).substring(0, 500));
      } else if (response.needsAuth && response.authUrl) {
        setResult({
          success: false,
          error: response.error,
          needsAuth: true,
          authUrl: response.authUrl,
        });
      } else {
        setResult({ success: false, error: response.error });
      }
    } catch {
      setResult({ success: false, error: "An unexpected error occurred" });
    } finally {
      setIsRunning(false);
    }
  };

  const handleAuthorize = () => {
    if (!result?.authUrl) return;

    // Open auth popup and monitor when it closes
    const authPopup = window.open(
      result.authUrl,
      "auth_popup",
      "width=600,height=700,scrollbars=yes"
    );

    // Poll to check when the popup closes
    const checkPopup = setInterval(async () => {
      if (authPopup?.closed) {
        clearInterval(checkPopup);
        // Retry running after auth popup closes
        handleRun();
      }
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-3 py-6 sm:items-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-900/20 dark:bg-neutral-900/95 dark:border-neutral-800/50 dark:shadow-black/40">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 p-4 border-b border-slate-200 sm:p-5 dark:border-neutral-800/50">
          <div className="flex min-w-0 items-center gap-3">
            <div className="shrink-0 p-2 rounded-lg bg-linear-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30">
              <Play className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Run Function</h2>
              <p className="truncate text-sm text-slate-500 dark:text-neutral-400">{func.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-950 transition-colors dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 sm:p-5">
          {/* Parameters Input */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2 dark:text-neutral-300">
              Parameters (JSON)
            </label>
            <textarea
              value={params}
              onChange={(e) => setParams(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-950 font-mono text-sm focus:outline-none focus:border-primary/50 transition-colors resize-none dark:bg-neutral-950/50 dark:border-neutral-800/50 dark:text-white"
              placeholder="{}"
            />
            <p className="mt-2 text-xs text-slate-500 dark:text-neutral-500">
              Pass parameters as a JSON object. Access them in your function
              with &apos;params&apos;.
            </p>
          </div>

          {/* Result */}
          {result && (
            <div
              className={`p-4 rounded-xl border ${
                result.success
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : result.needsAuth
                  ? "bg-amber-500/10 border-amber-500/30"
                  : "bg-red-500/10 border-red-500/30"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {result.success ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-400">
                      Success
                    </span>
                  </>
                ) : result.needsAuth ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-medium text-amber-400">
                      Authorization Required
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-medium text-red-400">
                      Error
                    </span>
                  </>
                )}
              </div>
              <p className="text-sm text-slate-600 mb-3 dark:text-neutral-300">
                {result.success ? null : result.error}
              </p>
              {result.success && (
                <pre className="text-sm font-mono text-slate-700 overflow-auto max-h-48 whitespace-pre-wrap dark:text-neutral-300">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              )}
              {result.needsAuth && (
                <button
                  onClick={handleAuthorize}
                  className="flex w-full items-center justify-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/40 text-amber-400 font-medium rounded-lg hover:bg-amber-500/30 transition-all sm:w-auto"
                >
                  <Play className="w-4 h-4" />
                  Authorize & Retry
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-2 p-4 border-t border-slate-200 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:p-5 dark:border-neutral-800/50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 text-slate-600 hover:text-slate-950 transition-colors sm:w-auto dark:text-neutral-400 dark:hover:text-white"
          >
            Close
          </button>
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex w-full items-center justify-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Function
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
