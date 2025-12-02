import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { initDriveService, operations } from "gdrivekit";
import { deleteDocument } from "../actions";

export default async function Dashboard() {
  const cookieStore = await cookies();
  const tokensStr = cookieStore.get("gdrive_tokens")?.value;
  const clientId = cookieStore.get("gdrive_client_id")?.value;
  const clientSecret = cookieStore.get("gdrive_client_secret")?.value;
  const projectId = cookieStore.get("gdrive_project_id")?.value;

  if (!tokensStr || !clientId || !clientSecret || !projectId) {
    redirect("/");
  }

  const tokens = JSON.parse(tokensStr);

  // Initialize gdrivekit
  initDriveService(
    {
      client_id: clientId,
      client_secret: clientSecret,
      project_id: projectId,
      redirect_uris: ["http://localhost:3000/oauth2callback"],
    },
    tokens
  );

  let files = [];
  try {
    const response = await operations.searchByType("application/json");
    files = response.data?.files || [];
  } catch (error) {
    console.error("Error listing files:", error);
    // Handle token expiry or other errors here
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-neutral-400">Manage your NoSQL Database</p>
          </div>
          <button className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-colors">
            Create Document
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.length === 0 ? (
            <div className="col-span-full text-center py-12 text-neutral-500 bg-neutral-900/50 rounded-xl border border-neutral-800">
              No files found. Create a new document to get started.
            </div>
          ) : (
            files.map((file: any) => (
              <div
                key={file.id}
                className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 hover:border-purple-500/50 transition-colors group cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 bg-neutral-800 rounded-lg group-hover:bg-purple-500/20 group-hover:text-purple-400 transition-colors">
                    {/* Icon placeholder */}
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
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
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
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-800">
                  <a
                    href={`/dashboard/edit/${file.name}?id=${file.id}`}
                    className="text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Edit
                  </a>
                  <form action={deleteDocument}>
                    <input type="hidden" name="fileId" value={file.id} />
                    <input type="hidden" name="filename" value={file.name} />
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
