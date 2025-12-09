"use server";

import { operations, initDriveService } from "gdrivekit";
import { getAuth } from "../../lib/gdrive/auth";
import { listDatabases } from "./database";
import { listBucketFiles } from "./bucket";

export async function getStorageUsage() {
  const auth = await getAuth();

  initDriveService(
    {
      client_id: auth.clientId,
      client_secret: auth.clientSecret,
      project_id: auth.projectId,
      redirect_uris: ["http://localhost:3000/oauth2callback"],
    },
    auth.tokens
  );

  try {
    // 1. Get Total Quota
    // @ts-ignore
    const quota = await operations.utilityOperations.getStorageQuota();

    // 2. Calculate App Usage
    // Parallelize detailed fetching
    const [dbs, bucketFiles] = await Promise.all([
      listDatabases(),
      listBucketFiles(),
    ]);

    let appUsageBytes = 0;

    // Bucket size
    if (bucketFiles && Array.isArray(bucketFiles)) {
      appUsageBytes += bucketFiles.reduce(
        (acc: number, file: any) => acc + parseInt(file.size || "0"),
        0
      );
    }

    // Database sizes (iterate each db to get tables)
    // We need to fetch files for each dict to get true size
    // Limit concurrency if needed, but for now Promise.all is fine for reasonable counts
    if (dbs && Array.isArray(dbs)) {
      const dbSizes = await Promise.all(
        dbs.map(async (db: any) => {
          try {
            const res = await operations.listOperations.listFilesInFolder(
              db.id
            );
            const files = res.data?.files || [];
            return files.reduce(
              (acc: number, f: any) => acc + parseInt(f.size || "0"),
              0
            );
          } catch (e) {
            console.error(`Failed to size db ${db.name}:`, e);
            return 0;
          }
        })
      );
      appUsageBytes += dbSizes.reduce(
        (acc: number, size: number) => acc + size,
        0
      );
    }

    const quotaData = (quota as any).data || quota;

    return {
      success: true,
      data: {
        ...quotaData,
        appUsage: appUsageBytes, // App specific usage in bytes
      },
    };
  } catch (error) {
    console.error("Failed to get storage usage:", error);
    return { success: false, error: "Failed to fetch storage usage" };
  }
}
