"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateDocument } from "../app/actions/table";
import { ColumnDefinition, RowData } from "../types";
import { toast } from "sonner";
import ArrayInput from "./ArrayInput";
import { Loader2, X } from "lucide-react";

interface EditRowModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileId: string;
  schema: ColumnDefinition[];
  document: RowData;
}

export default function EditRowModal({
  isOpen,
  onClose,
  fileId,
  schema,
  document,
}: EditRowModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Filter out system columns for editing
  const editableColumns = schema.filter((col) => !col.key.startsWith("$"));

  // Initialize form data when document changes
  useEffect(() => {
    if (isOpen && document) {
      const initialData: Record<string, any> = {};
      editableColumns.forEach((col) => {
        initialData[col.key] = document[col.key] ?? "";
      });
      setFormData(initialData);
    }
  }, [isOpen, document]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    const form = e.currentTarget;

    try {
      // Process form data based on schema types
      const processedData: Record<string, any> = {};

      editableColumns.forEach((col) => {
        // For arrays, read from the hidden input field (used by ArrayInput)
        // For other types, read from formData state
        if (col.array) {
          const hiddenInput = form.elements.namedItem(
            col.key
          ) as HTMLInputElement;
          const val = hiddenInput?.value || "[]";
          try {
            const parsed = JSON.parse(val);
            if (col.type === "integer") {
              processedData[col.key] = parsed.map((v: string) =>
                parseInt(v, 10)
              );
            } else {
              processedData[col.key] = parsed;
            }
          } catch (e) {
            processedData[col.key] = [];
          }
        } else {
          const val = formData[col.key];
          if (val !== null && val !== "") {
            if (col.type === "boolean") {
              processedData[col.key] = val === true || val === "true";
            } else if (col.type === "integer") {
              processedData[col.key] = parseInt(val as string, 10);
            } else {
              processedData[col.key] = val;
            }
          } else if (col.type === "boolean") {
            processedData[col.key] = false;
          }
        }
      });

      const submitData = new FormData();
      submitData.append("fileId", fileId);
      submitData.append("docId", document.$id);
      submitData.append("data", JSON.stringify(processedData));

      const result = (await updateDocument(submitData)) as any;

      if (result?.success) {
        toast.success("Row updated successfully");
        onClose();
        router.refresh();
      } else {
        throw new Error(result?.error || "Failed to update row");
      }
    } catch (error) {
      console.error("Failed to update row", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update row"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-neutral-800">
          <h3 className="text-lg font-semibold text-white">Edit Row</h3>
          <button onClick={onClose} className="btn btn-ghost p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {editableColumns.map((col) => (
              <div key={col.key} className="space-y-2">
                <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  {col.key}{" "}
                  {col.required && <span className="text-red-500">*</span>}
                </label>
                {col.array ? (
                  <ArrayInput
                    name={col.key}
                    required={col.required}
                    type={col.type as "string" | "integer"}
                    placeholder={`Add ${col.type} value...`}
                    initialValues={
                      Array.isArray(document[col.key])
                        ? document[col.key].map(String)
                        : []
                    }
                  />
                ) : col.type === "boolean" ? (
                  <div className="flex items-center h-10">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={
                          formData[col.key] === true ||
                          formData[col.key] === "true"
                        }
                        onChange={(e) =>
                          handleInputChange(col.key, e.target.checked)
                        }
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
                    value={formData[col.key] ?? ""}
                    onChange={(e) => handleInputChange(col.key, e.target.value)}
                    placeholder={`Enter ${col.key}`}
                    className="input"
                    required={col.required}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
