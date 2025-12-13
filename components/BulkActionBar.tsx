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
    <div className="floating-bar animate-slide-up">
      <span className="text-sm text-neutral-300">
        <span className="font-semibold text-white">{selectedCount}</span>
        {selectedCount === 1 ? " row" : " rows"} selected
      </span>

      <div className="divider" />

      <button
        onClick={onDelete}
        disabled={isDeleting}
        className="btn btn-danger"
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

      <button onClick={onClear} disabled={isDeleting} className="btn btn-ghost">
        <X className="w-4 h-4" />
        Clear
      </button>
    </div>
  );
}
