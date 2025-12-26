import {
  updateTableSchema,
  deleteColumn,
  listTables,
} from "../../../../../actions/table";
import { TableFile } from "../../../../../../types";
import { Plus, Key, Type, ToggleLeft, List, Trash2, Link2 } from "lucide-react";
import AddColumnForm from "../../../../../../components/AddColumnForm";

export default async function ColumnsView({
  table,
  fileId,
  databaseId,
}: {
  table: TableFile;
  fileId: string;
  databaseId: string;
}) {
  const tables = await listTables(databaseId);
  const availableTables = tables.map((t: { id: string; name: string }) => ({
    id: t.id,
    name: t.name,
  }));

  const getTypeColor = (type: string) => {
    switch (type) {
      case "string":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "integer":
        return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "boolean":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "datetime":
        return "text-purple-400 bg-purple-500/10 border-purple-500/20";
      case "relation":
        return "text-pink-400 bg-pink-500/10 border-pink-500/20";
      default:
        return "text-neutral-400 bg-neutral-500/10 border-neutral-500/20";
    }
  };

  const getTableName = (id: string) => {
    return (
      availableTables.find((t: { id: string; name: string }) => t.id === id)
        ?.name || id
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary-from to-primary-to flex items-center justify-center">
          <Key className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Columns</h2>
          <p className="text-sm text-neutral-400">
            {table.schema.length} columns defined
          </p>
        </div>
      </div>

      {/* Add Column Form */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-linear-to-br from-neutral-900 via-neutral-900 to-primary/20">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] rounded-full pointer-events-none" />

        <div className="relative z-10 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Plus className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-white">Add New Column</h3>
          </div>

          <AddColumnForm
            fileId={fileId}
            databaseId={databaseId}
            availableTables={availableTables}
          />
        </div>
      </div>

      {/* Columns Table */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-linear-to-br from-neutral-900/80 via-neutral-900 to-neutral-800/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Key className="w-3.5 h-3.5" />
                    Key
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Type className="w-3.5 h-3.5" />
                    Type
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <ToggleLeft className="w-3.5 h-3.5" />
                    Required
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <List className="w-3.5 h-3.5" />
                    Array
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {table.schema.map((col) => (
                <tr
                  key={col.key}
                  className="group hover:bg-neutral-800/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-1 h-8 rounded-full ${
                          col.key.startsWith("$")
                            ? "bg-linear-to-b from-neutral-600 to-neutral-700"
                            : "bg-linear-to-b from-purple-500 to-pink-500"
                        }`}
                      />
                      <span
                        className={`font-semibold ${
                          col.key.startsWith("$")
                            ? "text-neutral-400"
                            : "text-white"
                        }`}
                      >
                        {col.key}
                      </span>
                      {col.key.startsWith("$") && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-500 uppercase">
                          System
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${getTypeColor(
                        col.type
                      )}`}
                    >
                      {col.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {col.required ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-800/50 text-neutral-500 text-xs font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
                        No
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {col.array ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-medium border border-blue-500/20">
                        <List className="w-3 h-3" />
                        Yes
                      </span>
                    ) : (
                      <span className="text-neutral-600">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {col.type === "relation" && col.relationTableId ? (
                      <span className="inline-flex items-center gap-1.5 text-neutral-300 font-mono text-xs">
                        <Link2 className="w-3 h-3 text-pink-400" />
                        {getTableName(col.relationTableId)}
                      </span>
                    ) : (
                      <span className="text-neutral-400 font-mono text-xs">
                        {col.default ?? "—"}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {col.key.startsWith("$") ? (
                      <span className="text-neutral-700 text-xs">
                        Protected
                      </span>
                    ) : (
                      <form action={deleteColumn} className="inline-block">
                        <input type="hidden" name="fileId" value={fileId} />
                        <input
                          type="hidden"
                          name="databaseId"
                          value={databaseId}
                        />
                        <input type="hidden" name="columnKey" value={col.key} />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-400 hover:text-white hover:bg-red-500/20 transition-all text-xs font-medium group-hover:opacity-100 opacity-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
