import { redirect } from "next/navigation";
import { getTableData, getSimpleTableData } from "../../../../../actions/table";
import ColumnsView from "./columns";
import DataView from "./data";
import ApiAccess from "../../../../../../components/ApiAccess";
import Link from "next/link";
import { Database, ChevronRight, Table2, Layers } from "lucide-react";
import { hasCurrentDriveConnection } from "@/lib/gdrive/drive-connection-store";

// Force dynamic rendering to ensure fresh data after edits
// Force dynamic rendering removed to enable caching
// export const dynamic = "force-dynamic";

export default async function TablePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; fileId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id: databaseId, fileId } = await params;
  const { tab = "data" } = await searchParams;

  if (!(await hasCurrentDriveConnection())) {
    redirect("/dashboard");
  }

  const table = await getTableData(fileId);

  // Helper to fetch relation data for display
  const relationLookup: Record<string, Record<string, string>> = {};

  if (table) {
    const relationColumns = table.schema.filter(
      (col) => col.type === "relation" && col.relationTableId
    );

    await Promise.all(
      relationColumns.map(async (col) => {
        if (col.relationTableId) {
          const data = await getSimpleTableData(col.relationTableId);
          relationLookup[col.key] = data.reduce(
            (
              acc: Record<string, string>,
              item: { id: string; label: string }
            ) => {
              acc[item.id] = item.label;
              return acc;
            },
            {} as Record<string, string>
          );
        }
      })
    );
  }

  // Handle case where table data couldn't be loaded
  if (!table) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 text-slate-950 dark:bg-neutral-950 dark:text-white md:p-8">
        <div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm shadow-slate-900/5 dark:border-neutral-800 dark:bg-neutral-900/50 dark:shadow-none">
          <h1 className="text-xl font-semibold text-red-400 mb-2">
            Failed to Load Table
          </h1>
          <p className="mb-4 text-slate-600 dark:text-neutral-400">
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
    <div className="min-h-screen bg-slate-50 px-4 pb-4 pt-20 text-slate-950 dark:bg-neutral-950 dark:text-white md:p-8">
      <div className="max-w-full mx-auto space-y-8">
        <header className="space-y-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 flex-wrap">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-100 hover:text-slate-950 dark:border-transparent dark:bg-neutral-800/50 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
            >
              <Database className="w-3.5 h-3.5" />
              Databases
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-400 dark:text-neutral-600" />
            <Link
              href={`/dashboard/database/${databaseId}`}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-100 hover:text-slate-950 dark:border-transparent dark:bg-neutral-800/50 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
            >
              <Layers className="w-3.5 h-3.5" />
              Collection
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-400 dark:text-neutral-600" />
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium border border-primary/20">
              <Table2 className="w-3.5 h-3.5" />
              Table
            </span>
          </nav>

          {/* Title Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="bg-linear-to-r from-slate-950 via-slate-900 to-slate-600 bg-clip-text text-4xl font-bold text-transparent dark:from-white dark:via-white dark:to-neutral-400">
                {table.name}
              </h1>
              <div className="mt-3">
                <ApiAccess databaseId={databaseId} tableId={fileId} />
              </div>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm shadow-slate-900/5 dark:border-neutral-800 dark:bg-neutral-900/50 dark:shadow-none">
          <Link
            href={`${tableUrl}?tab=data`}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "data"
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-white"
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
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Columns
          </Link>
        </div>

        {/* Content */}
        <div>
          {tab === "data" && (
            <DataView
              table={table}
              fileId={fileId}
              databaseId={databaseId}
              relationLookup={relationLookup}
            />
          )}
          {tab === "columns" && (
            <ColumnsView
              table={table}
              fileId={fileId}
              databaseId={databaseId}
            />
          )}
        </div>
      </div>
    </div>
  );
}
