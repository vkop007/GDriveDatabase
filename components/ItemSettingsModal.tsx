"use client";

import { useState } from "react";
import Modal from "./Modal";
import {
  PenLine,
  Trash2,
  Database,
  Table,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { deleteDatabase, deleteCollection } from "../app/actions";
import { useConfirm } from "../contexts/ConfirmContext";
import { useRouter } from "next/navigation";

interface ItemSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: { id: string; name: string };
  type: "database" | "collection";
  parentId?: string;
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
  const confirm = useConfirm();
  const router = useRouter();

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: `Delete ${type}?`,
      description: `Are you sure you want to permanently delete "${item.name}"? This action cannot be undone and all data will be lost.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
      icon: <AlertTriangle className="w-6 h-6" />,
    });

    if (!confirmed) return;

    setIsDeleting(true);
    onClose();

    try {
      const formData = new FormData();
      formData.append("fileId", item.id);
      if (parentId) {
        formData.append("parentId", parentId);
      }

      if (type === "database") {
        await deleteDatabase(formData);
      } else {
        await deleteCollection(formData);
      }

      toast.success(
        `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`
      );

      router.refresh();
    } catch {
      toast.error(`Failed to delete ${type}`);
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${type.charAt(0).toUpperCase() + type.slice(1)} Settings`}
    >
      <div className="space-y-5">
        {/* Selected Item Card */}
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 blur-2xl rounded-full pointer-events-none dark:hidden" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center dark:bg-neutral-950">
              {type === "database" ? (
                <Database className="w-5 h-5 text-primary" />
              ) : (
                <Table className="w-5 h-5 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 dark:text-neutral-500">
                {type}
              </p>
              <p className="text-lg font-semibold text-slate-950 truncate dark:text-white">
                {item.name}
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-neutral-700/40">
            <p className="text-[11px] text-slate-500 font-mono truncate dark:text-neutral-500">
              ID: {item.id}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          {/* Rename Action */}
          <button
            onClick={() => {
              onRename();
              onClose();
            }}
            className="group w-full flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-primary/30 transition-all duration-300 dark:bg-neutral-800/30 dark:hover:bg-neutral-800/60 dark:border-neutral-700/40"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative w-11 h-11 rounded-xl bg-linear-to-br from-primary/25 to-purple-500/15 border border-primary/20 flex items-center justify-center group-hover:border-primary/40 transition-colors duration-300">
                <PenLine className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-slate-950 group-hover:text-primary transition-colors duration-300 dark:text-white">
                Rename
              </p>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Change the name of this {type}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-300" />
          </button>

          {/* Delete Action */}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="group w-full flex items-center gap-4 p-4 rounded-xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-red-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative w-11 h-11 rounded-xl bg-linear-to-br from-red-500/20 to-red-600/10 border border-red-500/20 flex items-center justify-center group-hover:border-red-500/40 transition-colors duration-300">
                <Trash2 className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-red-500">
                {isDeleting ? "Deleting..." : "Delete"}
              </p>
              <p className="text-xs text-red-500/60">
                Permanently remove this {type}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-red-500/40 group-hover:text-red-500 group-hover:translate-x-0.5 transition-all duration-300" />
          </button>
        </div>
      </div>
    </Modal>
  );
}
