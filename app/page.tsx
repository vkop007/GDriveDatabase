import { authenticateWithGoogle } from "./actions";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get("gdrive_tokens")?.value;

  if (token) {
    redirect("/dashboard");
  }
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[120px]" />

      <div className="z-10 w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter bg-linear-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            NoSQL Drive DB
          </h1>
          <p className="text-neutral-400">
            Turn your Google Drive into a powerful NoSQL database.
          </p>
        </div>

        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
          <form action={authenticateWithGoogle} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="clientId"
                className="text-sm font-medium text-neutral-300"
              >
                Client ID
              </label>
              <input
                id="clientId"
                name="clientId"
                type="text"
                required
                placeholder="Enter your Google Client ID"
                className="w-full bg-neutral-950/50 border border-neutral-800 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder:text-neutral-600"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="clientSecret"
                className="text-sm font-medium text-neutral-300"
              >
                Client Secret
              </label>
              <input
                id="clientSecret"
                name="clientSecret"
                type="password"
                required
                placeholder="Enter your Google Client Secret"
                className="w-full bg-neutral-950/50 border border-neutral-800 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder:text-neutral-600"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="projectId"
                className="text-sm font-medium text-neutral-300"
              >
                Project ID
              </label>
              <input
                id="projectId"
                name="projectId"
                type="text"
                required
                placeholder="Enter your Google Project ID"
                className="w-full bg-neutral-950/50 border border-neutral-800 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder:text-neutral-600"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium py-3 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-500/25"
            >
              Connect Google Drive
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-neutral-500">
          Your credentials are used locally to authenticate with Google.
        </p>
      </div>
    </div>
  );
}
