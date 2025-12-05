import { getApiKey } from "../../actions";
import { getUserProfile } from "../../actions/user";
import ApiSettings from "../../../components/settings/ApiSettings";
import UserProfile from "../../../components/settings/UserProfile";

export default async function SettingsPage() {
  const apiKey = await getApiKey();
  const user = await getUserProfile();

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold bg-linear-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-neutral-400 mt-2">Manage your account settings</p>
        </header>

        <UserProfile user={user} />

        <div className="flex justify-end">
          <form
            action={async () => {
              "use server";
              await import("../../actions/user").then((m) => m.logout());
            }}
          >
            <button
              type="submit"
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-medium transition-colors border border-red-500/20"
            >
              Sign Out
            </button>
          </form>
        </div>

        <ApiSettings initialApiKey={apiKey} />
      </div>
    </div>
  );
}
