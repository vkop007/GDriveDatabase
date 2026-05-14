import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connectDriveWithGoogle, listDatabases } from "../actions";
import DashboardView from "../../components/DashboardView";
import {
  APP_SESSION_COOKIE,
  GOOGLE_TOKEN_COOKIE,
} from "@/lib/gdrive/google-oauth";

export default async function Dashboard() {
  const cookieStore = await cookies();
  const appSession = cookieStore.get(APP_SESSION_COOKIE)?.value;
  const tokensStr = cookieStore.get(GOOGLE_TOKEN_COOKIE)?.value;
  const driveClientId = cookieStore.get("gdrive_client_id")?.value;
  const driveClientSecret = cookieStore.get("gdrive_client_secret")?.value;
  const driveProjectId = cookieStore.get("gdrive_project_id")?.value;

  if (!appSession) {
    redirect("/");
  }

  if (!tokensStr || !driveClientId || !driveClientSecret || !driveProjectId) {
    return (
      <DashboardView
        initialDatabases={[]}
        needsDriveConnection
        driveSetupAction={connectDriveWithGoogle}
      />
    );
  }

  // ✅ Now returns cached data (after first call)
  const files = await listDatabases();

  return <DashboardView initialDatabases={files} />;
}
