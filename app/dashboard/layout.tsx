import { getDatabaseTree } from "../actions";
import { logout } from "../actions/user";
import Sidebar from "../../components/Sidebar";
import DashboardLayoutWrapper from "../../components/DashboardLayout";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  type AppSession,
  APP_SESSION_COOKIE,
  GOOGLE_TOKEN_COOKIE,
} from "@/lib/gdrive/google-oauth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const appSession = cookieStore.get(APP_SESSION_COOKIE)?.value;
  const driveTokens = cookieStore.get(GOOGLE_TOKEN_COOKIE)?.value;
  const driveClientId = cookieStore.get("gdrive_client_id")?.value;
  const driveClientSecret = cookieStore.get("gdrive_client_secret")?.value;
  const driveProjectId = cookieStore.get("gdrive_project_id")?.value;

  if (!appSession) {
    redirect("/");
  }

  let user: AppSession = { email: "Google account" };
  try {
    user = JSON.parse(appSession) as AppSession;
  } catch {
    user = { email: "Google account" };
  }

  const hasDriveConnection =
    driveTokens && driveClientId && driveClientSecret && driveProjectId;
  const treeData = hasDriveConnection ? await getDatabaseTree() : [];

  return (
    <div className="flex min-h-screen bg-neutral-950">
      <Sidebar treeData={treeData} user={user} logoutAction={logout} />
      <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>
    </div>
  );
}
