"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { updateTableSchema } from "../app/actions/table";
import {
  AlertCircle,
  Plus,
  Key,
  Type,
  Shield,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import GradientButton from "./GradientButton";
import { toast } from "sonner";

interface AddColumnFormProps {
  fileId: string;
  databaseId: string;
  availableTables: { id: string; name: string }[];
}

export default function AddColumnForm({
  fileId,
  databaseId,
  availableTables,
}: AddColumnFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedType, setSelectedType] = useState<string>("string");
  const [showValidation, setShowValidation] = useState(false);
  const [enumValues, setEnumValues] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const result = await updateTableSchema(formData);

      if (result.success) {
        toast.success(result.message || "Column added successfully");
        formRef.current?.reset();
        setSelectedType("string");
        setShowValidation(false);
        setEnumValues("");
        router.refresh();
        return;
      }

      const message = result.error || "Failed to add column";
      setError(message);
      toast.error(message);
    } catch (submitError) {
      console.error("Failed to add column:", submitError);
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Failed to add column";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validation options that are available for each type
  const getValidationOptions = (type: string) => {
    switch (type) {
      case "string":
        return ["minLength", "maxLength", "pattern", "email", "url", "enum"];
      case "integer":
        return ["min", "max"];
      default:
        return [];
    }
  };

  const validationOptions = getValidationOptions(selectedType);
  const hasValidationOptions = validationOptions.length > 0;
  const labelClass =
    "flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-neutral-400";
  const compactLabelClass = "text-xs font-medium text-slate-500 dark:text-neutral-400";
  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-950 placeholder:text-slate-400 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-neutral-700 dark:bg-neutral-950/50 dark:text-white dark:placeholder:text-neutral-500";
  const smallInputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 placeholder:text-slate-400 focus:border-primary/50 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500";
  const switchTrackClass =
    "w-12 h-7 rounded-full border border-slate-300 bg-slate-200 shadow-inner transition-all peer-checked:border-primary/50 peer-checked:bg-linear-to-r peer-checked:from-primary-from peer-checked:to-primary-to dark:border-neutral-700 dark:bg-neutral-800";
  const smallSwitchTrackClass =
    "w-10 h-6 rounded-full border border-slate-300 bg-slate-200 transition-all peer-checked:border-emerald-500 peer-checked:bg-emerald-600 dark:border-neutral-700 dark:bg-neutral-800";
  const switchLabelClass =
    "text-sm text-slate-500 transition-colors group-hover:text-slate-950 dark:text-neutral-400 dark:group-hover:text-white";

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 dark:border-neutral-800 dark:bg-neutral-900/50 dark:shadow-none"
    >
      <input type="hidden" name="fileId" value={fileId} />
      <input type="hidden" name="databaseId" value={databaseId} />

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Column was not added</p>
            <p className="mt-0.5 text-red-700/80 dark:text-red-200/80">
              {error}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
        <div className="md:col-span-2 space-y-2">
          <label className={labelClass}>
            <Key className="w-3 h-3" />
            Key
          </label>
          <input
            type="text"
            name="key"
            placeholder="e.g. email"
            className={inputClass}
            required
          />
        </div>

        <div className="md:col-span-1 space-y-2">
          <label className={labelClass}>
            <Type className="w-3 h-3" />
            Type
          </label>
          <select
            name="type"
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setShowValidation(false);
            }}
            className={`${inputClass} appearance-none cursor-pointer`}
          >
            <option value="string">String</option>
            <option value="integer">Integer</option>
            <option value="boolean">Boolean</option>
            <option value="datetime">Datetime</option>
            <option value="relation">Relation</option>
            <option value="storage">Storage / Media</option>
          </select>
        </div>

        {selectedType === "relation" ? (
          <div className="md:col-span-1 space-y-2">
            <label className={labelClass}>
              <Type className="w-3 h-3" />
              Relation
            </label>
            <select
              name="relationTableId"
              className={`${inputClass} appearance-none cursor-pointer`}
              required
            >
              <option value="">Select Table</option>
              {availableTables.map((table) => (
                <option key={table.id} value={table.id}>
                  {table.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex flex-col justify-end md:col-span-1">
            <div className="h-5 mb-2" />
            <div className="h-[42px] flex items-center">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    name="array"
                    id="array"
                    className="sr-only peer"
                  />
                  <div className={switchTrackClass} />
                  <div className="absolute left-1 top-1 w-5 h-5 bg-neutral-400 rounded-full transition-all peer-checked:translate-x-5 peer-checked:bg-white shadow-sm" />
                </div>
                <span className={switchLabelClass}>
                  Array
                </span>
              </label>
            </div>
          </div>
        )}

        <div className="flex flex-col justify-end md:col-span-1">
          <div className="h-5 mb-2" />
          <div className="h-[42px] flex items-center">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  name="required"
                  id="required"
                  className="sr-only peer"
                />
                <div className={switchTrackClass} />
                <div className="absolute left-1 top-1 w-5 h-5 bg-neutral-400 rounded-full transition-all peer-checked:translate-x-5 peer-checked:bg-white shadow-sm" />
              </div>
              <span className={switchLabelClass}>
                Required
              </span>
            </label>
          </div>
        </div>

        <div className="flex flex-col justify-end md:col-span-1">
          <div className="h-5 mb-2" />
          <div className="h-[42px] flex items-center">
            <GradientButton
              type="submit"
              isLoading={isSubmitting}
              icon={<Plus className="w-4 h-4" />}
            >
              {isSubmitting ? "Adding..." : "Add Column"}
            </GradientButton>
          </div>
        </div>
      </div>

      {/* Validation Rules Toggle */}
      {hasValidationOptions && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowValidation(!showValidation)}
            className="flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-950 dark:text-neutral-400 dark:hover:text-white"
          >
            <Shield className="w-4 h-4" />
            <span>Validation Rules</span>
            {showValidation ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showValidation && (
            <div className="mt-4 grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-neutral-800 dark:bg-neutral-950/50 md:grid-cols-3">
              {selectedType === "string" && (
                <>
                  {/* Min Length */}
                  <div className="space-y-2">
                    <label className={compactLabelClass}>
                      Min Length
                    </label>
                    <input
                      type="number"
                      name="validation_minLength"
                      min="0"
                      placeholder="e.g. 3"
                      className={smallInputClass}
                    />
                  </div>

                  {/* Max Length */}
                  <div className="space-y-2">
                    <label className={compactLabelClass}>
                      Max Length
                    </label>
                    <input
                      type="number"
                      name="validation_maxLength"
                      min="1"
                      placeholder="e.g. 100"
                      className={smallInputClass}
                    />
                  </div>

                  {/* Pattern (Regex) */}
                  <div className="space-y-2">
                    <label className={compactLabelClass}>
                      Pattern (Regex)
                    </label>
                    <input
                      type="text"
                      name="validation_pattern"
                      placeholder="e.g. ^[a-z]+$"
                      className={`${smallInputClass} font-mono`}
                    />
                  </div>

                  {/* Email Toggle */}
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          name="validation_email"
                          className="sr-only peer"
                        />
                        <div className={smallSwitchTrackClass} />
                        <div className="absolute left-1 top-1 w-4 h-4 bg-neutral-400 rounded-full transition-all peer-checked:translate-x-4 peer-checked:bg-white shadow-sm" />
                      </div>
                      <span className={switchLabelClass}>
                        Email Format
                      </span>
                    </label>
                  </div>

                  {/* URL Toggle */}
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          name="validation_url"
                          className="sr-only peer"
                        />
                        <div className={smallSwitchTrackClass} />
                        <div className="absolute left-1 top-1 w-4 h-4 bg-neutral-400 rounded-full transition-all peer-checked:translate-x-4 peer-checked:bg-white shadow-sm" />
                      </div>
                      <span className={switchLabelClass}>
                        URL Format
                      </span>
                    </label>
                  </div>

                  {/* Unique Toggle */}
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          name="unique"
                          className="sr-only peer"
                        />
                        <div className="w-10 h-6 rounded-full border border-slate-300 bg-slate-200 transition-all peer-checked:border-purple-500 peer-checked:bg-purple-600 dark:border-neutral-700 dark:bg-neutral-800" />
                        <div className="absolute left-1 top-1 w-4 h-4 bg-neutral-400 rounded-full transition-all peer-checked:translate-x-4 peer-checked:bg-white shadow-sm" />
                      </div>
                      <div className="flex flex-col">
                        <span className={switchLabelClass}>
                          Unique Value
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-neutral-500">
                          Enforces ID uniqueness via index
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* Enum Values */}
                  <div className="space-y-2 md:col-span-3">
                    <label className={compactLabelClass}>
                      Allowed Values (comma-separated)
                    </label>
                    <input
                      type="text"
                      name="validation_enum"
                      value={enumValues}
                      onChange={(e) => setEnumValues(e.target.value)}
                      placeholder="e.g. active, pending, completed"
                      className={smallInputClass}
                    />
                    {enumValues && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {enumValues.split(",").map((val, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-md border border-primary/20"
                          >
                            {val.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {selectedType === "integer" && (
                <>
                  {/* Min Value */}
                  <div className="space-y-2">
                    <label className={compactLabelClass}>
                      Min Value
                    </label>
                    <input
                      type="number"
                      name="validation_min"
                      placeholder="e.g. 0"
                      className={smallInputClass}
                    />
                  </div>

                  {/* Max Value */}
                  <div className="space-y-2">
                    <label className={compactLabelClass}>
                      Max Value
                    </label>
                    <input
                      type="number"
                      name="validation_max"
                      placeholder="e.g. 100"
                      className={smallInputClass}
                    />
                  </div>
                </>
              )}

              {/* Custom Error Message */}
              <div className="space-y-2 md:col-span-3">
                <label className={compactLabelClass}>
                  Custom Error Message (optional)
                </label>
                <input
                  type="text"
                  name="validation_message"
                  placeholder="e.g. Please enter a valid email address"
                  className={smallInputClass}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
