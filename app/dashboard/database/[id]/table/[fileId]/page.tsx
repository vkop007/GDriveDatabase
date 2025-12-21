import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTableData } from "../../../../../actions/table";
import ColumnsView from "./columns";
import DataView from "./data";
import ApiAccess from "../../../../../../components/ApiAccess";
import Link from "next/link";
import { Database, ChevronRight, Table2, Layers, Settings } from "lucide-react";

// Force dynamic rendering to ensure fresh data after edits
export const dynamic = "force-dynamic";

export default async function TablePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; fileId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id: databaseId, fileId } = await params;
  const { tab = "data" } = await searchParams;

  const cookieStore = await cookies();
  const tokensStr = cookieStore.get("gdrive_tokens")?.value;

  if (!tokensStr) {
    redirect("/");
  }

  const table = await getTableData(fileId);

  // Handle case where table data couldn't be loaded
  if (!table) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-8 flex items-center justify-center">
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-8 max-w-md text-center">
          <h1 className="text-xl font-semibold text-red-400 mb-2">
            Failed to Load Table
          </h1>
          <p className="text-neutral-400 mb-4">
            Could not load table data. This might be due to an authentication
            issue.
          </p>
          <a
            href="/dashboard"
            className="inline-block bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Build the current table URL base for tabs
  const tableUrl = `/dashboard/database/${databaseId}/table/${fileId}`;

  return (
    <div className="min-h-screen bg-neutral-950 text-white pt-20 px-4 pb-4 md:p-8">
      <div className="max-w-full mx-auto space-y-8">
        <header className="space-y-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 flex-wrap">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all text-sm font-medium"
            >
              <Database className="w-3.5 h-3.5" />
              Databases
            </Link>
            <ChevronRight className="w-4 h-4 text-neutral-600" />
            <Link
              href={`/dashboard/database/${databaseId}`}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all text-sm font-medium"
            >
              <Layers className="w-3.5 h-3.5" />
              Collection
            </Link>
            <ChevronRight className="w-4 h-4 text-neutral-600" />
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium border border-primary/20">
              <Table2 className="w-3.5 h-3.5" />
              Table
            </span>
          </nav>

          {/* Title Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-linear-to-r from-white via-white to-white bg-clip-text text-transparent">
                {table.name}
              </h1>
              <div className="mt-3">
                <ApiAccess databaseId={databaseId} tableId={fileId} />
              </div>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-neutral-900/50 rounded-xl border border-neutral-800 w-fit">
          <Link
            href={`${tableUrl}?tab=data`}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "data"
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
            }`}
          >
            <Table2 className="w-3.5 h-3.5" />
            Data
          </Link>
          <Link
            href={`${tableUrl}?tab=columns`}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "columns"
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Columns
          </Link>
          <Link
            href={`${tableUrl}?tab=settings`}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "settings"
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Settings
          </Link>
        </div>

        {/* Content */}
        <div>
          {tab === "data" && <DataView table={table} fileId={fileId} />}
          {tab === "columns" && (
            <ColumnsView
              table={table}
              fileId={fileId}
              databaseId={databaseId}
            />
          )}
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
