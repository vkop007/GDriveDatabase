"use server";

import { operations, initDriveService } from "gdrivekit";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { unstable_cache, revalidateTag } from "next/cache";
import fs from "fs/promises";
import path from "path";

import { createTable } from "./actions/table";
import {
  moveFile,
  getOrCreateRootFolder,
  getOrCreateSystemFolder,
} from "../lib/gdrive/operations";

const ROOT_FOLDER_NAME = "GDriveDatabase";
const SECRETS_FILE = path.join(process.cwd(), "api-secrets.json");

export async function getAuth() {
  const cookieStore = await cookies();
  const tokensStr = cookieStore.get("gdrive_tokens")?.value;
  const clientId = cookieStore.get("gdrive_client_id")?.value;
  const clientSecret = cookieStore.get("gdrive_client_secret")?.value;
  const projectId = cookieStore.get("gdrive_project_id")?.value;

  if (!tokensStr || !clientId || !clientSecret || !projectId) {
    throw new Error("Not authenticated");
  }

  const tokens = JSON.parse(tokensStr);

  const driveService = initDriveService(
    {
      client_id: clientId,
      client_secret: clientSecret,
      project_id: projectId,
      redirect_uris: ["http://localhost:3000/oauth2callback"],
    },
    tokens
  );

  return { tokens, clientId, clientSecret, projectId, driveService };
}

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
    const existingConfig = files.data?.files?.find(
      (f: any) => f.name === API_CONFIG_FILE && !f.trashed
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
  try {
    const data = await fs.readFile(SECRETS_FILE, "utf-8");
    const secrets = JSON.parse(data);
    return secrets.apiKey as string;
  } catch (error) {
    return null;
  }
}

export async function deleteApiKey() {
  const { tokens, clientId, clientSecret, projectId, driveService } =
    await getAuth();

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
    const existingConfig = files.data?.files?.find(
      (f: any) => f.name === API_CONFIG_FILE && !f.trashed
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
      throw new Error("Invalid API Key");
    }

    // Reset the driveService singleton to ensure fresh tokens are used
    const { resetDriveService } = await import("gdrivekit");
    resetDriveService();

    const driveService = initDriveService(
      {
        client_id: secrets.clientId,
        client_secret: secrets.clientSecret,
        project_id: secrets.projectId,
        redirect_uris: ["http://localhost:3000/oauth2callback"],
      },
      secrets.tokens
    );

    return { ...secrets, driveService };
  } catch (error) {
    throw new Error("API Authentication failed");
  }
}

export async function authenticateWithGoogle(formData: FormData) {
  const clientId = formData.get("clientId") as string;
  const clientSecret = formData.get("clientSecret") as string;
  const projectId = formData.get("projectId") as string;

  if (!clientId || !clientSecret || !projectId) {
    throw new Error("Missing credentials");
  }

  let authUrl;
  try {
    // Construct Auth URL manually to avoid gdrivekit's CLI-centric behavior
    const SCOPES = [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/script.projects",
      "https://www.googleapis.com/auth/script.deployments",
      "https://www.googleapis.com/auth/script.processes",
      "https://www.googleapis.com/auth/script.metrics",
      "https://www.googleapis.com/auth/script.scriptapp",
      "email",
      "profile",
    ];
    const redirectUri = "http://localhost:3000/oauth2callback";

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: SCOPES.join(" "),
      access_type: "offline",
      prompt: "consent",
    });

    authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    // Store credentials in cookies for the callback
    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === "production";

    cookieStore.set("gdrive_client_id", clientId, {
      secure: isProduction,
      httpOnly: true,
    });
    cookieStore.set("gdrive_client_secret", clientSecret, {
      secure: isProduction,
      httpOnly: true,
    });
    cookieStore.set("gdrive_project_id", projectId, {
      secure: isProduction,
      httpOnly: true,
    });

    console.log("Auth URL generated:", authUrl);
  } catch (error) {
    console.error("Error generating credentials:", error);
    throw error;
  }

  if (authUrl) {
    redirect(authUrl);
  }
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
async function _listDatabases(auth: any) {
  initDriveService(
    {
      client_id: auth.clientId,
      client_secret: auth.clientSecret,
      project_id: auth.projectId,
      redirect_uris: ["http://localhost:3000/oauth2callback"],
    },
    auth.tokens
  );

  try {
    console.log("Fetching databases from Drive...");
    const rootId = await getOrCreateRootFolder(auth);
    const response = await operations.listOperations.listFoldersInFolder(
      rootId
    );
    const folders = response.data?.files || [];
    // Filter out system folders (starting with _ or . or in SYSTEM_NAMES)
    return folders.filter(
      (f: any) =>
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
  const checkExists = await operations.listOperations.listFoldersByName(name);

  if (checkExists.data?.files?.length > 0) {
    throw new Error("Database with this name already exists");
  }

  if (!name) {
    throw new Error("Missing database name");
  }

  try {
    const rootId = await getOrCreateRootFolder();
    await operations.folderOperations.createFolder(name, rootId);
  } catch (error) {
    console.error("Error creating database:", error);
    return { success: false, error: "Failed to create database" };
  }

  revalidateTag("databases", { expire: 0 });
  revalidateTag("database-tree", { expire: 0 });
  return { success: true };
}

export async function deleteDatabase(formData: FormData) {
  const fileId = formData.get("fileId") as string;
  if (!fileId) throw new Error("Missing fileId");

  await getAuth();
  await operations.fileOperations.deleteFile(fileId);
  revalidateTag("databases", { expire: 0 });
  revalidateTag("database-tree", { expire: 0 });
  return { success: true };
}

// Internal fetch for collections
async function _listCollections(databaseId: string, auth: any) {
  initDriveService(
    {
      client_id: auth.clientId,
      client_secret: auth.clientSecret,
      project_id: auth.projectId,
      redirect_uris: ["http://localhost:3000/oauth2callback"],
    },
    auth.tokens
  );

  try {
    console.log(`Fetching collections for ${databaseId}...`);
    const response = await operations.listOperations.listFilesInFolder(
      databaseId
    );
    return (response.data?.files || []).filter(
      (f: any) => f.mimeType === "application/json"
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

export const getDatabaseTree = async () => {
  const auth = await getAuth();

  // Initialize service needed for reading file content
  const driveService = initDriveService(
    {
      client_id: auth.clientId,
      client_secret: auth.clientSecret,
      project_id: auth.projectId,
      redirect_uris: ["http://localhost:3000/oauth2callback"],
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
          databases.map(async (db: any) => {
            // This runs in parallel for each database
            const tables = await _listCollections(db.id, auth);

            // Fetch schema for each table (Parallel)
            const tablesWithSchema = await Promise.all(
              tables.map(async (t: any) => {
                try {
                  const content = await driveService.selectJsonContent(t.id);
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
  } catch (e) {
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
      throw new Error((result as any).error || "Failed to create file");
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
      redirect_uris: ["http://localhost:3000/oauth2callback"],
    },
    tokens
  );

  await driveService.updateJsonContent(fileId, JSON.parse(content));
  revalidateTag(`table-data-${fileId}`, { expire: 0 });
  return { success: true };
}
