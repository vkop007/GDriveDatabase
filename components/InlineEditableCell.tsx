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
  onNavigate?: (direction: "next" | "prev") => void;
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
  onNavigate,
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

  const formatValue = (val: any, type: string): string => {
    if (val == null || val === "") return "";
    
    switch (type) {
      case "number":
        return String(Number(val));
      case "date":
        if (val instanceof Date) return val.toISOString().split("T")[0];
        return String(val).split("T")[0];
      case "datetime":
        if (val instanceof Date) return val.toISOString();
        return String(val);
      case "boolean":
        return String(val).toLowerCase() === "true" ? "true" : "false";
      default:
        return String(val);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let convertedValue: any = editValue;

      // Type conversion and validation
      if (columnType === "number") {
        if (editValue === "") {
          convertedValue = null;
        } else {
          const num = Number(editValue);
          if (isNaN(num)) {
            toast.error("Invalid number");
            setIsSaving(false);
            return;
          }
          convertedValue = num;
        }
      } else if (columnType === "boolean") {
        convertedValue = editValue.toLowerCase() === "true";
      } else if (columnType === "email") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (editValue && !emailRegex.test(editValue)) {
          toast.error("Invalid email");
          setIsSaving(false);
          return;
        }
      } else if (columnType === "date") {
        // Validate date format
        if (editValue && isNaN(Date.parse(editValue))) {
          toast.error("Invalid date");
          setIsSaving(false);
          return;
        }
      }

      const success = await onSave(convertedValue);
      if (success) {
        toast.success("Saved ✓");
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
    // Save on Enter
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    // Cancel on Escape
    else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
    // Tab navigation
    else if (e.key === "Tab") {
      e.preventDefault();
      handleSave();
      onNavigate?.(e.shiftKey ? "prev" : "next");
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

  const getPlaceholder = () => {
    switch (columnType) {
      case "email":
        return "user@example.com";
      case "number":
        return "Enter number";
      case "date":
        return "YYYY-MM-DD";
      case "datetime":
        return "YYYY-MM-DD HH:MM";
      case "boolean":
        return "true or false";
      default:
        return `Enter ${columnType}...`;
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 w-full animate-in fade-in zoom-in-95 duration-200">
        <div className="flex-1 relative">
          {columnType === "boolean" && (
            <select
              ref={inputRef as any}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleCancel}
              className="w-full px-3 py-1 rounded bg-neutral-800 border border-primary/50 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 appearance-none cursor-pointer transition-all duration-200"
              disabled={isSaving}
            >
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          )}
          {columnType !== "boolean" && (
            <input
              ref={inputRef}
              type={getInputType()}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleCancel}
              placeholder={getPlaceholder()}
              className="w-full px-3 py-1 rounded bg-neutral-800 border border-primary/50 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 placeholder-neutral-500 transition-all duration-200"
              disabled={isSaving}
              step={columnType === "number" ? "any" : undefined}
              min={columnType === "number" ? undefined : undefined}
            />
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0 animate-in fade-in slide-in-from-left-2 duration-300">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="p-1 rounded hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 disabled:opacity-50 transition-all duration-200 hover:scale-110 active:scale-95"
            title="Save (Enter)"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="p-1 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300 disabled:opacity-50 transition-all duration-200 hover:scale-110 active:scale-95"
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
      className={`cursor-pointer hover:text-primary transition-all duration-200 text-white rounded pl-2 pr-6 py-1 relative group/text hover:bg-neutral-700/20 flex items-center active:scale-95 ${maxWidth}`}
      title={displayValue}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEditStart?.();
        }
      }}
    >
      <span className={`truncate block ${maxWidth}`}>
        {displayValue ? (
          highlightText?.(displayValue) ?? displayValue
        ) : (
          <span className="text-neutral-600">—</span>
        )}
      </span>
      <Edit2
        className="absolute right-1.5 w-3 h-3 text-neutral-500 opacity-0 group-hover/text:opacity-100 transition-all duration-200 shrink-0 group-hover/text:scale-110"
        strokeWidth={2.5}
      />
    </div>
  );
}
