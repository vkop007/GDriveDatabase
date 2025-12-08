import { operations, initDriveService } from "gdrivekit";
import { getAuth } from "./auth";
import { writeFile, unlink, mkdir } from "fs/promises";
import path from "path";
import os from "os";

const BUCKET_FOLDER_NAME = "Buckets";

export async function getOrCreateBucketFolder(auth?: any) {
  if (!auth) auth = await getAuth();

  // Ensure service is initialized
  initDriveService(
    {
      client_id: auth.clientId,
      client_secret: auth.clientSecret,
      project_id: auth.projectId,
      redirect_uris: ["http://localhost:3000/oauth2callback"],
    },
    auth.tokens
  );

  // 1. Check if folder exists
  const listResponse = await operations.listOperations.listFoldersByName(
    BUCKET_FOLDER_NAME
  );

  const existing = listResponse.data?.files?.find(
    (f: any) => f.name === BUCKET_FOLDER_NAME && !f.trashed
  );

  if (existing) {
    return existing.id;
  }

  // 2. Create if not exists (in root GDriveDatabase folder logic)
  // Ideally we should reuse one logic for folder finding, but for now:
  try {
    const rootResponse = await operations.folderOperations.getFolderIdByName(
      "GDriveDatabase"
    );
    const rootId = rootResponse.folderId;
    if (rootId) {
      const createResponse = await operations.folderOperations.createFolder(
        BUCKET_FOLDER_NAME,
        rootId
      );
      return createResponse.data.id;
    }
  } catch (e) {}

  // Fallback to absolute root
  const createResponse = await operations.folderOperations.createFolder(
    BUCKET_FOLDER_NAME
  );
  return createResponse.data.id;
}

export async function processAndUploadFiles(files: File[]) {
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

    // @ts-ignore
    const uploadedFiles = await operations.batchOperations.uploadMultipleFiles(
      filePaths,
      bucketId
    );

    return { success: true, files: uploadedFiles };
  } catch (error) {
    console.error("Bucket upload failed:", error);
    throw error;
  } finally {
    for (const p of filePaths) {
      try {
        await unlink(p);
      } catch (e) {
        /* ignore */
      }
    }
  }
}
