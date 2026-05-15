import { getApiKey, getDatabaseNavTree } from "../../actions";
import PlaygroundClient from "@/components/PlaygroundClient";

export const dynamic = "force-dynamic";

export default async function PlaygroundPage() {
  const apiKey = await getApiKey();
  const databaseTree = await getDatabaseNavTree();

  return (
    <PlaygroundClient
      initialApiKey={apiKey || ""}
      databaseTree={databaseTree}
    />
  );
}
