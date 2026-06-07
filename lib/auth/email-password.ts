import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { getTursoClient, ensureTursoSchema } from "@/lib/storage/turso";
import type { AppSession } from "@/lib/gdrive/google-oauth";

const HASH_PREFIX = "scrypt";
const KEY_LENGTH = 64;

function normalizeEmail(value: FormDataEntryValue | string | null) {
  return String(value ?? "").trim().toLowerCase();
}

function readPassword(value: FormDataEntryValue | string | null) {
  return String(value ?? "");
}

function requireDatabase() {
  const db = getTursoClient();
  if (!db) {
    throw new Error(
      "Email/password auth requires database storage. Set TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, and ENCRYPTION_KEY."
    );
  }

  return db;
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("base64url");
  return `${HASH_PREFIX}.${salt}.${hash}`;
}

function verifyPassword(password: string, encodedHash: string) {
  const [prefix, salt, expectedHash] = encodedHash.split(".");
  if (prefix !== HASH_PREFIX || !salt || !expectedHash) return false;

  const actual = scryptSync(password, salt, KEY_LENGTH);
  const expected = Buffer.from(expectedHash, "base64url");

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password: string) {
  return password.length >= 8;
}

export async function createEmailPasswordUser(formData: FormData): Promise<AppSession> {
  const email = normalizeEmail(formData.get("email"));
  const password = readPassword(formData.get("password"));
  const name = String(formData.get("name") ?? "").trim() || undefined;

  if (!validateEmail(email)) throw new Error("Enter a valid email address.");
  if (!validatePassword(password)) throw new Error("Password must be at least 8 characters.");

  await ensureTursoSchema();
  const db = requireDatabase();
  const existing = await db.execute({
    sql: "SELECT id, password_hash FROM users WHERE email = ?",
    args: [email],
  });

  if (existing.rows[0]?.password_hash) {
    throw new Error("An account with this email already exists. Sign in instead.");
  }

  const userId = String(existing.rows[0]?.id || `email:${randomUUID()}`);
  const now = new Date().toISOString();
  await db.execute({
    sql: `
      INSERT INTO users (id, email, name, picture, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        email = excluded.email,
        name = excluded.name,
        password_hash = excluded.password_hash,
        updated_at = excluded.updated_at
    `,
    args: [userId, email, name ?? null, null, hashPassword(password), now, now],
  });

  return { email, name, sub: userId };
}

export async function verifyEmailPasswordUser(formData: FormData): Promise<AppSession> {
  const email = normalizeEmail(formData.get("email"));
  const password = readPassword(formData.get("password"));

  if (!validateEmail(email) || !password) {
    throw new Error("Invalid email or password.");
  }

  await ensureTursoSchema();
  const db = requireDatabase();
  const result = await db.execute({
    sql: "SELECT id, email, name, picture, password_hash FROM users WHERE email = ?",
    args: [email],
  });
  const user = result.rows[0];
  const passwordHash = typeof user?.password_hash === "string" ? user.password_hash : "";

  if (!user || !passwordHash || !verifyPassword(password, passwordHash)) {
    throw new Error("Invalid email or password.");
  }

  return {
    email: String(user.email || email),
    name: typeof user.name === "string" ? user.name : undefined,
    picture: typeof user.picture === "string" ? user.picture : undefined,
    sub: String(user.id),
  };
}
