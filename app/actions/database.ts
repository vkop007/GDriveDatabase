"use server";

import { operations } from "gdrivekit";
import { redirect } from "next/navigation";
import { getAuth } from "../../lib/gdrive/auth";
import { getOrCreateRootFolder } from "../../lib/gdrive/operations";

export async function listDatabases() {
  try {
    const rootId = await getOrCreateRootFolder();
    const response = await operations.listOperations.listFoldersInFolder(
      rootId
    );
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
    await operations.folderOperations.createFolder(name, rootId);
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
    await operations.fileOperations.deleteFile(fileId);
  } catch (error) {
    console.error("Error deleting database:", error);
    throw error;
  }

  redirect("/dashboard");
}
