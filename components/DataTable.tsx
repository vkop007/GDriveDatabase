"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { bulkDeleteDocuments, deleteDocument, updateDocument } from "../app/actions/table";
import { DocumentValue, TableFile, RowData } from "../types";
import BulkActionBar from "./BulkActionBar";
import EditRowModal from "./EditRowModal";
import InlineEditableCell from "./InlineEditableCell";
import { PaginationControls } from "./query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Trash2,
  Database,
  Loader2,
  Shield,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  X,
  Eye,
  EyeOff,
  Settings,
} from "lucide-react";
import { useConfirm } from "../contexts/ConfirmContext";
import {
  formatRelativeTime,
  formatFullDate,
  compareValues,
  filterBySearch,
} from "../lib/utils";

interface DataTableProps {
  table: TableFile;
  fileId: string;
  databaseId: string;
  relationLookup?: Record<string, Record<string, string>>;
  // Pagination props (optional for backwards compatibility)
  totalRows?: number;
  totalPages?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

type SortDirection = "asc" | "desc" | null;

interface SortState {
  column: string | null;
  direction: SortDirection;
}

interface InlineEditState {
  rowId: string;
  columnKey: string;
}

export default function DataTable({
  table,
  fileId,
  databaseId,
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
  const [inlineEdit, setInlineEdit] = useState<InlineEditState | null>(null);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const confirm = useConfirm();

  // Initialize and persist column visibility
  useEffect(() => {
    const storageKey = `table-columns-${fileId}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setColumnVisibility(JSON.parse(saved));
    } else {
      // Initialize all columns as visible
      const initial = table.schema.reduce(
        (acc, col) => ({
          ...acc,
          [col.key]: true,
        }),
        {}
      );
      setColumnVisibility(initial);
    }
  }, [fileId, table.schema]);

  // Close column menu on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showColumnMenu) {
        setShowColumnMenu(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showColumnMenu]);

  // Save visibility to localStorage
  const toggleColumnVisibility = useCallback(
    (columnKey: string) => {
      setColumnVisibility((prev) => {
        const updated = {
          ...prev,
          [columnKey]: !prev[columnKey],
        };
        localStorage.setItem(
          `table-columns-${fileId}`,
          JSON.stringify(updated)
        );
        return updated;
      });
    },
    [fileId]
  );

  // Sorting state
  const [sortState, setSortState] = useState<SortState>({
    column: null,
    direction: null,
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Get visible columns with proper ordering: $id → user columns → $createdAt/$updatedAt
  const visibleColumns = useMemo(
    () =>
      [...table.schema]
        .sort((a, b) => {
          if (a.key === "$id") return -1;
          if (b.key === "$id") return 1;
          const isATimestamp = a.key === "$createdAt" || a.key === "$updatedAt";
          const isBTimestamp = b.key === "$createdAt" || b.key === "$updatedAt";
          if (isATimestamp && !isBTimestamp) return 1;
          if (!isATimestamp && isBTimestamp) return -1;
          if (a.key === "$createdAt" && b.key === "$updatedAt") return -1;
          if (a.key === "$updatedAt" && b.key === "$createdAt") return 1;
          return 0;
        })
        .filter((col) => columnVisibility[col.key] !== false),
    [table.schema, columnVisibility]
  );

  // Filter and sort documents
  const processedDocuments = useMemo(() => {
    let docs = [...table.documents];

    // Apply search filter
    if (searchQuery.trim()) {
      docs = filterBySearch(docs, searchQuery);
    }

    // Apply sorting
    if (sortState.column && sortState.direction) {
      const sortColumn = visibleColumns.find(
        (col) => col.key === sortState.column
      );
      if (sortColumn) {
        docs.sort((a, b) =>
          compareValues(
            a[sortState.column!],
            b[sortState.column!],
            sortColumn.type,
            sortState.direction!
          )
        );
      }
    }

    return docs;
  }, [table.documents, searchQuery, sortState, visibleColumns]);

  const allIds = processedDocuments.map((doc) => doc.$id);
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

  // Inline edit handlers
  const handleInlineEditSave = async (
    rowId: string,
    columnKey: string,
    newValue: DocumentValue
  ): Promise<boolean> => {
    try {
      const doc = table.documents.find((d) => d.$id === rowId);
      if (!doc) throw new Error("Document not found");

      const updatedDoc = {
        ...doc,
        [columnKey]: newValue,
      };

      const formData = new FormData();
      formData.append("fileId", fileId);
      formData.append("docId", rowId);
      formData.append("data", JSON.stringify(updatedDoc));
      formData.append("databaseId", databaseId);

      const result = await updateDocument(formData);

      if (!result.success) {
        if (result.errors) {
          toast.error(`Validation error: ${result.errors[0].message}`);
        } else {
          toast.error(result.error || "Failed to update row");
        }
        return false;
      }

      router.refresh();
      setInlineEdit(null);
      return true;
    } catch (error) {
      toast.error("Failed to update row");
      console.error(error);
      return false;
    }
  };

  // Keyboard navigation between cells
  const handleCellNavigation = useCallback(
    (direction: "next" | "prev") => {
      if (!inlineEdit) return;

      const currentRowIndex = processedDocuments.findIndex(
        (d) => d.$id === inlineEdit.rowId
      );
      const currentColIndex = visibleColumns.findIndex(
        (c) => c.key === inlineEdit.columnKey
      );

      let newRowIndex = currentRowIndex;
      let newColIndex = currentColIndex;

      switch (direction) {
        case "next":
          // Tab to next column, or first column of next row
          newColIndex++;
          if (newColIndex >= visibleColumns.length) {
            newColIndex = 0;
            newRowIndex++;
          }
          break;
        case "prev":
          // Shift+Tab to previous column, or last column of previous row
          newColIndex--;
          if (newColIndex < 0) {
            newColIndex = visibleColumns.length - 1;
            newRowIndex--;
          }
          break;
      }

      // Bounds checking
      if (newRowIndex < 0 || newRowIndex >= processedDocuments.length) {
        return;
      }

      // Skip system fields when navigating
      while (visibleColumns[newColIndex]?.key.startsWith("$")) {
        if (direction === "next") {
          newColIndex++;
        } else {
          newColIndex--;
        }

        if (newColIndex < 0 || newColIndex >= visibleColumns.length) {
          if (direction === "next") {
            newRowIndex++;
            newColIndex = 0;
          } else {
            newRowIndex--;
            newColIndex = visibleColumns.length - 1;
          }
          break;
        }
      }

      // Final bounds check
      if (newRowIndex < 0 || newRowIndex >= processedDocuments.length) {
        return;
      }

      const newDoc = processedDocuments[newRowIndex];
      const newCol = visibleColumns[newColIndex];

      if (newDoc && newCol && !newCol.key.startsWith("$")) {
        setInlineEdit({ rowId: newDoc.$id, columnKey: newCol.key });
      }
    },
    [inlineEdit, processedDocuments, visibleColumns]
  );

  // Handle column sort
  const handleSort = useCallback((columnKey: string) => {
    setSortState((prev) => {
      if (prev.column !== columnKey) {
        return { column: columnKey, direction: "asc" };
      }
      if (prev.direction === "asc") {
        return { column: columnKey, direction: "desc" };
      }
      return { column: null, direction: null };
    });
  }, []);

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
    } catch {
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
    } catch {
      toast.error("Failed to delete row");
    } finally {
      setDeletingRowId(null);
    }
  };

  // Render sort icon for column header
  const renderSortIcon = (columnKey: string) => {
    const isActive = sortState.column === columnKey;
    const iconClass = `w-3.5 h-3.5 transition-all ${
      isActive
        ? "text-primary"
        : "text-slate-400 group-hover:text-slate-600 dark:text-neutral-600 dark:group-hover:text-neutral-400"
    }`;

    if (!isActive) {
      return <ArrowUpDown className={iconClass} />;
    }
    if (sortState.direction === "asc") {
      return <ArrowUp className={iconClass} />;
    }
    return <ArrowDown className={iconClass} />;
  };

  // Highlight search matches in text
  const highlightText = (text: string) => {
    if (!searchQuery.trim()) return text;
    const query = searchQuery.toLowerCase();
    const lowerText = text.toLowerCase();
    const index = lowerText.indexOf(query);

    if (index === -1) return text;

    return (
      <>
        {text.slice(0, index)}
        <mark className="bg-primary/30 text-white rounded px-0.5">
          {text.slice(index, index + query.length)}
        </mark>
        {text.slice(index + query.length)}
      </>
    );
  };

  return (
    <>
      {/* Search Bar & Column Visibility */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="relative w-full flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search across all columns..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-950 placeholder:text-slate-400 transition-all focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-neutral-800 dark:bg-neutral-900/80 dark:text-white dark:placeholder:text-neutral-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Column Visibility Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowColumnMenu(!showColumnMenu)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 transition-all hover:border-slate-300 hover:text-slate-950 sm:w-auto dark:border-neutral-800 dark:bg-neutral-900/80 dark:text-neutral-400 dark:hover:border-neutral-700 dark:hover:text-white"
            title="Toggle column visibility"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Columns</span>
            {Object.values(columnVisibility).filter((v) => !v).length > 0 && (
              <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                {Object.values(columnVisibility).filter((v) => !v).length} hidden
              </span>
            )}
          </button>

          {/* Column Visibility Menu */}
          {showColumnMenu && (
            <div className="absolute right-0 z-50 mt-2 max-h-[70vh] w-[min(14rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-200 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="border-b border-slate-200 p-3 dark:border-neutral-800">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                  Show/Hide Columns
                </p>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {table.schema.map((col) => (
                  <button
                    key={col.key}
                    onClick={() => toggleColumnVisibility(col.key)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-slate-100 dark:hover:bg-neutral-800/50"
                  >
                    <div className="shrink-0 w-4">
                      {columnVisibility[col.key] !== false ? (
                        <Eye className="w-4 h-4 text-primary" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-slate-400 dark:text-neutral-600" />
                      )}
                    </div>
                    <span
                      className={`flex-1 ${
                        columnVisibility[col.key] !== false
                          ? "text-slate-950 dark:text-white"
                          : "text-slate-400 dark:text-neutral-500"
                      }`}
                    >
                      {col.key.replace(/^\$/, "")}
                    </span>
                    {col.key.startsWith("$") && (
                      <span className="text-xs text-slate-400 dark:text-neutral-600">System</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-500">
                {Object.values(columnVisibility).filter((v) => v).length} of{" "}
                {table.schema.length} visible
              </div>
            </div>
          )}
        </div>
      </div>

      {searchQuery && (
        <p className="text-xs text-slate-500 mt-2 dark:text-neutral-500">
          Found{" "}
          <span className="text-primary font-medium">
            {processedDocuments.length}
          </span>{" "}
          result{processedDocuments.length !== 1 ? "s" : ""} for &quot;
          {searchQuery}&quot;
        </p>
      )}

      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5 dark:border-neutral-800 dark:bg-linear-to-br dark:from-neutral-900/90 dark:via-neutral-900 dark:to-neutral-800/60 dark:shadow-xl">
        {/* Subtle glow effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full text-left text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-slate-200 bg-slate-50/95 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/95">
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
                      className="w-4 h-4 rounded border-slate-300 bg-white text-primary focus:ring-primary/30 focus:ring-offset-0 cursor-pointer transition-all dark:border-neutral-600 dark:bg-neutral-950"
                      disabled={allIds.length === 0}
                    />
                  </div>
                </th>
                {visibleColumns.map((col) => (
                  <th key={col.key} className="px-6 py-4">
                    <button
                      onClick={() => handleSort(col.key)}
                      className="group flex items-center gap-2 transition-colors w-full hover:text-slate-950 dark:hover:text-white"
                    >
                      <span
                        className={`text-xs font-semibold uppercase tracking-wider ${
                          col.key.startsWith("$")
                            ? "text-slate-400 group-hover:text-slate-600 dark:text-neutral-600 dark:group-hover:text-neutral-400"
                            : "text-slate-500 group-hover:text-slate-950 dark:text-neutral-400 dark:group-hover:text-white"
                        }`}
                      >
                        {col.key.replace(/^\$/, "")}
                      </span>
                      {!col.key.startsWith("$") && (
                        <>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium dark:bg-neutral-800 dark:text-neutral-500">
                            {col.type}
                          </span>
                          {col.validation && (
                            <span title="Has validation rules">
                              <Shield className="w-3 h-3 text-emerald-500" />
                            </span>
                          )}
                          {col.unique && (
                            <span title="Unique Value">
                              <Shield className="w-3 h-3 text-purple-500" />
                            </span>
                          )}
                        </>
                      )}
                      {renderSortIcon(col.key)}
                    </button>
                  </th>
                ))}
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right dark:text-neutral-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-neutral-800/50">
              {processedDocuments.length === 0 ? (
                <tr>
                  <td
                    colSpan={visibleColumns.length + 2}
                    className="text-center py-16"
                  >
                    <div className="flex flex-col items-center gap-4 py-4">
                      <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-slate-100 to-white flex items-center justify-center border border-slate-200 dark:from-neutral-800/80 dark:to-neutral-800/30 dark:border-neutral-700/50">
                        {searchQuery ? (
                          <Search className="w-10 h-10 text-slate-400 dark:text-neutral-500" />
                        ) : (
                          <Database className="w-10 h-10 text-slate-400 dark:text-neutral-500" />
                        )}
                      </div>
                      <div className="text-center">
                        <p className="text-slate-700 font-medium text-lg dark:text-neutral-300">
                          {searchQuery ? "No results found" : "No data yet"}
                        </p>
                        <p className="text-sm text-slate-500 mt-1 max-w-xs dark:text-neutral-500">
                          {searchQuery
                            ? `No rows match "${searchQuery}"`
                            : "Add your first row to get started with your table"}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                processedDocuments.map((doc) => {
                  const isSelected = selectedIds.has(doc.$id);
                  return (
                    <tr
                      key={doc.$id}
                      className={`group transition-colors ${
                        isSelected
                          ? "bg-primary/10 hover:bg-primary/15"
                          : "hover:bg-slate-50 dark:hover:bg-neutral-800/30"
                      }`}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRow(doc.$id)}
                            className="w-4 h-4 rounded border-slate-300 bg-white text-primary focus:ring-primary/20 focus:ring-offset-0 cursor-pointer dark:border-neutral-700 dark:bg-neutral-950"
                          />
                        </div>
                      </td>
                      {visibleColumns.map((col) => {
                        const value = doc[col.key];
                        const displayValue =
                          typeof value === "object"
                            ? JSON.stringify(value)
                            : String(value ?? "");

                        const isId = col.key === "$id";
                        const isTimestamp =
                          col.key === "$createdAt" || col.key === "$updatedAt";
                        const isDate = col.type === "datetime";
                        const isRelation = col.type === "relation";
                        const isBoolean = col.type === "boolean";

                        return (
                          <td key={col.key} className="px-6 py-4">
                            {isId ? (
                              <code
                                onClick={() => {
                                  navigator.clipboard.writeText(displayValue);
                                  toast.success("ID copied to clipboard");
                                }}
                                className="text-xs font-mono px-2 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200 cursor-pointer hover:bg-slate-200 hover:text-slate-950 transition-colors dark:bg-neutral-800/50 dark:text-neutral-400 dark:border-neutral-700/50 dark:hover:bg-neutral-700/50 dark:hover:text-white"
                                title="Click to copy"
                              >
                                {displayValue.slice(0, 8)}...
                              </code>
                            ) : isTimestamp ? (
                              <span
                                className="text-slate-500 text-sm cursor-help dark:text-neutral-400"
                                title={formatFullDate(displayValue)}
                                suppressHydrationWarning
                              >
                                {formatRelativeTime(displayValue)}
                              </span>
                            ) : isBoolean ? (
                              <span
                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                                  value
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : "bg-slate-100 text-slate-500 border border-slate-200 dark:bg-neutral-700/30 dark:text-neutral-400 dark:border-neutral-600/20"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    value ? "bg-emerald-400" : "bg-slate-400 dark:bg-neutral-500"
                                  }`}
                                />
                                {value ? "true" : "false"}
                              </span>
                            ) : isDate ? (
                              <span
                                className="text-slate-500 text-sm cursor-help dark:text-neutral-400"
                                title={formatFullDate(displayValue)}
                                suppressHydrationWarning
                              >
                                {formatRelativeTime(displayValue)}
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
                                  <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden dark:bg-neutral-800 dark:border-neutral-700">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
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
                                <span className="text-slate-400 dark:text-neutral-600">—</span>
                              )
                            ) : col.array ? (
                              <div className="flex items-center gap-1 max-w-[200px] overflow-hidden">
                                {Array.isArray(value) && value.length > 0 ? (
                                  <>
                                    {value.slice(0, 2).map((item, i) => (
                                      <span
                                        key={i}
                                        className="inline-flex px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20 whitespace-nowrap"
                                      >
                                        {String(item).length > 10
                                          ? `${String(item).slice(0, 10)}...`
                                          : String(item)}
                                      </span>
                                    ))}
                                    {value.length > 2 && (
                                      <span className="text-xs text-slate-500 whitespace-nowrap dark:text-neutral-500">
                                        +{value.length - 2}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-slate-500 dark:text-neutral-500">—</span>
                                )}
                              </div>
                            ) : (
                              <InlineEditableCell
                                value={value}
                                displayValue={displayValue}
                                columnType={
                                  col.type as
                                    | "text"
                                    | "number"
                                    | "email"
                                    | "date"
                                    | "datetime"
                                    | "boolean"
                                }
                                isEditing={
                                  inlineEdit?.rowId === doc.$id &&
                                  inlineEdit?.columnKey === col.key
                                }
                                onEditStart={() =>
                                  setInlineEdit({ rowId: doc.$id, columnKey: col.key })
                                }
                                onCancel={() => setInlineEdit(null)}
                                onSave={(newValue) =>
                                  handleInlineEditSave(doc.$id, col.key, newValue)
                                }
                                onNavigate={handleCellNavigation}
                                highlightText={highlightText}
                              />
                            )}
                          </td>
                        );
                      })}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingDocument(doc)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-primary hover:bg-primary/10 transition-all text-xs font-medium dark:hover:text-white dark:hover:bg-primary/20"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleSingleDelete(doc.$id)}
                            disabled={deletingRowId === doc.$id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-all text-xs font-medium disabled:opacity-50 dark:text-red-400 dark:hover:text-white dark:hover:bg-red-500/20"
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
        ) : processedDocuments.length > 0 ? (
          <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 dark:border-neutral-800/50 dark:bg-neutral-900/50">
            <p className="text-xs text-slate-500 dark:text-neutral-500">
              Showing{" "}
              <span className="text-slate-700 font-medium dark:text-neutral-400">
                {processedDocuments.length}
              </span>{" "}
              row{processedDocuments.length !== 1 ? "s" : ""}
              {searchQuery && (
                <span className="text-primary ml-1">
                  (filtered from {table.documents.length})
                </span>
              )}
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
          databaseId={databaseId}
          schema={table.schema}
          document={editingDocument}
        />
      )}
    </>
  );
}
