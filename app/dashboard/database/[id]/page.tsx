import { redirect } from "next/navigation";
import { listCollections } from "../../../actions";
import DatabaseView from "../../../../components/DatabaseView";
import { hasCurrentDriveConnection } from "@/lib/gdrive/drive-connection-store";

export default async function DatabasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!(await hasCurrentDriveConnection())) {
    redirect("/dashboard");
  }

  const files = await listCollections(id);

  return <DatabaseView initialTables={files} databaseId={id} />;
}
