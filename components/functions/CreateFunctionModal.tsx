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
// Return a value to see it in the output

return { message: "Hello from my function!", timestamp: new Date().toISOString() };`;

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
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-neutral-900/95 border border-neutral-800/50 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-linear-to-br from-primary-from/20 to-primary-to/20 border border-primary/30">
              <FunctionSquare className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-white">
              Create New Function
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Function Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="MyFunction"
              className="w-full px-4 py-3 bg-neutral-950/50 border border-neutral-800/50 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Code Editor */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Function Code
            </label>
            <div className="relative">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={12}
                className="w-full px-4 py-3 bg-neutral-950/50 border border-neutral-800/50 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-primary/50 transition-colors resize-none"
                placeholder="// Your code here"
              />
            </div>
            <p className="mt-2 text-xs text-neutral-500">
              Your code will be wrapped in a function. Access parameters with
              &apos;params&apos; object.
            </p>
          </div>

          {/* Schedule Selector */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Auto-Run Schedule
              </span>
            </label>
            <select
              value={schedule}
              onChange={(e) => setSchedule(e.target.value as ScheduleType)}
              className="w-full px-4 py-3 bg-neutral-950/50 border border-neutral-800/50 rounded-xl text-white focus:outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
            >
              <option value="none">No auto-run (manual only)</option>
              <option value="minutely">Every minute</option>
              <option value="hourly">Every hour</option>
              <option value="daily">Daily at 9 AM</option>
              <option value="weekly">Weekly (Monday 9 AM)</option>
            </select>
            <p className="mt-2 text-xs text-neutral-500">
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
        <div className="flex items-center justify-end gap-3 p-5 border-t border-neutral-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-neutral-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-primary-from to-primary-to text-white font-medium rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
