"use server";

import { operations, initDriveService } from "gdrivekit";
import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { getAuth, fetchWithAuth } from "../../lib/gdrive/auth";
import { createFileInFolder } from "../../lib/gdrive/operations";
import { validateDocument } from "../../lib/validation";
import {
  ColumnDefinition,
  RowData,
  TableFile,
  ValidationError,
} from "../../types";

// Re-export ColumnDefinition for backward compatibility
export type { ColumnDefinition };

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

// Helper to get fresh table data bypassing Next.js cache
async function getFreshTableData(fileId: string): Promise<TableFile> {
  const response = await fetchWithAuth(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { cache: "no-store", next: { revalidate: 0 } }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch table data: ${response.status} ${response.statusText}`
    );
  }

  return (await response.json()) as TableFile;
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
  const response = await fetchWithAuth(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { next: { tags: [`table-data-${fileId}`] } }
  );

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(
      `Failed to fetch table data: ${response.status} ${response.statusText}`
    );
  }

  return (await response.json()) as TableFile;
}

export async function updateTableSchema(formData: FormData) {
  const fileId = formData.get("fileId") as string;
  const key = formData.get("key") as string;
  const type = formData.get("type") as any;
  const required = formData.get("required") === "on";
  const isArray = formData.get("array") === "on";
  const defaultValue = formData.get("default") as string;
  const relationTableId = formData.get("relationTableId") as string;

  // Parse validation rules from form data
  const validationMinLength = formData.get("validation_minLength") as string;
  const validationMaxLength = formData.get("validation_maxLength") as string;
  const validationPattern = formData.get("validation_pattern") as string;
  const validationEmail = formData.get("validation_email") === "on";
  const validationUrl = formData.get("validation_url") === "on";
  const validationEnum = formData.get("validation_enum") as string;
  const validationMin = formData.get("validation_min") as string;
  const validationMax = formData.get("validation_max") as string;
  const validationMessage = formData.get("validation_message") as string;

  if (!fileId || !key || !type) {
    throw new Error("Missing parameters");
  }

  // Use FRESH data for schema updates
  const table = await getFreshTableData(fileId);

  // Check if column already exists
  if (table.schema.some((c) => c.key === key)) {
    throw new Error("Column already exists");
  }

  // Build validation object if any rules are set
  let validation: import("../../types").ValidationRules | undefined;
  if (
    validationMinLength ||
    validationMaxLength ||
    validationPattern ||
    validationEmail ||
    validationUrl ||
    validationEnum ||
    validationMin ||
    validationMax ||
    validationMessage
  ) {
    validation = {};

    if (validationMinLength) {
      validation.minLength = parseInt(validationMinLength, 10);
    }
    if (validationMaxLength) {
      validation.maxLength = parseInt(validationMaxLength, 10);
    }
    if (validationPattern) {
      validation.pattern = validationPattern;
    }
    if (validationEmail) {
      validation.email = true;
    }
    if (validationUrl) {
      validation.url = true;
    }
    if (validationEnum) {
      validation.enum = validationEnum
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
    }
    if (validationMin) {
      validation.min = parseInt(validationMin, 10);
    }
    if (validationMax) {
      validation.max = parseInt(validationMax, 10);
    }
    if (validationMessage) {
      validation.message = validationMessage;
    }
  }

  // Import at top if not present, but we are inside function so we can't.
  // We assume checkingUniqueConstraint and rebuildIndex are imported at top of file.
  // Or we dynamically import or use the ones we added to imports.

  interface UpdateSchemaResult {
    success: boolean;
    error?: string;
    column?: ColumnDefinition;
  }

  // ... inside updateTableSchema ...
  const validationUnique = formData.get("unique") === "on";

  // ... (validation parsing) ...

  const newColumn: ColumnDefinition = {
    key,
    type,
    required,
    array: isArray,
    relationTableId: type === "relation" ? relationTableId : undefined,
    default: defaultValue || undefined,
    validation,
    unique: validationUnique,
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

  // Rebuild index if unique
  if (validationUnique) {
    // Need databaseId
    const databaseId = await getParentId(fileId);
    if (databaseId) {
      // Should exist
      const { rebuildIndex } = await import("../../lib/indexing");
      const indexFileId = await rebuildIndex(
        databaseId,
        fileId,
        key,
        table.documents
      );

      // Update schema with the new indexFileId
      const colIndex = table.schema.findIndex((c) => c.key === key);
      if (colIndex !== -1) {
        table.schema[colIndex].indexFileId = indexFileId;
        await saveTableContent(fileId, table);
      }
    }
  }

  revalidatePath(`/dashboard/table/${fileId}`);
  revalidateTag(`table-data-${fileId}`, { expire: 0 });
  revalidateTag("database-tree", { expire: 0 });
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

  const table = await getFreshTableData(fileId);

  // Find column to get indexFileId if needed
  const column = table.schema.find((c) => c.key === columnKey);
  // Remove column from schema
  table.schema = table.schema.filter((c) => c.key !== columnKey);

  // Remove the key from all existing documents
  table.documents.forEach((doc) => {
    delete doc[columnKey];
  });

  await saveTableContent(fileId, table);

  // Clean up index if it exists (regardless if it was marked unique, good practice to clean up)
  try {
    const databaseId = await getParentId(fileId);
    if (databaseId) {
      // Should exist
      const { deleteIndex } = await import("../../lib/indexing");
      await deleteIndex(
        databaseId,
        fileId,
        columnKey,
        undefined,
        column?.indexFileId
      );
    }
  } catch (e) {
    console.error("Failed to delete index file:", e);
  }

  revalidatePath(`/dashboard/table/${fileId}`);
  revalidateTag(`table-data-${fileId}`, { expire: 0 });
  revalidateTag("database-tree", { expire: 0 });
}

import { checkUniqueConstraint, updateIndex } from "../../lib/indexing";

// Helper to get database ID from file ID (needed for indexes)
// We assume 1-level tables (Database -> Table) for simplicity.
// Actually getParentId helper is at bottom of file, let's move/import it.
// We can assume parent of table is database folder.
// But we need to get it dynamically.

// ...

export async function addDocument(formData: FormData): Promise<{
  success: boolean;
  error?: string;
  errors?: ValidationError[];
}> {
  const fileId = formData.get("fileId") as string;
  const dataStr = formData.get("data") as string;
  let databaseId = formData.get("databaseId") as string;

  if (!fileId || !dataStr) {
    return { success: false, error: "Missing parameters" };
  }

  const data = JSON.parse(dataStr);
  const table = await getFreshTableData(fileId);

  if (!databaseId) {
    databaseId = await getParentId(fileId);
  }

  // Validate against schema with Zod
  const validation = validateDocument(data, table.schema);
  if (!validation.success) {
    return {
      success: false,
      errors: validation.errors,
      error: validation.errors
        .map((e) => `${e.field}: ${e.message}`)
        .join(", "),
    };
  }

  // Check Unique Constraints
  const uniqueColumns = table.schema.filter((col) => col.unique);
  if (databaseId) {
    for (const col of uniqueColumns) {
      const val = validation.data[col.key];
      const check = await checkUniqueConstraint(
        databaseId,
        fileId,
        col.key,
        val,
        undefined,
        undefined,
        col.indexFileId
      );
      if (!check.safe) {
        return {
          success: false,
          error: `Unique constraint failed for field '${col.key}': ${check.error}`,
        };
      }
    }
  }

  const newDoc: RowData = {
    $id: crypto.randomUUID(),
    $createdAt: new Date().toISOString(),
    $updatedAt: new Date().toISOString(),
    ...validation.data,
  };

  try {
    table.documents.push(newDoc);
    await saveTableContent(fileId, table);

    // Update Indexes
    let schemaUpdated = false;
    if (databaseId) {
      for (const col of uniqueColumns) {
        const val = newDoc[col.key];
        const newIndexFileId = await updateIndex(
          databaseId,
          fileId,
          col.key,
          undefined, // old value
          val, // new value
          newDoc.$id,
          undefined,
          col.indexFileId
        );

        if (newIndexFileId && newIndexFileId !== col.indexFileId) {
          col.indexFileId = newIndexFileId;
          schemaUpdated = true;
        }
      }
    }

    if (schemaUpdated) {
      await saveTableContent(fileId, table);
    }

    revalidatePath(`/dashboard/table/${fileId}`);
    revalidateTag(`table-data-${fileId}`, { expire: 0 });

    return { success: true };
  } catch (error) {
    console.error("Error adding document:", error);
    return { success: false, error: "Failed to add document" };
  }
}

export async function updateDocument(formData: FormData): Promise<{
  success: boolean;
  error?: string;
  errors?: ValidationError[];
}> {
  const fileId = formData.get("fileId") as string;
  const docId = formData.get("docId") as string;
  const dataStr = formData.get("data") as string;
  let databaseId = formData.get("databaseId") as string;

  console.log("[updateDocument] Called with:", { fileId, docId, dataStr });

  if (!fileId || !docId || !dataStr) {
    console.log("[updateDocument] Missing parameters");
    return { success: false, error: "Missing parameters" };
  }

  try {
    const data = JSON.parse(dataStr);
    console.log("[updateDocument] Parsed data:", data);

    const table = await getFreshTableData(fileId);
    console.log(
      "[updateDocument] Got table with",
      table.documents.length,
      "documents"
    );

    // Find document index FIRST
    const docIndex = table.documents.findIndex((d) => d.$id === docId);
    console.log("[updateDocument] Found document at index:", docIndex);

    if (docIndex === -1) {
      console.log("[updateDocument] Document not found");
      return { success: false, error: "Document not found" };
    }

    if (!databaseId) {
      databaseId = await getParentId(fileId);
    }

    // Validate against schema with Zod
    const validation = validateDocument(data, table.schema);
    if (!validation.success) {
      console.log("[updateDocument] Validation failed:", validation.errors);
      return {
        success: false,
        errors: validation.errors,
        error: validation.errors
          .map((e) => `${e.field}: ${e.message}`)
          .join(", "),
      };
    }

    // Check Unique Constraints
    const uniqueColumns = table.schema.filter((col) => col.unique);

    if (databaseId) {
      for (const col of uniqueColumns) {
        // Compare with existing value in table (using docIndex which is now safe)
        if (validation.data[col.key] !== table.documents[docIndex][col.key]) {
          // Only check if value changed
          const val = validation.data[col.key];
          const check = await checkUniqueConstraint(
            databaseId,
            fileId,
            col.key,
            val,
            docId, // Exclude self
            undefined,
            col.indexFileId
          );
          if (!check.safe) {
            return {
              success: false,
              error: `Unique constraint failed for field '${col.key}': ${check.error}`,
            };
          }
        }
      }
    }

    // Capture old values for index update
    const oldDoc = table.documents[docIndex];
    const oldValues: Record<string, any> = {};
    uniqueColumns.forEach((col) => {
      oldValues[col.key] = oldDoc[col.key];
    });

    // Preserve system fields and update with new data
    const updatedDoc: RowData = {
      ...table.documents[docIndex],
      ...validation.data,
      $id: docId, // Ensure $id is not changed
      $createdAt: table.documents[docIndex].$createdAt, // Preserve original
      $updatedAt: new Date().toISOString(), // Update timestamp
    };

    console.log("[updateDocument] Updated doc:", updatedDoc);

    table.documents[docIndex] = updatedDoc;
    console.log("[updateDocument] Saving to Drive...");
    await saveTableContent(fileId, table);
    console.log("[updateDocument] Saved successfully!");

    // Update Indexes
    let schemaUpdated = false;
    if (databaseId) {
      for (const col of uniqueColumns) {
        const newVal = updatedDoc[col.key];
        const oldVal = oldValues[col.key];

        if (newVal !== oldVal) {
          const newIndexFileId = await updateIndex(
            databaseId,
            fileId,
            col.key,
            oldVal,
            newVal,
            docId,
            undefined,
            col.indexFileId
          );
          if (newIndexFileId && newIndexFileId !== col.indexFileId) {
            col.indexFileId = newIndexFileId;
            schemaUpdated = true;
          }
        }
      }
    }

    if (schemaUpdated) {
      await saveTableContent(fileId, table);
    }

    revalidatePath(`/dashboard/table/${fileId}`);
    revalidateTag(`table-data-${fileId}`, { expire: 0 });
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

  const table = await getFreshTableData(fileId);
  table.documents = table.documents.filter((d) => d.$id !== docId);

  await saveTableContent(fileId, table);
  revalidatePath(`/dashboard/table/${fileId}`);
  revalidateTag(`table-data-${fileId}`, { expire: 0 });
}

export async function bulkDeleteDocuments(fileId: string, docIds: string[]) {
  if (!fileId || !docIds || docIds.length === 0) {
    return { success: false, error: "Missing parameters" };
  }

  try {
    const table = await getFreshTableData(fileId);
    const docIdSet = new Set(docIds);
    const initialCount = table.documents.length;

    table.documents = table.documents.filter((d) => !docIdSet.has(d.$id));

    const deletedCount = initialCount - table.documents.length;

    await saveTableContent(fileId, table);
    revalidatePath(`/dashboard/table/${fileId}`);
    revalidateTag(`table-data-${fileId}`, { expire: 0 });

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
