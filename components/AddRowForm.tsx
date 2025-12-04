"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDocument } from "../app/actions/table";
import { ColumnDefinition } from "../types";
import { toast } from "sonner";

export default function AddRowForm({
  fileId,
  schema,
}: {
  fileId: string;
  schema: ColumnDefinition[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const inputColumns = schema.filter((col) => !col.key.startsWith("$"));

  if (!isOpen) {
    return (
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
        Add Row
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-neutral-800">
          <h3 className="text-lg font-semibold text-white">Add New Row</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-neutral-500 hover:text-white transition-colors p-1 rounded-md hover:bg-neutral-800"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form
          action={async () => {
            // Action logic handled in onSubmit
          }}
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const formData = new FormData(form);
            const data: Record<string, any> = {}; // eslint-disable-line @typescript-eslint/no-explicit-any

            inputColumns.forEach((col) => {
              const val = formData.get(col.key);
              if (val !== null && val !== "") {
                if (col.type === "boolean") {
                  data[col.key] = (
                    form.elements.namedItem(col.key) as HTMLInputElement
                  ).checked;
                } else if (col.type === "integer") {
                  data[col.key] = parseInt(val as string, 10);
                } else {
                  data[col.key] = val;
                }
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
            }
          }}
          className="p-6 space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {inputColumns.map((col) => (
              <div key={col.key} className="space-y-2">
                <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  {col.key}{" "}
                  {col.required && <span className="text-red-500">*</span>}
                </label>
                {col.type === "boolean" ? (
                  <div className="flex items-center h-10">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name={col.key}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
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
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                    required={col.required}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg transition-colors text-sm font-medium shadow-lg shadow-purple-900/20"
            >
              Save Row
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
