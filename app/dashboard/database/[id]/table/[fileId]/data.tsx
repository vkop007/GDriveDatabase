import { TableFile } from "../../../../../../types";
import AddRowForm from "../../../../../../components/AddRowForm";
import DataTable from "../../../../../../components/DataTable";
import { Table2 } from "lucide-react";

export default function DataView({
  table,
  fileId,
  relationLookup = {},
}: {
  table: TableFile;
  fileId: string;
  relationLookup?: Record<string, Record<string, string>>;
}) {
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
        <AddRowForm fileId={fileId} schema={table.schema} />
      </div>

      <DataTable
        table={table}
        fileId={fileId}
        relationLookup={relationLookup}
      />
    </div>
  );
}
