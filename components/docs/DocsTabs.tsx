"use client";

import { CodeBlock } from "../../app/dashboard/apidocs/CodeBlock";
import {
  Package,
  Zap,
  Database,
  CheckCircle,
  RefreshCw,
  Trash2,
  PlusCircle,
  Search,
  Settings,
  FolderPlus,
} from "lucide-react";

export function DocsTabs() {
  return (
    <div className="space-y-8">
      {/* Getting Started */}
      <div className="border border-neutral-800 bg-neutral-900/50 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-neutral-800 flex items-start gap-4">
          <div className="p-2 rounded-lg bg-linear-to-br from-green-500/20 to-emerald-500/20 border border-green-500/20">
            <Package className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-1">
              Getting Started
            </h3>
            <p className="text-sm text-neutral-400">
              Install and initialize the GDatabase client.
            </p>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <h4 className="text-sm font-medium mb-2 text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">
                1
              </span>
              Installation
            </h4>
            <CodeBlock
              code="npm install gdatabase"
              language="bash"
              id="install"
            />
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2 text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">
                2
              </span>
              Initialize the Client
            </h4>
            <p className="text-sm text-neutral-400 mb-4">
              Get your API Key from the{" "}
              <a
                href="/dashboard/settings"
                className="text-primary hover:underline"
              >
                Settings page
              </a>
              .
            </p>
            <CodeBlock
              code={`import { GDatabase } from "gdatabase";

// Initialize with your API Key and App URL
const db = new GDatabase("YOUR_API_KEY", "https://your-app.com");`}
              id="init"
            />
          </div>
        </div>
      </div>

      {/* Create Database & Schema */}
      <div className="border border-neutral-800 bg-neutral-900/50 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-neutral-800 flex items-start gap-4">
          <div className="p-2 rounded-lg bg-linear-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20">
            <FolderPlus className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-1">
              Create Database & Schema
            </h3>
            <p className="text-sm text-neutral-400">
              Define your database structure programmatically.
            </p>
          </div>
        </div>
        <div className="p-6 space-y-8">
          {/* Create Database */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1.5">
                <FolderPlus className="w-3 h-3" />
                DATABASE
              </span>
              <h4 className="text-sm font-medium text-white">
                Create a new database
              </h4>
            </div>
            <CodeBlock
              code={`// Create a new database
const myDatabase = await db.createDatabase("my-store");

console.log(myDatabase.id);  // Database ID for future reference`}
              id="create-db"
            />
          </div>

          {/* Define Schema */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
                <Settings className="w-3 h-3" />
                SCHEMA
              </span>
              <h4 className="text-sm font-medium text-white">
                Define table schema
              </h4>
            </div>
            <CodeBlock
              code={`// Create a table with schema
const usersTable = await db
  .database("my-store")
  .createTable("users", {
    schema: [
      { key: "name", type: "string", required: true },
      { key: "email", type: "string", required: true },
      { key: "age", type: "integer" },
      { key: "active", type: "boolean" },
      { key: "tags", type: "string", array: true },
      { key: "createdAt", type: "datetime" }
    ]
  });

// Create another table with a relation
const postsTable = await db
  .database("my-store")
  .createTable("posts", {
    schema: [
      { key: "title", type: "string", required: true },
      { key: "content", type: "string" },
      { key: "authorId", type: "relation", relationTableId: usersTable.id }
    ]
  });`}
              id="create-schema"
            />
          </div>
        </div>
      </div>

      {/* CRUD Operations */}
      <div className="border border-neutral-800 bg-neutral-900/50 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-neutral-800 flex items-start gap-4">
          <div className="p-2 rounded-lg bg-linear-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20">
            <Zap className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-1">
              CRUD Operations
            </h3>
            <p className="text-sm text-neutral-400">
              Create, Read, Update, and Delete documents.
            </p>
          </div>
        </div>
        <div className="p-6 space-y-8">
          {/* List */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1.5">
                <Search className="w-3 h-3" />
                LIST
              </span>
              <h4 className="text-sm font-medium text-white">
                Fetch all documents
              </h4>
            </div>
            <CodeBlock
              code={`const users = await db
  .database("my-store")
  .table("users")
  .list();

// Returns array of documents with $id, $createdAt, $updatedAt
console.log(users);`}
              id="list"
            />
          </div>

          {/* Create */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
                <PlusCircle className="w-3 h-3" />
                CREATE
              </span>
              <h4 className="text-sm font-medium text-white">
                Add a new document
              </h4>
            </div>
            <CodeBlock
              code={`const newUser = await db
  .database("my-store")
  .table("users")
  .create({
    name: "Jane Smith",
    email: "jane@example.com",
    age: 28,
    active: true,
    tags: ["verified", "premium"],
    createdAt: new Date().toISOString()
  });

console.log(newUser.$id); // Auto-generated unique ID`}
              id="create"
            />
          </div>

          {/* Update */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3" />
                UPDATE
              </span>
              <h4 className="text-sm font-medium text-white">
                Modify an existing document
              </h4>
            </div>
            <CodeBlock
              code={`await db
  .database("my-store")
  .table("users")
  .update("document-id", {
    active: false,
    tags: ["verified", "premium", "inactive"]
  });`}
              id="update"
            />
          </div>

          {/* Delete */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1.5">
                <Trash2 className="w-3 h-3" />
                DELETE
              </span>
              <h4 className="text-sm font-medium text-white">
                Remove a document
              </h4>
            </div>
            <CodeBlock
              code={`await db
  .database("my-store")
  .table("users")
  .delete("document-id");`}
              id="delete"
            />
          </div>
        </div>
      </div>

      {/* Data Types */}
      <div className="border border-neutral-800 bg-neutral-900/50 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-neutral-800 flex items-start gap-4">
          <div className="p-2 rounded-lg bg-linear-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20">
            <Database className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-1">
              Supported Data Types
            </h3>
            <p className="text-sm text-neutral-400">
              Field types available for your schema.
            </p>
          </div>
        </div>
        <div className="p-6">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-neutral-950/50 rounded-xl p-4 border border-neutral-800">
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                string
              </span>
              <p className="text-sm text-neutral-400 mt-2">
                Text, emails, URLs
              </p>
            </div>
            <div className="bg-neutral-950/50 rounded-xl p-4 border border-neutral-800">
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                integer
              </span>
              <p className="text-sm text-neutral-400 mt-2">Whole numbers</p>
            </div>
            <div className="bg-neutral-950/50 rounded-xl p-4 border border-neutral-800">
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                boolean
              </span>
              <p className="text-sm text-neutral-400 mt-2">True/false flags</p>
            </div>
            <div className="bg-neutral-950/50 rounded-xl p-4 border border-neutral-800">
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                datetime
              </span>
              <p className="text-sm text-neutral-400 mt-2">Dates and times</p>
            </div>
            <div className="bg-neutral-950/50 rounded-xl p-4 border border-neutral-800">
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                relation
              </span>
              <p className="text-sm text-neutral-400 mt-2">
                Link to other tables
              </p>
            </div>
            <div className="bg-neutral-950/50 rounded-xl p-4 border border-neutral-800">
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-pink-500/10 text-pink-400 border border-pink-500/20">
                storage
              </span>
              <p className="text-sm text-neutral-400 mt-2">Files from bucket</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-linear-to-r from-blue-500/5 to-purple-500/5 border border-blue-500/20 rounded-xl flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-sm text-neutral-300">
              <strong className="text-white">Arrays:</strong> Add{" "}
              <code className="bg-blue-500/20 px-1.5 py-0.5 rounded text-blue-300 text-xs">
                array: true
              </code>{" "}
              to any field (except relations) to store multiple values.
            </p>
          </div>
        </div>
      </div>

      {/* Complete Example */}
      <div className="border border-neutral-800 bg-neutral-900/50 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-neutral-800">
          <h3 className="text-xl font-semibold text-white mb-1">
            Complete Example
          </h3>
          <p className="text-sm text-neutral-400">
            A full workflow from setup to CRUD operations.
          </p>
        </div>
        <div className="p-6">
          <CodeBlock
            code={`import { GDatabase } from "gdatabase";

// 1. Initialize
const db = new GDatabase("YOUR_API_KEY", "https://your-app.com");

// 2. Create database
const store = await db.createDatabase("e-commerce");

// 3. Define schemas
await db.database(store.id).createTable("products", {
  schema: [
    { key: "name", type: "string", required: true },
    { key: "price", type: "integer", required: true },
    { key: "inStock", type: "boolean" },
    { key: "categories", type: "string", array: true }
  ]
});

// 4. Add documents
const product = await db
  .database(store.id)
  .table("products")
  .create({
    name: "Wireless Headphones",
    price: 79,
    inStock: true,
    categories: ["electronics", "audio"]
  });

// 5. Query documents
const allProducts = await db
  .database(store.id)
  .table("products")
  .list();

console.log(\`Total products: \${allProducts.length}\`);`}
            id="complete-example"
          />
        </div>
      </div>
    </div>
  );
}
