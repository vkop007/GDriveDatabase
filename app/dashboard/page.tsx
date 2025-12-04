import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { listDatabases } from "../actions";
import DashboardView from "../../components/DashboardView";

export default async function Dashboard() {
  const cookieStore = await cookies();
  const tokensStr = cookieStore.get("gdrive_tokens")?.value;
  const clientId = cookieStore.get("gdrive_client_id")?.value;
  const clientSecret = cookieStore.get("gdrive_client_secret")?.value;
  const projectId = cookieStore.get("gdrive_project_id")?.value;

  if (!tokensStr || !clientId || !clientSecret || !projectId) {
    redirect("/");
  }

  // ✅ Now returns cached data (after first call)
  const files = await listDatabases();

  return <DashboardView initialDatabases={files} />;
}
