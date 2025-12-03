import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTableData, getParentId } from "../../../actions";
import ColumnsView from "././columns";
import DataView from "././data";
import ApiAccess from "../../../../components/ApiAccess";

export default async function TablePage({
  params,
  searchParams,
}: {
  params: Promise<{ fileId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { fileId } = await params;
  const { tab = "data" } = await searchParams;

  const cookieStore = await cookies();
  const tokensStr = cookieStore.get("gdrive_tokens")?.value;

  if (!tokensStr) {
    redirect("/");
  }

  const table = await getTableData(fileId);
  const parentId = await getParentId(fileId);

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <a
                href="/dashboard"
                className="text-neutral-400 hover:text-white transition-colors"
              >
                Databases
              </a>
              <span className="text-neutral-600">/</span>
              <span className="text-purple-400">Table</span>
            </div>
            <h1 className="text-3xl font-bold bg-linear-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              {table.name}
            </h1>
            <div className="mt-2">
              <ApiAccess databaseId={parentId} tableId={fileId} />
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="border-b border-neutral-800">
          <div className="flex gap-8">
            <a
              href={`/dashboard/table/${fileId}?tab=data`}
              className={`pb-4 text-sm font-medium transition-colors relative ${
                tab === "data"
                  ? "text-white"
                  : "text-neutral-400 hover:text-neutral-300"
              }`}
            >
              Data
              {tab === "data" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
              )}
            </a>
            <a
              href={`/dashboard/table/${fileId}?tab=columns`}
              className={`pb-4 text-sm font-medium transition-colors relative ${
                tab === "columns"
                  ? "text-white"
                  : "text-neutral-400 hover:text-neutral-300"
              }`}
            >
              Columns
              {tab === "columns" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
              )}
            </a>
            <a
              href={`/dashboard/table/${fileId}?tab=settings`}
              className={`pb-4 text-sm font-medium transition-colors relative ${
                tab === "settings"
                  ? "text-white"
                  : "text-neutral-400 hover:text-neutral-300"
              }`}
            >
              Settings
              {tab === "settings" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
              )}
            </a>
          </div>
        </div>

        {/* Content */}
        <div>
          {tab === "data" && <DataView table={table} fileId={fileId} />}
          {tab === "columns" && <ColumnsView table={table} fileId={fileId} />}
          {tab === "settings" && (
            <div className="p-8 text-center text-neutral-500 bg-neutral-900/50 rounded-xl border border-neutral-800">
              Settings coming soon...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
