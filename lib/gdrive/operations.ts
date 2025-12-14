import { operations } from "gdrivekit";
import { getAuth } from "./auth";
import { cookies } from "next/headers";

export const ROOT_FOLDER_NAME = "GDriveDatabase";

export async function getOrCreateRootFolder(auth?: any) {
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

  if (createResponse?.data?.id) {
    return createResponse.data.id;
  } else if ((createResponse as any)?.id) {
    return (createResponse as any).id;
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
export async function getOrCreateSystemFolder(auth?: any) {
  const rootId = await getOrCreateRootFolder(auth);

  try {
    // Look for existing _SystemData folder
    const response = await operations.listOperations.listFoldersInFolder(
      rootId
    );
    const systemFolder = response.data?.files?.find(
      (f: any) => f.name === SYSTEM_FOLDER_NAME && !f.trashed
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

  if (createResponse?.data?.id) {
    return createResponse.data.id;
  } else if ((createResponse as any)?.id) {
    return (createResponse as any).id;
  }

  throw new Error("Failed to create _SystemData folder");
}

import { fetchWithAuth } from "./auth";

// Custom move file implementation to bypass gdrivekit issue or limitations
export async function moveFile(fileId: string, folderId: string) {
  console.log(
    `[moveFile] Attempting to move file ${fileId} to folder ${folderId}`
  );

  try {
    // 2. Move file (add new parent, remove old parents)
    const moveResponse = await operations.fileOperations.moveFile(
      fileId,
      folderId
    );

    if (!moveResponse.success) {
      const errorText = await moveResponse.text();
      throw new Error(`Failed to move file: ${errorText}`);
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
  content: any
) {
  await getAuth();

  try {
    // Phase 1: Create the file
    const createResult = await operations.jsonOperations.createJsonFile(
      content,
      name
    );

    if (!createResult.success || !createResult.data?.id) {
      throw new Error("Failed to create file via gdrivekit");
    }

    const fileId = createResult.data.id;
    console.log(
      `[createFileInFolder] Created file with ID: ${fileId}. Moving to ${folderId}...`
    );

    // Phase 2: Move to correct folder
    const moveResult = await moveFile(fileId, folderId);
    console.log(
      `[createFileInFolder] Move result:`,
      JSON.stringify(moveResult)
    );

    if (!moveResult.success) {
      // Cleanup if move fails? Ideally yes, but keeping it simple for now
      throw new Error("Failed to move created file to target folder");
    }

    return { status: 200, success: true, data: createResult.data };
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
