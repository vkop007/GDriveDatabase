// Validation rules for column definitions
export interface ValidationRules {
  // String validations
  minLength?: number;
  maxLength?: number;
  pattern?: string; // Regex pattern
  email?: boolean; // Email format
  url?: boolean; // URL format

  // Number validations
  min?: number;
  max?: number;

  // Enum validation (for dropdowns)
  enum?: string[];

  // Custom error message
  message?: string;
}

export interface ColumnDefinition {
  key: string;
  type: "string" | "integer" | "boolean" | "datetime" | "relation" | "storage";
  required: boolean;
  default?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  array?: boolean;
  relationTableId?: string;
  validation?: ValidationRules;
  unique?: boolean;
  indexed?: boolean;
  indexFileId?: string;
}

export interface RowData {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface TableFile {
  name: string;
  schema: ColumnDefinition[];
  documents: RowData[];
}

export interface JsonTableEditorProps {
  initialContent: string;
  fileId: string;
  filename: string;
}

export type JsonType = "array" | "object";

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Query state types
export interface FilterCondition {
  id: string;
  column: string;
  operator: FilterOperator;
  value: string;
}

export type FilterOperator =
  | "eq"
  | "neq"
  | "contains"
  | "gt"
  | "lt"
  | "gte"
  | "lte";

export interface SortConfig {
  column: string;
  direction: "asc" | "desc";
}

export interface QueryState {
  filters: FilterCondition[];
  sort: SortConfig[];
  page: number;
  pageSize: number;
}

export interface QueryResult {
  data: RowData[];
  total: number;
  totalPages: number;
}
