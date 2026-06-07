"use client";

import { useState } from "react";
import { TableFile, QueryState } from "../../../../../../types";
import AddRowForm from "../../../../../../components/AddRowForm";
import DataTable from "../../../../../../components/DataTable";
import { QueryBuilder } from "../../../../../../components/query";
import { defaultQueryState, applyQuery } from "../../../../../../lib/query";
import { Table2 } from "lucide-react";
import Link from "next/link";

export default function DataView({
  table,
  fileId,
  databaseId,
  relationLookup = {},
}: {
  table: TableFile;
  fileId: string;
  databaseId: string;
  relationLookup?: Record<string, Record<string, string>>;
}) {
  const [query, setQuery] = useState<QueryState>(defaultQueryState);

  // Apply query to get filtered/sorted/paginated data
  const queryResult = applyQuery(table.documents, query);
  const userColumns = table.schema.filter((column) => !column.key.startsWith("$"));
  const hasUserColumns = userColumns.length > 0;
  const tableUrl = `/dashboard/database/${databaseId}/table/${fileId}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary-from to-primary-to border border-white/10 flex items-center justify-center">
            <Table2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-950 dark:text-white">Data</h2>
            <p className="text-sm text-slate-500 dark:text-neutral-400">
              {table.documents.length} row
              {table.documents.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <AddRowForm
          fileId={fileId}
          databaseId={databaseId}
          schema={table.schema}
        />
      </div>

      {!hasUserColumns && (
        <div className="rounded-2xl border border-blue-500/20 bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-500/10 dark:text-blue-100">
          Add at least one custom column before creating rows.{" "}
          <Link
            href={`${tableUrl}?tab=columns`}
            className="font-semibold text-blue-700 underline underline-offset-4 hover:text-blue-900 dark:text-blue-200 dark:hover:text-white"
          >
            Open columns
          </Link>
        </div>
      )}

      {/* Query Builder */}
      <QueryBuilder
        columns={table.schema}
        query={query}
        onQueryChange={setQuery}
        totalResults={table.documents.length}
        filteredResults={queryResult.total}
      />

      {/* Data Table with filtered results */}
      <DataTable
        table={{ ...table, documents: queryResult.data }}
        fileId={fileId}
        databaseId={databaseId}
        relationLookup={relationLookup}
        totalRows={queryResult.total}
        totalPages={queryResult.totalPages}
        currentPage={query.page}
        pageSize={query.pageSize}
        onPageChange={(page) => setQuery({ ...query, page })}
        onPageSizeChange={(pageSize) =>
          setQuery({ ...query, pageSize, page: 1 })
        }
      />
    </div>
  );
}
