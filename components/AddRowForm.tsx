"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { addDocument, getSimpleTableData } from "../app/actions/table";
import { listBucketFiles } from "../app/actions/bucket";
import {
  BucketFile,
  ColumnDefinition,
  DocumentValue,
  RelationOption,
} from "../types";
import { toast } from "sonner";
import ArrayInput from "./ArrayInput";
import { Loader2, Plus, X, Table2, AlertCircle, Shield } from "lucide-react";
import GradientButton from "./GradientButton";

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

export default function AddRowForm({
  fileId,
  databaseId,
  schema,
}: {
  fileId: string;
  databaseId: string;
  schema: ColumnDefinition[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [relationOptions, setRelationOptions] = useState<
    Record<string, RelationOption[]>
  >({});
  const [mediaOptions, setMediaOptions] = useState<Record<string, BucketFile[]>>(
    {}
  );

  const router = useRouter();
  const inputColumns = useMemo(
    () => schema.filter((col) => !col.key.startsWith("$")),
    [schema]
  );
  const fieldLabelClass =
    "flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-neutral-400";
  const fieldControlBase =
    "w-full rounded-xl border px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2";
  const getFieldControlClass = (hasError: boolean) =>
    `${fieldControlBase} bg-white text-slate-950 dark:bg-neutral-950/50 dark:text-white ${
      hasError
        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
        : "border-slate-200 focus:border-primary focus:ring-primary/20 dark:border-neutral-700"
    }`;
  const selectControlClass = (hasError: boolean) =>
    `${getFieldControlClass(hasError)} appearance-none cursor-pointer`;

  useEffect(() => {
    if (isOpen) {
      // Clear errors when opening
      setFieldErrors({});

      // Fetch options for relation columns
      const relationColumns = inputColumns.filter(
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
      const storageColumns = inputColumns.filter(
        (col) => col.type === "storage"
      );
      if (storageColumns.length > 0) {
        // Fetch once for all storage columns since they share the same bucket
        listBucketFiles().then((files) => {
          const fileOptions = files.map((f) => ({
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
  }, [isOpen, inputColumns]);

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
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20 animate-in fade-in zoom-in duration-200 dark:border-neutral-800 dark:bg-linear-to-br dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800 dark:shadow-black/40">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 blur-2xl rounded-full pointer-events-none" />

        {/* Header */}
        <div className="relative flex justify-between items-center p-6 border-b border-slate-200 bg-slate-50/80 dark:border-neutral-800 dark:bg-linear-to-r dark:from-neutral-900 dark:to-neutral-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary/30 to-primary/20 flex items-center justify-center border border-primary/20">
              <Table2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Add New Row</h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Fill in the fields below
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-950 hover:bg-slate-100 rounded-lg transition-all dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800"
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
            setFieldErrors({});

            const form = e.currentTarget;
            const formData = new FormData(form);
            const data: Record<string, DocumentValue> = {};

            inputColumns.forEach((col) => {
              const val = formData.get(col.key);

              if (col.array && val !== null && val !== "") {
                try {
                  const parsed = JSON.parse(String(val)) as unknown;
                  const parsedValues = Array.isArray(parsed) ? parsed : [];
                  if (col.type === "integer") {
                    data[col.key] = parsedValues.map((v) =>
                      parseInt(String(v), 10)
                    );
                  } else {
                    data[col.key] = parsedValues.map((v) => String(v));
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
                  data[col.key] = parseInt(String(val), 10);
                } else {
                  data[col.key] = String(val);
                }
              } else if (col.type === "boolean") {
                data[col.key] = (
                  form.elements.namedItem(col.key) as HTMLInputElement
                ).checked;
              }
            });

            const submissionData = new FormData();
            submissionData.append("fileId", fileId);
            submissionData.append("databaseId", databaseId);
            submissionData.append("data", JSON.stringify(data));

            try {
              const result = await addDocument(submissionData);
              if (result?.success) {
                toast.success("Row added successfully");
                setIsOpen(false);
                form.reset();
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
                  throw new Error(result?.error || "Failed to add row");
                }
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
              <div className="col-span-2 text-center py-12 rounded-xl bg-slate-50 border border-dashed border-slate-200 dark:bg-neutral-800/30 dark:border-neutral-700">
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-slate-100 flex items-center justify-center dark:bg-neutral-800/50">
                  <Table2 className="w-6 h-6 text-slate-400 dark:text-neutral-500" />
                </div>
                <p className="text-sm text-slate-600 dark:text-neutral-400">
                  No columns defined yet
                </p>
                <p className="text-xs text-slate-500 mt-1 dark:text-neutral-500">
                  Add columns first before adding rows
                </p>
              </div>
            ) : (
              inputColumns.map((col) => {
                const hasError = !!fieldErrors[col.key];
                const hint = getValidationHint(col);

                return (
                  <div key={col.key} className="space-y-2">
                    <label className={fieldLabelClass}>
                      {col.key}
                      {col.required && <span className="text-primary">*</span>}
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
                      />
                    ) : col.type === "boolean" ? (
                      <div className="flex items-center h-10">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name={col.key}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary dark:bg-neutral-800"></div>
                          <span className="ml-3 text-sm font-medium text-slate-700 dark:text-neutral-300">
                            {col.key}
                          </span>
                        </label>
                      </div>
                    ) : col.type === "datetime" ? (
                      <input
                        type="datetime-local"
                        name={col.key}
                        className={getFieldControlClass(hasError)}
                        required={col.required}
                      />
                    ) : col.type === "storage" ? (
                      <div className="relative">
                        <select
                          name={col.key}
                          className={selectControlClass(hasError)}
                          required={col.required}
                          defaultValue=""
                        >
                          <option value="" disabled>
                            Select File
                          </option>
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
                          name={col.key}
                          className={selectControlClass(hasError)}
                          required={col.required}
                          defaultValue=""
                        >
                          <option value="" disabled>
                            Select Item
                          </option>
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
                    ) : col.validation?.enum &&
                      col.validation.enum.length > 0 ? (
                      // Render select for enum fields
                      <select
                        name={col.key}
                        className={selectControlClass(hasError)}
                        required={col.required}
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Select {col.key}
                        </option>
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
                        name={col.key}
                        placeholder={`Enter ${col.key}`}
                        className={`${getFieldControlClass(hasError)} placeholder:text-slate-400 dark:placeholder:text-neutral-500`}
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
                      <p className="text-xs text-slate-500 flex items-center gap-1 dark:text-neutral-500">
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
              })
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded-xl transition-all dark:text-neutral-300 dark:hover:text-white dark:hover:bg-neutral-800"
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
