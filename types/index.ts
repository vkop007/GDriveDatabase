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

export type JsonPrimitive = string | number | boolean | null;

export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };

export type DocumentValue = JsonValue | undefined;

export type ColumnType =
  | "string"
  | "integer"
  | "boolean"
  | "datetime"
  | "relation"
  | "storage";

export interface ColumnDefinition {
  key: string;
  type: ColumnType;
  required: boolean;
  default?: DocumentValue;
  array?: boolean;
  relationTableId?: string;
  validation?: ValidationRules;
  unique?: boolean;
  indexed?: boolean;
  indexFileId?: string;
}

export type DocumentRow = {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
} & Record<string, DocumentValue>;

export type RowData = DocumentRow;

export interface TableFile {
  name: string;
  schema: ColumnDefinition[];
  documents: RowData[];
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  trashed?: boolean;
  parents?: string[];
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  size?: string;
}

export type Database = DriveFile;

export type Table = DriveFile & {
  schema?: ColumnDefinition[];
};

export type DatabaseNavItem = Pick<Database, "id" | "name"> & {
  tables: Pick<Table, "id" | "name">[];
};

export type DatabaseTreeItem = Pick<Database, "id" | "name"> & {
  tables: (Pick<Table, "id" | "name"> & { schema: ColumnDefinition[] })[];
};

export type BucketFile = DriveFile;

export type BucketUploadResult =
  | { success: true; files: BucketFile[] }
  | { success: false; error: string };

export interface RelationOption {
  id: string;
  label: string;
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
