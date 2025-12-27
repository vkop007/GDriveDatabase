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
  Upload,
  HardDrive,
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

      {/* Schema Management */}
      <div className="border border-neutral-800 bg-neutral-900/50 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-neutral-800 flex items-start gap-4">
          <div className="p-2 rounded-lg bg-linear-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20">
            <Settings className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-1">
              Schema Management
            </h3>
            <p className="text-sm text-neutral-400">
              Define and modify your table structure programmatically.
            </p>
          </div>
        </div>
        <div className="p-6 space-y-8">
          {/* Get Schema */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1.5">
                <Search className="w-3 h-3" />
                GET
              </span>
              <h4 className="text-sm font-medium text-white">
                Get current schema
              </h4>
            </div>
            <CodeBlock
              code={`// Get schema client for a table
const schema = db.database("my-db").table("my-table").schema();

// Get current schema
const { schema: columns } = await schema.get();
console.log("Columns:", columns);`}
              id="schema-get"
            />
          </div>

          {/* Add Column */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
                <PlusCircle className="w-3 h-3" />
                ADD
              </span>
              <h4 className="text-sm font-medium text-white">
                Add new columns
              </h4>
            </div>
            <CodeBlock
              code={`// Add a required column
await schema.addColumn({
  key: "email",
  type: "string",
  required: true,
});

// Add column with default value
await schema.addColumn({
  key: "status",
  type: "string",
  default: "pending",
});

// Add an array column
await schema.addColumn({
  key: "tags",
  type: "string",
  array: true,
});

// Add a relation column
await schema.addColumn({
  key: "authorId",
  type: "relation",
  relationTableId: "users-table-id",
});`}
              id="schema-add"
            />
          </div>

          {/* Update & Delete Column */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3" />
                UPDATE
              </span>
              <h4 className="text-sm font-medium text-white">
                Modify or remove columns
              </h4>
            </div>
            <CodeBlock
              code={`// Update column properties
await schema.updateColumn("status", {
  required: true,
  default: "active",
});

// Delete a column (also removes data from all documents)
await schema.deleteColumn("old_field");

// Replace entire schema (keeps system columns)
await schema.set([
  { key: "title", type: "string", required: true },
  { key: "content", type: "string" },
  { key: "published", type: "boolean", default: false },
]);`}
              id="schema-update"
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

      {/* Table Relationships */}
      <div className="border border-neutral-800 bg-neutral-900/50 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-neutral-800 flex items-start gap-4">
          <div className="p-2 rounded-lg bg-linear-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20">
            <Database className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-1">
              Table Relationships
            </h3>
            <p className="text-sm text-neutral-400">
              Link tables together using relation columns.
            </p>
          </div>
        </div>
        <div className="p-6 space-y-8">
          {/* One-to-Many */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1.5">
                <FolderPlus className="w-3 h-3" />
                ONE-TO-MANY
              </span>
              <h4 className="text-sm font-medium text-white">
                Link posts to authors
              </h4>
            </div>
            <CodeBlock
              code={`// 1. Create Users table
const usersSchema = db.database("my-db").table("users-id").schema();
await usersSchema.set([
  { key: "name", type: "string", required: true },
  { key: "email", type: "string", required: true },
]);

// 2. Create Posts table with relation to Users
const postsSchema = db.database("my-db").table("posts-id").schema();
await postsSchema.set([
  { key: "title", type: "string", required: true },
  { key: "content", type: "string" },
  { key: "authorId", type: "relation", relationTableId: "users-id" },
]);

// 3. Create a user
const user = await db.database("my-db").table("users-id").create({
  name: "John Doe",
  email: "john@example.com",
});

// 4. Create a post linked to the user
const post = await db.database("my-db").table("posts-id").create({
  title: "My First Post",
  content: "Hello World!",
  authorId: user.$id, // Reference the user's ID
});`}
              id="relation-one"
            />
          </div>

          {/* Query with Relations */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1.5">
                <Search className="w-3 h-3" />
                QUERY
              </span>
              <h4 className="text-sm font-medium text-white">
                Resolve related data
              </h4>
            </div>
            <CodeBlock
              code={`// Fetch posts and users
const posts = await db.database("my-db").table("posts-id").list();
const users = await db.database("my-db").table("users-id").list();

// Join the data client-side
const postsWithAuthor = posts.map(post => ({
  ...post,
  author: users.find(u => u.$id === post.authorId),
}));

console.log(postsWithAuthor[0].author.name); // "John Doe"`}
              id="relation-query"
            />
          </div>

          {/* Many-to-Many */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3" />
                MANY-TO-MANY
              </span>
              <h4 className="text-sm font-medium text-white">
                Posts with multiple tags
              </h4>
            </div>
            <CodeBlock
              code={`// Create Tags table
await db.database("my-db").table("tags-id").schema().set([
  { key: "name", type: "string", required: true },
]);

// Add tagIds array column to Posts
await db.database("my-db").table("posts-id").schema().addColumn({
  key: "tagIds",
  type: "string",
  array: true, // Store multiple tag IDs
});

// Create tags
const tag1 = await db.database("my-db").table("tags-id").create({ name: "javascript" });
const tag2 = await db.database("my-db").table("tags-id").create({ name: "tutorial" });

// Create post with multiple tags
await db.database("my-db").table("posts-id").create({
  title: "JS Tutorial",
  tagIds: [tag1.$id, tag2.$id],
});`}
              id="relation-many"
            />
          </div>
        </div>
      </div>

      {/* Storage Bucket */}
      <div className="border border-neutral-800 bg-neutral-900/50 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-neutral-800 flex items-start gap-4">
          <div className="p-2 rounded-lg bg-linear-to-br from-pink-500/20 to-rose-500/20 border border-pink-500/20">
            <HardDrive className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-1">
              Storage Bucket
            </h3>
            <p className="text-sm text-neutral-400">
              Upload, manage, and serve files from Google Drive storage.
            </p>
          </div>
        </div>
        <div className="p-6 space-y-8">
          {/* Upload Files */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
                <Upload className="w-3 h-3" />
                UPLOAD
              </span>
              <h4 className="text-sm font-medium text-white">
                Upload files to bucket
              </h4>
            </div>
            <CodeBlock
              code={`// Get bucket client
const bucket = db.bucket();

// Upload a single file (Browser)
const fileInput = document.querySelector('input[type="file"]');
const result = await bucket.upload(fileInput.files[0]);

if (result.success) {
  console.log("Uploaded:", result.files[0].id);
  
  // Get public URL
  const url = bucket.getPublicUrl(result.files[0].id);
}

// Upload multiple files
const files = Array.from(fileInput.files);
await bucket.upload(files);

// Upload from URL
await bucket.uploadFromUrl(
  "https://example.com/image.png",
  "my-image.png"
);

// Upload from Buffer (Node.js)
const buffer = await fetch(url).then(r => r.arrayBuffer());
await bucket.uploadFromBuffer(buffer, "doc.pdf", "application/pdf");`}
              id="bucket-upload"
            />
          </div>

          {/* List & Delete */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1.5">
                <Search className="w-3 h-3" />
                LIST
              </span>
              <h4 className="text-sm font-medium text-white">
                List and manage files
              </h4>
            </div>
            <CodeBlock
              code={`// List all files in bucket
const { files } = await bucket.list();

files.forEach(file => {
  console.log(\`\${file.name} (\${file.size} bytes)\`);
});

// Delete a file
await bucket.delete("file-id");

// Get thumbnail for images/videos
const thumb = bucket.getThumbnailUrl("file-id", 200);`}
              id="bucket-list"
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
            A full workflow from setup to CRUD operations with schema and
            bucket.
          </p>
        </div>
        <div className="p-6">
          <CodeBlock
            code={`import { GDatabase } from "gdatabase";

// 1. Initialize
const db = new GDatabase("YOUR_API_KEY", "https://your-app.com");

// 2. Define schema for a table
const schema = db.database("store-id").table("products-id").schema();

await schema.set([
  { key: "name", type: "string", required: true },
  { key: "price", type: "integer", required: true },
  { key: "image", type: "storage" },
  { key: "categories", type: "string", array: true }
]);

// 3. Upload product image to bucket
const bucket = db.bucket();
const imageResult = await bucket.uploadFromUrl(
  "https://example.com/product.jpg",
  "headphones.jpg"
);

// 4. Create document with image reference
const product = await db
  .database("store-id")
  .table("products-id")
  .create({
    name: "Wireless Headphones",
    price: 79,
    image: imageResult.files[0].id,
    categories: ["electronics", "audio"]
  });

// 5. Query documents
const products = await db
  .database("store-id")
  .table("products-id")
  .list();

console.log(\`Total products: \${products.length}\`);

// 6. Get public URL for image
const imageUrl = bucket.getPublicUrl(product.image);`}
            id="complete-example"
          />
        </div>
      </div>
    </div>
  );
}
