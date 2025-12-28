"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateDocument, getSimpleTableData } from "../app/actions/table";
import { listBucketFiles } from "../app/actions/bucket";
import { ColumnDefinition, RowData } from "../types";
import { toast } from "sonner";
import ArrayInput from "./ArrayInput";
import { X, Loader2, AlertCircle, Shield } from "lucide-react";
import GradientButton from "./GradientButton";

interface EditRowModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileId: string;
  schema: ColumnDefinition[];
  document: RowData;
}

// Get validation hint text for a column
function getValidationHint(col: ColumnDefinition): string | null {
  const v = col.validation;
  if (!v) return null;

  const hints: string[] = [];

  if (v.minLength !== undefined) hints.push(`min ${v.minLength} chars`);
  if (v.maxLength !== undefined) hints.push(`max ${v.maxLength} chars`);
  if (v.email) hints.push("email format");
  if (v.url) hints.push("URL format");
  if (v.pattern) hints.push(`pattern: ${v.pattern}`);
  if (v.enum && v.enum.length > 0) hints.push(`options: ${v.enum.join(", ")}`);
  if (v.min !== undefined) hints.push(`min: ${v.min}`);
  if (v.max !== undefined) hints.push(`max: ${v.max}`);

  return hints.length > 0 ? hints.join(" · ") : null;
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [relationOptions, setRelationOptions] = useState<
    Record<string, { id: string; label: string }[]>
  >({});
  const [mediaOptions, setMediaOptions] = useState<Record<string, any[]>>({});

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
      setFieldErrors({}); // Clear errors when opening

      // Fetch options for relation columns
      const relationColumns = editableColumns.filter(
        (col) => col.type === "relation" && col.relationTableId
      );

      relationColumns.forEach(async (col) => {
        if (col.relationTableId) {
          const options = await getSimpleTableData(col.relationTableId);
          setRelationOptions((prev) => ({
            ...prev,
            [col.key]: options,
          }));
        }
      });

      // Fetch options for storage columns
      const storageColumns = editableColumns.filter(
        (col) => col.type === "storage"
      );
      if (storageColumns.length > 0) {
        // Fetch once for all storage columns since they share the same bucket
        listBucketFiles().then((files) => {
          const fileOptions = files.map((f: any) => ({
            id: f.id,
            name: f.name,
            mimeType: f.mimeType,
            thumbnailLink: f.thumbnailLink,
            webViewLink: f.webViewLink,
          }));

          storageColumns.forEach((col) => {
            setMediaOptions((prev) => ({
              ...prev,
              [col.key]: fileOptions,
            }));
          });
        });
      }
    }
  }, [isOpen, document]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setFieldErrors({});
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

      const result = await updateDocument(submitData);

      if (result?.success) {
        toast.success("Row updated successfully");
        onClose();
        router.refresh();
      } else {
        // Handle validation errors
        if (result?.errors && result.errors.length > 0) {
          const errors: Record<string, string> = {};
          result.errors.forEach((err) => {
            errors[err.field] = err.message;
          });
          setFieldErrors(errors);
          toast.error("Validation failed. Please check the form.");
        } else {
          throw new Error(result?.error || "Failed to update row");
        }
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
    // Clear error when user starts typing
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
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
            {editableColumns.map((col) => {
              const hasError = !!fieldErrors[col.key];
              const hint = getValidationHint(col);

              return (
                <div key={col.key} className="space-y-2">
                  <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                    {col.key}{" "}
                    {col.required && <span className="text-red-500">*</span>}
                    {col.validation && (
                      <span title="Has validation rules">
                        <Shield className="w-3 h-3 text-emerald-500" />
                      </span>
                    )}
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
                        <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        <span className="ml-3 text-sm font-medium text-neutral-300">
                          {col.key}
                        </span>
                      </label>
                    </div>
                  ) : col.type === "datetime" ? (
                    <input
                      type="datetime-local"
                      value={(() => {
                        const val = formData[col.key];
                        if (!val) return "";
                        try {
                          const date = new Date(val);
                          // Format: YYYY-MM-DDTHH:mm
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(
                            2,
                            "0"
                          );
                          const day = String(date.getDate()).padStart(2, "0");
                          const hours = String(date.getHours()).padStart(
                            2,
                            "0"
                          );
                          const minutes = String(date.getMinutes()).padStart(
                            2,
                            "0"
                          );
                          return `${year}-${month}-${day}T${hours}:${minutes}`;
                        } catch {
                          return "";
                        }
                      })()}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        if (newValue) {
                          handleInputChange(
                            col.key,
                            new Date(newValue).toISOString()
                          );
                        } else {
                          handleInputChange(col.key, "");
                        }
                      }}
                      className={`w-full bg-neutral-950/50 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 transition-all scheme-dark ${
                        hasError
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : "border-neutral-700 focus:border-primary focus:ring-primary/20"
                      }`}
                      required={col.required}
                    />
                  ) : col.type === "storage" ? (
                    <div className="relative">
                      <select
                        value={formData[col.key] ?? ""}
                        onChange={(e) =>
                          handleInputChange(col.key, e.target.value)
                        }
                        className={`w-full bg-neutral-950/50 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer ${
                          hasError
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                            : "border-neutral-700 focus:border-primary focus:ring-primary/20"
                        }`}
                        required={col.required}
                      >
                        <option value="">Select File</option>
                        {mediaOptions[col.key]?.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.name}
                          </option>
                        ))}
                      </select>
                      {mediaOptions[col.key] === undefined && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="w-4 h-4 text-neutral-500 animate-spin" />
                        </div>
                      )}
                    </div>
                  ) : col.type === "relation" ? (
                    <div className="relative">
                      <select
                        value={formData[col.key] ?? ""}
                        onChange={(e) =>
                          handleInputChange(col.key, e.target.value)
                        }
                        className={`w-full bg-neutral-950/50 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer ${
                          hasError
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                            : "border-neutral-700 focus:border-primary focus:ring-primary/20"
                        }`}
                        required={col.required}
                      >
                        <option value="">Select Item</option>
                        {relationOptions[col.key]?.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {relationOptions[col.key] === undefined && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="w-4 h-4 text-neutral-500 animate-spin" />
                        </div>
                      )}
                    </div>
                  ) : col.validation?.enum && col.validation.enum.length > 0 ? (
                    // Render select for enum fields
                    <select
                      value={formData[col.key] ?? ""}
                      onChange={(e) =>
                        handleInputChange(col.key, e.target.value)
                      }
                      className={`w-full bg-neutral-950/50 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer ${
                        hasError
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : "border-neutral-700 focus:border-primary focus:ring-primary/20"
                      }`}
                      required={col.required}
                    >
                      <option value="">Select {col.key}</option>
                      {col.validation.enum.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={
                        col.type === "integer"
                          ? "number"
                          : col.validation?.email
                          ? "email"
                          : col.validation?.url
                          ? "url"
                          : "text"
                      }
                      value={formData[col.key] ?? ""}
                      onChange={(e) =>
                        handleInputChange(col.key, e.target.value)
                      }
                      placeholder={`Enter ${col.key}`}
                      className={`w-full bg-neutral-950/50 border rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 transition-all ${
                        hasError
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : "border-neutral-700 focus:border-primary focus:ring-primary/20"
                      }`}
                      required={col.required}
                      minLength={col.validation?.minLength}
                      maxLength={col.validation?.maxLength}
                      min={col.validation?.min}
                      max={col.validation?.max}
                      pattern={col.validation?.pattern}
                    />
                  )}

                  {/* Validation hint */}
                  {hint && !hasError && (
                    <p className="text-xs text-neutral-500 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      {hint}
                    </p>
                  )}

                  {/* Error message */}
                  {hasError && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fieldErrors[col.key]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Cancel
            </button>
            <GradientButton
              type="submit"
              isLoading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </GradientButton>
          </div>
        </form>
      </div>
    </div>
  );
}
