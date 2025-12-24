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
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsUpdating(false);
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
          <div>
            <h2 className="text-lg font-semibold text-white">Edit Function</h2>
            <p className="text-sm text-neutral-400">{func.name}</p>
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
          {/* Code Editor */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Function Code
            </label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={14}
              className="w-full px-4 py-3 bg-neutral-950/50 border border-neutral-800/50 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-primary/50 transition-colors resize-none"
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
        <div className="flex items-center justify-end gap-3 p-5 border-t border-neutral-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-neutral-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-primary-from to-primary-to text-white font-medium rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
