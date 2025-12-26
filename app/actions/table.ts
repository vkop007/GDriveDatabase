"use server";

import { operations, initDriveService } from "gdrivekit";
import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { getAuth, fetchWithAuth } from "../../lib/gdrive/auth";
import { createFileInFolder } from "../../lib/gdrive/operations";

// Types for Table Structure
export interface ColumnDefinition {
  key: string;
  type: "string" | "integer" | "boolean" | "datetime" | "relation" | "storage";
  required: boolean;
  default?: any;
  array?: boolean;
  relationTableId?: string;
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
    const response = await operations.listOperations.listFilesInFolder(
      databaseId
    );
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
  const relationTableId = formData.get("relationTableId") as string;

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
    relationTableId: type === "relation" ? relationTableId : undefined,
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
  revalidateTag("database-tree", "max");
}

export async function deleteColumn(formData: FormData) {
  const fileId = formData.get("fileId") as string;
  const columnKey = formData.get("columnKey") as string;

  if (!fileId || !columnKey) {
    throw new Error("Missing parameters");
  }

  // Prevent deletion of system columns
  if (columnKey.startsWith("$")) {
    throw new Error("Cannot delete system columns");
  }

  const table = await getTableData(fileId);

  // Remove column from schema
  table.schema = table.schema.filter((c) => c.key !== columnKey);

  // Remove the key from all existing documents
  table.documents.forEach((doc) => {
    delete doc[columnKey];
  });

  await saveTableContent(fileId, table);

  revalidatePath(`/dashboard/table/${fileId}`);
  revalidateTag("database-tree", "max");
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

export async function updateDocument(formData: FormData) {
  const fileId = formData.get("fileId") as string;
  const docId = formData.get("docId") as string;
  const dataStr = formData.get("data") as string;

  console.log("[updateDocument] Called with:", { fileId, docId, dataStr });

  if (!fileId || !docId || !dataStr) {
    console.log("[updateDocument] Missing parameters");
    return { success: false, error: "Missing parameters" };
  }

  try {
    const data = JSON.parse(dataStr);
    console.log("[updateDocument] Parsed data:", data);

    const table = await getTableData(fileId);
    console.log(
      "[updateDocument] Got table with",
      table.documents.length,
      "documents"
    );

    const docIndex = table.documents.findIndex((d) => d.$id === docId);
    console.log("[updateDocument] Found document at index:", docIndex);

    if (docIndex === -1) {
      console.log("[updateDocument] Document not found");
      return { success: false, error: "Document not found" };
    }

    // Preserve system fields and update with new data
    const updatedDoc: RowData = {
      ...table.documents[docIndex],
      ...data,
      $id: docId, // Ensure $id is not changed
      $createdAt: table.documents[docIndex].$createdAt, // Preserve original
      $updatedAt: new Date().toISOString(), // Update timestamp
    };

    console.log("[updateDocument] Updated doc:", updatedDoc);

    table.documents[docIndex] = updatedDoc;
    console.log("[updateDocument] Saving to Drive...");
    await saveTableContent(fileId, table);
    console.log("[updateDocument] Saved successfully!");

    revalidatePath(`/dashboard/table/${fileId}`);
    revalidateTag(`table-data-${fileId}`, "max");
    return { success: true };
  } catch (error) {
    console.error("[updateDocument] Error:", error);
    return { success: false, error: "Failed to update document" };
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

export async function bulkDeleteDocuments(fileId: string, docIds: string[]) {
  if (!fileId || !docIds || docIds.length === 0) {
    return { success: false, error: "Missing parameters" };
  }

  try {
    const table = await getTableData(fileId);
    const docIdSet = new Set(docIds);
    const initialCount = table.documents.length;

    table.documents = table.documents.filter((d) => !docIdSet.has(d.$id));

    const deletedCount = initialCount - table.documents.length;

    await saveTableContent(fileId, table);
    revalidatePath(`/dashboard/table/${fileId}`);

    return { success: true, deletedCount };
  } catch (error) {
    console.error("Error bulk deleting documents:", error);
    return { success: false, error: "Failed to delete documents" };
  }
}

// Helper to save the entire table content
async function saveTableContent(fileId: string, content: TableFile) {
  console.log("[saveTableContent] Saving to fileId:", fileId);
  console.log("[saveTableContent] Content:", JSON.stringify(content, null, 2));

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

  const result = await driveService.updateJsonContent(fileId, content);
  console.log("[saveTableContent] Drive API result:", result);
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
    await operations.fileOperations.deleteFile(fileId);
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
  // gdrivekit doesn't seem to expose a direct "getFileAttributes" or "getParents" helper easily accessible here.
  // Falling back to fetchWithAuth which works reliably.
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

export async function getParentInfo(
  fileId: string
): Promise<{ id: string; name: string } | null> {
  try {
    // First get the parent ID
    const parentId = await getParentId(fileId);
    if (!parentId) return null;

    // Then get the parent folder's name
    const response = await fetchWithAuth(
      `https://www.googleapis.com/drive/v3/files/${parentId}?fields=id,name`
    );

    if (!response.ok) {
      console.error(`Failed to fetch parent info: ${response.status}`);
      return { id: parentId, name: "Collection" };
    }

    const data = await response.json();
    return { id: data.id, name: data.name };
  } catch (error) {
    return null;
  }
}

export async function getSimpleTableData(tableId: string) {
  try {
    console.log("Fetching simple table data for:", tableId);
    const table = await getTableData(tableId);
    if (!table) {
      console.log("Table not found:", tableId);
      return [];
    }

    console.log("Table found. Doc count:", table.documents.length);

    // Find the first string column that isn't an ID or system field to use as a label
    // If none found, just use the second column or $id
    const labelField =
      table.schema.find(
        (c) =>
          c.type === "string" && !c.key.startsWith("$") && c.key !== "password"
      )?.key || "$id";

    console.log("Using label field:", labelField);

    const results = table.documents.map((doc) => ({
      id: doc.$id,
      label: doc[labelField] || doc.$id,
    }));
    console.log("Returning results:", results);
    return results;
  } catch (error) {
    console.error("Error fetching simple table data:", error);
    return [];
  }
}
