"use server";

import { operations, initDriveService } from "gdrivekit";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAuth, fetchWithAuth } from "../../lib/gdrive/auth";
import { moveFile, createFileInFolder } from "../../lib/gdrive/operations";

// Types for Table Structure
export interface ColumnDefinition {
  key: string;
  type: "string" | "integer" | "boolean" | "datetime";
  required: boolean;
  default?: any;
  array?: boolean;
}

export interface RowData {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  [key: string]: any;
}

export interface TableFile {
  name: string;
  schema: ColumnDefinition[];
  documents: RowData[];
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

// Re-export listCollections as listTables for clarity
export { listCollections as listTables };

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
    // Use optimized single-call creation
    const result = await createFileInFolder(parentId, name, initialContent);
    console.log("Create result:", JSON.stringify(result));

    if (!result.success || !result.data?.id) {
      console.error("Failed to create file:", (result as any).error);
      throw new Error(`Failed to create file: ${(result as any).error}`);
    }
  } catch (error) {
    console.error("Error creating table:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  revalidatePath(`/dashboard/database/${parentId}`);
  return { success: true };
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

  revalidatePath(`/dashboard/table/${fileId}`);
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

  try {
    table.documents.push(newDoc);
    await saveTableContent(fileId, table);
    return { success: true };
  } catch (error) {
    console.error("Error adding document:", error);
    return { success: false, error: "Failed to add document" };
  }
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
  revalidatePath(`/dashboard/table/${fileId}`);
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

export async function getParentId(fileId: string) {
  const response = await fetchWithAuth(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=parents`
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `Failed to fetch file parents. Status: ${response.status}, Text: ${errorText}`
    );
    throw new Error(
      `Failed to fetch file parents: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data.parents?.[0];
}
