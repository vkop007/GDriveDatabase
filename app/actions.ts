"use server";

import { operations, initDriveService } from "gdrivekit";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { unstable_cache, revalidateTag } from "next/cache";
import fs from "fs/promises";
import path from "path";
import {
  buildDriveOAuthUrl,
  createOAuthState,
  getBaseUrlFromHeaders,
  getSessionCookieOptions,
  DRIVE_OAUTH_STATE_COOKIE,
  GOOGLE_TOKEN_COOKIE,
} from "@/lib/gdrive/google-oauth";
import {
  savePendingDriveCredentials,
  getCurrentDriveConnection,
} from "@/lib/gdrive/drive-connection-store";
import {
  createEmailPasswordUser,
  verifyEmailPasswordUser,
} from "@/lib/auth/email-password";
import { setAppSessionCookie } from "@/lib/auth/app-session";
import { getAuth as getDriveAuth } from "@/lib/gdrive/auth";

import { createTable } from "./actions/table";
import {
  moveFile,
  getOrCreateRootFolder,
  getOrCreateSystemFolder,
} from "../lib/gdrive/operations";
import type {
  Database,
  DatabaseNavItem,
  DatabaseTreeItem,
  DriveFile,
  Table,
  TableFile,
} from "../types";

const SECRETS_FILE = path.join(process.cwd(), "api-secrets.json");

export async function getAuth() {
  return getDriveAuth();
}

type DriveAuth = Awaited<ReturnType<typeof getAuth>>;

const API_CONFIG_FILE = "api-config.json";

export async function generateApiKey() {
  const { tokens, clientId, clientSecret, projectId, driveService } =
    await getAuth();
  const apiKey = "sk_" + crypto.randomUUID().replace(/-/g, "");

  const secretData = {
    apiKey,
    tokens,
    clientId,
    clientSecret,
    projectId,
  };

  // Save locally
  await fs.writeFile(SECRETS_FILE, JSON.stringify(secretData, null, 2));

  // Sync to Drive - save in _SystemData folder
  try {
    const systemFolderId = await getOrCreateSystemFolder();
    const files = await operations.listOperations.listFilesInFolder(
      systemFolderId
    );
    const systemFiles = (files.data?.files ?? []) as DriveFile[];
    const existingConfig = systemFiles.find(
      (f) => f.name === API_CONFIG_FILE && !f.trashed
    );

    if (existingConfig) {
      await driveService.updateJsonContent(existingConfig.id, secretData);
    } else {
      const result = await operations.jsonOperations.createJsonFile(
        secretData,
        API_CONFIG_FILE
      );
      if (result.success && result.data.id) {
        await moveFile(result.data.id, systemFolderId);
      }
    }
  } catch (e) {
    console.error("Failed to sync API config to Drive:", e);
  }

  return apiKey;
}

export async function getApiKey() {
  // First, try reading from local file
  try {
    const data = await fs.readFile(SECRETS_FILE, "utf-8");
    const secrets = JSON.parse(data);
    if (secrets.apiKey) {
      return secrets.apiKey as string;
    }
  } catch {
    // Local file doesn't exist or is invalid, continue to check Drive
  }

  // If local file doesn't have apiKey, try to restore from Google Drive
  try {
    const { driveService } = await getAuth();
    const systemFolderId = await getOrCreateSystemFolder();
    const files = await operations.listOperations.listFilesInFolder(
      systemFolderId
    );
    const systemFiles = (files.data?.files ?? []) as DriveFile[];
    const configFile = systemFiles.find(
      (f) => f.name === API_CONFIG_FILE && !f.trashed
    );

    if (configFile) {
      const content = await driveService.selectJsonContent(configFile.id);
      if (content?.apiKey) {
        // Restore to local file for future reads
        await fs.writeFile(SECRETS_FILE, JSON.stringify(content, null, 2));
        console.log("[getApiKey] Restored API key from Google Drive");
        return content.apiKey as string;
      }
    }
  } catch (error) {
    console.error("[getApiKey] Failed to fetch from Drive:", error);
  }

  return null;
}

export async function deleteApiKey() {
  const { driveService } = await getAuth();

  try {
    // Read existing secrets to keep other data if needed, but for now we just clear the file or remove the key
    // Actually, we should probably keep the auth tokens but remove the apiKey
    const data = await fs.readFile(SECRETS_FILE, "utf-8");
    const secrets = JSON.parse(data);

    const newSecrets = { ...secrets };
    delete newSecrets.apiKey;

    // Save locally
    await fs.writeFile(SECRETS_FILE, JSON.stringify(newSecrets, null, 2));

    // Sync to Drive - use _SystemData folder
    const systemFolderId = await getOrCreateSystemFolder();
    const files = await operations.listOperations.listFilesInFolder(
      systemFolderId
    );
    const systemFiles = (files.data?.files ?? []) as DriveFile[];
    const existingConfig = systemFiles.find(
      (f) => f.name === API_CONFIG_FILE && !f.trashed
    );

    if (existingConfig) {
      await driveService.updateJsonContent(existingConfig.id, newSecrets);
    }
  } catch (e) {
    console.error("Failed to delete API key:", e);
    throw e;
  }
}

export async function getApiAuth(apiKey: string) {
  try {
    const data = await fs.readFile(SECRETS_FILE, "utf-8");
    const secrets = JSON.parse(data);

    if (secrets.apiKey !== apiKey) {
      console.error("[getApiAuth] API Key mismatch");
      throw new Error("Invalid API Key");
    }

    // Reset the driveService singleton to ensure fresh tokens are used
    const { resetDriveService } = await import("gdrivekit");
    resetDriveService();

    // Try to get fresh tokens from the user's active session (cookies)
    // This ensures the API key works even after the original tokens expire
    let tokensToUse = secrets.tokens;
    try {
      const cookieStore = await cookies();
      const cookieTokensStr = cookieStore.get(GOOGLE_TOKEN_COOKIE)?.value;
      if (cookieTokensStr) {
        const cookieTokens = JSON.parse(cookieTokensStr);
        // Update secrets with fresh tokens from cookies
        if (cookieTokens.access_token) {
          tokensToUse = cookieTokens;
          // Sync the fresh tokens back to api-secrets.json
          const updatedSecrets = { ...secrets, tokens: cookieTokens };
          await fs.writeFile(
            SECRETS_FILE,
            JSON.stringify(updatedSecrets, null, 2)
          );
          console.log("[getApiAuth] Synced fresh tokens from session");
        }
      }

      if (!cookieTokensStr) {
        const currentConnection = await getCurrentDriveConnection();
        if (currentConnection?.tokens?.access_token) {
          tokensToUse = currentConnection.tokens;
          const updatedSecrets = { ...secrets, tokens: currentConnection.tokens };
          await fs.writeFile(
            SECRETS_FILE,
            JSON.stringify(updatedSecrets, null, 2)
          );
          console.log("[getApiAuth] Synced fresh tokens from stored session");
        }
      }
    } catch {
      // If we can't get cookies (e.g., external API call), use stored tokens
      console.log("[getApiAuth] Using stored tokens (no active session)");
    }

    // Check if tokens are present
    if (!tokensToUse) {
      console.error("[getApiAuth] No tokens in secrets");
      throw new Error("No tokens available");
    }

    const driveService = initDriveService(
      {
        client_id: secrets.clientId,
        client_secret: secrets.clientSecret,
        project_id: secrets.projectId,
        redirect_uris: [`${process.env.NEXT_PUBLIC_BASE_URL}/oauth2callback`],
      },
      tokensToUse
    );

    return { ...secrets, tokens: tokensToUse, driveService };
  } catch (error) {
    console.error("[getApiAuth] Authentication failed with error:", error);
    throw new Error("API Authentication failed");
  }
}

export type AuthActionState = {
  error?: string;
};

function authErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Authentication failed.";
}

export async function signInWithEmail(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  let session;
  try {
    session = await verifyEmailPasswordUser(formData);
  } catch (error) {
    return { error: authErrorMessage(error) };
  }

  await setAppSessionCookie(session);
  redirect("/dashboard");
}

export async function signUpWithEmail(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  let session;
  try {
    session = await createEmailPasswordUser(formData);
  } catch (error) {
    return { error: authErrorMessage(error) };
  }

  await setAppSessionCookie(session);
  redirect("/dashboard");
}

export async function connectDriveWithGoogle(formData: FormData) {
  const clientId = formData.get("clientId") as string;
  const clientSecret = formData.get("clientSecret") as string;
  const projectId = formData.get("projectId") as string;

  if (!clientId || !clientSecret || !projectId) {
    throw new Error("Missing Google Drive credentials");
  }

  let authUrl = "";

  try {
    const state = createOAuthState();
    const cookieStore = await cookies();
    const headerStore = await headers();
    const stateCookieOptions = getSessionCookieOptions(10 * 60);
    const credentialCookieOptions = getSessionCookieOptions(60 * 60 * 24 * 30);
    const savedPendingCredentials = await savePendingDriveCredentials(state, {
      clientId,
      clientSecret,
      projectId,
    });

    if (savedPendingCredentials) {
      cookieStore.delete("gdrive_client_id");
      cookieStore.delete("gdrive_client_secret");
      cookieStore.delete("gdrive_project_id");
    } else {
      cookieStore.set("gdrive_client_id", clientId, credentialCookieOptions);
      cookieStore.set(
        "gdrive_client_secret",
        clientSecret,
        credentialCookieOptions
      );
      cookieStore.set("gdrive_project_id", projectId, credentialCookieOptions);
    }

    cookieStore.set(DRIVE_OAUTH_STATE_COOKIE, state, stateCookieOptions);

    authUrl = buildDriveOAuthUrl(
      { clientId },
      state,
      getBaseUrlFromHeaders(headerStore)
    );
  } catch (error) {
    console.error("Error generating Google Drive auth URL:", error);
    throw error;
  }

  redirect(authUrl);
}

// System folder/file names to hide from user
const SYSTEM_NAMES = [
  "api-config.json",
  "_system",
  ".system",
  "System",
  "_SystemData",
];

// Internal fetch function for databases
async function _listDatabases(auth: DriveAuth): Promise<Database[]> {
  initDriveService(
    {
      client_id: auth.clientId,
      client_secret: auth.clientSecret,
      project_id: auth.projectId,
      redirect_uris: [`${process.env.NEXT_PUBLIC_BASE_URL}/oauth2callback`],
    },
    auth.tokens
  );

  try {
    console.log("Fetching databases from Drive...");
    const rootId = await getOrCreateRootFolder(auth);
    const response = await operations.listOperations.listFoldersInFolder(
      rootId
    );
    const folders = (response.data?.files || []) as Database[];
    // Filter out system folders (starting with _ or . or in SYSTEM_NAMES)
    return folders.filter(
      (f) =>
        !f.name.startsWith("_") &&
        !f.name.startsWith(".") &&
        !SYSTEM_NAMES.includes(f.name)
    );
  } catch (error) {
    console.error("Error listing databases:", error);
    return [];
  }
}

export const listDatabases = async () => {
  const auth = await getAuth();
  return unstable_cache(
    async () => _listDatabases(auth),
    ["databases", auth.tokens.refresh_token], // Use refresh token as stable user ID
    { revalidate: 3600, tags: ["databases"] }
  )();
};

export async function createDatabase(formData: FormData) {
  const name = formData.get("name") as string;
  
  // Initialize drive service first
  const auth = await getAuth();
  initDriveService(
    {
      client_id: auth.clientId,
      client_secret: auth.clientSecret,
      project_id: auth.projectId,
      redirect_uris: [`${process.env.NEXT_PUBLIC_BASE_URL}/oauth2callback`],
    },
    auth.tokens
  );

  const checkExists = await operations.listOperations.listFoldersByName(name);

  if (checkExists.data?.files?.length > 0) {
    throw new Error("Database with this name already exists");
  }

  if (!name) {
    throw new Error("Missing database name");
  }

  try {
    const rootId = await getOrCreateRootFolder(auth);
    await operations.folderOperations.createFolder(name, rootId);
  } catch (error) {
    console.error("Error creating database:", error);
    return { success: false, error: "Failed to create database" };
  }

  revalidateTag("databases", { expire: 0 });
  revalidateTag("database-nav-tree", { expire: 0 });
  revalidateTag("database-tree", { expire: 0 });
  return { success: true };
}

export async function deleteDatabase(formData: FormData) {
  const fileId = formData.get("fileId") as string;
  if (!fileId) throw new Error("Missing fileId");

  await getAuth();
  await operations.fileOperations.deleteFile(fileId);
  revalidateTag("databases", { expire: 0 });
  revalidateTag("database-nav-tree", { expire: 0 });
  revalidateTag("database-tree", { expire: 0 });
  return { success: true };
}

// Internal fetch for collections
async function _listCollections(
  databaseId: string,
  auth: DriveAuth
): Promise<Table[]> {
  initDriveService(
    {
      client_id: auth.clientId,
      client_secret: auth.clientSecret,
      project_id: auth.projectId,
      redirect_uris: [`${process.env.NEXT_PUBLIC_BASE_URL}/oauth2callback`],
    },
    auth.tokens
  );

  try {
    console.log(`Fetching collections for ${databaseId}...`);
    const response = await operations.listOperations.listFilesInFolder(
      databaseId
    );
    const files = (response.data?.files || []) as Table[];
    return files.filter(
      (f) => f.mimeType === "application/json"
    );
  } catch (error) {
    console.error("Error listing collections:", error);
    return [];
  }
}

export const listCollections = async (databaseId: string) => {
  const auth = await getAuth();
  return unstable_cache(
    async () => _listCollections(databaseId, auth),
    [`collections-${databaseId}`, auth.tokens.refresh_token],
    { revalidate: 3600, tags: [`collections-${databaseId}`] }
  )();
};

export const getDatabaseNavTree = async (): Promise<DatabaseNavItem[]> => {
  const auth = await getAuth();

  return unstable_cache(
    async () => {
      try {
        console.log("Fetching database nav tree...");
        const databases = await _listDatabases(auth);
        const treeProps = await Promise.all(
          databases.map(async (db) => {
            const tables = await _listCollections(db.id, auth);

            return {
              id: db.id,
              name: db.name,
              tables: tables.map((table) => ({
                id: table.id,
                name: table.name,
              })),
            };
          })
        );

        return treeProps;
      } catch (error) {
        console.error("Error fetching database nav tree:", error);
        return [];
      }
    },
    ["database-nav-tree", auth.tokens.refresh_token],
    { revalidate: 3600, tags: ["database-nav-tree"] }
  )();
};

export const getDatabaseTree = async (): Promise<DatabaseTreeItem[]> => {
  const auth = await getAuth();

  // Initialize service needed for reading file content
  const driveService = initDriveService(
    {
      client_id: auth.clientId,
      client_secret: auth.clientSecret,
      project_id: auth.projectId,
      redirect_uris: [`${process.env.NEXT_PUBLIC_BASE_URL}/oauth2callback`],
    },
    auth.tokens
  );

  return unstable_cache(
    async () => {
      try {
        console.log("Fetching database tree...");
        // 1. Fetch all databases (Parallel Start)
        const databases = await _listDatabases(auth);

        // 2. Fetch all collections for all databases in parallel
        const treeProps = await Promise.all(
          databases.map(async (db) => {
            // This runs in parallel for each database
            const tables = await _listCollections(db.id, auth);

            // Fetch schema for each table (Parallel)
            const tablesWithSchema = await Promise.all(
              tables.map(async (t) => {
                try {
                  const content = (await driveService.selectJsonContent(
                    t.id
                  )) as Partial<TableFile>;
                  // selectJsonContent returns the parsed object directly
                  return {
                    id: t.id,
                    name: t.name,
                    schema: content.schema || [],
                  };
                } catch (e) {
                  console.error(
                    `Failed to fetch schema for table ${t.name}`,
                    e
                  );
                  return { id: t.id, name: t.name, schema: [] };
                }
              })
            );

            return {
              id: db.id,
              name: db.name,
              tables: tablesWithSchema,
            };
          })
        );
        return treeProps;
      } catch (error) {
        console.error("Error fetching database tree:", error);
        return [];
      }
    },
    ["database-tree", auth.tokens.refresh_token],
    { revalidate: 3600, tags: ["database-tree"] }
  )();
};

// Re-export listCollections as listTables for clarity (optional, or just alias)
export { listCollections as listTables };

// Deprecated or Modified Actions
export async function createCollection(formData: FormData) {
  // Redirecting to createTable logic to enforce new structure
  return createTable(formData);
}

export async function deleteCollection(formData: FormData) {
  const fileId = formData.get("fileId") as string;
  const parentId = formData.get("parentId") as string;

  if (!fileId || !parentId) {
    throw new Error("Missing parameters");
  }

  await getAuth();

  try {
    await operations.fileOperations.deleteFile(fileId);
  } catch (error) {
    console.error("Error deleting collection:", error);
    throw error;
  }

  revalidateTag(`collections-${parentId}`, { expire: 0 });
  revalidateTag("database-nav-tree", { expire: 0 });
  revalidateTag("database-tree", { expire: 0 });
  return { success: true };
}

export async function createDocument(formData: FormData) {
  const filename = formData.get("filename") as string;
  const content = formData.get("content") as string;

  if (!filename || !content) {
    throw new Error("Missing parameters");
  }

  let jsonContent;
  try {
    jsonContent = JSON.parse(content);
  } catch {
    throw new Error("Invalid JSON content");
  }

  await getAuth();

  try {
    const rootId = await getOrCreateRootFolder();
    const result = await operations.jsonOperations.createJsonFile(
      jsonContent,
      filename
    );

    if (result.success && result.data.id) {
      await moveFile(result.data.id, rootId);
    } else {
      throw new Error(result.error || "Failed to create file");
    }
  } catch (error) {
    console.error("Error creating document:", error);
    throw error;
  }

  redirect("/dashboard");
}

// Keeping saveDocument for generic JSON editing if needed, but might not be used for Tables
export async function saveDocument(formData: FormData) {
  // ... existing implementation or deprecated
  const filename = formData.get("filename") as string;
  const fileId = formData.get("fileId") as string;
  const content = formData.get("content") as string;

  if (!fileId || !content || !filename) {
    throw new Error("Missing parameters");
  }

  const { tokens, clientId, clientSecret, projectId } = await getAuth();
  const driveService = initDriveService(
    {
      client_id: clientId,
      client_secret: clientSecret,
      project_id: projectId,
      redirect_uris: [`${process.env.NEXT_PUBLIC_BASE_URL}/oauth2callback`],
    },
    tokens
  );

  await driveService.updateJsonContent(fileId, JSON.parse(content));
  revalidateTag(`table-data-${fileId}`, { expire: 0 });
  return { success: true };
}
