"use client";

import { useState } from "react";
import { X, Loader2, FunctionSquare, Clock } from "lucide-react";
import {
  createFunction,
  FunctionInfo,
  ScheduleType,
} from "@/app/actions/function";

interface CreateFunctionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (func: FunctionInfo) => void;
}

const TEMPLATE_CODE = `// Your function code here
// Access parameters with 'params' object

console.log("Function execution started");
console.log("Params received:", JSON.stringify(params));

// Return a value to see it in the output
return { 
  message: "Hello from my function!", 
  timestamp: new Date().toISOString() 
};`;

export default function CreateFunctionModal({
  isOpen,
  onClose,
  onCreated,
}: CreateFunctionModalProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState(TEMPLATE_CODE);
  const [schedule, setSchedule] = useState<ScheduleType>("none");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Function name is required");
      return;
    }

    if (!code.trim()) {
      setError("Function code is required");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const result = await createFunction(name.trim(), code, schedule);
      if (result.success && result.function) {
        onCreated(result.function);
        setName("");
        setCode(TEMPLATE_CODE);
        setSchedule("none");
      } else {
        setError(result.error || "Failed to create function");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-3 py-6 sm:items-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-900/20 dark:bg-neutral-900/95 dark:border-neutral-800/50 dark:shadow-black/40">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 p-4 border-b border-slate-200 sm:p-5 dark:border-neutral-800/50">
          <div className="flex min-w-0 items-center gap-3">
            <div className="shrink-0 p-2 rounded-lg bg-linear-to-br from-primary-from/20 to-primary-to/20 border border-primary/30">
              <FunctionSquare className="w-5 h-5 text-primary" />
            </div>
            <h2 className="truncate text-lg font-semibold text-slate-950 dark:text-white">
              Create New Function
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-950 transition-colors dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 sm:p-5">
          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2 dark:text-neutral-300">
              Function Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="MyFunction"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-950 placeholder:text-slate-400 focus:outline-none focus:border-primary/50 transition-colors dark:bg-neutral-950/50 dark:border-neutral-800/50 dark:text-white dark:placeholder:text-neutral-500"
            />
          </div>

          {/* Code Editor */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2 dark:text-neutral-300">
              Function Code
            </label>
            <div className="relative">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={12}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-950 font-mono text-sm focus:outline-none focus:border-primary/50 transition-colors resize-none dark:bg-neutral-950/50 dark:border-neutral-800/50 dark:text-white"
                placeholder="// Your code here"
              />
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-neutral-500">
              Your code will be wrapped in a function. Access parameters with
              &apos;params&apos; object.
            </p>
          </div>

          {/* Schedule Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2 dark:text-neutral-300">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Auto-Run Schedule
              </span>
            </label>
            <select
              value={schedule}
              onChange={(e) => setSchedule(e.target.value as ScheduleType)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-950 focus:outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer dark:bg-neutral-950/50 dark:border-neutral-800/50 dark:text-white"
            >
              <option value="none">No auto-run (manual only)</option>
              <option value="minutely">Every minute</option>
              <option value="hourly">Every hour</option>
              <option value="daily">Daily at 9 AM</option>
              <option value="weekly">Weekly (Monday 9 AM)</option>
            </select>
            <p className="mt-2 text-xs text-slate-500 dark:text-neutral-500">
              {schedule === "none"
                ? "Function will only run when you click Run."
                : "Function will automatically run on Google's servers at the scheduled time."}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-2 p-4 border-t border-slate-200 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:p-5 dark:border-neutral-800/50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 text-slate-600 hover:text-slate-950 transition-colors sm:w-auto dark:text-neutral-400 dark:hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="flex w-full items-center justify-center gap-2 px-5 py-2.5 bg-linear-to-r from-primary-from to-primary-to text-white font-medium rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create & Deploy"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
