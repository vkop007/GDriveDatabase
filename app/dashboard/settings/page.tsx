import { getApiKey } from "../../actions";
import { getUserProfile } from "../../actions/user";
import ApiSettings from "../../../components/settings/ApiSettings";
import UserProfile from "../../../components/settings/UserProfile";
import BackupSettings from "../../../components/settings/BackupSettings";
import { Settings } from "lucide-react";

export default async function SettingsPage() {
  const apiKey = await getApiKey();
  const user = await getUserProfile();

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
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

        <UserProfile user={user} />
        <ApiSettings initialApiKey={apiKey} />
        <BackupSettings />
      </div>
    </div>
  );
}
