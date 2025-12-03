import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { listDatabases, createDatabase, deleteDatabase } from "../actions";

import ApiAccess from "../../components/ApiAccess";
import CopyButton from "../../components/CopyButton";

export default async function Dashboard() {
  const cookieStore = await cookies();
  const tokensStr = cookieStore.get("gdrive_tokens")?.value;
  const clientId = cookieStore.get("gdrive_client_id")?.value;
  const clientSecret = cookieStore.get("gdrive_client_secret")?.value;
  const projectId = cookieStore.get("gdrive_project_id")?.value;

  if (!tokensStr || !clientId || !clientSecret || !projectId) {
    redirect("/");
  }

  const files = await listDatabases();

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Databases
            </h1>
            <div className="flex items-center gap-4">
              <p className="text-neutral-400">Manage your NoSQL Databases</p>
              <ApiAccess />
            </div>
          </div>
          <form action={createDatabase} className="flex gap-2">
            <input
              type="text"
              name="name"
              placeholder="Database Name"
              className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500"
              required
            />
            <button className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium">
              Create Database
            </button>
          </form>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.length === 0 ? (
            <div className="col-span-full text-center py-12 text-neutral-500 bg-neutral-900/50 rounded-xl border border-neutral-800">
              No databases found. Create a new database to get started.
            </div>
          ) : (
            files.map((file: any) => (
              <div
                key={file.id}
                className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 hover:border-purple-500/50 transition-colors group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 bg-neutral-800 rounded-lg group-hover:bg-purple-500/20 group-hover:text-purple-400 transition-colors">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                      />
                    </svg>
                  </div>
                  <span className="text-xs text-neutral-500">
                    {new Date(file.createdTime).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-medium truncate mb-1" title={file.name}>
                  {file.name}
                </h3>
                <div className="flex items-center gap-2 mb-4">
                  <CopyButton text={file.id} label="Database ID" />
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-800">
                  <a
                    href={`/dashboard/database/${file.id}`}
                    className="text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Open
                  </a>
                  <form action={deleteDatabase}>
                    <input type="hidden" name="fileId" value={file.id} />
                    <button
                      type="submit"
                      className="text-xs font-medium text-red-500 hover:text-red-400 transition-colors"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
