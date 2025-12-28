import { getApiKey } from "../../actions";
import PlaygroundClient from "@/components/PlaygroundClient";

export default async function PlaygroundPage() {
  const apiKey = await getApiKey();

  return <PlaygroundClient initialApiKey={apiKey || ""} />;
}
