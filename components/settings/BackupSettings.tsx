"use client";

import { useState } from "react";
import { backupDatabase } from "../../app/actions/backup";
import { toast } from "sonner";
import { DatabaseBackup, Loader2, CheckCircle } from "lucide-react";

export default function BackupSettings() {
  const [loading, setLoading] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  const handleBackup = async () => {
    if (
      !confirm(
        "This will create a zip backup of your entire database. Continue?"
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const result = await backupDatabase();

      if (result.success) {
        toast.success(result.message || "Backup created successfully!");
        setLastBackup(new Date().toLocaleString());
      } else {
        throw new Error(result.error || "Failed to create backup");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create backup"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <DatabaseBackup className="w-5 h-5 text-blue-400" />
        </div>
        <h2 className="text-xl font-semibold">Backup Database</h2>
      </div>

      <p className="text-neutral-400 text-sm mb-6">
        Create a zip backup of your entire database and save it to Google Drive.
        This includes all your databases, tables, and data.
      </p>

      <div className="space-y-4">
        {lastBackup && (
          <div className="flex items-center gap-2 text-sm text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span>Last backup: {lastBackup}</span>
          </div>
        )}

        <button
          onClick={handleBackup}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg transition-colors text-sm font-medium"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating Backup...
            </>
          ) : (
            <>
              <DatabaseBackup className="w-4 h-4" />
              Create Backup
            </>
          )}
        </button>
      </div>
    </div>
  );
}
