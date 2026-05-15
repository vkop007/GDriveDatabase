import { redirect } from "next/navigation";
import { getDatabaseTree } from "../../actions";
import GraphVisualizer from "@/components/GraphVisualizer";
import { hasCurrentDriveConnection } from "@/lib/gdrive/drive-connection-store";

export default async function AnalyzerPage() {
  if (!(await hasCurrentDriveConnection())) {
    redirect("/dashboard");
  }

  const treeData = await getDatabaseTree();

  return <GraphVisualizer treeData={treeData} />;
}
