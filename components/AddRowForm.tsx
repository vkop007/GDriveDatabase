"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDocument } from "../app/actions/table";
import { ColumnDefinition } from "../types";
import { toast } from "sonner";
import ArrayInput from "./ArrayInput";
import { Loader2, Plus, X, Table2 } from "lucide-react";
import GradientButton from "./GradientButton";

export default function AddRowForm({
  fileId,
  schema,
}: {
  fileId: string;
  schema: ColumnDefinition[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const inputColumns = schema.filter((col) => !col.key.startsWith("$"));

  if (!isOpen) {
    return (
      <GradientButton
        onClick={() => setIsOpen(true)}
        icon={<Plus className="w-4 h-4" />}
      >
        Add Row
      </GradientButton>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 blur-2xl rounded-full pointer-events-none" />

        {/* Header */}
        <div className="relative flex justify-between items-center p-6 border-b border-neutral-800 bg-gradient-to-r from-neutral-900 to-neutral-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-primary/20 flex items-center justify-center border border-primary/20">
              <Table2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Add New Row</h3>
              <p className="text-xs text-neutral-400">
                Fill in the fields below
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          action={async () => {
            // Action logic handled in onSubmit
          }}
          onSubmit={async (e) => {
            e.preventDefault();
            if (isLoading) return;
            setIsLoading(true);
            const form = e.currentTarget;
            const formData = new FormData(form);
            const data: Record<string, any> = {}; // eslint-disable-line @typescript-eslint/no-explicit-any

            inputColumns.forEach((col) => {
              const val = formData.get(col.key);

              if (col.array && val !== null && val !== "") {
                try {
                  const parsed = JSON.parse(val as string);
                  if (col.type === "integer") {
                    data[col.key] = parsed.map((v: string) => parseInt(v, 10));
                  } else {
                    data[col.key] = parsed;
                  }
                } catch (e) {
                  console.error("Failed to parse array input", e);
                  data[col.key] = [];
                }
              } else if (val !== null && val !== "") {
                if (col.type === "boolean") {
                  data[col.key] = (
                    form.elements.namedItem(col.key) as HTMLInputElement
                  ).checked;
                } else if (col.type === "integer") {
                  data[col.key] = parseInt(val as string, 10);
                } else {
                  data[col.key] = val;
                }
              } else if (col.type === "boolean") {
                data[col.key] = (
                  form.elements.namedItem(col.key) as HTMLInputElement
                ).checked;
              }
            });

            const submissionData = new FormData();
            submissionData.append("fileId", fileId);
            submissionData.append("data", JSON.stringify(data));

            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const result = (await addDocument(submissionData)) as any;
              if (result?.success) {
                toast.success("Row added successfully");
                setIsOpen(false);
                form.reset();
                router.refresh();
              } else {
                throw new Error(result?.error || "Failed to add row");
              }
            } catch (error) {
              console.error("Failed to add row", error);
              toast.error(
                error instanceof Error ? error.message : "Failed to add row"
              );
            } finally {
              setIsLoading(false);
            }
          }}
          className="relative p-6 space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {inputColumns.length === 0 ? (
              <div className="col-span-2 text-center py-12 rounded-xl bg-neutral-800/30 border border-dashed border-neutral-700">
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-neutral-800/50 flex items-center justify-center">
                  <Table2 className="w-6 h-6 text-neutral-500" />
                </div>
                <p className="text-sm text-neutral-400">
                  No columns defined yet
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  Add columns first before adding rows
                </p>
              </div>
            ) : (
              inputColumns.map((col) => (
                <div key={col.key} className="space-y-2">
                  <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                    {col.key}
                    {col.required && <span className="text-primary">*</span>}
                  </label>
                  {col.array ? (
                    <ArrayInput
                      name={col.key}
                      required={col.required}
                      type={col.type as "string" | "integer"}
                      placeholder={`Add ${col.type} value...`}
                    />
                  ) : col.type === "boolean" ? (
                    <div className="flex items-center h-10">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name={col.key}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        <span className="ml-3 text-sm font-medium text-neutral-300">
                          {col.key}
                        </span>
                      </label>
                    </div>
                  ) : (
                    <input
                      type={col.type === "integer" ? "number" : "text"}
                      name={col.key}
                      placeholder={`Enter ${col.key}`}
                      className="w-full bg-neutral-950/50 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      required={col.required}
                    />
                  )}
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-5 py-2.5 text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl transition-all"
            >
              Cancel
            </button>
            <GradientButton
              type="submit"
              isLoading={isLoading}
              disabled={isLoading || inputColumns.length === 0}
            >
              {isLoading ? "Adding..." : "Save Row"}
            </GradientButton>
          </div>
        </form>
      </div>
    </div>
  );
}
