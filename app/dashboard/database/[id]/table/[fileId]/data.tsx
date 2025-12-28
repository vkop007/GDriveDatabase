"use client";

import { useState } from "react";
import { TableFile, QueryState } from "../../../../../../types";
import AddRowForm from "../../../../../../components/AddRowForm";
import DataTable from "../../../../../../components/DataTable";
import { QueryBuilder } from "../../../../../../components/query";
import { defaultQueryState, applyQuery } from "../../../../../../lib/query";
import { Table2 } from "lucide-react";

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary-from to-primary-to border border-white/10 flex items-center justify-center">
            <Table2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Data</h2>
            <p className="text-sm text-neutral-400">
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
