"use server";

import { operations, initDriveService } from "gdrivekit";
import { getAuth } from "../../lib/gdrive/auth";
import { listDatabases } from "./database";
import { listBucketFiles } from "./bucket";
import type { DriveFile } from "../../types";

function toBytes(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : 0;
}

function toRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function getQuotaFields(quota: unknown) {
  const quotaRecord = toRecord(quota);
  const dataRecord = toRecord(quotaRecord.data ?? quotaRecord);
  return toRecord(dataRecord.storageQuota ?? dataRecord.quota ?? dataRecord);
}

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
        (acc, file) => acc + toBytes(file.size),
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
        dbs.map(async (db) => {
          try {
            const res = await operations.listOperations.listFilesInFolder(
              db.id
            );
            const files = ((res.data?.files || []) as DriveFile[]);
            const size = files.reduce(
              (acc, file) => acc + toBytes(file.size),
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

    const storageQuota = getQuotaFields(quota);

    return {
      success: true,
      data: {
        ...storageQuota,
        limit: toBytes(storageQuota.limit),
        usage: toBytes(storageQuota.usage),
        usageInDrive: toBytes(storageQuota.usageInDrive),
        usageInDriveTrash: toBytes(storageQuota.usageInDriveTrash),
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
