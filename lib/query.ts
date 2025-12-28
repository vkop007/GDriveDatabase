"use client";

import {
  RowData,
  FilterCondition,
  FilterOperator,
  SortConfig,
  QueryState,
  QueryResult,
} from "../types";

// Operator labels for UI
export const operatorLabels: Record<FilterOperator, string> = {
  eq: "equals",
  neq: "not equals",
  contains: "contains",
  gt: "greater than",
  lt: "less than",
  gte: "≥",
  lte: "≤",
};

// Operators available by column type
export const operatorsByType: Record<string, FilterOperator[]> = {
  string: ["eq", "neq", "contains"],
  integer: ["eq", "neq", "gt", "lt", "gte", "lte"],
  boolean: ["eq"],
  datetime: ["eq", "gt", "lt", "gte", "lte"],
  relation: ["eq", "neq"],
  storage: ["eq", "neq"],
};

// Default query state
export const defaultQueryState: QueryState = {
  filters: [],
  sort: [],
  page: 1,
  pageSize: 25,
};

// Apply filters to documents
function applyFilters(
  documents: RowData[],
  filters: FilterCondition[]
): RowData[] {
  if (filters.length === 0) return documents;

  return documents.filter((doc) => {
    return filters.every((filter) => {
      const value = doc[filter.column];
      const filterValue = filter.value;

      // Handle null/undefined
      if (value === null || value === undefined) {
        return filter.operator === "neq";
      }

      switch (filter.operator) {
        case "eq":
          return String(value).toLowerCase() === filterValue.toLowerCase();
        case "neq":
          return String(value).toLowerCase() !== filterValue.toLowerCase();
        case "contains":
          return String(value)
            .toLowerCase()
            .includes(filterValue.toLowerCase());
        case "gt":
          return Number(value) > Number(filterValue);
        case "lt":
          return Number(value) < Number(filterValue);
        case "gte":
          return Number(value) >= Number(filterValue);
        case "lte":
          return Number(value) <= Number(filterValue);
        default:
          return true;
      }
    });
  });
}

// Apply sorting to documents
function applySorting(documents: RowData[], sort: SortConfig[]): RowData[] {
  if (sort.length === 0) return documents;

  return [...documents].sort((a, b) => {
    for (const config of sort) {
      const aVal = a[config.column];
      const bVal = b[config.column];

      let comparison = 0;

      // Handle null/undefined
      if (aVal == null && bVal == null) continue;
      if (aVal == null) return config.direction === "asc" ? 1 : -1;
      if (bVal == null) return config.direction === "asc" ? -1 : 1;

      // Compare values
      if (typeof aVal === "number" && typeof bVal === "number") {
        comparison = aVal - bVal;
      } else if (typeof aVal === "boolean" && typeof bVal === "boolean") {
        comparison = aVal === bVal ? 0 : aVal ? 1 : -1;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      if (comparison !== 0) {
        return config.direction === "asc" ? comparison : -comparison;
      }
    }
    return 0;
  });
}

// Apply pagination to documents
function applyPagination(
  documents: RowData[],
  page: number,
  pageSize: number
): RowData[] {
  const start = (page - 1) * pageSize;
  return documents.slice(start, start + pageSize);
}

// Main query function
export function applyQuery(
  documents: RowData[],
  query: QueryState
): QueryResult {
  // Apply filters
  let result = applyFilters(documents, query.filters);

  // Apply sorting
  result = applySorting(result, query.sort);

  // Get total before pagination
  const total = result.length;
  const totalPages = Math.ceil(total / query.pageSize);

  // Apply pagination
  result = applyPagination(result, query.page, query.pageSize);

  return { data: result, total, totalPages };
}

// Generate unique ID for filter conditions
export function generateFilterId(): string {
  return Math.random().toString(36).substring(2, 9);
}
