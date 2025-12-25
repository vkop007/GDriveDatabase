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
} from "lucide-react";
import { FunctionInfo } from "@/app/actions/function";
import CreateFunctionModal from "./CreateFunctionModal";
import RunFunctionModal from "./RunFunctionModal";
import EditFunctionModal from "./EditFunctionModal";
import DeleteFunctionModal from "./DeleteFunctionModal";

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
          {functions.map((func) => (
            <div
              key={func.id}
              className="group relative p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800/50 hover:border-primary/30 transition-all duration-300"
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

              {/* Function Info */}
              <div className="mb-4 text-sm text-neutral-500">
                Created:{" "}
                {new Date(func.createdAt).toLocaleDateString("en-IN", {
                  timeZone: "Asia/Kolkata",
                })}
                {func.lastRunAt && (
                  <>
                    <br />
                    Last run:{" "}
                    {new Date(func.lastRunAt).toLocaleString("en-IN", {
                      timeZone: "Asia/Kolkata",
                    })}
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
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
          ))}
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
