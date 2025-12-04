import { getDatabaseTree } from "../actions";
import Sidebar from "../../components/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const treeData = await getDatabaseTree();

  return (
    <div className="flex min-h-screen bg-neutral-950">
      <Sidebar treeData={treeData} />
      <main className="flex-1 md:ml-(--sidebar-width) transition-all duration-200">
        {children}
      </main>
    </div>
  );
}
