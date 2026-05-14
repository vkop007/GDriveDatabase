import { getAuth } from "../../../actions";
import { redirect } from "next/navigation";
import { operations } from "gdrivekit";
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

  try {
    await getAuth();
  } catch {
    redirect("/dashboard");
  }

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
      <div className="w-full max-w-full bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
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
