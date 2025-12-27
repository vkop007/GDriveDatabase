import { useState, useEffect } from "react";
import {
  X,
  RefreshCw,
  Terminal,
  Clock,
  AlertCircle,
  Info,
  CheckCircle,
  Download,
} from "lucide-react";
import Modal from "../Modal";
import { getFunctionLogs } from "@/app/actions/function";
import { toast } from "sonner";

interface LogViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  functionId: string;
  functionName: string;
}

interface LogEntry {
  level: "INFO" | "ERROR" | "WARN";
  timestamp: string;
  message: string;
}

interface LogSession {
  functionId: string;
  startTime: string;
  endTime: string;
  logs: LogEntry[];
  status: "SUCCESS" | "ERROR";
  error?: string;
  result?: any;
}

export default function LogViewerModal({
  isOpen,
  onClose,
  functionId,
  functionName,
}: LogViewerModalProps) {
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<LogSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<LogSession | null>(
    null
  );

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const result = await getFunctionLogs(functionId);
      if (result.success && result.logs) {
        setSessions(result.logs);
        if (result.logs.length > 0 && !selectedSession) {
          setSelectedSession(result.logs[0]);
        }
      } else {
        toast.error(result.error || "Failed to fetch logs");
      }
    } catch (error) {
      toast.error("An error occurred while fetching logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    } else {
      setSessions([]);
      setSelectedSession(null);
    }
  }, [isOpen, functionId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Logs: ${functionName}`}
      maxWidth="max-w-5xl"
    >
      <div className="flex flex-col h-[70vh] md:h-[600px] w-full">
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Session List */}
          <div className="w-1/3 min-w-[200px] border-r border-neutral-800 flex flex-col bg-neutral-900/30">
            <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-400">
                Executions
              </span>
              <button
                onClick={fetchLogs}
                disabled={loading}
                className="p-1.5 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-400 hover:text-white"
                title="Refresh logs"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {sessions.length === 0 && !loading ? (
                <div className="text-center py-8 text-neutral-500 text-sm">
                  No execution logs found
                </div>
              ) : (
                sessions.map((session, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedSession(session)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selectedSession === session
                        ? "bg-primary/10 border-primary/30 active-session"
                        : "bg-neutral-800/20 border-transparent hover:bg-neutral-800/40"
                    }`}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {session.status === "ERROR" ? (
                            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                          <span
                            className={`text-xs font-bold ${
                              session.status === "ERROR"
                                ? "text-red-400"
                                : "text-emerald-400"
                            }`}
                          >
                            {session.status}
                          </span>
                        </div>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {new Date(session.startTime).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-400 truncate pl-5.5">
                        {formatDate(session.startTime)}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Main Content - Log Details */}
          <div className="flex-1 flex flex-col bg-neutral-950">
            {selectedSession ? (
              <>
                <div className="p-4 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        selectedSession.status === "ERROR"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-emerald-500/10 text-emerald-400"
                      }`}
                    >
                      <Terminal className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white">
                        Execution Details
                      </h3>
                      <p className="text-xs text-neutral-400">
                        {formatDate(selectedSession.startTime)}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-neutral-500 flex flex-col items-end">
                    <span>
                      Duration:{" "}
                      {(
                        (new Date(selectedSession.endTime).getTime() -
                          new Date(selectedSession.startTime).getTime()) /
                        1000
                      ).toFixed(2)}
                      s
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 font-mono text-xs md:text-sm space-y-1 bg-black/50">
                  {selectedSession.logs.map((log, idx) => (
                    <div
                      key={idx}
                      className="flex gap-3 hover:bg-white/5 p-0.5 rounded px-2"
                    >
                      <span className="text-neutral-500 shrink-0 w-24">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span
                        className={`shrink-0 w-12 font-bold ${
                          log.level === "ERROR"
                            ? "text-red-400"
                            : log.level === "WARN"
                            ? "text-yellow-400"
                            : "text-blue-400"
                        }`}
                      >
                        {log.level}
                      </span>
                      <span
                        className={`break-all whitespace-pre-wrap ${
                          log.level === "ERROR"
                            ? "text-red-300"
                            : log.level === "WARN"
                            ? "text-yellow-200"
                            : "text-neutral-300"
                        }`}
                      >
                        {log.message}
                      </span>
                    </div>
                  ))}

                  {selectedSession.logs.length === 0 && (
                    <div className="flex items-center gap-2 text-neutral-500 italic p-2 bg-neutral-900/30 rounded-lg border border-neutral-800/50">
                      <Info className="w-4 h-4" />
                      <span>
                        No standard output (console.log) was captured during
                        this execution.
                      </span>
                    </div>
                  )}

                  {selectedSession.error && (
                    <div className="mt-4 p-3 rounded-lg bg-red-950/30 border border-red-900/50 text-red-300 break-all whitespace-pre-wrap">
                      <div className="font-bold mb-1 flex items-center gap-2">
                        <AlertCircle className="w-3 h-3" /> Uncaught Error:
                      </div>
                      {selectedSession.error}
                    </div>
                  )}

                  {selectedSession.result !== undefined && (
                    <div className="mt-4 border-t border-neutral-800 pt-4">
                      <div className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-2">
                        <CheckCircle className="w-3 h-3" /> Return Value:
                      </div>
                      <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 font-mono overflow-x-auto">
                        <pre>
                          {typeof selectedSession.result === "object"
                            ? JSON.stringify(selectedSession.result, null, 2)
                            : String(selectedSession.result)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-neutral-500">
                <Terminal className="w-12 h-12 mb-3 opacity-20" />
                <p>Select an execution to view logs</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
