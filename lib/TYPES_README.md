# GDatabase TypeScript Types

This document describes the type-safe SDK additions for GDatabase.

## Quick Start with Types

```typescript
import { GDatabase, RowData, ColumnDefinition } from 'gdatabase';

// Define your data model
interface User {
  name: string;
  email: string;
  age: number;
  status: 'active' | 'inactive';
}

// Initialize with your credentials
const db = new GDatabase('YOUR_API_KEY', 'http://localhost:3000');

// Type-safe table access
const users = await db.database('my-db').table<User>('users').list();

// Get a single user with full type safety
const user = await db.database('my-db').table<User>('users').get('user-id');

// Create a new user - all fields type-checked!
await db.database('my-db').table<User>('users').create({
  name: 'John Doe',
  email: 'john@example.com',
  age: 25,
  status: 'active'
  // ❌ TypeScript error if: age is not a number, or status is not 'active'/'inactive'
});
```

## Type Definitions

### RowData<T>
Every document includes system fields:
```typescript
interface RowData<T> extends T {
  $id: string;           // Document ID
  $createdAt: string;   // Creation timestamp
  $updatedAt: string;   // Last update timestamp
}
```

### ColumnDefinition
Schema column types:
```typescript
interface ColumnDefinition {
  key: string;
  type: 'string' | 'integer' | 'boolean' | 'datetime' | 'relation' | 'storage';
  required?: boolean;
  default?: unknown;
  array?: boolean;
  relationTableId?: string;  // For relation type
}
```

### QueryOptions
Filter, sort, and paginate:
```typescript
interface QueryOptions<T> {
  filters?: FilterCondition[];
  sort?: SortConfig[];
  limit?: number;   // Default: 50
  offset?: number;  // Default: 0
}

interface FilterCondition {
  column: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith';
  value: unknown;
}

interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}
```

## Error Handling (Issue #74)

The SDK provides a Result patternn for consistent error handling:

```typescript
import { Result, GDatabaseError } from 'gdatabase';

// Using Result patternn
const result = await db.database('my-db').table<User>('users').get('id');

if (!result.success) {
  console.error(result.error.code);     // e.g., 'NOT_FOUND'
  console.error(result.error.message); // Human-readable message
  return;
}

const user = result.data; // Fully typed!
```

Error codes:
- `NOT_FOUND` - Document doesn't exist
- `PERMISSION_DENIED` - No access to resource
- `RATE_LIMITED` - Too many requests
- `QUOTA_EXCEEDED` - API quota exceeded
- `VALIDATION_ERROR` - Invalid data provided
- `NETWORK_ERROR` - Connection failed
- `UNKNOWN` - Something else went wrong

## Migration from Any Types

Before (no type safety):
```typescript
const users = await db.table('users').list();
// users: any[]
```

After (fully typed):
```typescript
interface User { name: string; email: string; }
const users = await db.table<User>('users').list();
// users: RowData<User>[]
```

## License

MIT