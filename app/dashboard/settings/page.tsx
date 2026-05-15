import { cookies, headers } from "next/headers";
import { getApiKey, connectDriveWithGoogle } from "../../actions";
import { disconnectDrive } from "../../actions/user";
import {
  APP_SESSION_COOKIE,
  getBaseUrlFromHeaders,
  getGoogleRedirectUri,
  type AppSession,
} from "@/lib/gdrive/google-oauth";
import { getCurrentDriveConnection } from "@/lib/gdrive/drive-connection-store";

export const dynamic = "force-dynamic";
import ApiSettings from "../../../components/settings/ApiSettings";
import AccountDriveSettings from "../../../components/settings/AccountDriveSettings";
import BackupSettings from "../../../components/settings/BackupSettings";
import { Settings } from "lucide-react";

function parseAppSession(value?: string) {
  if (!value) return null;

  try {
    return JSON.parse(value) as AppSession;
  } catch {
    return null;
  }
}

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const apiKey = await getApiKey();
  const user = parseAppSession(cookieStore.get(APP_SESSION_COOKIE)?.value);
  const driveConnection = await getCurrentDriveConnection();
  const driveClientId = driveConnection?.clientId || null;
  const driveProjectId = driveConnection?.projectId || null;
  const hasCredentials = Boolean(
    driveConnection?.clientId &&
      driveConnection.clientSecret &&
      driveConnection.projectId
  );

  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-4 pt-20 text-slate-950 md:px-8 md:pb-8 dark:bg-neutral-950 dark:text-white">
      <div className="max-w-full mx-auto space-y-8">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 dark:border-neutral-800 dark:bg-linear-to-br dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800 dark:shadow-none">
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-950 dark:bg-linear-to-r dark:from-white dark:to-neutral-400 dark:bg-clip-text dark:text-transparent">
                Settings
              </h1>
              <p className="text-slate-500 text-sm mt-1 dark:text-neutral-400">
                Manage your account and preferences
              </p>
            </div>
          </div>
        </div>

        <AccountDriveSettings
          user={user}
          drive={{
            clientId: driveClientId,
            hasCredentials,
            hasToken: Boolean(driveConnection?.tokens),
            isConnected: hasCredentials && Boolean(driveConnection?.tokens),
            projectId: driveProjectId,
            redirectUri: getGoogleRedirectUri(
              getBaseUrlFromHeaders(headerStore)
            ),
          }}
          connectDriveAction={connectDriveWithGoogle}
          disconnectDriveAction={disconnectDrive}
        />
        <ApiSettings initialApiKey={apiKey} />
        <BackupSettings />
      </div>
    </div>
  );
}
