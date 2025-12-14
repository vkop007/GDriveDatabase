"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import { renameItem } from "../app/actions/rename";
import { Loader2, PenLine } from "lucide-react";
import { toast } from "sonner";

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  itemId: string;
  itemType: "database" | "collection";
  parentId?: string;
}

export default function RenameModal({
  isOpen,
  onClose,
  currentName,
  itemId,
  itemType,
  parentId,
}: RenameModalProps) {
  const [name, setName] = useState(currentName);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
    }
  }, [isOpen, currentName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name === currentName) return;

    setIsLoading(true);
    try {
      const result = await renameItem(itemId, name, itemType, parentId);

      if (result.success) {
        toast.success(
          `${
            itemType.charAt(0).toUpperCase() + itemType.slice(1)
          } renamed successfully`
        );
        onClose();
        router.refresh();
      } else {
        throw new Error(result.error || "Failed to rename item");
      }
    } catch (error) {
      console.error("Failed to rename item", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to rename item"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Rename ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="rename-input"
            className="block text-sm font-medium text-neutral-400 mb-2"
          >
            Name
          </label>
          <input
            id="rename-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`Enter new ${itemType} name`}
            className="input"
            required
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn btn-ghost">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !name.trim() || name === currentName}
            className="btn btn-primary"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
