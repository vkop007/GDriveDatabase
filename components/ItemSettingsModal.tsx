"use client";

import { useState } from "react";
import Modal from "./Modal";
import { Loader2, PenLine, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteDatabase, deleteCollection } from "../app/actions";

interface ItemSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: { id: string; name: string };
  type: "database" | "collection";
  parentId?: string; // Required for collection deletion
  onRename: () => void;
}

export default function ItemSettingsModal({
  isOpen,
  onClose,
  item,
  type,
  parentId,
  onRename,
}: ItemSettingsModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${type.charAt(0).toUpperCase() + type.slice(1)} Settings`}
    >
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-neutral-800/30 border border-neutral-700/50">
          <h3 className="text-sm font-medium text-neutral-400 mb-1">
            Selected Item
          </h3>
          <p className="text-lg font-semibold text-white truncate">
            {item.name}
          </p>
          <p className="text-xs text-neutral-500 font-mono mt-1 break-all">
            {item.id}
          </p>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => {
              onRename();
              onClose();
            }}
            className="list-item w-full text-left"
          >
            <div className="icon-box icon-box-purple">
              <PenLine className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Rename</p>
              <p className="text-xs text-neutral-400">
                Change the name of this {type}
              </p>
            </div>
          </button>

          <form
            action={type === "database" ? deleteDatabase : deleteCollection}
            onSubmit={() => setIsDeleting(true)}
          >
            <input type="hidden" name="fileId" value={item.id} />
            {parentId && (
              <input type="hidden" name="parentId" value={parentId} />
            )}
            <button
              type="submit"
              disabled={isDeleting}
              className="w-full flex items-center gap-3 px-4 py-3 bg-red-500/5 hover:bg-red-500/10 text-left rounded-lg transition-colors group border border-red-500/10 hover:border-red-500/20"
            >
              <div className="p-2 bg-red-500/10 rounded-md group-hover:bg-red-500/20 transition-colors">
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 text-red-500" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-500">
                  {isDeleting ? "Deleting..." : "Delete"}
                </p>
                <p className="text-xs text-red-500/60">
                  {isDeleting
                    ? "Please wait..."
                    : `Permanently remove this ${type}`}
                </p>
              </div>
            </button>
          </form>
        </div>
      </div>
    </Modal>
  );
}
