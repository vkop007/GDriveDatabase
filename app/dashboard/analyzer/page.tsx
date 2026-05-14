import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDatabaseTree } from "../../actions";
import GraphVisualizer from "@/components/GraphVisualizer";
import { GOOGLE_TOKEN_COOKIE } from "@/lib/gdrive/google-oauth";

export default async function AnalyzerPage() {
  const cookieStore = await cookies();
  const tokensStr = cookieStore.get(GOOGLE_TOKEN_COOKIE)?.value;

  if (!tokensStr) {
    redirect("/dashboard");
  }

  const treeData = await getDatabaseTree();

  return <GraphVisualizer treeData={treeData} />;
}
