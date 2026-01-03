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
      redirect_uris: [`${process.env.NEXT_PUBLIC_BASE_URL}/oauth2callback`],
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
    let bucketUsageBytes = 0;

    // Bucket size
    if (bucketFiles && Array.isArray(bucketFiles)) {
      bucketUsageBytes = bucketFiles.reduce(
        (acc: number, file: any) => acc + parseInt(file.size || "0"),
        0
      );
      appUsageBytes += bucketUsageBytes;
    }

    // Database sizes (iterate each db to get tables)
    interface DbUsage {
      id: string;
      name: string;
      size: number;
      tableCount: number;
    }
    const databaseUsage: DbUsage[] = [];

    if (dbs && Array.isArray(dbs)) {
      const dbDetails = await Promise.all(
        dbs.map(async (db: any) => {
          try {
            const res = await operations.listOperations.listFilesInFolder(
              db.id
            );
            const files = res.data?.files || [];
            const size = files.reduce(
              (acc: number, f: any) => acc + parseInt(f.size || "0"),
              0
            );
            return {
              id: db.id,
              name: db.name,
              size,
              tableCount: files.length,
            };
          } catch (e) {
            console.error(`Failed to size db ${db.name}:`, e);
            return { id: db.id, name: db.name, size: 0, tableCount: 0 };
          }
        })
      );

      databaseUsage.push(...dbDetails);
      appUsageBytes += dbDetails.reduce((acc, db) => acc + db.size, 0);
    }

    const quotaData = (quota as any).data || quota;

    return {
      success: true,
      data: {
        ...quotaData,
        appUsage: appUsageBytes,
        bucketUsage: bucketUsageBytes,
        bucketFileCount: bucketFiles?.length || 0,
        databaseUsage, // Per-database breakdown
        databaseCount: dbs?.length || 0,
      },
    };
  } catch (error) {
    console.error("Failed to get storage usage:", error);
    return { success: false, error: "Failed to fetch storage usage" };
  }
}
