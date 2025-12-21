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
          className="flex-1 bg-neutral-950/50 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="bg-gradient-to-r from-primary/20 to-primary/10 hover:from-primary hover:to-primary/80 text-primary hover:text-white p-2.5 rounded-xl transition-all border border-primary/20 hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="group flex items-center gap-1.5 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full text-sm text-primary"
            >
              <span>{value}</span>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="text-primary/60 hover:text-red-400 transition-colors"
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
