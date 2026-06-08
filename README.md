<p align="center">
  <img src="public/logo.png" alt="GDrive Database Logo" width="120" height="120" />
</p>

<h1 align="center">GDrive Database</h1>

<p align="center">
  <strong>Transform your Google Drive into a powerful NoSQL database</strong>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#setup">Setup</a> •
  <a href="#sdk-usage">SDK Usage</a> •
  <a href="#available-column-types">Data Types</a> •
  <a href="#api-reference">API Reference</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" />
  <img src="https://img.shields.io/badge/node-%3E%3D20-green.svg" alt="Node" />
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

## Setup

This repository is the hosted dashboard/API app. It uses:

- Next.js for the dashboard and API routes.
- Email/password login for app accounts.
- Turso/libSQL for users and encrypted Google Drive OAuth credentials.
- Google Drive as the actual document/file storage for each connected user.
- User-owned Google OAuth credentials pasted from the dashboard settings page.
- The published [`gdatabase`](https://www.npmjs.com/package/gdatabase) npm package for external database calls.

### 1. Prerequisites

- Node.js 20+ recommended for Next.js 16.
- npm or Bun.
- A Turso account/database.
- A Google Cloud project for Drive OAuth.
- A Google account that can create Google Cloud OAuth credentials.

### 2. Install Dependencies

```bash
npm install

# or
bun install
```

### 3. Create Environment File

Copy the example file:

```bash
cp .env.example .env
```

Required variables:

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_BASE_URL` | Yes | Public app URL used for OAuth redirects. Use `http://localhost:3000` locally. |
| `TURSO_DATABASE_URL` | Yes | Turso/libSQL database URL. |
| `TURSO_AUTH_TOKEN` | Yes | Turso database auth token. |
| `ENCRYPTION_KEY` | Yes | Encrypts stored Drive credentials and can sign app sessions. Keep stable. |
| `AUTH_SECRET` | Optional | Separate session signing secret. If omitted, `ENCRYPTION_KEY` is used. |

Generate strong secrets:

```bash
openssl rand -base64 32
```

Do not commit `.env`. If `ENCRYPTION_KEY` changes later, previously stored Drive credentials cannot be decrypted.

### 4. Set Up Turso

Create a Turso database from the Turso dashboard or CLI. Turso stores app users, API keys, encrypted OAuth credentials, and refresh tokens. Your actual database rows/files still live in the connected user's Google Drive.

CLI example:

```bash
turso db create gdrive-database
turso db show gdrive-database --url
turso db tokens create gdrive-database
```

Put the returned URL and token into `.env`:

```bash
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-token
```

No manual migration command is needed. The app creates/updates these tables automatically on first use:

- `users`
- `drive_oauth_states`
- `drive_connections`

### 5. Set Up Google Drive OAuth

Google credentials are not app login credentials. Users sign in to GDrive Database with email/password, then each user connects their own Google Drive from `Dashboard -> Settings -> Connect Drive`.

You need one Google Cloud OAuth client for each Google Drive account/project you want to connect. The app accepts the downloaded OAuth JSON and stores the `client_id`, `client_secret`, and `project_id` encrypted in Turso.

#### 5.1 Create or Select a Google Cloud Project

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project selector at the top.
3. Create a new project, or select an existing project.
4. Keep the project ID handy. It will look like `my-project-123456`.

#### 5.2 Enable Required Google APIs

Open **APIs & Services -> Library** in the same project and enable:

| API | Required for |
| --- | --- |
| **Google Drive API** | Creating folders, tables, row files, bucket files, and reading Drive storage. |
| **Google Apps Script API** | Functions, backups, script creation/deployment, and script execution metadata. |

Direct links:

- [Google Drive API](https://console.cloud.google.com/apis/library/drive.googleapis.com)
- [Google Apps Script API](https://console.cloud.google.com/apis/library/script.googleapis.com)

CLI equivalent:

```bash
gcloud services enable drive.googleapis.com script.googleapis.com \
  --project your-google-cloud-project-id
```

If you do not plan to use Functions/Backups yet, the dashboard can still run with Drive API only, but enabling Apps Script API now avoids errors later when you open the Functions page.

#### 5.3 Configure OAuth Consent Screen

Open **APIs & Services -> OAuth consent screen**.

For development:

1. Choose **External** unless you are using a Google Workspace organization and want **Internal**.
2. Fill app name, support email, and developer contact email.
3. Add yourself under **Test users** while the app is in testing mode.
4. Save and continue.

The app requests these scopes when a user connects Drive:

```text
https://www.googleapis.com/auth/drive
https://www.googleapis.com/auth/drive.file
https://www.googleapis.com/auth/script.projects
https://www.googleapis.com/auth/script.deployments
https://www.googleapis.com/auth/script.processes
https://www.googleapis.com/auth/script.metrics
https://www.googleapis.com/auth/script.scriptapp
email
profile
```

For personal development, testing mode with your own Google account is enough. For a public production app, Google may require OAuth verification because Drive and Apps Script scopes are sensitive/restricted.

#### 5.4 Create OAuth Client ID

Open **APIs & Services -> Credentials -> Create Credentials -> OAuth client ID**.

Use these settings:

| Field | Value |
| --- | --- |
| Application type | `Web application` |
| Name | Anything clear, for example `GDrive Database Local` |
| Authorized JavaScript origins | `http://localhost:3000` locally, and your production origin later |
| Authorized redirect URIs | Must include the exact callback URL shown below |

Local redirect URI:

```text
http://localhost:3000/oauth2callback
```

Production redirect URI:

```text
https://your-production-domain.com/oauth2callback
```

The redirect URI must exactly match `NEXT_PUBLIC_BASE_URL + /oauth2callback`. A missing slash, different port, or different domain will cause a Google `redirect_uri_mismatch` error.

After creating the OAuth client:

1. Click the download icon for the OAuth client.
2. Open the downloaded JSON file.
3. It should look similar to:

```json
{
  "web": {
    "client_id": "xxxxx.apps.googleusercontent.com",
    "project_id": "your-project-id",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "client_secret": "GOCSPX-xxxxx",
    "redirect_uris": ["http://localhost:3000/oauth2callback"]
  }
}
```

#### 5.5 Connect Drive Inside GDrive Database

1. Start this app.
2. Create/sign in to an email/password account.
3. Open **Dashboard -> Settings**.
4. Confirm the **Google OAuth Redirect URI** shown on the page matches the URI in Google Cloud.
5. Click **Connect Drive**.
6. Paste the OAuth JSON, or manually fill Client ID, Client Secret, and Project ID.
7. Click **Connect Google Drive** and approve the requested Google permissions.

The pasted JSON must contain:

- `client_id`
- `client_secret`
- `project_id`

The app encrypts the client secret and OAuth tokens in Turso.

If Functions or Backups show Apps Script permission/API errors:

- Confirm **Google Apps Script API** is enabled in the same Google Cloud project.
- Open [Apps Script Settings](https://script.google.com/home/usersettings) with the same Google account and make sure the Apps Script API setting is enabled if Google prompts for it.
- Wait 1-2 minutes after enabling APIs, then reconnect Drive or retry the function action.

### 6. Run Locally

```bash
npm run dev

# or
bun run dev
```

Open:

```text
http://localhost:3000
```

Create an account with email/password, then connect Google Drive in Settings before creating databases, tables, bucket files, or functions.

To use the SDK or external API routes, open **Dashboard -> Settings -> API Access** and generate an API key.

### 7. Production Deployment

For Vercel:

1. Import the repository into Vercel.
2. Add these environment variables to the Vercel project:

```bash
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token
ENCRYPTION_KEY=your-long-stable-secret
AUTH_SECRET=your-long-stable-session-secret
```

3. Add the production redirect URI to the Google OAuth client:

```text
https://your-app.vercel.app/oauth2callback
```

4. Redeploy after changing environment variables or OAuth redirect URLs.

### Troubleshooting

- **Email login disabled:** check `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, and `ENCRYPTION_KEY`.
- **Google redirect mismatch:** make sure `NEXT_PUBLIC_BASE_URL` exactly matches the domain in Google Cloud and the redirect URI ends with `/oauth2callback`.
- **Google says app is not verified:** keep OAuth consent screen in testing mode and add your Google account as a test user, or complete Google verification for public users.
- **Drive API has not been used:** enable Google Drive API in the same project as the OAuth client, wait a minute, then retry.
- **Apps Script API has not been used:** enable Google Apps Script API in the same project and retry after propagation.
- **Drive credentials cannot decrypt:** `ENCRYPTION_KEY` changed after credentials were saved. Reconnect Drive or restore the old key.
- **OAuth app still in testing:** add the Google account as a test user in the OAuth consent screen.
- **Port already in use:** stop the old Next dev server or run on another port with `PORT=3001 npm run dev`.
- **Wondering about `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`:** they are not needed for the default email/password login flow. Google Drive credentials are supplied by each user inside Settings.

## SDK Usage

Use the published [`gdatabase`](https://www.npmjs.com/package/gdatabase) npm package when another app needs to call your hosted GDrive Database API.

Before writing code:

1. Run this dashboard/API app locally or deploy it.
2. Sign in to the dashboard.
3. Connect Google Drive from **Dashboard -> Settings**.
4. Create a database and table in the dashboard.
5. Generate an API key from **Dashboard -> Settings -> API Access**.
6. Copy your database ID and table ID from the dashboard URL or table page.

Install the client package in the app that will call your database:

```bash
npm install gdatabase

# or
bun add gdatabase
```

### Initialize

```typescript
import { GDatabase } from "gdatabase";

const db = new GDatabase(
  process.env.GDATABASE_API_KEY!, // Generated from Dashboard -> Settings -> API Access
  "http://localhost:3000" // Your GDrive Database app URL
);
```

For production, use your deployed URL:

```typescript
const db = new GDatabase(
  process.env.GDATABASE_API_KEY!,
  "https://your-app.vercel.app"
);
```

### Database Calls

```typescript
const databaseId = "your-database-id";
const tableId = "your-table-id";
const table = db.database(databaseId).table(tableId);

// List rows
const rows = await table.list();

// Create a row
const created = await table.create({
  title: "New item",
  status: "active",
});

// Read one row
const row = await table.get(created.$id);

// Update one row
await table.update(created.$id, {
  status: "completed",
});

// Delete one row
await table.delete(created.$id);
```

Keep API keys on the server. Do not expose `GDATABASE_API_KEY` in browser-side code unless you intentionally want public write access to that API key.

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
