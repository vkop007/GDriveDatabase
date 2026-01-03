"use server";

import { operations, initDriveService } from "gdrivekit";
import { getAuth } from "../actions";
import {
  getOrCreateRootFolder,
  getOrCreateSystemFolder,
} from "../../lib/gdrive/operations";
import { cookies } from "next/headers";

// Google Apps Script code that runs on Google's servers for fast backup
// - Backs up sourceFolderId contents (excluding _SystemData folder)
// - Stores backup in destFolderId
// - Deletes old backup before creating new one (only keeps 1 backup)
const BACKUP_SCRIPT_CODE = `
function createBackup(params) {
  try {
    var sourceFolderId = params.sourceFolderId;
    var destFolderId = params.destFolderId;
    var sourceFolder = DriveApp.getFolderById(sourceFolderId);
    var destFolder = DriveApp.getFolderById(destFolderId);
    
    // First, delete any existing backup files in destination folder
    var destFiles = destFolder.getFiles();
    while (destFiles.hasNext()) {
      var file = destFiles.next();
      if (file.getName().indexOf("GDriveDatabase-backup-") === 0 && 
          file.getName().endsWith(".zip")) {
        Logger.log("Deleting old backup: " + file.getName());
        file.setTrashed(true);
      }
    }
    
    // Now create the new backup from source folder (excluding _SystemData)
    var blobs = collectBlobs(sourceFolder, "");
    
    var timestamp = Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd_HH-mm");
    var zipName = "GDriveDatabase-backup-" + timestamp + ".zip";
    
    var zip = Utilities.zip(blobs, zipName);
    var file = destFolder.createFile(zip);
    
    return {
      success: true,
      name: zipName,
      fileId: file.getId(),
      url: file.getUrl()
    };
  } catch (e) {
    return {
      success: false,
      error: e.toString()
    };
  }
}

function collectBlobs(folder, prefix) {
  var blobs = [];
  
  var files = folder.getFiles();
  while (files.hasNext()) {
    var file = files.next();
    // Skip backup files when collecting blobs
    if (file.getName().indexOf("GDriveDatabase-backup-") === 0) continue;
    
    try {
      var blob = file.getBlob();
      blob.setName(prefix + file.getName());
      blobs.push(blob);
    } catch (e) {
      Logger.log("Skipping file: " + file.getName() + " - " + e.toString());
    }
  }
  
  var folders = folder.getFolders();
  while (folders.hasNext()) {
    var sub = folders.next();
    // Skip _SystemData folder - it contains system files, not user data
    if (sub.getName() === "_SystemData") continue;
    
    var subBlobs = collectBlobs(sub, prefix + sub.getName() + "/");
    for (var i = 0; i < subBlobs.length; i++) {
      blobs.push(subBlobs[i]);
    }
  }
  
  return blobs;
}
`;

const BACKUP_SCRIPT_NAME = "GDriveDatabase-Backup-Script";

interface BackupScriptInfo {
  scriptId: string;
  webAppUrl: string;
  authorized: boolean;
  lastBackupTime?: string;
  autoBackupEnabled: boolean;
}

async function saveBackupScriptInfo(info: BackupScriptInfo) {
  const cookieStore = await cookies();
  cookieStore.set("backup_script_info", JSON.stringify(info), {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
}

async function getBackupScriptInfo(): Promise<BackupScriptInfo | null> {
  const cookieStore = await cookies();
  const infoStr = cookieStore.get("backup_script_info")?.value;
  if (!infoStr) return null;
  try {
    return JSON.parse(infoStr);
  } catch {
    return null;
  }
}

// Check if we need to run a daily backup (different day than last backup)
function needsDailyBackup(lastBackupTime: string | undefined): boolean {
  if (!lastBackupTime) return false; // No previous backup, let user set up first

  const lastBackup = new Date(lastBackupTime);
  const now = new Date();

  // Get dates in IST (India Standard Time)
  const lastBackupDate = lastBackup.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
  });
  const todayDate = now.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
  });

  return lastBackupDate !== todayDate;
}

/**
 * Get the current backup status for UI display.
 */
export async function getBackupStatus(): Promise<{
  hasScript: boolean;
  authorized: boolean;
  lastBackupTime?: string;
  autoBackupEnabled: boolean;
  needsBackupToday: boolean;
}> {
  const scriptInfo = await getBackupScriptInfo();
  if (!scriptInfo) {
    return {
      hasScript: false,
      authorized: false,
      autoBackupEnabled: false,
      needsBackupToday: false,
    };
  }
  return {
    hasScript: true,
    authorized: scriptInfo.authorized,
    lastBackupTime: scriptInfo.lastBackupTime,
    autoBackupEnabled: scriptInfo.autoBackupEnabled,
    needsBackupToday:
      scriptInfo.autoBackupEnabled &&
      needsDailyBackup(scriptInfo.lastBackupTime),
  };
}

/**
 * Initial setup - creates and authorizes the backup script.
 * After this, backups will run automatically on daily site visits.
 */
export async function setupAutoBackup(): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  needsAuthorization?: boolean;
  authorizationUrl?: string;
}> {
  try {
    const { tokens, clientId, clientSecret, projectId } = await getAuth();

    initDriveService(
      {
        client_id: clientId,
        client_secret: clientSecret,
        project_id: projectId,
        redirect_uris: [`${process.env.NEXT_PUBLIC_BASE_URL}/oauth2callback`],
      },
      tokens
    );

    // Get folders for backup: source = root folder, dest = _SystemData
    const rootFolderId = await getOrCreateRootFolder();
    const systemFolderId = await getOrCreateSystemFolder();

    // Check if we have a previously deployed script
    let scriptInfo = await getBackupScriptInfo();

    if (!scriptInfo || !scriptInfo.authorized) {
      // Create new script
      console.log("Creating backup script...");

      // Delete old script if exists
      try {
        const searchResult =
          await operations.searchOperations.searchByExactName(
            BACKUP_SCRIPT_NAME
          );
        if (searchResult.success && searchResult.data?.files?.length > 0) {
          const oldScriptId = searchResult.data.files[0].id;
          console.log("Deleting old script:", oldScriptId);
          try {
            await operations.scriptOperations.deleteGoogleScript(oldScriptId);
          } catch (e) {
            console.log("Could not delete old script:", e);
          }
        }
      } catch (e) {
        console.log("Search failed:", e);
      }

      // Create new script
      const scriptResult =
        await operations.scriptOperations.createGoogleScript.Function(
          BACKUP_SCRIPT_NAME,
          BACKUP_SCRIPT_CODE
        );
      const scriptId = scriptResult.scriptId;
      console.log("Created backup script:", scriptId);

      // Deploy the script
      console.log("Deploying script...");
      let deployResult:
        | { webAppUrl?: string; deploymentId?: string }
        | undefined;

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          deployResult = await operations.scriptOperations.deployGoogleScript(
            scriptId
          );
          break;
        } catch (err) {
          console.log(`Deploy attempt ${attempt}/3 failed:`, err);
          if (attempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, 3000 * attempt));
          }
        }
      }

      if (!deployResult?.webAppUrl) {
        throw new Error("Failed to deploy script");
      }

      const webAppUrl = deployResult.webAppUrl;
      console.log("Script deployed:", webAppUrl);

      scriptInfo = {
        scriptId,
        webAppUrl,
        authorized: false,
        autoBackupEnabled: false,
      };
      await saveBackupScriptInfo(scriptInfo);

      // Return authorization URL
      const authUrl = `${webAppUrl}?func=createBackup&sourceFolderId=${rootFolderId}&destFolderId=${systemFolderId}`;

      return {
        success: false,
        needsAuthorization: true,
        authorizationUrl: authUrl,
        error:
          "Please authorize the backup script by clicking the link, then click 'I've Authorized'.",
      };
    }

    // Script is authorized - run initial backup and enable auto-backup
    console.log("Running initial backup...");
    const url = new URL(scriptInfo.webAppUrl);
    url.searchParams.append("func", "createBackup");
    url.searchParams.append("sourceFolderId", rootFolderId);
    url.searchParams.append("destFolderId", systemFolderId);

    const response = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow",
    });

    const text = await response.text();

    if (
      text.includes("Authorization needed") ||
      text.includes("auth-required")
    ) {
      scriptInfo.authorized = false;
      await saveBackupScriptInfo(scriptInfo);

      return {
        success: false,
        needsAuthorization: true,
        authorizationUrl: url.toString(),
        error: "Script authorization needed. Please authorize and try again.",
      };
    }

    let result: any;
    try {
      result = JSON.parse(text);
    } catch {
      console.log("Response (non-JSON):", text.substring(0, 500));
      throw new Error("Unexpected response from backup script");
    }

    if (!result.success) {
      throw new Error(result.error || "Backup failed");
    }

    // Save as authorized with auto-backup enabled
    scriptInfo.authorized = true;
    scriptInfo.autoBackupEnabled = true;
    scriptInfo.lastBackupTime = new Date().toISOString();
    await saveBackupScriptInfo(scriptInfo);

    return {
      success: true,
      message: `Auto-backup enabled! First backup created: ${result.name}`,
    };
  } catch (error) {
    console.error("Error setting up auto-backup:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to setup auto-backup",
    };
  }
}

/**
 * Mark the backup script as authorized after user completes authorization.
 */
export async function markBackupScriptAuthorized() {
  const scriptInfo = await getBackupScriptInfo();
  if (scriptInfo) {
    scriptInfo.authorized = true;
    await saveBackupScriptInfo(scriptInfo);
    return { success: true };
  }
  return { success: false, error: "No backup script found" };
}

/**
 * Run daily backup - called automatically when user visits on a new day.
 */
export async function runDailyBackup(): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const scriptInfo = await getBackupScriptInfo();

    if (
      !scriptInfo ||
      !scriptInfo.authorized ||
      !scriptInfo.autoBackupEnabled
    ) {
      return { success: false, error: "Auto-backup not enabled" };
    }

    const { tokens, clientId, clientSecret, projectId } = await getAuth();

    initDriveService(
      {
        client_id: clientId,
        client_secret: clientSecret,
        project_id: projectId,
        redirect_uris: [`${process.env.NEXT_PUBLIC_BASE_URL}/oauth2callback`],
      },
      tokens
    );

    const rootFolderId = await getOrCreateRootFolder();
    const systemFolderId = await getOrCreateSystemFolder();

    console.log("Running daily backup...");
    const url = new URL(scriptInfo.webAppUrl);
    url.searchParams.append("func", "createBackup");
    url.searchParams.append("sourceFolderId", rootFolderId);
    url.searchParams.append("destFolderId", systemFolderId);

    const response = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow",
    });

    const text = await response.text();

    if (text.includes("Authorization needed")) {
      return { success: false, error: "Script authorization expired" };
    }

    let result: any;
    try {
      result = JSON.parse(text);
    } catch {
      throw new Error("Unexpected response from backup script");
    }

    if (!result.success) {
      throw new Error(result.error || "Backup failed");
    }

    // Update last backup time
    scriptInfo.lastBackupTime = new Date().toISOString();
    await saveBackupScriptInfo(scriptInfo);

    return {
      success: true,
      message: `Daily backup created: ${result.name}`,
    };
  } catch (error) {
    console.error("Error running daily backup:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to run backup",
    };
  }
}
