"use client";

import { X, ArrowUpDown, ArrowUp, ArrowDown, Plus } from "lucide-react";
import { ColumnDefinition } from "../../types";
import { SortConfig } from "../../lib/query";

interface SortControlsProps {
  sortConfigs: SortConfig[];
  columns: ColumnDefinition[];
  onChange: (configs: SortConfig[]) => void;
}

export default function SortControls({
  sortConfigs,
  columns,
  onChange,
}: SortControlsProps) {
  const addSort = () => {
    const availableColumns = columns.filter(
      (col) =>
        !col.key.startsWith("$") &&
        !sortConfigs.some((s) => s.column === col.key)
    );
    if (availableColumns.length === 0) return;

    onChange([
      ...sortConfigs,
      { column: availableColumns[0].key, direction: "asc" },
    ]);
  };

  const updateSort = (index: number, config: SortConfig) => {
    const newConfigs = [...sortConfigs];
    newConfigs[index] = config;
    onChange(newConfigs);
  };

  const removeSort = (index: number) => {
    onChange(sortConfigs.filter((_, i) => i !== index));
  };

  const usedColumns = sortConfigs.map((s) => s.column);
  const availableColumns = columns.filter(
    (col) => !col.key.startsWith("$") && !usedColumns.includes(col.key)
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-neutral-300">
          <ArrowUpDown className="w-4 h-4 text-neutral-500" />
          Sort By
        </div>
        {availableColumns.length > 0 && (
          <button
            onClick={addSort}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-primary hover:bg-primary/10 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        )}
      </div>

      {sortConfigs.length === 0 ? (
        <p className="text-sm text-neutral-500 italic">No sorting applied</p>
      ) : (
        <div className="space-y-2">
          {sortConfigs.map((config, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-3 rounded-xl bg-neutral-900/50 border border-neutral-800 group animate-in fade-in slide-in-from-top-2 duration-200"
            >
              {/* Priority indicator */}
              <span className="w-6 h-6 flex items-center justify-center rounded-full bg-neutral-800 text-xs text-neutral-400 font-medium">
                {index + 1}
              </span>

              {/* Column selector */}
              <select
                value={config.column}
                onChange={(e) =>
                  updateSort(index, { ...config, column: e.target.value })
                }
                className="flex-1 min-w-[120px] px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              >
                <option value={config.column}>{config.column}</option>
                {columns
                  .filter(
                    (col) =>
                      !col.key.startsWith("$") && !usedColumns.includes(col.key)
                  )
                  .map((col) => (
                    <option key={col.key} value={col.key}>
                      {col.key}
                    </option>
                  ))}
              </select>

              {/* Direction toggle */}
              <button
                onClick={() =>
                  updateSort(index, {
                    ...config,
                    direction: config.direction === "asc" ? "desc" : "asc",
                  })
                }
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                  config.direction === "asc"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-orange-500/10 border-orange-500/30 text-orange-400"
                }`}
              >
                {config.direction === "asc" ? (
                  <>
                    <ArrowUp className="w-4 h-4" />
                    <span className="text-sm">Asc</span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="w-4 h-4" />
                    <span className="text-sm">Desc</span>
                  </>
                )}
              </button>

              {/* Remove button */}
              <button
                onClick={() => removeSort(index)}
                className="p-2 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                title="Remove sort"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
