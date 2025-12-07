"use client";

import { useState, KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";

interface ArrayInputProps {
  name: string;
  placeholder?: string;
  required?: boolean;
  initialValues?: string[];
  type?: "string" | "integer";
}

export default function ArrayInput({
  name,
  placeholder = "Add value...",
  required = false,
  initialValues = [],
  type = "string",
}: ArrayInputProps) {
  const [values, setValues] = useState<string[]>(initialValues);
  const [currentValue, setCurrentValue] = useState("");

  const handleAdd = () => {
    if (!currentValue.trim()) return;
    setValues([...values, currentValue.trim()]);
    setCurrentValue("");
  };

  const handleRemove = (index: number) => {
    setValues(values.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type={type === "integer" ? "number" : "text"}
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="bg-neutral-800 hover:bg-neutral-700 text-white p-2.5 rounded-lg transition-colors"
          disabled={!currentValue.trim()}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((value, index) => (
            <div
              key={index}
              className="flex items-center gap-1.5 bg-neutral-800/50 border border-neutral-700 px-3 py-1 rounded-full text-sm text-neutral-200"
            >
              <span>{value}</span>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="text-neutral-500 hover:text-red-400 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Hidden input to pass data to parent form */}
      <input
        type="hidden"
        name={name}
        value={JSON.stringify(values.length > 0 ? values : [])}
      />
      {required && values.length === 0 && (
        <input
          type="text"
          required
          className="absolute opacity-0 w-1 h-1"
          onInvalid={(e) =>
            (e.target as HTMLInputElement).setCustomValidity(
              "Please add at least one value"
            )
          }
          onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
        />
      )}
    </div>
  );
}
