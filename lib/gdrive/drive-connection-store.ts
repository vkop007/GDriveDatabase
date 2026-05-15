import { cookies } from "next/headers";
import { cache } from "react";
import {
  APP_SESSION_COOKIE,
  DRIVE_OAUTH_STATE_COOKIE,
  GOOGLE_TOKEN_COOKIE,
  type AppSession,
} from "./google-oauth";
import { decryptJson, encryptJson } from "@/lib/storage/encryption";
import { ensureTursoSchema, getTursoClient } from "@/lib/storage/turso";

const PENDING_STATE_MAX_AGE_SECONDS = 10 * 60;

export type DriveCredentials = {
  clientId: string;
  clientSecret: string;
  projectId: string;
};

export type OAuthTokens = Record<string, unknown> & {
  access_token?: string;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  expiry_date?: number;
};

export type StoredDriveConnection = DriveCredentials & {
  tokens: OAuthTokens;
  userId: string;
  userEmail: string | null;
  userName: string | null;
  userPicture: string | null;
  scopes: string | null;
};

type PendingDriveCredentials = DriveCredentials & {
  state: string;
  userId: string;
  userEmail: string | null;
  userName: string | null;
  userPicture: string | null;
};

function readString(value: unknown) {
  if (value === null || value === undefined) return null;
  return typeof value === "string" ? value : String(value);
}

function getSessionUserId(session: AppSession) {
  return session.sub || session.email;
}

export const getCurrentAppSession = cache(async function getCurrentAppSession() {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(APP_SESSION_COOKIE)?.value;

  if (!sessionValue) return null;

  try {
    return JSON.parse(sessionValue) as AppSession;
  } catch {
    return null;
  }
});

async function getLegacyCookieConnection() {
  const cookieStore = await cookies();
  const tokensStr = cookieStore.get(GOOGLE_TOKEN_COOKIE)?.value;
  const clientId = cookieStore.get("gdrive_client_id")?.value;
  const clientSecret = cookieStore.get("gdrive_client_secret")?.value;
  const projectId = cookieStore.get("gdrive_project_id")?.value;
  const session = await getCurrentAppSession();

  if (!tokensStr || !clientId || !clientSecret || !projectId) {
    return null;
  }

  return {
    tokens: JSON.parse(tokensStr),
    clientId,
    clientSecret,
    projectId,
    userId: session ? getSessionUserId(session) : "legacy-cookie-session",
    userEmail: session?.email ?? null,
    userName: session?.name ?? null,
    userPicture: session?.picture ?? null,
    scopes: null,
  } satisfies StoredDriveConnection;
}

async function upsertUser(session: AppSession) {
  const dbReady = await ensureTursoSchema();
  const db = getTursoClient();
  if (!dbReady || !db) return false;

  const now = new Date().toISOString();
  await db.execute({
    sql: `
      INSERT INTO users (id, email, name, picture, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        email = excluded.email,
        name = excluded.name,
        picture = excluded.picture,
        updated_at = excluded.updated_at
    `,
    args: [
      getSessionUserId(session),
      session.email,
      session.name ?? null,
      session.picture ?? null,
      now,
      now,
    ],
  });

  return true;
}

export async function savePendingDriveCredentials(
  state: string,
  credentials: DriveCredentials
) {
  const session = await getCurrentAppSession();
  const dbReady = await ensureTursoSchema();
  const db = getTursoClient();

  if (!session || !dbReady || !db) return false;

  await upsertUser(session);

  const now = new Date();
  const expiresAt = Math.floor(
    (now.getTime() + PENDING_STATE_MAX_AGE_SECONDS * 1000) / 1000
  );

  await db.execute({
    sql: `
      INSERT INTO drive_oauth_states (
        state,
        user_id,
        user_email,
        user_name,
        user_picture,
        client_id,
        client_secret_encrypted,
        project_id,
        created_at,
        expires_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(state) DO UPDATE SET
        user_id = excluded.user_id,
        user_email = excluded.user_email,
        user_name = excluded.user_name,
        user_picture = excluded.user_picture,
        client_id = excluded.client_id,
        client_secret_encrypted = excluded.client_secret_encrypted,
        project_id = excluded.project_id,
        created_at = excluded.created_at,
        expires_at = excluded.expires_at
    `,
    args: [
      state,
      getSessionUserId(session),
      session.email,
      session.name ?? null,
      session.picture ?? null,
      credentials.clientId,
      encryptJson(credentials.clientSecret),
      credentials.projectId,
      now.toISOString(),
      expiresAt,
    ],
  });

  return true;
}

export async function consumePendingDriveCredentials(state: string) {
  const dbReady = await ensureTursoSchema();
  const db = getTursoClient();
  if (!dbReady || !db) return null;

  const nowSeconds = Math.floor(Date.now() / 1000);
  await db.execute({
    sql: "DELETE FROM drive_oauth_states WHERE expires_at < ?",
    args: [nowSeconds],
  });

  const result = await db.execute({
    sql: "SELECT * FROM drive_oauth_states WHERE state = ? AND expires_at >= ?",
    args: [state, nowSeconds],
  });
  await db.execute({
    sql: "DELETE FROM drive_oauth_states WHERE state = ?",
    args: [state],
  });

  const row = result.rows[0];
  if (!row) return null;

  const clientSecret = decryptJson<string>(
    readString(row.client_secret_encrypted) || ""
  );

  return {
    state,
    userId: readString(row.user_id) || "",
    userEmail: readString(row.user_email),
    userName: readString(row.user_name),
    userPicture: readString(row.user_picture),
    clientId: readString(row.client_id) || "",
    clientSecret,
    projectId: readString(row.project_id) || "",
  } satisfies PendingDriveCredentials;
}

export async function saveDriveConnection(
  credentials: DriveCredentials,
  tokens: OAuthTokens,
  pending?: PendingDriveCredentials | null
) {
  const dbReady = await ensureTursoSchema();
  const db = getTursoClient();
  if (!dbReady || !db) return false;

  const currentSession = await getCurrentAppSession();
  const session: AppSession = currentSession ?? {
    email: pending?.userEmail || "Google account",
    name: pending?.userName ?? undefined,
    picture: pending?.userPicture ?? undefined,
    sub: pending?.userId,
  };
  const userId = pending?.userId || getSessionUserId(session);
  const now = new Date().toISOString();

  await upsertUser({ ...session, sub: userId });

  await db.execute({
    sql: `
      INSERT INTO drive_connections (
        user_id,
        user_email,
        user_name,
        user_picture,
        client_id,
        client_secret_encrypted,
        project_id,
        tokens_encrypted,
        scopes,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        user_email = excluded.user_email,
        user_name = excluded.user_name,
        user_picture = excluded.user_picture,
        client_id = excluded.client_id,
        client_secret_encrypted = excluded.client_secret_encrypted,
        project_id = excluded.project_id,
        tokens_encrypted = excluded.tokens_encrypted,
        scopes = excluded.scopes,
        updated_at = excluded.updated_at
    `,
    args: [
      userId,
      session.email,
      session.name ?? null,
      session.picture ?? null,
      credentials.clientId,
      encryptJson(credentials.clientSecret),
      credentials.projectId,
      encryptJson(tokens),
      tokens.scope ?? null,
      now,
      now,
    ],
  });

  return true;
}

export const getCurrentDriveConnection = cache(
  async function getCurrentDriveConnection() {
    const session = await getCurrentAppSession();
    const dbReady = await ensureTursoSchema();
    const db = getTursoClient();

    if (session && dbReady && db) {
      const result = await db.execute({
        sql: "SELECT * FROM drive_connections WHERE user_id = ?",
        args: [getSessionUserId(session)],
      });
      const row = result.rows[0];

      if (row) {
        return {
          userId: readString(row.user_id) || getSessionUserId(session),
          userEmail: readString(row.user_email),
          userName: readString(row.user_name),
          userPicture: readString(row.user_picture),
          clientId: readString(row.client_id) || "",
          clientSecret: decryptJson<string>(
            readString(row.client_secret_encrypted) || ""
          ),
          projectId: readString(row.project_id) || "",
          tokens: decryptJson<OAuthTokens>(
            readString(row.tokens_encrypted) || ""
          ),
          scopes: readString(row.scopes),
        } satisfies StoredDriveConnection;
      }
    }

    return getLegacyCookieConnection();
  }
);

export const hasCurrentDriveConnection = cache(
  async function hasCurrentDriveConnection() {
    return Boolean(await getCurrentDriveConnection());
  }
);

export async function saveCurrentDriveTokens(tokens: OAuthTokens) {
  const session = await getCurrentAppSession();
  const dbReady = await ensureTursoSchema();
  const db = getTursoClient();

  if (!session || !dbReady || !db) return false;

  const result = await db.execute({
    sql: "SELECT user_id FROM drive_connections WHERE user_id = ?",
    args: [getSessionUserId(session)],
  });

  if (!result.rows[0]) return false;

  await db.execute({
    sql: `
      UPDATE drive_connections
      SET tokens_encrypted = ?, updated_at = ?
      WHERE user_id = ?
    `,
    args: [encryptJson(tokens), new Date().toISOString(), getSessionUserId(session)],
  });

  return true;
}

export async function deleteCurrentDriveConnection() {
  const session = await getCurrentAppSession();
  const dbReady = await ensureTursoSchema();
  const db = getTursoClient();

  if (session && dbReady && db) {
    await db.execute({
      sql: "DELETE FROM drive_connections WHERE user_id = ?",
      args: [getSessionUserId(session)],
    });
  }

  const cookieStore = await cookies();
  cookieStore.delete(GOOGLE_TOKEN_COOKIE);
  cookieStore.delete(DRIVE_OAUTH_STATE_COOKIE);
  cookieStore.delete("gdrive_client_id");
  cookieStore.delete("gdrive_client_secret");
  cookieStore.delete("gdrive_project_id");
}
