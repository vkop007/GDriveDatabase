import { TableFile } from "../../../../types";
import AddRowForm from "../../../../components/AddRowForm";
import DataTable from "../../../../components/DataTable";

export default function DataView({
  table,
  fileId,
}: {
  table: TableFile;
  fileId: string;
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Data</h2>
        <AddRowForm fileId={fileId} schema={table.schema} />
      </div>

      <DataTable table={table} fileId={fileId} />
    </div>
  );
}
