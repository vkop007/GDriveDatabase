"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import { createTable } from "../app/actions/table";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

interface CreateTableModalProps {
  parentId: string;
}

export default function CreateTableModal({ parentId }: CreateTableModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (await createTable(formData)) as any;
      if (result?.success) {
        toast.success("Table created successfully");
        setIsOpen(false);
        router.refresh();
      } else {
        throw new Error(result?.error || "Failed to create table");
      }
    } catch (error) {
      console.error("Failed to create table", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create table"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="btn btn-primary">
        <Plus className="w-4 h-4" />
        Create Table
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Create New Table"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="parentId" value={parentId} />
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-neutral-400 mb-2"
            >
              Table Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="e.g. users"
              className="input"
              required
              autoFocus
              disabled={isLoading}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="btn btn-ghost"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Table"
              )}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
