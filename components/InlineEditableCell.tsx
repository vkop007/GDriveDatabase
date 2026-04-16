"use client";

import { useState, useRef, useEffect } from "react";
import { Check, X, Edit2 } from "lucide-react";
import { toast } from "sonner";

interface InlineEditableCellProps {
  value: any;
  displayValue: string;
  columnType?: "text" | "number" | "email" | "date" | "datetime" | "boolean";
  onSave: (newValue: any) => Promise<boolean>;
  onCancel?: () => void;
  isEditing?: boolean;
  onEditStart?: () => void;
  disabled?: boolean;
  maxWidth?: string;
  highlightText?: (text: string) => React.ReactNode;
}

export default function InlineEditableCell({
  value,
  displayValue,
  columnType = "text",
  onSave,
  onCancel,
  isEditing = false,
  onEditStart,
  disabled = false,
  maxWidth = "max-w-[160px]",
  highlightText,
}: InlineEditableCellProps) {
  const [editValue, setEditValue] = useState(String(value ?? ""));
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let convertedValue: any = editValue;

      // Type conversion based on column type
      if (columnType === "number") {
        convertedValue = editValue === "" ? null : Number(editValue);
      } else if (columnType === "boolean") {
        convertedValue = editValue.toLowerCase() === "true";
      }

      const success = await onSave(convertedValue);
      if (success) {
        toast.success("Saved");
      }
    } catch (error) {
      toast.error("Failed to save");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(String(value ?? ""));
    onCancel?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  const getInputType = () => {
    switch (columnType) {
      case "number":
        return "number";
      case "email":
        return "email";
      case "date":
        return "date";
      case "datetime":
        return "datetime-local";
      default:
        return "text";
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 w-full">
        <input
          ref={inputRef}
          type={getInputType()}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleCancel}
          className="flex-1 px-3 py-1 rounded bg-neutral-800 border border-primary/50 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 min-w-0"
          disabled={isSaving}
          step={columnType === "number" ? "any" : undefined}
        />
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="p-1 rounded hover:bg-neutral-700/50 text-emerald-400 hover:text-emerald-300 disabled:opacity-50 transition-colors"
            title="Save (Enter)"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="p-1 rounded hover:bg-neutral-700/50 text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
            title="Cancel (Escape)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onEditStart}
      className={`cursor-pointer hover:text-primary transition-colors text-white rounded pl-2 pr-6 py-1 relative group/text hover:bg-neutral-700/20 flex items-center ${maxWidth}`}
      title={displayValue}
    >
      <span className={`truncate block ${maxWidth}`}>
        {displayValue ? (
          highlightText?.(displayValue) ?? displayValue
        ) : (
          <span className="text-neutral-600">—</span>
        )}
      </span>
      <Edit2
        className="absolute right-1.5 w-3 h-3 text-neutral-500 opacity-0 group-hover/text:opacity-100 transition-opacity shrink-0"
        strokeWidth={2.5}
      />
    </div>
  );
}
