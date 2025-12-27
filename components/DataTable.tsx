"use client";

import { useState } from "react";
import { bulkDeleteDocuments, deleteDocument } from "../app/actions/table";
import { TableFile, RowData } from "../types";
import BulkActionBar from "./BulkActionBar";
import EditRowModal from "./EditRowModal";
import { PaginationControls } from "./query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Database, Loader2 } from "lucide-react";
import { useConfirm } from "../contexts/ConfirmContext";

interface DataTableProps {
  table: TableFile;
  fileId: string;
  relationLookup?: Record<string, Record<string, string>>;
  // Pagination props (optional for backwards compatibility)
  totalRows?: number;
  totalPages?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export default function DataTable({
  table,
  fileId,
  relationLookup = {},
  totalRows,
  totalPages = 1,
  currentPage = 1,
  pageSize = 25,
  onPageChange,
  onPageSizeChange,
}: DataTableProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingRowId, setDeletingRowId] = useState<string | null>(null);
  const [editingDocument, setEditingDocument] = useState<RowData | null>(null);
  const confirm = useConfirm();

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

    const confirmed = await confirm({
      title: "Delete Rows",
      description: `Are you sure you want to delete ${selectedIds.size} row${
        selectedIds.size > 1 ? "s" : ""
      }? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
    });

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

  const handleSingleDelete = async (docId: string) => {
    const confirmed = await confirm({
      title: "Delete Row",
      description:
        "Are you sure you want to delete this row? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
    });

    if (!confirmed) return;

    setDeletingRowId(docId);
    try {
      const formData = new FormData();
      formData.append("fileId", fileId);
      formData.append("docId", docId);
      await deleteDocument(formData);
      toast.success("Row deleted successfully");
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete row");
    } finally {
      setDeletingRowId(null);
    }
  };

  // Get visible columns (non-system for better display)
  const visibleColumns = table.schema;

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-linear-to-br from-neutral-900/90 via-neutral-900 to-neutral-800/60 shadow-xl">
        {/* Subtle glow effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/80">
                <th className="w-12 px-4 py-4">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(input) => {
                        if (input) {
                          input.indeterminate = someSelected && !allSelected;
                        }
                      }}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded bg-neutral-950 border-neutral-600 text-primary focus:ring-primary/30 focus:ring-offset-0 cursor-pointer transition-all"
                      disabled={allIds.length === 0}
                    />
                  </div>
                </th>
                {visibleColumns.map((col) => (
                  <th key={col.key} className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold uppercase tracking-wider ${
                          col.key.startsWith("$")
                            ? "text-neutral-600"
                            : "text-neutral-400"
                        }`}
                      >
                        {col.key}
                      </span>
                      {!col.key.startsWith("$") && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-500 font-medium">
                          {col.type}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {table.documents.length === 0 ? (
                <tr>
                  <td
                    colSpan={visibleColumns.length + 2}
                    className="text-center py-16"
                  >
                    <div className="flex flex-col items-center gap-4 py-4">
                      <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-neutral-800/80 to-neutral-800/30 flex items-center justify-center border border-neutral-700/50">
                        <Database className="w-10 h-10 text-neutral-500" />
                      </div>
                      <div className="text-center">
                        <p className="text-neutral-300 font-medium text-lg">
                          No data yet
                        </p>
                        <p className="text-sm text-neutral-500 mt-1 max-w-xs">
                          Add your first row to get started with your table
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                table.documents.map((doc, rowIndex) => {
                  const isSelected = selectedIds.has(doc.$id);
                  return (
                    <tr
                      key={doc.$id}
                      className={`group transition-colors ${
                        isSelected
                          ? "bg-primary/10 hover:bg-primary/15"
                          : "hover:bg-neutral-800/30"
                      }`}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRow(doc.$id)}
                            className="w-4 h-4 rounded bg-neutral-950 border-neutral-700 text-primary focus:ring-primary/20 focus:ring-offset-0 cursor-pointer"
                          />
                        </div>
                      </td>
                      {visibleColumns.map((col) => {
                        const value = doc[col.key];
                        const displayValue =
                          typeof value === "object"
                            ? JSON.stringify(value)
                            : String(value ?? "");

                        // Style system fields differently
                        const isSystemField = col.key.startsWith("$");
                        const isId = col.key === "$id";
                        const isDate = col.type === "datetime";
                        const isRelation = col.type === "relation";

                        return (
                          <td key={col.key} className="px-6 py-4">
                            {isId ? (
                              <code className="text-xs font-mono px-2 py-1 rounded bg-neutral-800/50 text-neutral-400 border border-neutral-700/50">
                                {displayValue.slice(0, 8)}...
                              </code>
                            ) : isDate ? (
                              <span className="text-neutral-400 text-sm">
                                {new Date(displayValue).toLocaleString()}
                              </span>
                            ) : isRelation ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                {relationLookup[col.key]?.[displayValue] ||
                                  displayValue}
                              </span>
                            ) : col.type === "storage" ? (
                              value ? (
                                <a
                                  href={`/api/resources?id=${displayValue}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-primary hover:underline"
                                >
                                  <div className="w-8 h-8 rounded bg-neutral-800 border border-neutral-700 flex items-center justify-center overflow-hidden">
                                    {/* Try to show image thumbnail if possible, otherwise generic file icon */}
                                    {/* Since we only store the link, we can't be sure it's an image without metadata, but we can try */}
                                    <img
                                      src={`/api/resources?id=${displayValue}`}
                                      alt="File"
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                        e.currentTarget.parentElement?.classList.add(
                                          "bg-neutral-800"
                                        );
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs truncate max-w-[150px]">
                                    View File
                                  </span>
                                </a>
                              ) : (
                                <span className="text-neutral-600">—</span>
                              )
                            ) : col.array ? (
                              <div className="flex flex-wrap gap-1.5">
                                {Array.isArray(value) ? (
                                  value.slice(0, 3).map((item, i) => (
                                    <span
                                      key={i}
                                      className="inline-flex px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20"
                                    >
                                      {String(item)}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-neutral-500">—</span>
                                )}
                                {Array.isArray(value) && value.length > 3 && (
                                  <span className="text-xs text-neutral-500">
                                    +{value.length - 3} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span
                                className={`${
                                  isSystemField
                                    ? "text-neutral-500"
                                    : "text-white"
                                } truncate block max-w-[200px]`}
                                title={displayValue}
                              >
                                {displayValue || (
                                  <span className="text-neutral-600">—</span>
                                )}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingDocument(doc)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-primary hover:text-white hover:bg-primary/20 transition-all text-xs font-medium"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleSingleDelete(doc.$id)}
                            disabled={deletingRowId === doc.$id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-400 hover:text-white hover:bg-red-500/20 transition-all text-xs font-medium disabled:opacity-50"
                          >
                            {deletingRowId === doc.$id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer with pagination */}
        {totalRows !== undefined && onPageChange && onPageSizeChange ? (
          <PaginationControls
            page={currentPage}
            pageSize={pageSize}
            total={totalRows}
            totalPages={totalPages}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        ) : table.documents.length > 0 ? (
          <div className="px-6 py-3 border-t border-neutral-800/50 bg-neutral-900/50">
            <p className="text-xs text-neutral-500">
              Showing{" "}
              <span className="text-neutral-400 font-medium">
                {table.documents.length}
              </span>{" "}
              row{table.documents.length !== 1 ? "s" : ""}
              {selectedIds.size > 0 && (
                <span className="ml-2 text-primary">
                  • {selectedIds.size} selected
                </span>
              )}
            </p>
          </div>
        ) : null}
      </div>

      <BulkActionBar
        selectedCount={selectedIds.size}
        onDelete={handleBulkDelete}
        onClear={clearSelection}
        isDeleting={isDeleting}
      />

      {editingDocument && (
        <EditRowModal
          isOpen={!!editingDocument}
          onClose={() => setEditingDocument(null)}
          fileId={fileId}
          schema={table.schema}
          document={editingDocument}
        />
      )}
    </>
  );
}
