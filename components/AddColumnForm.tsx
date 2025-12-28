"use client";

import { useState } from "react";
import { updateTableSchema } from "../app/actions/table";
import { Plus, Key, Type, Shield, ChevronDown, ChevronUp } from "lucide-react";
import GradientButton from "./GradientButton";

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
  const [selectedType, setSelectedType] = useState<string>("string");
  const [showValidation, setShowValidation] = useState(false);
  const [enumValues, setEnumValues] = useState<string>("");

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

  return (
    <form
      action={updateTableSchema}
      className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/50 space-y-4"
    >
      <input type="hidden" name="fileId" value={fileId} />
      <input type="hidden" name="databaseId" value={databaseId} />

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
        <div className="md:col-span-2 space-y-2">
          <label className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
            <Key className="w-3 h-3" />
            Key
          </label>
          <input
            type="text"
            name="key"
            placeholder="e.g. email"
            className="w-full bg-neutral-950/50 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            required
          />
        </div>

        <div className="md:col-span-1 space-y-2">
          <label className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
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
            className="w-full bg-neutral-950/50 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
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
            <label className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
              <Type className="w-3 h-3" />
              Relation
            </label>
            <select
              name="relationTableId"
              className="w-full bg-neutral-950/50 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
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
                  <div className="w-12 h-7 bg-neutral-800 rounded-full peer-checked:bg-linear-to-r peer-checked:from-primary-from peer-checked:to-primary-to transition-all border border-neutral-700 peer-checked:border-primary/50 shadow-inner" />
                  <div className="absolute left-1 top-1 w-5 h-5 bg-neutral-400 rounded-full transition-all peer-checked:translate-x-5 peer-checked:bg-white shadow-sm" />
                </div>
                <span className="text-sm text-neutral-400 group-hover:text-white transition-colors">
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
                <div className="w-12 h-7 bg-neutral-800 rounded-full peer-checked:bg-linear-to-r peer-checked:from-primary-from peer-checked:to-primary-to transition-all border border-neutral-700 peer-checked:border-primary/50 shadow-inner" />
                <div className="absolute left-1 top-1 w-5 h-5 bg-neutral-400 rounded-full transition-all peer-checked:translate-x-5 peer-checked:bg-white shadow-sm" />
              </div>
              <span className="text-sm text-neutral-400 group-hover:text-white transition-colors">
                Required
              </span>
            </label>
          </div>
        </div>

        <div className="flex flex-col justify-end md:col-span-1">
          <div className="h-5 mb-2" />
          <div className="h-[42px] flex items-center">
            <GradientButton type="submit" icon={<Plus className="w-4 h-4" />}>
              Add Column
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
            className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
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
            <div className="mt-4 p-4 bg-neutral-950/50 rounded-xl border border-neutral-800 grid grid-cols-1 md:grid-cols-3 gap-4">
              {selectedType === "string" && (
                <>
                  {/* Min Length */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-neutral-400">
                      Min Length
                    </label>
                    <input
                      type="number"
                      name="validation_minLength"
                      min="0"
                      placeholder="e.g. 3"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  {/* Max Length */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-neutral-400">
                      Max Length
                    </label>
                    <input
                      type="number"
                      name="validation_maxLength"
                      min="1"
                      placeholder="e.g. 100"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  {/* Pattern (Regex) */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-neutral-400">
                      Pattern (Regex)
                    </label>
                    <input
                      type="text"
                      name="validation_pattern"
                      placeholder="e.g. ^[a-z]+$"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-primary/50 font-mono"
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
                        <div className="w-10 h-6 bg-neutral-800 rounded-full peer-checked:bg-emerald-600 transition-all border border-neutral-700 peer-checked:border-emerald-500" />
                        <div className="absolute left-1 top-1 w-4 h-4 bg-neutral-400 rounded-full transition-all peer-checked:translate-x-4 peer-checked:bg-white shadow-sm" />
                      </div>
                      <span className="text-sm text-neutral-400 group-hover:text-white transition-colors">
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
                        <div className="w-10 h-6 bg-neutral-800 rounded-full peer-checked:bg-emerald-600 transition-all border border-neutral-700 peer-checked:border-emerald-500" />
                        <div className="absolute left-1 top-1 w-4 h-4 bg-neutral-400 rounded-full transition-all peer-checked:translate-x-4 peer-checked:bg-white shadow-sm" />
                      </div>
                      <span className="text-sm text-neutral-400 group-hover:text-white transition-colors">
                        URL Format
                      </span>
                    </label>
                  </div>

                  {/* Enum Values */}
                  <div className="space-y-2 md:col-span-3">
                    <label className="text-xs font-medium text-neutral-400">
                      Allowed Values (comma-separated)
                    </label>
                    <input
                      type="text"
                      name="validation_enum"
                      value={enumValues}
                      onChange={(e) => setEnumValues(e.target.value)}
                      placeholder="e.g. active, pending, completed"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-primary/50"
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
                    <label className="text-xs font-medium text-neutral-400">
                      Min Value
                    </label>
                    <input
                      type="number"
                      name="validation_min"
                      placeholder="e.g. 0"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  {/* Max Value */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-neutral-400">
                      Max Value
                    </label>
                    <input
                      type="number"
                      name="validation_max"
                      placeholder="e.g. 100"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </>
              )}

              {/* Custom Error Message */}
              <div className="space-y-2 md:col-span-3">
                <label className="text-xs font-medium text-neutral-400">
                  Custom Error Message (optional)
                </label>
                <input
                  type="text"
                  name="validation_message"
                  placeholder="e.g. Please enter a valid email address"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
