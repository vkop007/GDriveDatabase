import { getAuth } from "./gdrive/auth";
import { initDriveService, GoogleDriveService } from "gdrivekit";
import { createFileInFolder } from "./gdrive/operations";
import { RowData } from "../types";

export const INDEX_FOLDER_NAME = ".indexes";

export interface IndexFile {
  tableId: string;
  column: string;
  isUnique: boolean;
  map: Record<string, string[]>;
  updatedAt: string;
}

// Helper to get authorized drive service
async function getDrive(drive?: GoogleDriveService) {
  if (drive) return drive;
  const { tokens, clientId, clientSecret, projectId } = await getAuth();
  return initDriveService(
    {
      client_id: clientId,
      client_secret: clientSecret,
      project_id: projectId,
      redirect_uris: ["http://localhost:3000/oauth2callback"],
    },
    tokens
  );
}

// Get or create the main .indexes folder inside the database folder
export async function getIndexFolderId(
  databaseId: string,
  driveService?: GoogleDriveService
): Promise<string> {
  const drive = await getDrive(driveService);

  try {
    const query = `'${databaseId}' in parents and name = '${INDEX_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const response = await drive.listFiles(query);

    if (response && response.files && response.files.length > 0) {
      return response.files[0].id!;
    }
  } catch (e) {
    console.warn("Index folder search failed, trying create", e);
  }

  // Create it
  // Create it
  const createResponse: any = await drive.createFolder(
    INDEX_FOLDER_NAME,
    databaseId
  );
  console.log(
    "[getIndexFolderId] Create response:",
    JSON.stringify(createResponse)
  );

  if (createResponse?.id) return createResponse.id;
  if (createResponse?.data?.id) return createResponse.data.id;

  return createResponse.id;
}

// Generate a file name for the index
function getIndexFileName(tableId: string, columnKey: string): string {
  return `${tableId}_${columnKey}.index.json`;
}

// Get cached or fresh index content
export async function getIndex(
  databaseId: string,
  tableId: string,
  columnKey: string,
  driveService?: GoogleDriveService,
  indexFileId?: string
): Promise<{ fileId: string | null; content: IndexFile | null }> {
  try {
    const drive = await getDrive(driveService);

    let fileId = indexFileId;

    if (!fileId) {
      // Fallback to search (slow, eventually consistent)
      const folderId = await getIndexFolderId(databaseId, drive);
      const fileName = getIndexFileName(tableId, columnKey);

      const query = `'${folderId}' in parents and name = '${fileName}' and trashed = false`;
      const response = await drive.listFiles(query);

      if (response && response.files && response.files.length > 0) {
        fileId = response.files[0].id;
      }
    }

    if (!fileId) {
      return { fileId: null, content: null };
    }

    const content = await drive.selectJsonContent(fileId);

    return {
      fileId,
      content: content as IndexFile,
    };
  } catch (error) {
    console.error(
      `Failed to get index for ${columnKey} (id: ${indexFileId}):`,
      error
    );
    return { fileId: null, content: null };
  }
}

// Check unique constraint
export async function checkUniqueConstraint(
  databaseId: string,
  tableId: string,
  columnKey: string,
  value: any,
  excludeDocId?: string,
  driveService?: GoogleDriveService,
  indexFileId?: string
): Promise<{ safe: boolean; error?: string }> {
  if (value === undefined || value === null || value === "")
    return { safe: true };

  // console.log(`[checkUniqueConstraint] Checking ${columnKey} for value '${value}' (FileID: ${indexFileId})`);
  const { content } = await getIndex(
    databaseId,
    tableId,
    columnKey,
    driveService,
    indexFileId
  );

  if (!content) {
    // console.log(`[checkUniqueConstraint] No index content found for ${columnKey}`);
    return { safe: true };
  }

  const strValue = String(value);
  // Optional: verbose logging
  // console.log(`[checkUniqueConstraint] Index found. Map keys: ${Object.keys(content.map).join(",")}`);
  const existingIds = content.map[strValue];

  if (existingIds && existingIds.length > 0) {
    if (excludeDocId) {
      const otherIds = existingIds.filter((id) => id !== excludeDocId);
      if (otherIds.length > 0) {
        // console.log(`[checkUniqueConstraint] Conflict found (excluding ${excludeDocId})`);
        return { safe: false, error: `Value '${value}' already exists.` };
      }
    } else {
      // console.log(`[checkUniqueConstraint] Conflict found`);
      return { safe: false, error: `Value '${value}' already exists.` };
    }
  }

  return { safe: true };
}

// Update index after a write/update/delete
export async function updateIndex(
  databaseId: string,
  tableId: string,
  columnKey: string,
  oldValue: any,
  newValue: any,
  docId: string,
  driveService?: GoogleDriveService,
  indexFileId?: string
): Promise<string | null> {
  const { fileId, content } = await getIndex(
    databaseId,
    tableId,
    columnKey,
    driveService,
    indexFileId
  );
  let index = content;
  let currentFileId = fileId;

  if (!index) {
    index = {
      tableId,
      column: columnKey,
      isUnique: true,
      map: {},
      updatedAt: new Date().toISOString(),
    };
  }

  if (oldValue !== undefined && oldValue !== null && oldValue !== "") {
    const strOld = String(oldValue);
    if (index.map[strOld]) {
      index.map[strOld] = index.map[strOld].filter((id) => id !== docId);
      if (index.map[strOld].length === 0) {
        delete index.map[strOld];
      }
    }
  }

  if (newValue !== undefined && newValue !== null && newValue !== "") {
    const strNew = String(newValue);
    if (!index.map[strNew]) {
      index.map[strNew] = [];
    }
    if (!index.map[strNew].includes(docId)) {
      index.map[strNew].push(docId);
    }
  }

  index.updatedAt = new Date().toISOString();

  const drive = await getDrive(driveService);

  if (currentFileId) {
    await drive.updateJsonContent(currentFileId, index);
    return currentFileId;
  } else {
    const folderId = await getIndexFolderId(databaseId, drive);
    const fileName = getIndexFileName(tableId, columnKey);
    const result = await createFileInFolder(folderId, fileName, index, drive);
    return result.data?.id || null;
  }
}

// Rebuild an index completely
export async function rebuildIndex(
  databaseId: string,
  tableId: string,
  columnKey: string,
  documents: RowData[],
  driveService?: GoogleDriveService
): Promise<string> {
  const drive = await getDrive(driveService);

  // 1. Check if exists and delete (using search fallback since we are rebuilding from scratch)
  const { fileId } = await getIndex(databaseId, tableId, columnKey, drive);
  if (fileId) {
    await drive.deleteFile(fileId);
  }

  // 2. Build map
  const map: Record<string, string[]> = {};

  for (const doc of documents) {
    const val = doc[columnKey];
    if (val !== undefined && val !== null && val !== "") {
      const strVal = String(val);
      if (!map[strVal]) {
        map[strVal] = [];
      }
      map[strVal].push(doc.$id);
    }
  }

  const index: IndexFile = {
    tableId,
    column: columnKey,
    isUnique: true,
    map,
    updatedAt: new Date().toISOString(),
  };

  // 3. Create file
  const folderId = await getIndexFolderId(databaseId, drive);
  const fileName = getIndexFileName(tableId, columnKey);
  const result = await createFileInFolder(folderId, fileName, index, drive);
  console.log(`Rebuilt index for ${columnKey} (ID: ${result.data.id})`);
  return result.data.id;
}

// Delete index file
export async function deleteIndex(
  databaseId: string,
  tableId: string,
  columnKey: string,
  driveService?: GoogleDriveService,
  indexFileId?: string
) {
  const drive = await getDrive(driveService);
  const { fileId } = await getIndex(
    databaseId,
    tableId,
    columnKey,
    drive,
    indexFileId
  );
  if (fileId) {
    await drive.deleteFile(fileId);
  }
}
