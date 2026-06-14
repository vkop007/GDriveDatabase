"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Database,
  ExternalLink,
  KeyRound,
  Link2,
  RefreshCw,
  ShieldCheck,
  Unplug,
  User,
  LogOut,
} from "lucide-react";
import type { AppSession } from "@/lib/gdrive/google-oauth";
import DriveSetupClient from "../DriveSetupClient";

type ServerFormAction = (formData: FormData) => void | Promise<void>;

type DriveConnection = {
  clientId: string | null;
  hasCredentials: boolean;
  hasToken: boolean;
  isConnected: boolean;
  projectId: string | null;
  redirectUri: string;
};

type AccountDriveSettingsProps = {
  connectDriveAction: ServerFormAction;
  disconnectDriveAction: ServerFormAction;
  logoutAction: ServerFormAction;
  drive: DriveConnection;
  user: AppSession | null;
};

function maskValue(value: string | null) {
  if (!value) return "Not saved";
  if (value.length <= 24) return value;
  return `${value.slice(0, 12)}...${value.slice(-16)}`;
}

function StatusPill({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "green" | "amber" | "neutral";
}) {
  const styles = {
    green:
      "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    amber:
      "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    neutral:
      "border-slate-200 bg-slate-100 text-slate-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

function DetailRow({
  label,
  value,
  icon,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-slate-200 py-3 dark:border-neutral-800">
      <div className="flex min-w-0 items-center gap-3 text-sm text-slate-500 dark:text-neutral-400">
        <span className="text-slate-400 dark:text-neutral-500">{icon}</span>
        <span>{label}</span>
      </div>
      <span className="min-w-0 truncate text-right font-mono text-xs text-slate-700 dark:text-neutral-200">
        {value}
      </span>
    </div>
  );
}

export default function AccountDriveSettings({
  connectDriveAction,
  disconnectDriveAction,
  logoutAction,
  drive,
  user,
}: AccountDriveSettingsProps) {
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const displayName = user?.name || user?.email || "Account";
  const initial = displayName.charAt(0).toUpperCase();
  const driveTone = drive.isConnected
    ? "green"
    : drive.hasCredentials || drive.hasToken
      ? "amber"
      : "neutral";
  const driveLabel = drive.isConnected
    ? "Drive connected"
    : drive.hasCredentials || drive.hasToken
      ? "Reconnect needed"
      : "Drive not connected";

  const copyRedirectUri = async () => {
    try {
      await navigator.clipboard.writeText(drive.redirectUri);
      toast.success("Redirect URI copied");
    } catch {
      toast.error("Failed to copy redirect URI");
    }
  };

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-none">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 dark:bg-neutral-950">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
                  Account
                </h2>
                <p className="text-sm text-slate-500 dark:text-neutral-400">
                  App login identity
                </p>
              </div>
            </div>
            <StatusPill tone={user ? "green" : "amber"}>
              {user ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5" />
              )}
              {user ? "Signed in" : "Session missing"}
            </StatusPill>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-neutral-700 dark:bg-neutral-950">
              {user?.picture ? (
                <Image
                  src={user.picture}
                  alt={displayName}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <span className="text-lg font-semibold text-primary">
                  {initial}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-slate-950 dark:text-white">
                {displayName}
              </p>
              <p className="truncate text-sm text-slate-500 dark:text-neutral-400">
                {user?.email || "No email found"}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <DetailRow
              icon={<ShieldCheck className="h-4 w-4" />}
              label="Login Method"
              value="Email/password"
            />
            <DetailRow
              icon={<KeyRound className="h-4 w-4" />}
              label="Drive Access"
              value="Separate OAuth credentials"
            />
          </div>

          {user && (
            <div className="mt-6 border-t border-slate-200 pt-6 dark:border-neutral-800">
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-5 text-sm font-semibold text-red-600 transition hover:bg-red-500/15 dark:text-red-300"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </form>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-none">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/25 bg-blue-500/10 dark:bg-neutral-950">
                <Database className="h-5 w-5 text-blue-300" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
                  Google Drive
                </h2>
                <p className="text-sm text-slate-500 dark:text-neutral-400">
                  User-owned OAuth credentials
                </p>
              </div>
            </div>
            <StatusPill tone={driveTone}>
              {drive.isConnected ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : drive.hasCredentials || drive.hasToken ? (
                <AlertTriangle className="h-3.5 w-3.5" />
              ) : (
                <ShieldCheck className="h-3.5 w-3.5" />
              )}
              {driveLabel}
            </StatusPill>
          </div>

          <div className="mt-6">
            <DetailRow
              icon={<KeyRound className="h-4 w-4" />}
              label="Client ID"
              value={maskValue(drive.clientId)}
            />
            <DetailRow
              icon={<ShieldCheck className="h-4 w-4" />}
              label="Client Secret"
              value={drive.hasCredentials ? "Saved securely" : "Not saved"}
            />
            <DetailRow
              icon={<Database className="h-4 w-4" />}
              label="Project ID"
              value={maskValue(drive.projectId)}
            />
            <DetailRow
              icon={<Link2 className="h-4 w-4" />}
              label="Drive Token"
              value={drive.hasToken ? "Authorized" : "Not authorized"}
            />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setIsSetupOpen(true)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary/90"
            >
              <RefreshCw className="h-4 w-4" />
              {drive.isConnected ? "Switch Drive" : "Connect Drive"}
            </button>

            <form action={disconnectDriveAction}>
              <button
                type="submit"
                disabled={!drive.hasCredentials && !drive.hasToken}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-5 text-sm font-semibold text-red-600 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 sm:w-auto dark:text-red-300 dark:disabled:border-neutral-800 dark:disabled:bg-neutral-900 dark:disabled:text-neutral-600"
              >
                <Unplug className="h-4 w-4" />
                Disconnect Drive
              </button>
            </form>
          </div>
        </section>

        <section className="rounded-2xl border border-sky-500/20 bg-sky-50 p-6 xl:col-span-2 dark:bg-neutral-950">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold text-sky-700 dark:text-sky-200">
                <Link2 className="h-4 w-4" />
                Google OAuth Redirect URI
              </div>
              <p className="mt-2 truncate font-mono text-sm text-slate-700 dark:text-neutral-100">
                {drive.redirectUri}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={copyRedirectUri}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-sky-500/25 bg-sky-500/10 px-4 text-sm font-medium text-sky-700 transition hover:bg-sky-500/15 dark:text-sky-100"
              >
                <Copy className="h-4 w-4" />
                Copy URI
              </button>
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-neutral-600 dark:hover:bg-neutral-800"
              >
                <ExternalLink className="h-4 w-4" />
                Google Console
              </a>
            </div>
          </div>
        </section>
      </div>

      <DriveSetupClient
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        onSubmit={connectDriveAction}
      />
    </>
  );
}
