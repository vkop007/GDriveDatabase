import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDatabaseTree } from "../../actions";
import GraphVisualizer from "@/components/GraphVisualizer";

export default async function AnalyzerPage() {
  const cookieStore = await cookies();
  const tokensStr = cookieStore.get("gdrive_tokens")?.value;

  if (!tokensStr) {
    redirect("/");
  }

  const treeData = await getDatabaseTree();

  return <GraphVisualizer treeData={treeData} />;
}
