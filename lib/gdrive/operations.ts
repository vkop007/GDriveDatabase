import { operations, type GoogleDriveService } from "gdrivekit";
import { getAuth } from "./auth";
import type { DriveFile } from "../../types";

export const ROOT_FOLDER_NAME = "GDriveDatabase";

function getCreatedFileId(response: unknown): string | null {
  if (!response || typeof response !== "object") {
    return null;
  }

  const record = response as {
    id?: unknown;
    data?: { id?: unknown };
  };

  if (typeof record.id === "string") {
    return record.id;
  }

  if (typeof record.data?.id === "string") {
    return record.data.id;
  }

  return null;
}

export async function getOrCreateRootFolder(auth?: unknown) {
  if (!auth) {
    await getAuth();
  }

  try {
    const response = await operations.folderOperations.getFolderIdByName(
      ROOT_FOLDER_NAME
    );
    console.log("Response from getFolderIdByName:", response);
    if (response.folderId) {
      console.log("Found existing root folder via list:", response.folderId);
      return response.folderId;
    }
  } catch (error) {
    console.error("Error listing root folders:", error);
  }

  // Create if not exists
  console.log("Creating new root folder (operations.ts)");
  const createResponse = await operations.folderOperations.createFolder(
    ROOT_FOLDER_NAME
  );
  console.log(
    "Create folder response (operations.ts):",
    JSON.stringify(createResponse)
  );

  const createdFileId = getCreatedFileId(createResponse);

  if (createdFileId) {
    return createdFileId;
  }

  throw new Error(
    "Failed to create root folder: Valid ID not found in response"
  );
}

const SYSTEM_FOLDER_NAME = "_SystemData";

/**
 * Get or create the _SystemData folder inside GDriveDatabase root.
 * This folder stores system files like api-config.json, backups, user-profile.json
 */
export async function getOrCreateSystemFolder(auth?: unknown) {
  const rootId = await getOrCreateRootFolder(auth);

  try {
    // Look for existing _SystemData folder
    const response = await operations.listOperations.listFoldersInFolder(
      rootId
    );
    const folders = (response.data?.files ?? []) as DriveFile[];
    const systemFolder = folders.find(
      (f) => f.name === SYSTEM_FOLDER_NAME && !f.trashed
    );

    if (systemFolder) {
      return systemFolder.id;
    }
  } catch (error) {
    console.error("Error listing folders for _SystemData:", error);
  }

  // Create if not exists
  console.log("Creating _SystemData folder...");
  const createResponse = await operations.folderOperations.createFolder(
    SYSTEM_FOLDER_NAME,
    rootId
  );

  const createdFileId = getCreatedFileId(createResponse);

  if (createdFileId) {
    return createdFileId;
  }

  throw new Error("Failed to create _SystemData folder");
}

// Custom move file implementation to bypass gdrivekit issue or limitations
export async function moveFile(
  fileId: string,
  folderId: string,
  driveService?: GoogleDriveService
) {
  console.log(
    `[moveFile] Attempting to move file ${fileId} to folder ${folderId}`
  );

  try {
    if (driveService) {
      // Use driveService if available
      // Note: driveService.moveFile might not preserve name, but usually does
      await driveService.moveFile(fileId, folderId);
    } else {
      // 2. Move file (add new parent, remove old parents)
      const moveResponse = await operations.fileOperations.moveFile(
        fileId,
        folderId
      );

      if (!moveResponse.success) {
        const errorText = await moveResponse.text();
        throw new Error(`Failed to move file: ${errorText}`);
      }
    }

    console.log(`[moveFile] Successfully moved file.`);
    return { success: true };
  } catch (error) {
    console.error("[moveFile] Error moving file:", error);
    throw error;
  }
}

export async function createFileInFolder(
  folderId: string,
  name: string,
  content: unknown,
  driveService?: GoogleDriveService
) {
  if (!driveService) {
    await getAuth();
  }

  try {
    let fileId: string;

    if (driveService) {
      // Use driveService if available
      const result = await driveService.createJsonFile(
        JSON.stringify(content),
        name
      );
      console.log(
        "[createFileInFolder] driveService.createJsonFile result:",
        JSON.stringify(result)
      );

      // Check for common return patterns
      const createdFileId = getCreatedFileId(result);
      if (createdFileId) {
        fileId = createdFileId;
      } else {
        throw new Error(
          "Failed to create file via driveService: ID not found in response"
        );
      }
    } else {
      // Fallback to operations (cookie auth)
      const createResult = await operations.jsonOperations.createJsonFile(
        content,
        name
      );
      if (!createResult.success || !createResult.data?.id) {
        throw new Error("Failed to create file via gdrivekit");
      }
      fileId = createResult.data.id;
    }

    console.log(
      `[createFileInFolder] Created file with ID: ${fileId}. Moving to ${folderId}...`
    );

    // Phase 2: Move to correct folder
    const moveResult = await moveFile(fileId, folderId, driveService);
    console.log(
      `[createFileInFolder] Move result:`,
      JSON.stringify(moveResult)
    );

    if (!moveResult.success) {
      throw new Error("Failed to move created file to target folder");
    }

    return { status: 200, success: true, data: { id: fileId } };
  } catch (error) {
    console.error("Error creating file in folder:", error);
    throw error;
  }
}

export async function renameFile(fileId: string, newName: string) {
  await getAuth();
  try {
    const response = await operations.fileOperations.renameFile(
      fileId,
      newName
    );
    return { success: true, data: response?.data };
  } catch (error) {
    console.error("Error renaming file:", error);
    throw error;
  }
}
