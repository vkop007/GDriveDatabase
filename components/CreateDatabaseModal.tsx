"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import { createDatabase } from "../app/actions";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import GradientButton from "./GradientButton";

export default function CreateDatabaseModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    const formData = new FormData(e.currentTarget);

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
      <GradientButton
        onClick={() => setIsOpen(true)}
        icon={<Plus className="w-4 h-4" />}
      >
        Create Database
      </GradientButton>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Create New Database"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <GradientButton
              type="submit"
              isLoading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create Database"}
            </GradientButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
