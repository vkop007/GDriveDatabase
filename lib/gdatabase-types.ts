// GDatabase TypeScript Type Definitions
// Issue #73: Add TypeScript generics for type-safe SDK

export interface GDatabaseConfig {
  apiKey: string;
  baseUrl?: string;
}

// System fields added to every document
export interface GDatabaseSystemFields {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
}

// User-defined row data (generic)
export type RowData<T = unknown> = T & GDatabaseSystemFields;

// Column definition for schema
export interface ColumnDefinition {
  key: string;
  type: 'string' | 'integer' | 'boolean' | 'datetime' | 'relation' | 'storage';
  required?: boolean;
  default?: unknown;
  array?: boolean;
  relationTableId?: string;
}

// Query options
export interface QueryOptions<T = unknown> {
  filters?: FilterCondition[];
  sort?: SortConfig[];
  limit?: number;
  offset?: number;
}

export interface FilterCondition {
  column: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith';
  value: unknown;
}

export interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

// TableClient generic interface
export interface ITableClient<T = unknown> {
  list(options?: QueryOptions<T>): Promise<RowData<T>[]>;
  get(id: string): Promise<RowData<T> | null>;
  create(data: Partial<T>): Promise<RowData<T>>;
  update(id: string, data: Partial<T>): Promise<RowData<T>>;
  delete(id: string): Promise<boolean>;
  schema(): ISchemaClient;
}

// SchemaClient interface  
export interface ISchemaClient {
  get(): Promise<{ schema: ColumnDefinition[] }>;
  addColumn(column: ColumnDefinition): Promise<boolean>;
  updateColumn(key: string, updates: Partial<ColumnDefinition>): Promise<boolean>;
  deleteColumn(key: string): Promise<boolean>;
  set(columns: ColumnDefinition[]): Promise<boolean>;
}

// DatabaseClient generic interface
export interface IDatabaseClient {
  table<T = unknown>(tableId: string): ITableClient<T>;
}

// GDatabase main interface with generic support
export interface IGDatabase {
  database(dbId: string): IDatabaseClient;
  bucket(): IBucketClient;
  functions(): IFunctionsClient;
}

export interface IBucketClient {
  upload(file: File | File[]): Promise<{ success: boolean; files?: string[]; error?: string }>;
  uploadFromUrl(url: string, filename?: string): Promise<{ success: boolean; fileId?: string; error?: string }>;
  list(): Promise<{ success: boolean; files?: BucketFile[]; error?: string }>;
  delete(fileId: string): Promise<{ success: boolean; error?: string }>;
}

export interface BucketFile {
  id: string;
  name: string;
  size: number;
  url: string;
}

export interface IFunctionsClient {
  run(url: string, params?: Record<string, unknown>): Promise<{ success: boolean; data?: unknown; error?: string; authUrl?: string }>;
}

// Result pattern for error handling (Issue #74)
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

export interface GDatabaseError {
  code: 'NOT_FOUND' | 'PERMISSION_DENIED' | 'RATE_LIMITED' | 'QUOTA_EXCEEDED' | 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'UNKNOWN';
  message: string;
  status?: number;
}