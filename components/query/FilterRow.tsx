"use client";

import { X } from "lucide-react";
import { ColumnDefinition, FilterCondition, FilterOperator } from "../../types";
import { operatorLabels, operatorsByType } from "../../lib/query";

interface FilterRowProps {
  filter: FilterCondition;
  columns: ColumnDefinition[];
  onChange: (filter: FilterCondition) => void;
  onRemove: () => void;
}

export default function FilterRow({
  filter,
  columns,
  onChange,
  onRemove,
}: FilterRowProps) {
  // Get selected column definition
  const selectedColumn = columns.find((col) => col.key === filter.column);
  const columnType = selectedColumn?.type || "string";
  const availableOperators =
    operatorsByType[columnType] || operatorsByType.string;

  // Handle column change
  const handleColumnChange = (newColumn: string) => {
    const newColumnDef = columns.find((col) => col.key === newColumn);
    const newType = newColumnDef?.type || "string";
    const newOperators = operatorsByType[newType] || operatorsByType.string;

    // Reset operator if current one isn't valid for new type
    const newOperator = newOperators.includes(filter.operator)
      ? filter.operator
      : newOperators[0];

    onChange({
      ...filter,
      column: newColumn,
      operator: newOperator,
      value: "",
    });
  };

  return (
    <div className="flex items-center gap-2 p-3 rounded-xl bg-neutral-900/50 border border-neutral-800 group animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Column selector */}
      <select
        value={filter.column}
        onChange={(e) => handleColumnChange(e.target.value)}
        className="flex-1 min-w-[120px] px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
      >
        <option value="" disabled>
          Select column
        </option>
        {columns
          .filter((col) => !col.key.startsWith("$"))
          .map((col) => (
            <option key={col.key} value={col.key}>
              {col.key}
            </option>
          ))}
      </select>

      {/* Operator selector */}
      <select
        value={filter.operator}
        onChange={(e) =>
          onChange({ ...filter, operator: e.target.value as FilterOperator })
        }
        className="min-w-[100px] px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
      >
        {availableOperators.map((op) => (
          <option key={op} value={op}>
            {operatorLabels[op]}
          </option>
        ))}
      </select>

      {/* Value input */}
      {columnType === "boolean" ? (
        <select
          value={filter.value}
          onChange={(e) => onChange({ ...filter, value: e.target.value })}
          className="flex-1 min-w-[100px] px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        >
          <option value="">Select value</option>
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      ) : columnType === "datetime" ? (
        <input
          type="datetime-local"
          value={filter.value}
          onChange={(e) => onChange({ ...filter, value: e.target.value })}
          className="flex-1 min-w-[180px] px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        />
      ) : (
        <input
          type={columnType === "integer" ? "number" : "text"}
          value={filter.value}
          onChange={(e) => onChange({ ...filter, value: e.target.value })}
          placeholder="Enter value..."
          className="flex-1 min-w-[150px] px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        />
      )}

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="p-2 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
        title="Remove filter"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
