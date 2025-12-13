"use client";

import { useState } from "react";
import { bulkDeleteDocuments, deleteDocument } from "../app/actions/table";
import { TableFile } from "../types";
import BulkActionBar from "./BulkActionBar";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface DataTableProps {
  table: TableFile;
  fileId: string;
}

export default function DataTable({ table, fileId }: DataTableProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const allIds = table.documents.map((doc) => doc.$id);
  const allSelected =
    allIds.length > 0 && allIds.every((id) => selectedIds.has(id));
  const someSelected = allIds.some((id) => selectedIds.has(id));

  const toggleRow = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    const confirmed = confirm(
      `Are you sure you want to delete ${selectedIds.size} row${
        selectedIds.size > 1 ? "s" : ""
      }? This action cannot be undone.`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const result = await bulkDeleteDocuments(fileId, Array.from(selectedIds));
      if (result.success) {
        toast.success(
          `Deleted ${result.deletedCount} row${
            result.deletedCount !== 1 ? "s" : ""
          }`
        );
        setSelectedIds(new Set());
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete rows");
      }
    } catch (error) {
      toast.error("An error occurred while deleting");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-neutral-900 text-neutral-400 font-medium">
            <tr>
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) {
                      input.indeterminate = someSelected && !allSelected;
                    }
                  }}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-purple-500 focus:ring-purple-500 focus:ring-offset-neutral-900 cursor-pointer"
                  disabled={allIds.length === 0}
                />
              </th>
              {table.schema.map((col) => (
                <th key={col.key} className="px-6 py-3">
                  {col.key}
                </th>
              ))}
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {table.documents.length === 0 ? (
              <tr>
                <td
                  colSpan={table.schema.length + 2}
                  className="px-6 py-12 text-center text-neutral-500"
                >
                  No data yet. Add your first row above.
                </td>
              </tr>
            ) : (
              table.documents.map((doc) => {
                const isSelected = selectedIds.has(doc.$id);
                return (
                  <tr
                    key={doc.$id}
                    className={`hover:bg-neutral-800/50 transition-colors ${
                      isSelected ? "bg-purple-500/10" : ""
                    }`}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRow(doc.$id)}
                        className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-purple-500 focus:ring-purple-500 focus:ring-offset-neutral-900 cursor-pointer"
                      />
                    </td>
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
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <BulkActionBar
        selectedCount={selectedIds.size}
        onDelete={handleBulkDelete}
        onClear={clearSelection}
        isDeleting={isDeleting}
      />
    </>
  );
}
