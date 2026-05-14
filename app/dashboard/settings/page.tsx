import { cookies, headers } from "next/headers";
import { getApiKey, connectDriveWithGoogle } from "../../actions";
import { disconnectDrive } from "../../actions/user";
import {
  APP_SESSION_COOKIE,
  getBaseUrlFromHeaders,
  getGoogleRedirectUri,
  GOOGLE_TOKEN_COOKIE,
  type AppSession,
} from "@/lib/gdrive/google-oauth";

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
  const driveClientId = cookieStore.get("gdrive_client_id")?.value || null;
  const driveClientSecret =
    cookieStore.get("gdrive_client_secret")?.value || null;
  const driveProjectId = cookieStore.get("gdrive_project_id")?.value || null;
  const driveToken = cookieStore.get(GOOGLE_TOKEN_COOKIE)?.value || null;
  const hasCredentials = Boolean(
    driveClientId && driveClientSecret && driveProjectId
  );

  return (
    <div className="min-h-screen bg-neutral-950 px-4 pb-4 pt-20 text-white md:px-8 md:pb-8">
      <div className="max-w-full mx-auto space-y-8">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-neutral-900 via-neutral-900 to-neutral-800 border border-neutral-800 p-6">
          {/* Glow effect */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-linear-to-r from-white to-neutral-400 bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-neutral-400 text-sm mt-1">
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
            hasToken: Boolean(driveToken),
            isConnected: hasCredentials && Boolean(driveToken),
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
