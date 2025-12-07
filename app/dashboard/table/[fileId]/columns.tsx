import { updateTableSchema, deleteColumn } from "../../../actions/table";
import { TableFile } from "../../../../types";

export default function ColumnsView({
  table,
  fileId,
}: {
  table: TableFile;
  fileId: string;
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Columns</h2>
        {/* Simple Add Column Form for now - could be a modal later */}
        <div className="flex gap-2">
          {/* We'll use a hidden checkbox hack or just a details/summary for a simple inline form if not using client components for state */}
        </div>
      </div>

      {/* Add Column Form */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
        <h3 className="text-sm font-medium mb-4 text-neutral-400">
          Add New Column
        </h3>
        <form
          action={updateTableSchema}
          className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
        >
          <input type="hidden" name="fileId" value={fileId} />

          <div className="space-y-1">
            <label className="text-xs text-neutral-500">Key</label>
            <input
              type="text"
              name="key"
              placeholder="e.g. email"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-neutral-500">Type</label>
            <select
              name="type"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
            >
              <option value="string">String</option>
              <option value="integer">Integer</option>
              <option value="boolean">Boolean</option>
              <option value="datetime">Datetime</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pb-2">
            <input
              type="checkbox"
              name="required"
              id="required"
              className="rounded bg-neutral-950 border-neutral-800"
            />
            <label htmlFor="required" className="text-sm text-neutral-400">
              Required
            </label>
          </div>

          <div className="flex items-center gap-2 pb-2">
            <input
              type="checkbox"
              name="array"
              id="array"
              className="rounded bg-neutral-950 border-neutral-800"
            />
            <label htmlFor="array" className="text-sm text-neutral-400">
              Array
            </label>
          </div>

          <button className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium">
            Add Column
          </button>
        </form>
      </div>

      {/* Columns List */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-900 text-neutral-400 font-medium">
            <tr>
              <th className="px-6 py-3">Key</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Required</th>
              <th className="px-6 py-3">Array</th>
              <th className="px-6 py-3">Default</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {table.schema.map((col) => (
              <tr
                key={col.key}
                className="hover:bg-neutral-800/50 transition-colors"
              >
                <td className="px-6 py-4 font-medium text-white">{col.key}</td>
                <td className="px-6 py-4 text-purple-400">{col.type}</td>
                <td className="px-6 py-4">
                  {col.required ? (
                    <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs">
                      Yes
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full bg-neutral-800 text-neutral-500 text-xs">
                      No
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {col.array ? (
                    <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs">
                      Yes
                    </span>
                  ) : (
                    <span className="text-neutral-600">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-neutral-400">
                  {col.default ?? "-"}
                </td>
                <td className="px-6 py-4">
                  {col.key.startsWith("$") ? (
                    <span className="text-neutral-600">-</span>
                  ) : (
                    <form action={deleteColumn} className="inline-block">
                      <input type="hidden" name="fileId" value={fileId} />
                      <input type="hidden" name="columnKey" value={col.key} />
                      <button
                        type="submit"
                        className="text-red-500 hover:text-red-400 transition-colors text-sm"
                      >
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
  );
}
