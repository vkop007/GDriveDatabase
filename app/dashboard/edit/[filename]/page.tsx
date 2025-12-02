import { updateDocument } from "../../../actions";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { initDriveService, operations } from "gdrivekit";

export default async function EditDocument({
  params,
  searchParams,
}: {
  params: Promise<{ filename: string }>;
  searchParams: Promise<{ id: string }>;
}) {
  const { filename } = await params;
  const { id } = await searchParams;

  if (!filename || !id) {
    redirect("/dashboard");
  }

  const decodedFilename = decodeURIComponent(filename);

  const cookieStore = await cookies();
  const tokensStr = cookieStore.get("gdrive_tokens")?.value;
  const clientId = cookieStore.get("gdrive_client_id")?.value;
  const clientSecret = cookieStore.get("gdrive_client_secret")?.value;
  const projectId = cookieStore.get("gdrive_project_id")?.value;

  if (!tokensStr || !clientId || !clientSecret || !projectId) {
    redirect("/");
  }

  const tokens = JSON.parse(tokensStr);

  initDriveService(
    {
      client_id: clientId,
      client_secret: clientSecret,
      project_id: projectId,
      redirect_uris: ["http://localhost:3000/oauth2callback"],
    },
    tokens
  );

  let content = "{}";
  try {
    const data = await operations.readJsonFileData(id);
    content = JSON.stringify(data, null, 2);
  } catch (error) {
    console.error("Error reading file:", error);
    content = JSON.stringify({ error: "Failed to load content" }, null, 2);
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
        <h1 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          Edit Document: {decodedFilename}
        </h1>

        <form action={updateDocument} className="space-y-6">
          <input type="hidden" name="fileId" value={id} />
          <input type="hidden" name="filename" value={decodedFilename} />

          <div className="space-y-2">
            <label
              htmlFor="content"
              className="text-sm font-medium text-neutral-300"
            >
              JSON Content
            </label>
            <textarea
              id="content"
              name="content"
              required
              rows={15}
              className="w-full bg-neutral-950/50 border border-neutral-800 rounded-lg px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder:text-neutral-600"
              defaultValue={content}
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium py-3 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-500/25"
            >
              Save Changes
            </button>
            <a
              href="/dashboard"
              className="px-6 py-3 rounded-lg border border-neutral-800 hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-white"
            >
              Cancel
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
