import { operations, initDriveService } from "gdrivekit";
import { getAuth } from "./auth";
import { writeFile, unlink, mkdir } from "fs/promises";
import path from "path";
import os from "os";
import type { BucketFile, BucketUploadResult, DriveFile } from "../../types";

export const BUCKET_FOLDER_NAME = "Buckets";

type DriveAuth = {
  clientId: string;
  clientSecret: string;
  projectId: string;
  tokens: Parameters<typeof initDriveService>[1] | Record<string, unknown>;
};

function toBucketFile(file: BucketFile): BucketFile {
  return {
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    trashed: file.trashed,
    parents: file.parents,
    createdTime: file.createdTime,
    modifiedTime: file.modifiedTime,
    webViewLink: file.webViewLink,
    webContentLink: file.webContentLink,
    thumbnailLink: file.thumbnailLink,
    size: file.size,
  };
}

export async function getOrCreateBucketFolder(auth?: DriveAuth) {
  if (!auth) auth = await getAuth();

  // Ensure service is initialized
  initDriveService(
    {
      client_id: auth.clientId,
      client_secret: auth.clientSecret,
      project_id: auth.projectId,
      redirect_uris: [`${process.env.NEXT_PUBLIC_BASE_URL}/oauth2callback`],
    },
    auth.tokens as Parameters<typeof initDriveService>[1]
  );

  // 1. Check if folder exists
  const listResponse = await operations.listOperations.listFoldersByName(
    BUCKET_FOLDER_NAME
  );

  const folders = (listResponse.data?.files ?? []) as DriveFile[];
  const existing = folders.find(
    (f) => f.name === BUCKET_FOLDER_NAME && !f.trashed
  );

  if (existing?.id) {
    return existing.id;
  }

  // 2. Create if not exists (in root GDriveDatabase folder logic)
  try {
    const rootResponse = await operations.folderOperations.getFolderIdByName(
      "GDriveDatabase"
    );
    const rootId = rootResponse?.folderId;
    if (rootId) {
      const createResponse = await operations.folderOperations.createFolder(
        BUCKET_FOLDER_NAME,
        rootId
      );
      if (createResponse?.data?.id) {
        return createResponse.data.id;
      }
    }
  } catch (e) {
    console.error("Error finding/creating bucket in GDriveDatabase folder:", e);
  }

  // Fallback to absolute root
  const createResponse = await operations.folderOperations.createFolder(
    BUCKET_FOLDER_NAME
  );

  if (!createResponse?.data?.id) {
    throw new Error("Failed to create bucket folder");
  }

  return createResponse.data.id;
}

export async function processAndUploadFiles(
  files: File[]
): Promise<BucketUploadResult> {
  const auth = await getAuth();
  const bucketId = await getOrCreateBucketFolder(auth);

  const tempDir = path.join(os.tmpdir(), "gdrive-bucket-upload-" + Date.now());
  await mkdir(tempDir, { recursive: true });

  const filePaths: string[] = [];

  try {
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_"); // Sanitize
      const filePath = path.join(tempDir, safeName);
      await writeFile(filePath, buffer);
      filePaths.push(filePath);
    }

    console.log("Uploading files to GDrive Bucket:", filePaths);

    const uploadResults = await operations.batchOperations.uploadMultipleFiles(
      filePaths,
      bucketId
    );
    const uploadedFiles = uploadResults.flatMap(({ result }) =>
      result.success && result.data ? [toBucketFile(result.data)] : []
    );

    return { success: true, files: uploadedFiles };
  } catch (error) {
    console.error("Bucket upload failed:", error);
    throw error;
  } finally {
    for (const p of filePaths) {
      try {
        await unlink(p);
      } catch {
        /* ignore */
      }
    }
  }
}
