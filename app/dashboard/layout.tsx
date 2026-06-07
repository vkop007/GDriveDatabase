import { getDatabaseNavTree } from "../actions";
import { logout } from "../actions/user";
import Sidebar from "../../components/Sidebar";
import DashboardLayoutWrapper from "../../components/DashboardLayout";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { type AppSession, APP_SESSION_COOKIE } from "@/lib/gdrive/google-oauth";
import { parseAppSessionCookie } from "@/lib/auth/app-session";
import { hasCurrentDriveConnection } from "@/lib/gdrive/drive-connection-store";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const appSession = cookieStore.get(APP_SESSION_COOKIE)?.value;

  if (!appSession) {
    redirect("/");
  }

  const user: AppSession = parseAppSessionCookie(appSession) ?? { email: "Account" };

  const hasDriveConnection = await hasCurrentDriveConnection();
  const treeData = hasDriveConnection ? await getDatabaseNavTree() : [];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-950 dark:bg-neutral-950 dark:text-white">
      <Sidebar treeData={treeData} user={user} logoutAction={logout} />
      <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>
    </div>
  );
}
