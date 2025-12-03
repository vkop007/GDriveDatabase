import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { listCollections } from "../../../actions";
import DatabaseView from "../../../../components/DatabaseView";

export default async function DatabasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const tokensStr = cookieStore.get("gdrive_tokens")?.value;

  if (!tokensStr) {
    redirect("/");
  }

  const files = await listCollections(id);

  return <DatabaseView initialTables={files} databaseId={id} />;
}
