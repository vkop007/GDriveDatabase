import { deleteDocument } from "../../../actions";
import { TableFile } from "../../../../types";
import AddRowForm from "../../../../components/AddRowForm";

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

      {/* Data Table */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-neutral-900 text-neutral-400 font-medium">
            <tr>
              {table.schema.map((col) => (
                <th key={col.key} className="px-6 py-3">
                  {col.key}
                </th>
              ))}
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {table.documents.map((doc) => (
              <tr
                key={doc.$id}
                className="hover:bg-neutral-800/50 transition-colors"
              >
                {table.schema.map((col) => (
                  <td key={col.key} className="px-6 py-4 text-white">
                    {typeof doc[col.key] === "object"
                      ? JSON.stringify(doc[col.key])
                      : String(doc[col.key] ?? "")}
                  </td>
                ))}
                <td className="px-6 py-4 text-right">
                  <form action={deleteDocument} className="inline-block">
                    <input type="hidden" name="fileId" value={fileId} />
                    <input type="hidden" name="docId" value={doc.$id} />
                    <button className="text-red-500 hover:text-red-400 transition-colors">
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
