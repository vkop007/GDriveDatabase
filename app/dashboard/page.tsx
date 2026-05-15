import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connectDriveWithGoogle, listDatabases } from "../actions";
import DashboardView from "../../components/DashboardView";
import { APP_SESSION_COOKIE } from "@/lib/gdrive/google-oauth";
import { hasCurrentDriveConnection } from "@/lib/gdrive/drive-connection-store";

export default async function Dashboard() {
  const cookieStore = await cookies();
  const appSession = cookieStore.get(APP_SESSION_COOKIE)?.value;

  if (!appSession) {
    redirect("/");
  }

  if (!(await hasCurrentDriveConnection())) {
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
