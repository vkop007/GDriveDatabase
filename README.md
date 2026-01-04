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

## 🚀 Quick Start

### Installation

```bash
npm install gdatabase
```

### Initialize

```typescript
import { GDatabase } from "gdatabase";

const db = new GDatabase("YOUR_API_KEY", "https://your-app.com");
```

### Create Database & Schema

```typescript
// Create a database
const store = await db.createDatabase("my-store");

// Define a table schema
await db.database(store.id).createTable("users", {
  schema: [
    { key: "name", type: "string", required: true },
    { key: "email", type: "string", required: true },
    { key: "age", type: "integer" },
    { key: "tags", type: "string", array: true },
  ],
});
```

### CRUD Operations

```typescript
const users = db.database(store.id).table("users");

// Create
const user = await users.create({
  name: "John Doe",
  email: "john@example.com",
  age: 30,
  tags: ["verified"],
});

// Read
const allUsers = await users.list();

// Update
await users.update(user.$id, { age: 31 });

// Delete
await users.delete(user.$id);
```

## 📦 Data Types

| Type       | Description           | Array Support |
| ---------- | --------------------- | ------------- |
| `string`   | Text values           | ✅            |
| `integer`  | Whole numbers         | ✅            |
| `boolean`  | True/false            | ✅            |
| `datetime` | ISO 8601 dates        | ✅            |
| `relation` | Link to another table | ❌            |
| `storage`  | Link to bucket files  | ✅            |

## 📚 Documentation

Visit `/dashboard/apidocs` for complete SDK documentation with examples.

## 📄 License

MIT
