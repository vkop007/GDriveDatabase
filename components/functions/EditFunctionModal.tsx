"use client";

import { useState } from "react";
import { X, Loader2, Save } from "lucide-react";
import { updateFunction, FunctionInfo } from "@/app/actions/function";

interface EditFunctionModalProps {
  isOpen: boolean;
  onClose: () => void;
  func: FunctionInfo;
  onUpdated: (func: FunctionInfo) => void;
}

export default function EditFunctionModal({
  isOpen,
  onClose,
  func,
  onUpdated,
}: EditFunctionModalProps) {
  const [code, setCode] = useState(func.code);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async () => {
    if (!code.trim()) {
      setError("Function code is required");
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      const result = await updateFunction(func.id, code);
      if (result.success) {
        onUpdated({
          ...func,
          code,
          updatedAt: new Date().toISOString(),
        });
      } else {
        setError(result.error || "Failed to update function");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsUpdating(false);
    }
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
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Edit Function</h2>
            <p className="truncate text-sm text-slate-500 dark:text-neutral-400">{func.name}</p>
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
          {/* Code Editor */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2 dark:text-neutral-300">
              Function Code
            </label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={14}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-950 font-mono text-sm focus:outline-none focus:border-primary/50 transition-colors resize-none dark:bg-neutral-950/50 dark:border-neutral-800/50 dark:text-white"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-2 p-4 border-t border-slate-200 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:p-5 dark:border-neutral-800/50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 text-slate-600 hover:text-slate-950 transition-colors sm:w-auto dark:text-neutral-400 dark:hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-medium text-white transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save & Deploy
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
