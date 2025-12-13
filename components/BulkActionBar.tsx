"use client";

import { Trash2, X, Loader2 } from "lucide-react";

interface BulkActionBarProps {
  selectedCount: number;
  onDelete: () => void;
  onClear: () => void;
  isDeleting: boolean;
}

export default function BulkActionBar({
  selectedCount,
  onDelete,
  onClear,
  isDeleting,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl px-6 py-3 flex items-center gap-4">
        <span className="text-sm text-neutral-300">
          <span className="font-semibold text-white">{selectedCount}</span>
          {selectedCount === 1 ? " row" : " rows"} selected
        </span>

        <div className="w-px h-6 bg-neutral-700" />

        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:bg-red-600/50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
        >
          {isDeleting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4" />
              Delete Selected
            </>
          )}
        </button>

        <button
          onClick={onClear}
          disabled={isDeleting}
          className="flex items-center gap-2 text-neutral-400 hover:text-white disabled:opacity-50 transition-colors text-sm"
        >
          <X className="w-4 h-4" />
          Clear
        </button>
      </div>
    </div>
  );
}
