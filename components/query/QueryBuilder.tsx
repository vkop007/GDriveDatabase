"use client";

import { useState, useRef, useEffect } from "react";
import { Filter, ArrowUpDown, X, Plus, Sparkles } from "lucide-react";
import {
  ColumnDefinition,
  QueryState,
  FilterCondition,
  SortConfig,
  FilterOperator,
} from "../../types";
import {
  defaultQueryState,
  generateFilterId,
  operatorLabels,
  operatorsByType,
} from "../../lib/query";

interface QueryBuilderProps {
  columns: ColumnDefinition[];
  query: QueryState;
  onQueryChange: (query: QueryState) => void;
  totalResults: number;
  filteredResults: number;
}

export default function QueryBuilder({
  columns,
  query,
  onQueryChange,
  totalResults,
  filteredResults,
}: QueryBuilderProps) {
  const [activePanel, setActivePanel] = useState<"filter" | "sort" | null>(
    null
  );
  const panelRef = useRef<HTMLDivElement>(null);

  const hasFiltersOrSort = query.filters.length > 0 || query.sort.length > 0;
  const isFiltered = totalResults !== filteredResults;

  // Close panel on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setActivePanel(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addFilter = () => {
    const firstColumn = columns.find((col) => !col.key.startsWith("$"));
    if (!firstColumn) return;
    onQueryChange({
      ...query,
      filters: [
        ...query.filters,
        {
          id: generateFilterId(),
          column: firstColumn.key,
          operator: "eq",
          value: "",
        },
      ],
    });
    setActivePanel("filter");
  };

  const updateFilter = (id: string, updates: Partial<FilterCondition>) => {
    onQueryChange({
      ...query,
      filters: query.filters.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      ),
      page: 1,
    });
  };

  const removeFilter = (id: string) => {
    const newFilters = query.filters.filter((f) => f.id !== id);
    onQueryChange({ ...query, filters: newFilters, page: 1 });
    if (newFilters.length === 0) setActivePanel(null);
  };

  const addSort = () => {
    const available = columns.filter(
      (c) =>
        !c.key.startsWith("$") && !query.sort.some((s) => s.column === c.key)
    );
    if (available.length === 0) return;
    onQueryChange({
      ...query,
      sort: [...query.sort, { column: available[0].key, direction: "asc" }],
      page: 1,
    });
    setActivePanel("sort");
  };

  const updateSort = (index: number, config: SortConfig) => {
    const newSort = [...query.sort];
    newSort[index] = config;
    onQueryChange({ ...query, sort: newSort, page: 1 });
  };

  const removeSort = (index: number) => {
    const newSort = query.sort.filter((_, i) => i !== index);
    onQueryChange({ ...query, sort: newSort, page: 1 });
    if (newSort.length === 0) setActivePanel(null);
  };

  const clearAll = () => {
    onQueryChange({ ...defaultQueryState, pageSize: query.pageSize });
    setActivePanel(null);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Sleek toolbar */}
      <div className="flex items-center gap-3">
        {/* Filter button */}
        <button
          onClick={() => {
            if (query.filters.length === 0) addFilter();
            else setActivePanel(activePanel === "filter" ? null : "filter");
          }}
          className={`group relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
            query.filters.length > 0
              ? "border border-blue-500/20 bg-blue-500/10 text-blue-700 shadow-sm shadow-blue-500/10 dark:bg-neutral-900 dark:text-blue-300 dark:shadow-none"
              : "border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-slate-300 hover:bg-slate-100 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white"
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>Filter</span>
          {query.filters.length > 0 && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-bold">
              {query.filters.length}
            </span>
          )}
        </button>

        {/* Sort button */}
        <button
          onClick={() => {
            if (query.sort.length === 0) addSort();
            else setActivePanel(activePanel === "sort" ? null : "sort");
          }}
          className={`group relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
            query.sort.length > 0
              ? "border border-purple-500/20 bg-purple-500/10 text-purple-700 shadow-sm shadow-purple-500/10 dark:bg-neutral-900 dark:text-purple-300 dark:shadow-none"
              : "border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-slate-300 hover:bg-slate-100 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white"
          }`}
        >
          <ArrowUpDown className="w-4 h-4" />
          <span>Sort</span>
          {query.sort.length > 0 && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-500 text-white text-xs font-bold">
              {query.sort.length}
            </span>
          )}
        </button>

        {/* Results indicator */}
        {isFiltered && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs text-emerald-700 font-medium dark:text-emerald-300">
              {filteredResults} of {totalResults}
            </span>
          </div>
        )}

        {/* Clear button */}
        {hasFiltersOrSort && (
          <button
            onClick={clearAll}
            className="ml-auto text-xs text-slate-500 transition-colors hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-400"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Floating panel */}
      {activePanel && (
        <div className="absolute top-full left-0 mt-2 z-50 min-w-[400px] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl shadow-slate-900/15 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-black/50">
            {/* Glow effect */}
            <div
              className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl pointer-events-none ${
                activePanel === "filter" ? "bg-blue-500/20 dark:hidden" : "bg-purple-500/20 dark:hidden"
              }`}
            />

            {/* Header */}
            <div className="relative flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-white/5">
              <div className="flex items-center gap-2">
                {activePanel === "filter" ? (
                  <>
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                      <Filter className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-semibold text-slate-950 dark:text-white">Filters</span>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                      <ArrowUpDown className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-semibold text-slate-950 dark:text-white">Sort Order</span>
                  </>
                )}
              </div>
              <button
                onClick={() => setActivePanel(null)}
                className="p-1.5 rounded-lg text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-950 dark:text-neutral-500 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="relative p-4 space-y-3">
              {activePanel === "filter" && (
                <>
                  {query.filters.map((filter, idx) => {
                    const col = columns.find((c) => c.key === filter.column);
                    const colType = col?.type || "string";
                    const operators =
                      operatorsByType[colType] || operatorsByType.string;

                    return (
                      <div
                        key={filter.id}
                        className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 transition-all hover:border-slate-300 dark:border-white/5 dark:bg-white/5 dark:hover:border-white/10"
                      >
                        <span className="w-6 h-6 flex items-center justify-center rounded-md bg-blue-500/20 text-blue-400 text-xs font-bold">
                          {idx + 1}
                        </span>

                        <select
                          value={filter.column}
                          onChange={(e) => {
                            const newCol = columns.find(
                              (c) => c.key === e.target.value
                            );
                            const newType = newCol?.type || "string";
                            const newOps =
                              operatorsByType[newType] ||
                              operatorsByType.string;
                            updateFilter(filter.id, {
                              column: e.target.value,
                              operator: newOps.includes(filter.operator)
                                ? filter.operator
                                : newOps[0],
                              value: "",
                            });
                          }}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer dark:border-transparent dark:bg-neutral-800 dark:text-white"
                        >
                          {columns
                            .filter((c) => !c.key.startsWith("$"))
                            .map((c) => (
                              <option key={c.key} value={c.key}>
                                {c.key}
                              </option>
                            ))}
                        </select>

                        <select
                          value={filter.operator}
                          onChange={(e) =>
                            updateFilter(filter.id, {
                              operator: e.target.value as FilterOperator,
                            })
                          }
                          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer dark:border-transparent dark:bg-neutral-800 dark:text-white"
                        >
                          {operators.map((op) => (
                            <option key={op} value={op}>
                              {operatorLabels[op]}
                            </option>
                          ))}
                        </select>

                        <input
                          type={
                            colType === "integer"
                              ? "number"
                              : colType === "datetime"
                              ? "datetime-local"
                              : "text"
                          }
                          value={filter.value}
                          onChange={(e) =>
                            updateFilter(filter.id, { value: e.target.value })
                          }
                          placeholder="Enter value..."
                          className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-950 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:border-transparent dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500"
                        />

                        <button
                          onClick={() => removeFilter(filter.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all dark:text-neutral-500 dark:hover:text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}

                  <button
                    onClick={addFilter}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-slate-300 text-sm text-slate-500 transition-all hover:border-blue-500/30 hover:bg-blue-500/5 hover:text-blue-600 dark:border-white/10 dark:text-neutral-400 dark:hover:text-blue-400"
                  >
                    <Plus className="w-4 h-4" />
                    Add another filter
                  </button>
                </>
              )}

              {activePanel === "sort" && (
                <>
                  {query.sort.map((config, idx) => (
                    <div
                      key={idx}
                      className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 transition-all hover:border-slate-300 dark:border-white/5 dark:bg-white/5 dark:hover:border-white/10"
                    >
                      <span className="w-6 h-6 flex items-center justify-center rounded-md bg-purple-500/20 text-purple-400 text-xs font-bold">
                        {idx + 1}
                      </span>

                      <select
                        value={config.column}
                        onChange={(e) =>
                          updateSort(idx, { ...config, column: e.target.value })
                        }
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none cursor-pointer dark:border-transparent dark:bg-neutral-800 dark:text-white"
                      >
                        {columns
                          .filter((c) => !c.key.startsWith("$"))
                          .map((c) => (
                            <option key={c.key} value={c.key}>
                              {c.key}
                            </option>
                          ))}
                      </select>

                      <button
                        onClick={() =>
                          updateSort(idx, {
                            ...config,
                            direction:
                              config.direction === "asc" ? "desc" : "asc",
                          })
                        }
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          config.direction === "asc"
                            ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 dark:bg-neutral-900 dark:text-emerald-300"
                            : "bg-orange-500/10 text-orange-700 border border-orange-500/20 dark:bg-neutral-900 dark:text-orange-300"
                        }`}
                      >
                        {config.direction === "asc"
                          ? "↑ Ascending"
                          : "↓ Descending"}
                      </button>

                      <button
                        onClick={() => removeSort(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all dark:text-neutral-500 dark:hover:text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {query.sort.length <
                    columns.filter((c) => !c.key.startsWith("$")).length && (
                    <button
                      onClick={addSort}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-slate-300 text-sm text-slate-500 transition-all hover:border-purple-500/30 hover:bg-purple-500/5 hover:text-purple-600 dark:border-white/10 dark:text-neutral-400 dark:hover:text-purple-400"
                    >
                      <Plus className="w-4 h-4" />
                      Add another sort
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
