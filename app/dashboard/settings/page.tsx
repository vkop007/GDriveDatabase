import { getApiKey } from "../../actions";
import { getUserProfile } from "../../actions/user";
import ApiSettings from "../../../components/settings/ApiSettings";
import UserProfile from "../../../components/settings/UserProfile";
import BackupSettings from "../../../components/settings/BackupSettings";

export default async function SettingsPage() {
  const apiKey = await getApiKey();
  const user = await getUserProfile();

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen text-white">
      <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-bold bg-linear-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-neutral-400 mt-2">Manage your account settings</p>
        </header>

        <UserProfile user={user} />
        <ApiSettings initialApiKey={apiKey} />
        <BackupSettings />
      </div>
    </div>
  );
}
