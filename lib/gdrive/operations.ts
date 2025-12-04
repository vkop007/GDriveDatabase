import { operations } from "gdrivekit";
import { getAuth } from "./auth";
import { cookies } from "next/headers";

export const ROOT_FOLDER_NAME = "GDriveDatabase";

export async function getOrCreateRootFolder() {
  await getAuth();

  try {
    const response = await operations.listFoldersInFolder("root");

    const folder = response.data?.files?.find(
      (f: any) => f.name === ROOT_FOLDER_NAME && !f.trashed
    );

    if (folder) {
      console.log("Found existing root folder via list:", folder.id);
      return folder.id;
    }
  } catch (error) {
    console.error("Error listing root folders:", error);
  }

  console.log("Creating new root folder");
  // Create if not exists
  const createResponse = await operations.createFolder(ROOT_FOLDER_NAME);
  return createResponse.data.id;
}

// Custom move file implementation to bypass gdrivekit issue
export async function moveFile(fileId: string, folderId: string) {
  await getAuth();
  return await operations.moveFile(fileId, folderId);
}
