import { getApiKey } from "../../actions";
import ApiSettings from "./ApiSettings";

export default async function SettingsPage() {
  const apiKey = await getApiKey();

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold bg-linear-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-neutral-400 mt-2">Manage your account settings</p>
        </header>

        <ApiSettings initialApiKey={apiKey} />
      </div>
    </div>
  );
}
