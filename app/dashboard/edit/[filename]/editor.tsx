"use client";

import { useState, useEffect } from "react";
import { saveDocument } from "../../../actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { JsonTableEditorProps, JsonType } from "../../../../types";
import Link from "next/link";

export default function JsonTableEditor({
  initialContent,
  fileId,
  filename,
}: JsonTableEditorProps) {
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [jsonType, setJsonType] = useState<JsonType>("array");
  const [viewMode, setViewMode] = useState<"table" | "raw">("table");
  const [rawContent, setRawContent] = useState(initialContent);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Helper to parse value safely
  const parseValue = (val: string) => {
    try {
      // Try to parse as JSON (numbers, booleans, objects, arrays)
      return JSON.parse(val);
    } catch {
      // If fails, return as string
      return val;
    }
  };

  useEffect(() => {
    try {
      const parsed = JSON.parse(initialContent);
      if (Array.isArray(parsed)) {
        setJsonType("array");
        setData(parsed);
        const keys = new Set<string>();
        parsed.forEach((item) => {
          if (typeof item === "object" && item !== null) {
            Object.keys(item).forEach((k) => keys.add(k));
          }
        });
        setColumns(Array.from(keys));
        setViewMode("table");
      } else if (typeof parsed === "object" && parsed !== null) {
        setJsonType("object");
        // Convert object to array of { key, value } for table editing
        const kvArray = Object.entries(parsed).map(([k, v]) => ({
          key: k,
          value: v,
        }));
        setData(kvArray);
        setColumns(["key", "value"]);
        setViewMode("table");
      } else {
        setViewMode("raw");
      }
    } catch (e) {
      setViewMode("raw");
    }
  }, [initialContent]);

  const updateRawContent = (newData: any[], type: JsonType) => {
    if (type === "array") {
      // For raw content, we map data and try to parse values
      const dataForRaw = newData.map((row) => {
        const newRow: any = {};
        Object.keys(row).forEach((k) => {
          newRow[k] = parseValue(row[k]);
        });
        return newRow;
      });
      setRawContent(JSON.stringify(dataForRaw, null, 2));
    } else {
      // Reconstruct object from key-value array
      const newObj = newData.reduce((acc, item) => {
        if (item.key) {
          acc[item.key] = parseValue(item.value);
        }
        return acc;
      }, {} as Record<string, any>);
      setRawContent(JSON.stringify(newObj, null, 2));
    }
  };

  const handleCellChange = (
    rowIndex: number,
    column: string,
    value: string
  ) => {
    const newData = [...data];

    if (jsonType === "array") {
      // For arrays, we try to preserve types if possible, or just store string
      // But for input display we need string.
      // Here we are setting the value in data.
      // If the user types "true", should it be boolean true?
      // Let's keep it simple: store what they type as string in data for now,
      // but when saving rawContent, we might want to parse it?
      // Actually, for the table input to work nicely, data[rowIndex][column] should be the string value.
      // But rawContent needs the real type.

      // Let's try to parse for the raw content update, but keep string in data for input
      // Wait, if we parse it, the input value (which reads from data) might change format (e.g. 1.0 -> 1)
      // Let's just update data with the string value for now to keep input stable.
      // But wait, if we save "true" as string "true", it changes type.

      // Better approach: Update data with the string value (for UI).
      // When generating rawContent, try to parse values.

      newData[rowIndex] = { ...newData[rowIndex], [column]: value };
      setData(newData);

      // For raw content, we map data and try to parse values
      const dataForRaw = newData.map((row) => {
        const newRow: any = {};
        Object.keys(row).forEach((k) => {
          newRow[k] = parseValue(row[k]);
        });
        return newRow;
      });
      setRawContent(JSON.stringify(dataForRaw, null, 2));
    } else {
      // Object mode: column is either "key" or "value"
      newData[rowIndex] = { ...newData[rowIndex], [column]: value };
      setData(newData);

      // Reconstruct object
      const newObj = newData.reduce((acc, item) => {
        if (item.key) {
          acc[item.key] =
            column === "value" ? parseValue(item.value) : item.value;
        }
        return acc;
      }, {} as Record<string, any>);
      setRawContent(JSON.stringify(newObj, null, 2));
    }
  };

  const handleRawChange = (value: string) => {
    setRawContent(value);
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        setJsonType("array");
        setData(parsed);
        const keys = new Set<string>();
        parsed.forEach((item) => {
          if (typeof item === "object" && item !== null) {
            Object.keys(item).forEach((k) => keys.add(k));
          }
        });
        setColumns(Array.from(keys));
      } else if (typeof parsed === "object" && parsed !== null) {
        setJsonType("object");
        const kvArray = Object.entries(parsed).map(([k, v]) => ({
          key: k,
          value: v,
        }));
        setData(kvArray);
        setColumns(["key", "value"]);
      }
      setError(null);
    } catch (e) {
      setError("Invalid JSON");
    }
  };

  const addRow = () => {
    if (jsonType === "array") {
      const newRow: any = {};
      columns.forEach((col) => (newRow[col] = ""));
      const newData = [...data, newRow];
      setData(newData);
      updateRawContent(newData, "array");
    } else {
      const newData = [...data, { key: "", value: "" }];
      setData(newData);
      updateRawContent(newData, "object");
    }
  };

  const deleteRow = (index: number) => {
    const newData = data.filter((_, i) => i !== index);
    setData(newData);
    updateRawContent(newData, jsonType);
  };

  const addColumn = () => {
    if (jsonType === "object") return; // No columns in object mode
    const name = prompt("Enter column name:");
    if (name && !columns.includes(name)) {
      setColumns([...columns, name]);
      // Update data to include this key? Not strictly necessary until value is set
    }
  };

  return (
    <div className="space-y-6">
      {/* Header / Toolbar */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-4">
          <div className="flex bg-neutral-900/50 p-1 rounded-lg border border-neutral-800">
            <button
              onClick={() => setViewMode("table")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === "table"
                  ? "bg-neutral-800 text-white shadow-sm"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode("raw")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === "raw"
                  ? "bg-neutral-800 text-white shadow-sm"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
              }`}
            >
              Raw JSON
            </button>
          </div>
          <span className="text-neutral-600 text-sm">|</span>
          <div className="text-sm text-neutral-400">
            {jsonType === "array" ? "List Mode" : "Key-Value Mode"} •{" "}
            {data.length} Rows
          </div>
        </div>

        {viewMode === "table" && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={addRow}
              className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm font-medium transition-colors border border-neutral-700"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Row
            </button>
            {jsonType === "array" && (
              <button
                type="button"
                onClick={addColumn}
                className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm font-medium transition-colors border border-neutral-700"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Column
              </button>
            )}
          </div>
        )}
      </div>

      {/* Editor Area */}
      {viewMode === "table" ? (
        <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900/30 shadow-inner">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-xs text-neutral-400 uppercase bg-neutral-900/80 border-b border-neutral-800 sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                  <th className="px-4 py-3 font-semibold w-12 text-center border-r border-neutral-800">
                    #
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 font-semibold min-w-[150px] border-r border-neutral-800 last:border-r-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-purple-400">
                          {jsonType === "object" && col === "key"
                            ? "Attribute"
                            : col === "value"
                            ? "Value"
                            : "T"}
                        </span>
                        {jsonType === "object"
                          ? col === "key"
                            ? "Key"
                            : "Value"
                          : col}
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 font-semibold w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {data.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="group bg-transparent hover:bg-neutral-800/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-neutral-600 text-center border-r border-neutral-800 font-mono text-xs">
                      {rowIndex + 1}
                    </td>
                    {columns.map((col) => (
                      <td
                        key={`${rowIndex}-${col}`}
                        className="p-0 border-r border-neutral-800 last:border-r-0 relative"
                      >
                        <input
                          type="text"
                          className="w-full h-full px-4 py-3 bg-transparent border-none focus:ring-2 focus:ring-inset focus:ring-purple-500/50 outline-none text-neutral-300 placeholder-neutral-800 transition-all font-mono text-xs"
                          value={
                            typeof row[col] === "object"
                              ? JSON.stringify(row[col])
                              : row[col] === undefined || row[col] === null
                              ? ""
                              : String(row[col])
                          }
                          onChange={(e) =>
                            handleCellChange(rowIndex, col, e.target.value)
                          }
                          placeholder="null"
                        />
                      </td>
                    ))}
                    <td className="px-2 py-0 text-center">
                      <button
                        onClick={() => deleteRow(rowIndex)}
                        className="p-1.5 text-neutral-600 hover:text-red-400 hover:bg-red-900/20 rounded-md transition-all opacity-0 group-hover:opacity-100"
                        title="Delete Row"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td
                      colSpan={columns.length + 2}
                      className="px-6 py-12 text-center text-neutral-500"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <p>No data found</p>
                        <button
                          onClick={addRow}
                          className="text-purple-400 hover:text-purple-300 text-xs font-medium"
                        >
                          Add your first row
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-linear-to-r from-purple-600 to-blue-600 rounded-lg blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
          <textarea
            value={rawContent}
            onChange={(e) => handleRawChange(e.target.value)}
            rows={20}
            className="relative w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-purple-500/50 focus:border-transparent outline-none transition-all placeholder:text-neutral-600 text-neutral-300 leading-relaxed"
            spellCheck={false}
          />
          {error && (
            <div className="absolute bottom-4 right-4 text-red-400 text-xs bg-red-950/90 px-3 py-2 rounded-md border border-red-900/50 backdrop-blur-sm shadow-lg flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {error}
            </div>
          )}
        </div>
      )}

      {/* Footer Actions */}
      {/* Footer Actions */}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);

          const toastId = toast.loading("Saving changes...");

          try {
            const result = await saveDocument(formData);

            if (result.success) {
              toast.success("Saved successfully!", { id: toastId });
              router.push("/dashboard");
            } else {
              toast.error("Failed to save", { id: toastId });
            }
          } catch (err) {
            toast.error("An unexpected error occurred", { id: toastId });
          }
        }}
        className="flex items-center justify-end gap-4 pt-4 border-t border-neutral-800"
      >
        <input type="hidden" name="fileId" value={fileId} />
        <input type="hidden" name="filename" value={filename} />
        <input type="hidden" name="content" value={rawContent} />

        <Link
          href="/dashboard"
          className="px-6 py-2.5 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={!!error}
          className="px-8 py-2.5 bg-white text-black hover:bg-neutral-200 font-medium rounded-lg text-sm transition-all shadow-lg shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}
