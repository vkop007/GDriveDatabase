import { updateTableSchema, deleteColumn } from "../../../../../actions/table";
import { TableFile } from "../../../../../../types";
import { Plus, Key, Type, ToggleLeft, List, Trash2 } from "lucide-react";
import GradientButton from "../../../../../../components/GradientButton";

export default function ColumnsView({
  table,
  fileId,
  databaseId,
}: {
  table: TableFile;
  fileId: string;
  databaseId: string;
}) {
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
      default:
        return "text-neutral-400 bg-neutral-500/10 border-neutral-500/20";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center">
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
      <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-linear-to-br from-neutral-900 via-neutral-900 to-purple-950/20">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[60px] rounded-full pointer-events-none" />

        <div className="relative z-10 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Plus className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">Add New Column</h3>
          </div>

          <form
            action={updateTableSchema}
            className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end"
          >
            <input type="hidden" name="fileId" value={fileId} />
            <input type="hidden" name="databaseId" value={databaseId} />

            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
                <Key className="w-3 h-3" />
                Key
              </label>
              <input
                type="text"
                name="key"
                placeholder="e.g. email"
                className="w-full bg-neutral-950/50 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
                <Type className="w-3 h-3" />
                Type
              </label>
              <select
                name="type"
                className="w-full bg-neutral-950/50 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all appearance-none cursor-pointer"
              >
                <option value="string">String</option>
                <option value="integer">Integer</option>
                <option value="boolean">Boolean</option>
                <option value="datetime">Datetime</option>
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <div className="h-5 mb-2" />{" "}
              {/* Spacer for alignment with labels */}
              <div className="h-[42px] flex items-center">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      name="required"
                      id="required"
                      className="sr-only peer"
                    />
                    <div className="w-12 h-7 bg-neutral-800 rounded-full peer-checked:bg-linear-to-r peer-checked:from-purple-600 peer-checked:to-pink-600 transition-all border border-neutral-700 peer-checked:border-purple-500/50 shadow-inner" />
                    <div className="absolute left-1 top-1 w-5 h-5 bg-neutral-400 rounded-full transition-all peer-checked:translate-x-5 peer-checked:bg-white shadow-sm" />
                  </div>
                  <span className="text-sm text-neutral-400 group-hover:text-white transition-colors">
                    Required
                  </span>
                </label>
              </div>
            </div>

            <div className="flex flex-col justify-end">
              <div className="h-5 mb-2" />{" "}
              {/* Spacer for alignment with labels */}
              <div className="h-[42px] flex items-center">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      name="array"
                      id="array"
                      className="sr-only peer"
                    />
                    <div className="w-12 h-7 bg-neutral-800 rounded-full peer-checked:bg-linear-to-r peer-checked:from-blue-600 peer-checked:to-cyan-600 transition-all border border-neutral-700 peer-checked:border-blue-500/50 shadow-inner" />
                    <div className="absolute left-1 top-1 w-5 h-5 bg-neutral-400 rounded-full transition-all peer-checked:translate-x-5 peer-checked:bg-white shadow-sm" />
                  </div>
                  <span className="text-sm text-neutral-400 group-hover:text-white transition-colors">
                    Array
                  </span>
                </label>
              </div>
            </div>

            <div className="flex flex-col justify-end">
              <div className="h-5 mb-2" /> {/* Spacer */}
              <div className="h-[42px] flex items-center">
                <GradientButton
                  type="submit"
                  icon={<Plus className="w-4 h-4" />}
                >
                  Add Column
                </GradientButton>
              </div>
            </div>
          </form>
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
                  Default
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
                    <span className="text-neutral-400 font-mono text-xs">
                      {col.default ?? "—"}
                    </span>
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
