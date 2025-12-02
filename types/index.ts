export interface ColumnDefinition {
  key: string;
  type: "string" | "integer" | "boolean" | "datetime";
  required: boolean;
  default?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  array?: boolean;
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
