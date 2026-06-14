import { cookies, headers } from "next/headers";
import { getApiKey, connectDriveWithGoogle } from "../../actions";
import { disconnectDrive, logout } from "../../actions/user";
import {
  APP_SESSION_COOKIE,
  getBaseUrlFromHeaders,
  getGoogleRedirectUri,
} from "@/lib/gdrive/google-oauth";
import { parseAppSessionCookie } from "@/lib/auth/app-session";
import { getCurrentDriveConnection } from "@/lib/gdrive/drive-connection-store";

export const dynamic = "force-dynamic";
import ApiSettings from "../../../components/settings/ApiSettings";
import AccountDriveSettings from "../../../components/settings/AccountDriveSettings";
import BackupSettings from "../../../components/settings/BackupSettings";
import { Settings } from "lucide-react";

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const [apiKey, driveConnection] = await Promise.all([
    getApiKey(),
    getCurrentDriveConnection(),
  ]);
  const user = parseAppSessionCookie(cookieStore.get(APP_SESSION_COOKIE)?.value);
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
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-none">
          <div className="relative flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/25 bg-primary shadow-sm shadow-primary/10 dark:bg-neutral-950 dark:shadow-none">
              <Settings className="w-6 h-6 text-white dark:text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-950 dark:text-white">
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
          logoutAction={logout}
        />
        <ApiSettings initialApiKey={apiKey} />
        <BackupSettings />
      </div>
    </div>
  );
}
