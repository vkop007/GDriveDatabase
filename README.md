<p align="center">
  <img src="public/logo.png" alt="GDrive Database Logo" width="120" height="120" />
</p>

<h1 align="center">GDrive Database</h1>

<p align="center">
  <strong>Transform your Google Drive into a powerful NoSQL database</strong>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-data-types">Data Types</a> •
  <a href="#-documentation">Docs</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" />
  <img src="https://img.shields.io/badge/node-%3E%3D18-green.svg" alt="Node" />
  <img src="https://img.shields.io/badge/TypeScript-Ready-blue.svg" alt="TypeScript" />
</p>

---

A modern NoSQL database solution powered by Google Drive. Store, query, and manage your data with a simple SDK and beautiful dashboard. Zero infrastructure. Infinite possibilities.

## ✨ Features

- **Google Drive Backend** - Your data lives in your Google Drive, full ownership
- **Schema Definition** - Define tables and schemas programmatically
- **Simple SDK** - Type-safe JavaScript/TypeScript client
- **Relations** - Link documents across tables
- **Storage Bucket** - Upload files linked to your records
- **Functions** - Server-side code with Google Apps Script

## Installation

```bash
npm install gdatabase
# or
bun add gdatabase
```

## Usage

### Initialize

```typescript
import { GDatabase } from "gdatabase";

const db = new GDatabase(
  "YOUR_API_KEY",
  "http://localhost:3000" // Your App URL
);
```

### Database & Tables

```typescript
// List items
const items = await db.database("my-db").table("my-table").list();

// Create item
await db.database("my-db").table("my-table").create({
  title: "New Item",
  status: "active",
});

// Get item
const item = await db.database("my-db").table("my-table").get("doc-id");

// Update item
await db.database("my-db").table("my-table").update("doc-id", {
  status: "completed",
});

// Delete item
await db.database("my-db").table("my-table").delete("doc-id");
```

### Schema Management

Define and modify your table structure programmatically:

```typescript
// Get schema client for a table
const schema = db.database("my-db").table("my-table").schema();

// Get current schema
const { schema: columns } = await schema.get();
console.log("Columns:", columns);

// Add a new column
await schema.addColumn({
  key: "email",
  type: "string",
  required: true,
});

// Add a column with default value
await schema.addColumn({
  key: "status",
  type: "string",
  required: false,
  default: "pending",
});

// Add an array column
await schema.addColumn({
  key: "tags",
  type: "string",
  array: true,
});

// Add a relation column (links to another table)
await schema.addColumn({
  key: "authorId",
  type: "relation",
  relationTableId: "users-table-id",
});

// Update column properties
await schema.updateColumn("status", {
  required: true,
  default: "active",
});

// Delete a column (also removes data from all documents)
await schema.deleteColumn("old_field");

// Replace entire schema (keeps system columns like $id, $createdAt, $updatedAt)
await schema.set([
  { key: "title", type: "string", required: true },
  { key: "content", type: "string", required: false },
  { key: "published", type: "boolean", default: false },
  { key: "views", type: "integer", default: 0 },
]);
```

#### Available Column Types

| Type       | Description                                        |
| ---------- | -------------------------------------------------- |
| `string`   | Text values                                        |
| `integer`  | Whole numbers                                      |
| `boolean`  | True/false values                                  |
| `datetime` | ISO date strings                                   |
| `relation` | Link to another table (requires `relationTableId`) |
| `storage`  | File reference (bucket file ID)                    |

### Table Relationships

Create relationships between tables using the `relation` type:

```typescript
// Setup: Create Users table
const usersSchema = db.database("my-db").table("users-table-id").schema();
await usersSchema.set([
  { key: "name", type: "string", required: true },
  { key: "email", type: "string", required: true },
]);

// Create a user
const user = await db.database("my-db").table("users-table-id").create({
  name: "John Doe",
  email: "john@example.com",
});

// Setup: Create Posts table with relation to Users
const postsSchema = db.database("my-db").table("posts-table-id").schema();
await postsSchema.set([
  { key: "title", type: "string", required: true },
  { key: "content", type: "string" },
  { key: "authorId", type: "relation", relationTableId: "users-table-id" },
]);

// Create a post linked to the user
const post = await db.database("my-db").table("posts-table-id").create({
  title: "My First Post",
  content: "Hello World!",
  authorId: user.$id, // Reference the user's ID
});

// Query posts and resolve author
const posts = await db.database("my-db").table("posts-table-id").list();
const users = await db.database("my-db").table("users-table-id").list();

// Manually join the data
const postsWithAuthor = posts.map((post) => ({
  ...post,
  author: users.find((u) => u.$id === post.authorId),
}));
```

#### Many-to-Many Relationships

Use array of IDs for many-to-many relationships:

```typescript
// Tags table
await db
  .database("my-db")
  .table("tags-id")
  .schema()
  .set([{ key: "name", type: "string", required: true }]);

// Posts with multiple tags (store tag IDs as array in a string field)
await db.database("my-db").table("posts-id").schema().addColumn({
  key: "tagIds",
  type: "string",
  array: true, // Array of tag IDs
});

// Create post with multiple tags
await db
  .database("my-db")
  .table("posts-id")
  .create({
    title: "Tagged Post",
    tagIds: [tag1.$id, tag2.$id, tag3.$id],
  });
```

### Storage Bucket

Upload, manage, and serve files from Google Drive storage:

```typescript
// Get bucket client
const bucket = db.bucket();

// Upload a file (Browser)
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];
const uploadResult = await bucket.upload(file);

if (uploadResult.success) {
  console.log("Uploaded:", uploadResult.files);
  // Get public URL for the file
  const publicUrl = bucket.getPublicUrl(uploadResult.files[0].id);
  console.log("Public URL:", publicUrl);
}

// Upload multiple files
const files = Array.from(fileInput.files);
const result = await bucket.upload(files);

// Upload from URL
const urlResult = await bucket.uploadFromUrl(
  "https://example.com/image.png",
  "my-image.png" // optional filename
);

// Upload from Buffer/Blob (Node.js or Browser)
const buffer = await fetch("https://example.com/file.pdf").then((r) =>
  r.arrayBuffer()
);
const bufferResult = await bucket.uploadFromBuffer(
  buffer,
  "document.pdf",
  "application/pdf"
);

// List all files in bucket
const listResult = await bucket.list();
if (listResult.success) {
  listResult.files.forEach((file) => {
    console.log(`${file.name} (${file.size} bytes)`);
  });
}

// Delete a file
const deleteResult = await bucket.delete("file-id");

// Get thumbnail URL for images/videos
const thumbnailUrl = bucket.getThumbnailUrl("file-id", 300); // 300px size
```

### Functions

Run serverless Google Apps Script functions:

```typescript
// Get functions client
const functions = db.functions();

// Run a function directly by web URL
const result = await functions.run(
  "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec",
  { param1: "value1" }
);

if (result.success) {
  console.log("Result:", result.data);
} else if (result.needsAuth) {
  console.log("Authorization needed, visit:", result.authUrl);
} else {
  console.log("Error:", result.error);
}

// Or run by function ID (fetches web URL automatically)
const result2 = await functions.runById("function-id", { key: "value" });
```

## API Reference

### GDatabase

- `database(databaseId: string)` - Access a database
- `bucket()` - Access the storage bucket client
- `functions()` - Access functions client

### DatabaseClient

- `table(tableId: string)` - Access a table

### TableClient

- `schema()` - Access the schema manager for this table
- `list()` - List all documents
- `create(data)` - Create a document
- `get(docId)` - Get a document
- `update(docId, data)` - Update a document
- `delete(docId)` - Delete a document

### SchemaClient

- `get()` - Get the current table schema
- `addColumn(column)` - Add a new column to the schema
- `updateColumn(columnKey, updates)` - Update an existing column
- `deleteColumn(columnKey)` - Delete a column (also removes data from documents)
- `set(columns)` - Replace entire schema (keeps system columns)

### BucketClient

- `upload(files: File | File[])` - Upload one or more files
- `uploadFromUrl(url, filename?)` - Download and upload a file from URL
- `uploadFromBuffer(data, filename, mimeType?)` - Upload from Buffer/Blob
- `list()` - List all files in the bucket
- `delete(fileId)` - Delete a file
- `getPublicUrl(fileId)` - Get public Google Drive URL
- `getThumbnailUrl(fileId, size?)` - Get thumbnail URL for images/videos

### FunctionsClient

- `list()` - List all functions
- `get(functionId)` - Get function details
- `run(webAppUrl, params?)` - Run function by URL
- `runById(functionId, params?)` - Run function by ID

## License

MIT VK
