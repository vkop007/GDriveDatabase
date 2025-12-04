"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import { createTable } from "../app/actions/table";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CreateTableModalProps {
  parentId: string;
}

export default function CreateTableModal({ parentId }: CreateTableModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
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
      <button
        onClick={() => setIsOpen(true)}
        className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        Create Table
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Create New Table"
      >
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="parentId" value={parentId} />
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-neutral-400 mb-1"
            >
              Table Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="e.g. users"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
              required
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Table
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
