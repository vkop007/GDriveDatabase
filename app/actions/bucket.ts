"use server";

import { operations, initDriveService } from "gdrivekit";
import { getAuth } from "../../lib/gdrive/auth";
import { unstable_cache, revalidateTag } from "next/cache";
import {
  getOrCreateBucketFolder,
  processAndUploadFiles,
} from "../../lib/gdrive/bucket-service";

async function _listBucketFiles(auth: any) {
  try {
    const bucketId = await getOrCreateBucketFolder(auth);
    initDriveService(
      {
        client_id: auth.clientId,
        client_secret: auth.clientSecret,
        project_id: auth.projectId,
        redirect_uris: ["http://localhost:3000/oauth2callback"],
      },
      auth.tokens
    );
    // Re-init just in case, or rely on getOrCreate auth side-effect
    const response = await operations.listOperations.listFilesInFolder(
      bucketId
    );
    return response.data?.files || [];
  } catch (error) {
    console.error("Error listing bucket files:", error);
    return [];
  }
}

export const listBucketFiles = async () => {
  const auth = await getAuth();
  return unstable_cache(
    async () => _listBucketFiles(auth),
    ["bucket-files", auth.tokens.refresh_token],
    { revalidate: 3600, tags: ["bucket-files"] }
  )();
};

export async function uploadBucketFiles(formData: FormData) {
  const files = formData.getAll("files") as File[];
  if (!files || files.length === 0) {
    throw new Error("No files uploaded");
  }

  try {
    const result = await processAndUploadFiles(files);
    revalidateTag("bucket-files", "max");
    return result;
  } catch (error) {
    console.error("Upload action failed:", error);
    return { success: false, error: "Upload failed" };
  }
}

export async function deleteBucketFile(formData: FormData) {
  const fileId = formData.get("fileId") as string;
  if (!fileId) return;

  await getAuth();
  await operations.fileOperations.deleteFile(fileId);
  revalidateTag("bucket-files", "max");
}

export async function renameBucketFile(formData: FormData) {
  const fileId = formData.get("fileId") as string;
  const newName = formData.get("newName") as string;

  if (!fileId || !newName) {
    throw new Error("Missing fileId or newName");
  }

  await getAuth();
  await operations.fileOperations.renameFile(fileId, newName);
  revalidateTag("bucket-files", "max");
}
