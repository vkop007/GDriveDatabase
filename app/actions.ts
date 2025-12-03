"use server";

import { operations, initDriveService } from "gdrivekit";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

const ROOT_FOLDER_NAME = "GDriveDatabase";

async function getAuth() {
  const cookieStore = await cookies();
  const tokensStr = cookieStore.get("gdrive_tokens")?.value;
  const clientId = cookieStore.get("gdrive_client_id")?.value;
  const clientSecret = cookieStore.get("gdrive_client_secret")?.value;
  const projectId = cookieStore.get("gdrive_project_id")?.value;

  if (!tokensStr || !clientId || !clientSecret || !projectId) {
    throw new Error("Not authenticated");
  }

  const tokens = JSON.parse(tokensStr);

  initDriveService(
    {
      client_id: clientId,
      client_secret: clientSecret,
      project_id: projectId,
      redirect_uris: ["http://localhost:3000/oauth2callback"],
    },
    tokens
  );

  return { tokens, clientId, clientSecret, projectId };
}

async function getOrCreateRootFolder() {
  await getAuth();

  try {
    // List all folders in the root directory
    // This is often more reliable than search queries for immediate consistency
    const response = await operations.listFoldersInFolder("root");

    console.log(
      "Root folders list:",
      JSON.stringify(
        response.data?.files?.map((f: any) => ({
          name: f.name,
          id: f.id,
          mimeType: f.mimeType,
          trashed: f.trashed,
        }))
      )
    );

    const folder = response.data?.files?.find(
      (f: any) => f.name === ROOT_FOLDER_NAME && !f.trashed
    );

    if (folder) {
      console.log("Found existing root folder via list:", folder.id);
      return folder.id;
    }
  } catch (error) {
    console.error("Error listing root folders:", error);
    // Fallback to search if list fails? Or just proceed to create?
    // Let's try search as a backup if list fails, but list should work for 'root'
  }

  console.log("Creating new root folder");
  // Create if not exists
  const createResponse = await operations.createFolder(ROOT_FOLDER_NAME);
  return createResponse.data.id;
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
    const scope = "https://www.googleapis.com/auth/drive";
    const redirectUri = "http://localhost:3000/oauth2callback";

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: scope,
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

export async function listDatabases() {
  try {
    const rootId = await getOrCreateRootFolder();
    const response = await operations.listFoldersInFolder(rootId);
    return response.data?.files || [];
  } catch (error) {
    console.error("Error listing databases:", error);
    return [];
  }
}

export async function createDatabase(formData: FormData) {
  const name = formData.get("name") as string;

  if (!name) {
    throw new Error("Missing database name");
  }

  try {
    const rootId = await getOrCreateRootFolder();
    await operations.createFolder(name, rootId);
  } catch (error) {
    console.error("Error creating database:", error);
    throw error;
  }

  redirect("/dashboard");
}

export async function deleteDatabase(formData: FormData) {
  const fileId = formData.get("fileId") as string;

  if (!fileId) {
    throw new Error("Missing fileId");
  }

  await getAuth();

  try {
    await operations.deleteFile(fileId);
  } catch (error) {
    console.error("Error deleting database:", error);
    throw error;
  }

  redirect("/dashboard");
}

export async function listCollections(databaseId: string) {
  try {
    await getAuth();
    console.log(`Listing collections in ${databaseId}...`);
    const response = await operations.listFilesInFolder(databaseId);
    console.log("List response count:", response.data?.files?.length);
    // Filter for JSON files just in case, though listFilesInFolder might return all types
    return (response.data?.files || []).filter(
      (f: any) => f.mimeType === "application/json"
    );
  } catch (error) {
    console.error("Error listing collections:", error);
    return [];
  }
}

import { ColumnDefinition, RowData, TableFile } from "../types";

import { revalidatePath } from "next/cache";

export async function createTable(formData: FormData) {
  const name = formData.get("name") as string;
  const parentId = formData.get("parentId") as string;

  if (!name || !parentId) {
    throw new Error("Missing name or parentId");
  }

  await getAuth();

  try {
    const defaultSchema: ColumnDefinition[] = [
      { key: "$id", type: "string", required: true },
      { key: "$createdAt", type: "datetime", required: true },
      { key: "$updatedAt", type: "datetime", required: true },
    ];

    const initialContent: TableFile = {
      name,
      schema: defaultSchema,
      documents: [],
    };

    console.log(`Creating table '${name}' in parent '${parentId}'...`);
    const result = await operations.createJsonFile(initialContent, name);
    console.log("Create result:", JSON.stringify(result));

    if (result.success && result.data.id) {
      console.log(`Moving file ${result.data.id} to ${parentId}...`);
      // Use custom moveFile instead of operations.moveFile
      await moveFile(result.data.id, parentId);
      console.log("Move successful");
    } else {
      console.error("Failed to create file:", result);
      throw new Error(
        `Failed to create file: ${(result as any).error || "Unknown error"}`
      );
    }
  } catch (error) {
    console.error("Error creating table:", error);
    throw error;
  }

  revalidatePath(`/dashboard/database/${parentId}`);
  redirect(`/dashboard/database/${parentId}`);
}

export async function getTableData(fileId: string) {
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

  const response = await driveService.selectJsonContent(fileId);
  return response as TableFile;
}

export async function updateTableSchema(formData: FormData) {
  const fileId = formData.get("fileId") as string;
  const key = formData.get("key") as string;
  const type = formData.get("type") as any;
  const required = formData.get("required") === "on";
  const isArray = formData.get("array") === "on";
  const defaultValue = formData.get("default") as string;

  if (!fileId || !key || !type) {
    throw new Error("Missing parameters");
  }

  const table = await getTableData(fileId);

  // Check if column already exists
  if (table.schema.some((c) => c.key === key)) {
    throw new Error("Column already exists");
  }

  const newColumn: ColumnDefinition = {
    key,
    type,
    required,
    array: isArray,
    default: defaultValue || undefined,
  };

  table.schema.push(newColumn);

  // Update all existing documents with default value if provided
  if (defaultValue !== undefined) {
    table.documents.forEach((doc) => {
      if (doc[key] === undefined) {
        doc[key] = defaultValue;
      }
    });
  }

  await saveTableContent(fileId, table);

  // Revalidate path? For now just redirect back
  redirect(`/dashboard/table/${fileId}?tab=columns`);
}

export async function addDocument(formData: FormData) {
  const fileId = formData.get("fileId") as string;
  const dataStr = formData.get("data") as string;

  if (!fileId || !dataStr) {
    throw new Error("Missing parameters");
  }

  const data = JSON.parse(dataStr);
  const table = await getTableData(fileId);

  const newDoc: RowData = {
    $id: crypto.randomUUID(),
    $createdAt: new Date().toISOString(),
    $updatedAt: new Date().toISOString(),
    ...data,
  };

  // Validate against schema (basic validation)
  for (const col of table.schema) {
    if (
      col.required &&
      newDoc[col.key] === undefined &&
      !col.key.startsWith("$")
    ) {
      // Allow missing if it has a default? Logic handled in UI mostly, but good to check
      // For now, we trust the UI/Input
    }
  }

  table.documents.push(newDoc);
  await saveTableContent(fileId, table);

  redirect(`/dashboard/table/${fileId}?tab=data`);
}

export async function deleteDocument(formData: FormData) {
  const fileId = formData.get("fileId") as string;
  const docId = formData.get("docId") as string;

  if (!fileId || !docId) {
    throw new Error("Missing parameters");
  }

  const table = await getTableData(fileId);
  table.documents = table.documents.filter((d) => d.$id !== docId);

  await saveTableContent(fileId, table);
  redirect(`/dashboard/table/${fileId}?tab=data`);
}

// Helper to save the entire table content
async function saveTableContent(fileId: string, content: TableFile) {
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

  await driveService.updateJsonContent(fileId, content);
}

// Custom move file implementation to bypass gdrivekit issue
async function moveFile(fileId: string, folderId: string) {
  let { tokens, clientId, clientSecret } = await getAuth();

  const makeRequest = async (accessToken: string) => {
    // First we need to get the current parents to remove them
    const getResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=parents`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (getResponse.status === 401) {
      return { status: 401 };
    }

    if (!getResponse.ok) {
      throw new Error(`Failed to get file parents: ${getResponse.statusText}`);
    }

    const fileData = await getResponse.json();
    const previousParents = fileData.parents?.join(",") || "";

    // Now move the file
    const moveResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?addParents=${folderId}&removeParents=${previousParents}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (moveResponse.status === 401) {
      return { status: 401 };
    }

    if (!moveResponse.ok) {
      const errorText = await moveResponse.text();
      throw new Error(`Failed to move file: ${errorText}`);
    }

    return { status: 200, success: true };
  };

  let result = await makeRequest(tokens.access_token);

  if (result.status === 401) {
    console.log("Access token expired, refreshing...");
    if (!tokens.refresh_token) {
      throw new Error("Access token expired and no refresh token available");
    }

    const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: tokens.refresh_token,
        grant_type: "refresh_token",
      }),
    });

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text();
      throw new Error(`Failed to refresh token: ${errorText}`);
    }

    const newTokens = await refreshResponse.json();

    // Merge new tokens with old ones (to keep refresh_token if not returned)
    const updatedTokens = { ...tokens, ...newTokens };

    // Update cookie
    const cookieStore = await cookies();
    cookieStore.set("gdrive_tokens", JSON.stringify(updatedTokens), {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    });

    // Retry with new token
    console.log("Retrying move with new token...");
    result = await makeRequest(updatedTokens.access_token);

    if (result.status === 401) {
      throw new Error("Still unauthorized after token refresh");
    }
  }

  return { success: true };
}

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
    await operations.deleteFile(fileId);
  } catch (error) {
    console.error("Error deleting collection:", error);
    throw error;
  }

  redirect(`/dashboard/database/${parentId}`);
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
    const result = await operations.createJsonFile(jsonContent, filename);

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

  await saveTableContent(fileId, JSON.parse(content));
  return { success: true };
}
