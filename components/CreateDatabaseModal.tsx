"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import { createDatabase } from "../app/actions";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

export default function CreateDatabaseModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (await createDatabase(formData)) as any;
      if (result?.success) {
        toast.success("Database created successfully");
        setIsOpen(false);
        router.refresh();
      } else {
        throw new Error(result?.error || "Failed to create database");
      }
    } catch (error) {
      console.error("Failed to create database", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create database"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="btn btn-primary">
        <Plus className="w-4 h-4" />
        Create Database
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Create New Database"
      >
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-neutral-400 mb-2"
            >
              Database Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="e.g. My Database"
              className="input"
              required
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Database
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
