import { getDatabaseTree } from "../actions";
import Sidebar from "../../components/Sidebar";
import DashboardLayoutWrapper from "../../components/DashboardLayout";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const treeData = await getDatabaseTree();

  return (
    <div className="flex min-h-screen bg-neutral-950">
      <Sidebar treeData={treeData} />
      <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>
    </div>
  );
}
