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
    data?: any;
    error?: string;
  } | null>(null);

  const handleRun = async () => {
    setIsRunning(true);
    setResult(null);

    try {
      let parsedParams = {};
      try {
        parsedParams = JSON.parse(params);
      } catch {
        setResult({ success: false, error: "Invalid JSON parameters" });
        setIsRunning(false);
        return;
      }

      const response = await runFunction(func.id, parsedParams);
      if (response.success) {
        setResult({ success: true, data: response.result });
        onRan(func.id, JSON.stringify(response.result).substring(0, 500));
      } else {
        setResult({ success: false, error: response.error });
      }
    } catch (err) {
      setResult({ success: false, error: "An unexpected error occurred" });
    } finally {
      setIsRunning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-neutral-900/95 border border-neutral-800/50 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-linear-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30">
              <Play className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Run Function</h2>
              <p className="text-sm text-neutral-400">{func.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Parameters Input */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Parameters (JSON)
            </label>
            <textarea
              value={params}
              onChange={(e) => setParams(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-neutral-950/50 border border-neutral-800/50 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-primary/50 transition-colors resize-none"
              placeholder="{}"
            />
            <p className="mt-2 text-xs text-neutral-500">
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
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-medium text-red-400">
                      Error
                    </span>
                  </>
                )}
              </div>
              <pre className="text-sm font-mono text-neutral-300 overflow-auto max-h-48 whitespace-pre-wrap">
                {result.success
                  ? JSON.stringify(result.data, null, 2)
                  : result.error}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-neutral-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-neutral-400 hover:text-white transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
