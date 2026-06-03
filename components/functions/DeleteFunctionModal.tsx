"use client";

import { useState } from "react";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";
import { deleteFunction, FunctionInfo } from "@/app/actions/function";

interface DeleteFunctionModalProps {
  isOpen: boolean;
  onClose: () => void;
  func: FunctionInfo;
  onDeleted: (id: string) => void;
}

export default function DeleteFunctionModal({
  isOpen,
  onClose,
  func,
  onDeleted,
}: DeleteFunctionModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteFunction(func.id);
      if (result.success) {
        onDeleted(func.id);
      } else {
        setError(result.error || "Failed to delete function");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
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
      <div className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col overflow-hidden bg-neutral-900/95 border border-neutral-800/50 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-neutral-800/50 sm:p-5">
          <div className="shrink-0 p-2 rounded-lg bg-red-500/20 border border-red-500/30">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-white">
              Delete Function
            </h2>
            <p className="text-sm text-neutral-400">
              This action cannot be undone
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <p className="text-neutral-300">
            Are you sure you want to delete{" "}
            <span className="break-words font-semibold text-white">
              {func.name}
            </span>
            ? This will permanently remove the function and its Apps Script from
            your Google Drive.
          </p>

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-2 p-4 border-t border-neutral-800/50 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:p-5">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 text-neutral-400 hover:text-white transition-colors sm:w-auto"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex w-full items-center justify-center gap-2 px-5 py-2.5 bg-linear-to-r from-red-500 to-red-600 text-white font-medium rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete Function
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
