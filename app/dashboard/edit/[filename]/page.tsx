import { saveDocument } from "../../../actions";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { initDriveService, operations } from "gdrivekit";
import JsonTableEditor from "./editor";

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
    let response = await operations.jsonOperations.readJsonFileData(id);

    // Recursively unwrap if response has { success: true, data: ... } structure
    // This handles cases where the API returns a wrapper AND the file content itself is wrapped
    while (
      response &&
      typeof response === "object" &&
      "data" in response &&
      "success" in response &&
      response.success === true
    ) {
      response = response.data;
    }

    content = JSON.stringify(response, null, 2);
  } catch (error) {
    console.error("Error reading file:", error);
    content = JSON.stringify({ error: "Failed to load content" }, null, 2);
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8 flex items-center justify-center">
      <div className="w-full max-w-7xl bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
        <h1 className="text-2xl font-bold mb-6 bg-linear-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          Edit Document: {decodedFilename}
        </h1>

        <JsonTableEditor
          initialContent={content}
          fileId={id}
          filename={decodedFilename}
        />
      </div>
    </div>
  );
}
