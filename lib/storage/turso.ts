import { createClient, type Client } from "@libsql/client";

let tursoClient: Client | null = null;
let schemaInit: Promise<void> | null = null;
let warnedAboutMissingEnv = false;

export function isTursoConfigured() {
  return Boolean(
    process.env.TURSO_DATABASE_URL &&
      process.env.TURSO_AUTH_TOKEN &&
      process.env.ENCRYPTION_KEY
  );
}

export function getTursoClient() {
  if (!isTursoConfigured()) {
    if (
      !warnedAboutMissingEnv &&
      (process.env.TURSO_DATABASE_URL || process.env.TURSO_AUTH_TOKEN)
    ) {
      console.warn(
        "Turso storage is partially configured. Set TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, and ENCRYPTION_KEY."
      );
      warnedAboutMissingEnv = true;
    }

    return null;
  }

  tursoClient ??= createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  return tursoClient;
}

export async function ensureTursoSchema() {
  const db = getTursoClient();
  if (!db) return false;

  schemaInit ??= db
    .batch(
      [
        {
          sql: `
            CREATE TABLE IF NOT EXISTS users (
              id TEXT PRIMARY KEY,
              email TEXT,
              name TEXT,
              picture TEXT,
              password_hash TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            )
          `,
          args: [],
        },
        {
          sql: `
            CREATE TABLE IF NOT EXISTS drive_oauth_states (
              state TEXT PRIMARY KEY,
              user_id TEXT NOT NULL,
              user_email TEXT,
              user_name TEXT,
              user_picture TEXT,
              client_id TEXT NOT NULL,
              client_secret_encrypted TEXT NOT NULL,
              project_id TEXT NOT NULL,
              created_at TEXT NOT NULL,
              expires_at INTEGER NOT NULL
            )
          `,
          args: [],
        },
        {
          sql: `
            CREATE TABLE IF NOT EXISTS drive_connections (
              user_id TEXT PRIMARY KEY,
              user_email TEXT,
              user_name TEXT,
              user_picture TEXT,
              client_id TEXT NOT NULL,
              client_secret_encrypted TEXT NOT NULL,
              project_id TEXT NOT NULL,
              tokens_encrypted TEXT NOT NULL,
              scopes TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            )
          `,
          args: [],
        },
      ],
      "write"
    )
    .then(async () => {
      const db = getTursoClient();
      if (!db) return;

      try {
        await db.execute("ALTER TABLE users ADD COLUMN password_hash TEXT");
      } catch (error) {
        const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
        if (!message.includes("duplicate column") && !message.includes("already exists")) {
          throw error;
        }
      }
    });

  await schemaInit;
  return true;
}
