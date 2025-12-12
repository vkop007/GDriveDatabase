"use server";

import { operations, initDriveService } from "gdrivekit";
import { getAuth } from "../actions";
import { getOrCreateRootFolder } from "../../lib/gdrive/operations";

// Google Apps Script code that runs on Google's servers for fast backup
const BACKUP_SCRIPT_CODE = `
function createBackup(folderId) {
  try {
    var folder = DriveApp.getFolderById(folderId);
    var blobs = collectBlobs(folder, "");
    
    var timestamp = Utilities.formatDate(new Date(), "GMT", "yyyy-MM-dd_HH-mm");
    var zipName = "GDriveDatabase-backup-" + timestamp + ".zip";
    
    var zip = Utilities.zip(blobs, zipName);
    var file = folder.createFile(zip);
    
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
  
  // Add files
  var files = folder.getFiles();
  while (files.hasNext()) {
    var file = files.next();
    try {
      var blob = file.getBlob();
      blob.setName(prefix + file.getName());
      blobs.push(blob);
    } catch (e) {
      // Skip files that can't be converted to blobs (e.g., Google Docs)
      Logger.log("Skipping file: " + file.getName() + " - " + e.toString());
    }
  }
  
  // Add subfolders recursively
  var folders = folder.getFolders();
  while (folders.hasNext()) {
    var sub = folders.next();
    var subBlobs = collectBlobs(sub, prefix + sub.getName() + "/");
    for (var i = 0; i < subBlobs.length; i++) {
      blobs.push(subBlobs[i]);
    }
  }
  
  return blobs;
}
`;

const BACKUP_SCRIPT_NAME = "GDriveDatabase-Backup-Script";

/**
 * Creates a backup of the entire GDriveDatabase folder as a zip file
 * using Google Apps Script for fast server-side processing.
 */
export async function backupDatabase() {
  try {
    const { tokens, clientId, clientSecret, projectId } = await getAuth();

    // Initialize drive service
    initDriveService(
      {
        client_id: clientId,
        client_secret: clientSecret,
        project_id: projectId,
        redirect_uris: ["http://localhost:3000/oauth2callback"],
      },
      tokens
    );

    // Get root folder ID
    const rootFolderId = await getOrCreateRootFolder();

    // Step 1: Create or get existing backup script
    let scriptId: string;

    try {
      // Try to find existing script
      const searchResult = await operations.searchOperations.searchByExactName(
        BACKUP_SCRIPT_NAME
      );

      if (searchResult.success && searchResult.data?.files?.length > 0) {
        // Use existing script
        scriptId = searchResult.data.files[0].id;
        console.log("Found existing backup script:", scriptId);
      } else {
        // Create new script
        const createResult =
          await operations.scriptOperations.createGoogleScript(
            BACKUP_SCRIPT_NAME,
            BACKUP_SCRIPT_CODE
          );
        scriptId = createResult.scriptId;
        console.log("Created new backup script:", scriptId);
      }
    } catch (e) {
      // Create new script if search fails
      const createResult = await operations.scriptOperations.createGoogleScript(
        BACKUP_SCRIPT_NAME,
        BACKUP_SCRIPT_CODE
      );
      scriptId = createResult.scriptId;
      console.log("Created backup script:", scriptId);
    }

    // Step 2: Run the backup script (devMode=true for immediate execution without deployment)
    const result = await operations.scriptOperations.runGoogleScript(
      scriptId,
      "createBackup",
      [rootFolderId],
      true // devMode - runs without needing deployment
    );

    if (!result.success) {
      throw new Error(result.error || "Backup script execution failed");
    }

    return {
      success: true,
      message: `Backup created successfully: ${result.name}`,
      fileId: result.fileId,
      url: result.url,
    };
  } catch (error) {
    console.error("Error creating backup:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create backup",
    };
  }
}
