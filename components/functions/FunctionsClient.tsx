"use client";

import { useState } from "react";
import {
  Plus,
  Play,
  Trash2,
  Edit,
  CheckCircle,
  AlertCircle,
  Clock,
  FunctionSquare,
  Zap,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { FunctionInfo, enableAutoRun } from "@/app/actions/function";
import CreateFunctionModal from "./CreateFunctionModal";
import RunFunctionModal from "./RunFunctionModal";
import EditFunctionModal from "./EditFunctionModal";
import DeleteFunctionModal from "./DeleteFunctionModal";
import { toast } from "sonner";

interface FunctionsClientProps {
  initialFunctions: FunctionInfo[];
}

export default function FunctionsClient({
  initialFunctions,
}: FunctionsClientProps) {
  const [functions, setFunctions] = useState<FunctionInfo[]>(initialFunctions);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [runningFunction, setRunningFunction] = useState<FunctionInfo | null>(
    null
  );
  const [editingFunction, setEditingFunction] = useState<FunctionInfo | null>(
    null
  );
  const [deletingFunction, setDeletingFunction] = useState<FunctionInfo | null>(
    null
  );

  const handleFunctionCreated = (newFunction: FunctionInfo) => {
    setFunctions((prev) => [...prev, newFunction]);
    setIsCreateOpen(false);
  };

  const handleFunctionUpdated = (updatedFunction: FunctionInfo) => {
    setFunctions((prev) =>
      prev.map((f) => (f.id === updatedFunction.id ? updatedFunction : f))
    );
    setEditingFunction(null);
  };

  const handleFunctionDeleted = (id: string) => {
    setFunctions((prev) => prev.filter((f) => f.id !== id));
    setDeletingFunction(null);
  };

  const handleFunctionRan = (id: string, result: string) => {
    setFunctions((prev) =>
      prev.map((f) =>
        f.id === id
          ? { ...f, lastRunAt: new Date().toISOString(), lastRunResult: result }
          : f
      )
    );
  };

  const [enablingAutoRun, setEnablingAutoRun] = useState<string | null>(null);

  const handleEnableAutoRun = async (func: FunctionInfo) => {
    setEnablingAutoRun(func.id);
    try {
      const result = await enableAutoRun(func.id);
      if (result.success) {
        toast.success(`Auto-run enabled for ${func.name}!`);
        // Update the local state to reflect the change
        setFunctions((prev) =>
          prev.map((f) =>
            f.id === func.id ? { ...f, triggerEnabled: true } : f
          )
        );
      } else if (result.needsAuth && result.authUrl) {
        // Open auth popup and monitor when it closes
        const authPopup = window.open(
          result.authUrl,
          "auth_popup",
          "width=600,height=700,scrollbars=yes"
        );

        toast.info("Authorization needed", {
          description:
            "Please authorize in the popup, then we'll activate automatically.",
        });

        // Poll to check when the popup closes
        const checkPopup = setInterval(async () => {
          if (authPopup?.closed) {
            clearInterval(checkPopup);
            // Retry enabling after auth popup closes
            toast.loading("Activating...", { id: "activating" });
            try {
              const retryResult = await enableAutoRun(func.id);
              if (retryResult.success) {
                toast.success(`Auto-run enabled for ${func.name}!`, {
                  id: "activating",
                });
                setFunctions((prev) =>
                  prev.map((f) =>
                    f.id === func.id ? { ...f, triggerEnabled: true } : f
                  )
                );
              } else {
                toast.error(retryResult.error || "Failed to enable auto-run", {
                  id: "activating",
                });
              }
            } catch {
              toast.error("Failed to enable auto-run", { id: "activating" });
            } finally {
              setEnablingAutoRun(null);
            }
          }
        }, 500);

        return; // Don't clear enablingAutoRun yet, the polling will handle it
      } else {
        toast.error(result.error || "Failed to enable auto-run");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      if (!enablingAutoRun) return; // Already handled by popup polling
      setEnablingAutoRun(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "deployed":
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "deployed":
        return "Deployed";
      case "error":
        return "Error";
      default:
        return "Draft";
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-linear-to-br from-primary-from/20 to-primary-to/20 border border-primary/30">
              <FunctionSquare className="w-6 h-6 text-primary" />
            </div>
            Functions
          </h1>
          <p className="text-neutral-400 mt-2">
            Create and run Google Apps Script functions
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-primary-from to-primary-to text-white font-medium rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30"
        >
          <Plus className="w-4 h-4" />
          Create Function
        </button>
      </div>

      {/* Functions Grid */}
      {functions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800/50 mb-4">
            <FunctionSquare className="w-12 h-12 text-neutral-600" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            No functions yet
          </h3>
          <p className="text-neutral-400 text-center max-w-sm mb-6">
            Create your first function to run custom code on Google's servers
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-primary-from to-primary-to text-white font-medium rounded-xl hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Function
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {functions.map((func) => {
            const hasActiveAutoRun =
              func.schedule && func.schedule !== "none" && func.triggerEnabled;
            return (
              <div
                key={func.id}
                className="group relative p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800/50 hover:border-primary/30 transition-all duration-300 flex flex-col"
              >
                {/* Status Badge */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-800/80 border border-neutral-700/50">
                  {getStatusIcon(func.status)}
                  <span className="text-xs font-medium text-neutral-300">
                    {getStatusLabel(func.status)}
                  </span>
                </div>

                {/* Function Name */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-linear-to-br from-primary-from/10 to-primary-to/10 border border-primary/20">
                    <FunctionSquare className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-white truncate pr-16">
                    {func.name}
                  </h3>
                </div>

                {/* Function Info - flex-1 to push actions to bottom */}
                <div className="flex-1 mb-4 space-y-2 text-sm text-neutral-500">
                  <div>
                    Created:{" "}
                    {new Date(func.createdAt).toLocaleDateString("en-IN", {
                      timeZone: "Asia/Kolkata",
                    })}
                  </div>
                  {func.lastRunAt && (
                    <div>
                      Last run:{" "}
                      {new Date(func.lastRunAt).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                      })}
                    </div>
                  )}
                  {/* Schedule Info */}
                  {func.schedule && func.schedule !== "none" && (
                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex items-center gap-1.5 text-primary">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="font-medium text-xs">
                          {func.schedule === "minutely" && "Every minute"}
                          {func.schedule === "hourly" && "Every hour"}
                          {func.schedule === "daily" && "Daily 9 AM"}
                          {func.schedule === "weekly" && "Weekly Mon 9 AM"}
                        </span>
                      </div>
                      <div className="flex-1" />
                      {func.triggerEnabled ? (
                        <span className="flex items-center gap-1.5 px-2 py-1 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-md">
                          <RefreshCw
                            className="w-3 h-3 animate-spin"
                            style={{ animationDuration: "3s" }}
                          />
                          Activated
                        </span>
                      ) : (
                        <button
                          onClick={() => handleEnableAutoRun(func)}
                          disabled={
                            enablingAutoRun === func.id ||
                            func.status !== "deployed"
                          }
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 border border-primary/30 text-primary rounded-md hover:bg-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Activate triggers on Google's servers"
                        >
                          {enablingAutoRun === func.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Zap className="w-3 h-3" />
                          )}
                          Activate
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions - always at bottom */}
                <div className="flex items-center gap-2 mt-auto">
                  <button
                    onClick={() => setRunningFunction(func)}
                    disabled={func.status !== "deployed"}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-linear-to-r from-emerald-500/10 to-emerald-600/10 border border-emerald-500/30 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="w-4 h-4" />
                    Run
                  </button>
                  <button
                    onClick={() => setEditingFunction(func)}
                    className="p-2 rounded-lg bg-neutral-800/50 border border-neutral-700/50 text-neutral-400 hover:text-white hover:border-neutral-600 transition-all"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingFunction(func)}
                    className="p-2 rounded-lg bg-neutral-800/50 border border-neutral-700/50 text-neutral-400 hover:text-red-400 hover:border-red-500/50 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <CreateFunctionModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleFunctionCreated}
      />

      {runningFunction && (
        <RunFunctionModal
          isOpen={!!runningFunction}
          onClose={() => setRunningFunction(null)}
          func={runningFunction}
          onRan={handleFunctionRan}
        />
      )}

      {editingFunction && (
        <EditFunctionModal
          isOpen={!!editingFunction}
          onClose={() => setEditingFunction(null)}
          func={editingFunction}
          onUpdated={handleFunctionUpdated}
        />
      )}

      {deletingFunction && (
        <DeleteFunctionModal
          isOpen={!!deletingFunction}
          onClose={() => setDeletingFunction(null)}
          func={deletingFunction}
          onDeleted={handleFunctionDeleted}
        />
      )}
    </div>
  );
}
