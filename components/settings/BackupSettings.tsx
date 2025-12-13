"use client";

import { useState, useEffect } from "react";
import {
  setupAutoBackup,
  markBackupScriptAuthorized,
  getBackupStatus,
  runDailyBackup,
} from "../../app/actions/backup";
import { toast } from "sonner";
import {
  DatabaseBackup,
  Loader2,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  Calendar,
} from "lucide-react";

export default function BackupSettings() {
  const [loading, setLoading] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [awaitingAuth, setAwaitingAuth] = useState(false);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Load backup status on mount and run daily backup if needed
  useEffect(() => {
    const loadStatusAndCheckBackup = async () => {
      try {
        setCheckingStatus(true);
        const status = await getBackupStatus();

        if (status.lastBackupTime) {
          setLastBackup(new Date(status.lastBackupTime).toLocaleString());
        }

        if (status.autoBackupEnabled) {
          setAutoBackupEnabled(true);

          // Check if we need to run today's backup
          if (status.needsBackupToday) {
            console.log("Running daily backup...");
            toast.info("Running daily backup...");
            const result = await runDailyBackup();
            if (result.success) {
              toast.success(result.message || "Daily backup completed!");
              setLastBackup(new Date().toLocaleString());
            } else {
              toast.error(result.error || "Daily backup failed");
            }
          }
        }

        if (status.hasScript && !status.authorized) {
          setAwaitingAuth(true);
        }
      } catch (error) {
        console.error("Failed to load backup status:", error);
      } finally {
        setCheckingStatus(false);
      }
    };
    loadStatusAndCheckBackup();
  }, []);

  const handleSetupAutoBackup = async () => {
    if (
      !confirm(
        "This will enable automatic daily backups. Your database will be backed up once per day when you visit the site. Continue?"
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setAuthUrl(null);
      const result = await setupAutoBackup();

      if (result.success) {
        toast.success(result.message || "Auto-backup enabled!");
        setLastBackup(new Date().toLocaleString());
        setAutoBackupEnabled(true);
        setAwaitingAuth(false);
      } else if (result.needsAuthorization && result.authorizationUrl) {
        setAuthUrl(result.authorizationUrl);
        setAwaitingAuth(true);
        toast.info("Please authorize the backup script.");
      } else {
        throw new Error(result.error || "Failed to setup auto-backup");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to setup auto-backup"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAuthComplete = async () => {
    try {
      setLoading(true);
      await markBackupScriptAuthorized();
      const result = await setupAutoBackup();

      if (result.success) {
        toast.success(result.message || "Auto-backup enabled!");
        setLastBackup(new Date().toLocaleString());
        setAuthUrl(null);
        setAwaitingAuth(false);
        setAutoBackupEnabled(true);
      } else if (result.needsAuthorization) {
        toast.warning("Please complete the authorization first.");
      } else {
        throw new Error(result.error || "Failed to enable auto-backup");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to enable auto-backup"
      );
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
          <span className="text-neutral-400">Checking backup status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <DatabaseBackup className="w-5 h-5 text-blue-400" />
        </div>
        <h2 className="text-xl font-semibold">Backup Database</h2>
      </div>

      {autoBackupEnabled ? (
        // Auto-backup is enabled - show status
        <div className="space-y-4">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Auto-backup Enabled</span>
            </div>
            <p className="text-neutral-400 text-sm">
              Your database is automatically backed up once per day when you
              visit the site. Old backups are deleted before creating new ones.
            </p>
          </div>

          {lastBackup && (
            <div className="flex items-center gap-2 text-sm text-neutral-300">
              <Calendar className="w-4 h-4 text-neutral-500" />
              <span>Last backup: {lastBackup}</span>
            </div>
          )}
        </div>
      ) : (
        // Auto-backup not enabled - show setup
        <>
          <p className="text-neutral-400 text-sm mb-6">
            Enable automatic daily backups. Your database will be backed up once
            per day when you visit the site. Old backups are automatically
            deleted before creating new ones.
          </p>

          <div className="space-y-4">
            {lastBackup && (
              <div className="flex items-center gap-2 text-sm text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span>Last backup: {lastBackup}</span>
              </div>
            )}

            {/* Authorization required state */}
            {awaitingAuth && authUrl && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 space-y-3">
                <p className="text-yellow-200 text-sm">
                  <strong>One-time authorization required:</strong> The backup
                  script needs your permission to access Google Drive.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href={authUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Authorize Script
                  </a>
                  <button
                    onClick={handleAuthComplete}
                    disabled={loading}
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    I&apos;ve Authorized
                  </button>
                </div>
                <p className="text-yellow-200/70 text-xs">
                  Click &quot;Review Permissions&quot; and authorize, then click
                  the green button.
                </p>
              </div>
            )}

            {/* Setup button */}
            {!awaitingAuth && (
              <button
                onClick={handleSetupAutoBackup}
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg transition-colors text-sm font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <DatabaseBackup className="w-4 h-4" />
                    Enable Auto-Backup
                  </>
                )}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
