"use server";

import { operations, initDriveService } from "gdrivekit";
import { getAuth } from "../actions";
import { getOrCreateSystemFolder, moveFile } from "../../lib/gdrive/operations";
import { revalidateTag } from "next/cache";

const FUNCTIONS_REGISTRY_FILE = "functions-registry.json";

export type ScheduleType = "none" | "minutely" | "hourly" | "daily" | "weekly";

export interface FunctionInfo {
  id: string;
  scriptId: string;
  name: string;
  code: string;
  webAppUrl?: string;
  deploymentId?: string;
  status: "draft" | "deployed" | "error";
  schedule: ScheduleType;
  triggerEnabled?: boolean;
  nextRunAt?: string;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  lastRunResult?: string;
}

interface FunctionsRegistry {
  functions: FunctionInfo[];
}

// Get or create the functions registry file
async function getOrCreateRegistry(): Promise<{
  registryId: string;
  registry: FunctionsRegistry;
}> {
  const systemFolderId = await getOrCreateSystemFolder();
  const files = await operations.listOperations.listFilesInFolder(
    systemFolderId
  );
  const existingRegistry = files.data?.files?.find(
    (f: any) => f.name === FUNCTIONS_REGISTRY_FILE && !f.trashed
  );

  if (existingRegistry) {
    const result = await operations.jsonOperations.readJsonFileData(
      existingRegistry.id
    );
    return {
      registryId: existingRegistry.id,
      registry: (result.success ? result.data : null) || { functions: [] },
    };
  }

  // Create new registry
  const { tokens, clientId, clientSecret, projectId } = await getAuth();
  const driveService = initDriveService(
    {
      client_id: clientId,
      client_secret: clientSecret,
      project_id: projectId,
      redirect_uris: [`${process.env.NEXT_PUBLIC_BASE_URL}/oauth2callback`],
    },
    tokens
  );

  const newRegistry: FunctionsRegistry = { functions: [] };
  const result = await operations.jsonOperations.createJsonFile(
    newRegistry,
    FUNCTIONS_REGISTRY_FILE
  );

  if (result.success && result.data.id) {
    await moveFile(result.data.id, systemFolderId);
    return { registryId: result.data.id, registry: newRegistry };
  }

  throw new Error("Failed to create functions registry");
}

// Save registry
async function saveRegistry(registryId: string, registry: FunctionsRegistry) {
  const { tokens, clientId, clientSecret, projectId } = await getAuth();
  const driveService = initDriveService(
    {
      client_id: clientId,
      client_secret: clientSecret,
      project_id: projectId,
      redirect_uris: [`${process.env.NEXT_PUBLIC_BASE_URL}/oauth2callback`],
    },
    tokens
  );
  await driveService.updateJsonContent(registryId, registry);
}

/**
 * List all user-created functions
 */
export async function listFunctions(): Promise<FunctionInfo[]> {
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

    const { registry } = await getOrCreateRegistry();
    return registry.functions;
  } catch (error) {
    console.error("Error listing functions:", error);
    return [];
  }
}

/**
 * Calculate the next run time based on schedule
 */
function calculateNextRunTime(schedule: ScheduleType): string | undefined {
  if (schedule === "none") return undefined;

  const now = new Date();
  switch (schedule) {
    case "minutely":
      return new Date(now.getTime() + 60 * 1000).toISOString();
    case "hourly":
      return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    case "daily":
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0); // 9 AM next day
      return tomorrow.toISOString();
    case "weekly":
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + ((8 - nextWeek.getDay()) % 7) || 7); // Next Monday
      nextWeek.setHours(9, 0, 0, 0);
      return nextWeek.toISOString();
    default:
      return undefined;
  }
}

/**
 * Create a new function
 */
export async function createFunction(
  name: string,
  code: string,
  schedule: ScheduleType = "none"
): Promise<{ success: boolean; function?: FunctionInfo; error?: string }> {
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

    const { registryId, registry } = await getOrCreateRegistry();

    // Check for duplicate name
    if (registry.functions.some((f) => f.name === name)) {
      return {
        success: false,
        error: "A function with this name already exists",
      };
    }

    const functionId = crypto.randomUUID();
    const systemFolderId = await getOrCreateSystemFolder();

    // Wrapper code to handle logging
    // We will store logs in _SystemData/logs/{functionId}/{timestamp}.json
    const wrappedCode = `
var SYSTEM_FOLDER_ID = "${systemFolderId}";
var FUNCTION_ID = "${functionId}";

/**
 * Main function - called via ?func=run&param1=value1&param2=value2
 * All URL params are passed to this function
 */
function run(params) {
  var logs = [];
  var startTime = new Date().toISOString();
  
  // Override console methods to capture logs
  var originalLog = console.log;
  var originalError = console.error;
  var originalWarn = console.warn;
  var originalInfo = console.info;
  
  // Capturing console.log
  console.log = function() {
    var args = Array.prototype.slice.call(arguments);
    logs.push({
      level: 'INFO',
      timestamp: new Date().toISOString(),
      message: args.map(function(a) { return String(a); }).join(' ')
    });
    originalLog.apply(console, arguments);
  };
  
  // Capturing console.info
  console.info = function() {
    var args = Array.prototype.slice.call(arguments);
    logs.push({
      level: 'INFO',
      timestamp: new Date().toISOString(),
      message: args.map(function(a) { return String(a); }).join(' ')
    });
    originalInfo.apply(console, arguments);
  };

  // Capturing console.warn
  console.warn = function() {
    var args = Array.prototype.slice.call(arguments);
    logs.push({
      level: 'WARN',
      timestamp: new Date().toISOString(),
      message: args.map(function(a) { return String(a); }).join(' ')
    });
    originalWarn.apply(console, arguments);
  };
  
  // Capturing console.error
  console.error = function() {
    var args = Array.prototype.slice.call(arguments);
    logs.push({
      level: 'ERROR',
      timestamp: new Date().toISOString(),
      message: args.map(function(a) { return String(a); }).join(' ')
    });
    originalError.apply(console, arguments);
  };

  // Capture Logger.log (Apps Script specific)
  try {
    var originalLoggerLog = Logger.log;
    Logger.log = function(str) {
       logs.push({
        level: 'INFO',
        timestamp: new Date().toISOString(),
        message: String(str)
      });
      originalLoggerLog.apply(Logger, arguments);
    }
  } catch (e) {
    // Logger might not be available or writable in some contexts, ignore
  }

  var result;
  var error;
  
  try {
    // Execute user code
    // wrapping in an IIFE to avoid variable conflicts
    result = (function() {
      ${code}
    })();
  } catch (e) {
    error = e.toString();
    console.error(error);
  } finally {
    // Save logs to Drive
    try {
      saveLogs(logs, result, error, startTime);
    } catch (logError) {
      originalError.apply(console, ["Failed to save logs", logError]);
    }
    
    // Restore console
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;
    console.info = originalInfo;
  }
  
  if (error) throw error;
  return result;
}

function saveLogs(logs, result, error, startTime) {
  if (!SYSTEM_FOLDER_ID) return;
  
  try {
    // Get/Create logs folder structure
    var sysFolder = DriveApp.getFolderById(SYSTEM_FOLDER_ID);
    var logsRoot;
    var folders = sysFolder.getFoldersByName("logs");
    if (folders.hasNext()) {
      logsRoot = folders.next();
    } else {
      logsRoot = sysFolder.createFolder("logs");
    }
    
    var funcLogsFolder;
    folders = logsRoot.getFoldersByName(FUNCTION_ID);
    if (folders.hasNext()) {
      funcLogsFolder = folders.next();
    } else {
      funcLogsFolder = logsRoot.createFolder(FUNCTION_ID);
    }
    
    // cleanup old logs (keep last 20)
    var files = funcLogsFolder.getFiles();
    var allFiles = [];
    while (files.hasNext()) {
      allFiles.push(files.next());
    }
    
    if (allFiles.length > 20) {
      allFiles.sort(function(a, b) {
        return a.getDateCreated().getTime() - b.getDateCreated().getTime();
      });
      // Delete oldest
      for (var i = 0; i < allFiles.length - 20; i++) {
        allFiles[i].setTrashed(true);
      }
    }
    
    // Save new log
    var logData = {
      functionId: FUNCTION_ID,
      startTime: startTime,
      endTime: new Date().toISOString(),
      logs: logs,
      status: error ? 'ERROR' : 'SUCCESS',
      error: error,
      result: result 
    };
    
    var fileName = new Date().toISOString().replace(/:/g, "-") + ".json";
    funcLogsFolder.createFile(fileName, JSON.stringify(logData, null, 2), MimeType.PLAIN_TEXT);
    
  } catch (e) {
    // Last resort fallback
    console.error("CRITICAL: Failed to write log file: " + e);
  }
}
`;

    // Create the Apps Script with retry logic
    console.log("Creating function script:", name);
    let scriptId: string | undefined;
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const scriptResult =
          await operations.scriptOperations.createGoogleScript.Function(
            `GDriveDB-Func-${name}`,
            wrappedCode
          );
        scriptId = scriptResult.scriptId;
        console.log("Created script:", scriptId);
        break;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.log(`Script creation attempt ${attempt}/3 failed:`, err);

        // Wait longer between retries
        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, 3000 * attempt));
        }
      }
    }

    if (!scriptId) {
      throw lastError || new Error("Failed to create script after 3 attempts");
    }

    // Deploy the script
    console.log("Deploying script...");
    let deployResult: { webAppUrl?: string; deploymentId?: string } | undefined;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        deployResult = await operations.scriptOperations.deployGoogleScript(
          scriptId
        );
        break;
      } catch (err) {
        console.log(`Deploy attempt ${attempt}/3 failed:`, err);
        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
        }
      }
    }

    const now = new Date().toISOString();
    const newFunction: FunctionInfo = {
      id: functionId,
      scriptId,
      name,
      code,
      webAppUrl: deployResult?.webAppUrl,
      deploymentId: deployResult?.deploymentId,
      status: deployResult?.webAppUrl ? "deployed" : "draft",
      schedule,
      nextRunAt: calculateNextRunTime(schedule),
      createdAt: now,
      updatedAt: now,
    };

    registry.functions.push(newFunction);
    await saveRegistry(registryId, registry);
    revalidateTag("functions", { expire: 0 });

    return { success: true, function: newFunction };
  } catch (error) {
    console.error("Error creating function:", error);

    // Detect specific error types and provide helpful messages
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes("404") && errorMessage.includes("projects")) {
      return {
        success: false,
        error:
          "Apps Script API error: Please ensure the Apps Script API is enabled in your Google Cloud Console, then re-authenticate by logging out and back in.",
      };
    }

    if (
      errorMessage.includes("401") ||
      errorMessage.includes("403") ||
      errorMessage.includes("Unauthorized")
    ) {
      return {
        success: false,
        error:
          "Authorization error: Your session may have expired or lacks the required permissions. Please log out and log back in to re-authenticate with the necessary scopes.",
      };
    }

    if (errorMessage.includes("quota") || errorMessage.includes("rate limit")) {
      return {
        success: false,
        error:
          "Rate limit exceeded: Google API quota reached. Please wait a few minutes and try again.",
      };
    }

    return {
      success: false,
      error: errorMessage || "Failed to create function",
    };
  }
}

/**
 * Get a single function by ID
 */
export async function getFunction(id: string): Promise<FunctionInfo | null> {
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

    const { registry } = await getOrCreateRegistry();
    return registry.functions.find((f) => f.id === id) || null;
  } catch (error) {
    console.error("Error getting function:", error);
    return null;
  }
}

/**
 * Update function code
 */
export async function updateFunction(
  id: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
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

    const { registryId, registry } = await getOrCreateRegistry();
    const funcIndex = registry.functions.findIndex((f) => f.id === id);

    if (funcIndex === -1) {
      return { success: false, error: "Function not found" };
    }

    const func = registry.functions[funcIndex];

    // Delete old script and create new one (gdrivekit doesn't have updateGoogleScript)
    const systemFolderId = await getOrCreateSystemFolder();

    // Wrapper code with logging
    const wrappedCode = `
var SYSTEM_FOLDER_ID = "${systemFolderId}";
var FUNCTION_ID = "${func.id}";

/**
 * Main function - called via ?func=run&param1=value1&param2=value2
 */
function run(params) {
  var logs = [];
  var startTime = new Date().toISOString();
  
  // Override console methods to capture logs
  var originalLog = console.log;
  var originalError = console.error;
  var originalWarn = console.warn;
  var originalInfo = console.info;
  
  // Capturing console.log
  console.log = function() {
    var args = Array.prototype.slice.call(arguments);
    logs.push({
      level: 'INFO',
      timestamp: new Date().toISOString(),
      message: args.map(function(a) { return String(a); }).join(' ')
    });
    originalLog.apply(console, arguments);
  };
  
  // Capturing console.info
  console.info = function() {
    var args = Array.prototype.slice.call(arguments);
    logs.push({
      level: 'INFO',
      timestamp: new Date().toISOString(),
      message: args.map(function(a) { return String(a); }).join(' ')
    });
    originalInfo.apply(console, arguments);
  };

  // Capturing console.warn
  console.warn = function() {
    var args = Array.prototype.slice.call(arguments);
    logs.push({
      level: 'WARN',
      timestamp: new Date().toISOString(),
      message: args.map(function(a) { return String(a); }).join(' ')
    });
    originalWarn.apply(console, arguments);
  };
  
  // Capturing console.error
  console.error = function() {
    var args = Array.prototype.slice.call(arguments);
    logs.push({
      level: 'ERROR',
      timestamp: new Date().toISOString(),
      message: args.map(function(a) { return String(a); }).join(' ')
    });
    originalError.apply(console, arguments);
  };

  // Capture Logger.log (Apps Script specific)
  try {
    var originalLoggerLog = Logger.log;
    Logger.log = function(str) {
       logs.push({
        level: 'INFO',
        timestamp: new Date().toISOString(),
        message: String(str)
      });
      originalLoggerLog.apply(Logger, arguments);
    }
  } catch (e) {
    // Logger might not be available or writable in some contexts, ignore
  }

  var result;
  var error;
  
  try {
    // Execute user code
    result = (function() {
      ${code}
    })();
  } catch (e) {
    error = e.toString();
    console.error(error);
  } finally {
    // Save logs
    try {
      saveLogs(logs, result, error, startTime);
    } catch (logError) {
      originalError.apply(console, ["Failed to save logs", logError]);
    }
    
    // Restore console
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;
    console.info = originalInfo;
  }
  
  if (error) throw error;
  return result;
}

function saveLogs(logs, result, error, startTime) {
  if (!SYSTEM_FOLDER_ID) return;
  
  try {
    var sysFolder = DriveApp.getFolderById(SYSTEM_FOLDER_ID);
    var logsRoot;
    var folders = sysFolder.getFoldersByName("logs");
    if (folders.hasNext()) {
      logsRoot = folders.next();
    } else {
      logsRoot = sysFolder.createFolder("logs");
    }
    
    var funcLogsFolder;
    folders = logsRoot.getFoldersByName(FUNCTION_ID);
    if (folders.hasNext()) {
      funcLogsFolder = folders.next();
    } else {
      funcLogsFolder = logsRoot.createFolder(FUNCTION_ID);
    }
    
    // cleanup old logs
    var files = funcLogsFolder.getFiles();
    var allFiles = [];
    while (files.hasNext()) {
      allFiles.push(files.next());
    }
    
    if (allFiles.length > 20) {
      allFiles.sort(function(a, b) {
        return a.getDateCreated().getTime() - b.getDateCreated().getTime();
      });
      for (var i = 0; i < allFiles.length - 20; i++) {
        allFiles[i].setTrashed(true);
      }
    }
    
    var logData = {
      functionId: FUNCTION_ID,
      startTime: startTime,
      endTime: new Date().toISOString(),
      logs: logs,
      status: error ? 'ERROR' : 'SUCCESS',
      error: error,
      result: result
    };
    
    var fileName = new Date().toISOString().replace(/:/g, "-") + ".json";
    funcLogsFolder.createFile(fileName, JSON.stringify(logData, null, 2), MimeType.PLAIN_TEXT);
    
  } catch (e) {
    console.error("CRITICAL: Failed to write log file: " + e);
  }
}
`;

    // Delete old script (best effort)
    try {
      await operations.scriptOperations.deleteGoogleScript(func.scriptId);
    } catch (e) {
      console.log("Could not delete old script:", e);
    }

    // Create new script
    const scriptResult =
      await operations.scriptOperations.createGoogleScript.Function(
        `GDriveDB-Func-${func.name}`,
        wrappedCode
      );
    const newScriptId = scriptResult.scriptId;

    // Deploy the new script
    let deployResult: { webAppUrl?: string; deploymentId?: string } | undefined;
    try {
      deployResult = await operations.scriptOperations.deployGoogleScript(
        newScriptId
      );
    } catch (err) {
      console.log("Deploy failed:", err);
    }

    func.scriptId = newScriptId;
    func.code = code;
    func.webAppUrl = deployResult?.webAppUrl || func.webAppUrl;
    func.deploymentId = deployResult?.deploymentId || func.deploymentId;
    func.status = deployResult?.webAppUrl ? "deployed" : func.status;
    func.updatedAt = new Date().toISOString();

    registry.functions[funcIndex] = func;
    await saveRegistry(registryId, registry);
    revalidateTag("functions", { expire: 0 });

    return { success: true };
  } catch (error) {
    console.error("Error updating function:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update function",
    };
  }
}

/**
 * Update the schedule for a function
 */
export async function updateSchedule(
  id: string,
  schedule: ScheduleType
): Promise<{ success: boolean; error?: string }> {
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

    const { registryId, registry } = await getOrCreateRegistry();
    const funcIndex = registry.functions.findIndex((f) => f.id === id);

    if (funcIndex === -1) {
      return { success: false, error: "Function not found" };
    }

    const func = registry.functions[funcIndex];

    // Update schedule in registry
    func.schedule = schedule;
    func.nextRunAt = calculateNextRunTime(schedule);
    func.updatedAt = new Date().toISOString();

    registry.functions[funcIndex] = func;
    await saveRegistry(registryId, registry);
    revalidateTag("functions", { expire: 0 });

    console.log(`Schedule updated for ${func.name}: ${schedule}`);

    // Note: The actual trigger is managed within the Apps Script itself
    // When the user runs the function, it will set up the trigger on Google's side

    return { success: true };
  } catch (error) {
    console.error("Error updating schedule:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update schedule",
    };
  }
}

/**
 * Enable auto-run by calling the trigger setup function via the web app
 */
export async function enableAutoRun(id: string): Promise<{
  success: boolean;
  error?: string;
  needsAuth?: boolean;
  authUrl?: string;
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

    const { registryId, registry } = await getOrCreateRegistry();
    const funcIndex = registry.functions.findIndex((f) => f.id === id);

    if (funcIndex === -1) {
      return { success: false, error: "Function not found" };
    }

    const func = registry.functions[funcIndex];

    if (!func.webAppUrl) {
      return { success: false, error: "Function is not deployed" };
    }

    if (!func.schedule || func.schedule === "none") {
      return {
        success: false,
        error: "No schedule set. Please set a schedule first.",
      };
    }

    // Call the setupTrigger function via the web app URL
    const url = new URL(func.webAppUrl);
    url.searchParams.append("func", "setupTrigger");
    url.searchParams.append("schedule", func.schedule);

    console.log(
      `Enabling auto-run for ${func.name} with schedule: ${func.schedule}`
    );
    const response = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow",
    });

    const text = await response.text();

    // Check if authorization is needed
    if (
      text.includes("Authorization needed") ||
      text.includes("auth-required") ||
      text.includes("You need to authorize")
    ) {
      return {
        success: false,
        needsAuth: true,
        authUrl: url.toString(),
        error:
          "Please authorize the script to set up triggers. Click the link to authorize.",
      };
    }

    let result: any;
    try {
      result = JSON.parse(text);
    } catch {
      // If not JSON, it might be an HTML page (authorization needed)
      if (text.includes("<!DOCTYPE") || text.includes("<html")) {
        return {
          success: false,
          needsAuth: true,
          authUrl: url.toString(),
          error:
            "Please visit the script URL to authorize trigger permissions.",
        };
      }
      result = { message: text };
    }

    if (result.error) {
      throw new Error(result.error);
    }

    // Update the function to show triggers are active
    func.triggerEnabled = true;
    func.updatedAt = new Date().toISOString();
    registry.functions[funcIndex] = func;
    await saveRegistry(registryId, registry);
    revalidateTag("functions", { expire: 0 });

    console.log(`Auto-run enabled for ${func.name}:`, result);

    return { success: true };
  } catch (error) {
    console.error("Error enabling auto-run:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to enable auto-run",
    };
  }
}

/**
 * Delete a function
 */
export async function deleteFunction(
  id: string
): Promise<{ success: boolean; error?: string }> {
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

    const { registryId, registry } = await getOrCreateRegistry();
    const funcIndex = registry.functions.findIndex((f) => f.id === id);

    if (funcIndex === -1) {
      return { success: false, error: "Function not found" };
    }

    const func = registry.functions[funcIndex];

    // Delete the Apps Script
    try {
      await operations.scriptOperations.deleteGoogleScript(func.scriptId);
    } catch (e) {
      console.log("Could not delete script:", e);
    }

    registry.functions.splice(funcIndex, 1);
    await saveRegistry(registryId, registry);
    revalidateTag("functions", { expire: 0 });

    return { success: true };
  } catch (error) {
    console.error("Error deleting function:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete function",
    };
  }
}

/**
 * Run a function with optional parameters
 */
/**
 * Run a function with optional parameters
 */
export async function runFunction(
  id: string,
  params?: Record<string, any>
): Promise<{
  success: boolean;
  result?: any;
  error?: string;
  needsAuth?: boolean;
  authUrl?: string;
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

    const { registryId, registry } = await getOrCreateRegistry();
    const funcIndex = registry.functions.findIndex((f) => f.id === id);

    if (funcIndex === -1) {
      return { success: false, error: "Function not found" };
    }

    const func = registry.functions[funcIndex];

    if (!func.webAppUrl) {
      return { success: false, error: "Function is not deployed" };
    }

    // Call the function via web app URL
    const url = new URL(func.webAppUrl);
    url.searchParams.append("func", "run");
    if (params) {
      url.searchParams.append("params", JSON.stringify(params));
    }

    console.log("Running function:", func.name);
    const response = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow",
    });

    const text = await response.text();

    // Check for authorization issues
    if (
      text.includes("Authorization needed") ||
      text.includes("Access denied") ||
      text.includes("auth-required") ||
      (text.includes("<!DOCTYPE") &&
        text.includes("<title>Access denied</title>"))
    ) {
      return {
        success: false,
        needsAuth: true,
        authUrl: func.webAppUrl,
        error:
          "Function needs authorization. Click the button below to authorize.",
      };
    }

    let result: any;
    try {
      result = JSON.parse(text);
    } catch {
      result = text;
    }

    // Update last run info
    func.lastRunAt = new Date().toISOString();
    func.lastRunResult = JSON.stringify(result).substring(0, 500);
    registry.functions[funcIndex] = func;
    await saveRegistry(registryId, registry);

    return { success: true, result };
  } catch (error) {
    console.error("Error running function:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to run function",
    };
  }
}

/**
 * Get logs for a function
 */
export async function getFunctionLogs(
  functionId: string
): Promise<{ success: boolean; logs?: any[]; error?: string }> {
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

    const systemFolderId = await getOrCreateSystemFolder();

    // Find logs folder
    const logsFolderId = await getOrCreateLogFolder(systemFolderId, functionId);
    if (!logsFolderId) {
      return { success: true, logs: [] };
    }

    const files = await operations.listOperations.listFilesInFolder(
      logsFolderId
    );

    // Sort by name (timestamp) desc
    const logFiles = (files.data?.files || [])
      .filter((f: any) => !f.trashed)
      .sort((a: any, b: any) => b.name.localeCompare(a.name))
      .slice(0, 20); // Get last 20 logs

    const logs = [];
    for (const file of logFiles) {
      try {
        const result = await operations.jsonOperations.readJsonFileData(
          file.id
        );
        if (result.success) {
          logs.push(result.data);
        }
      } catch (e) {
        console.error("Error reading log file:", file.id, e);
      }
    }

    return { success: true, logs };
  } catch (error) {
    console.error("Error getting function logs:", error);
    return { success: false, error: "Failed to get logs" };
  }
}

async function getOrCreateLogFolder(
  systemFolderId: string,
  functionId: string
) {
  // 1. Get/Create "logs" folder in system folder
  let logsRootId;
  const sysFiles = await operations.listOperations.listFoldersInFolder(
    systemFolderId
  );
  const existingLogsRoot = sysFiles.data?.files?.find(
    (f: any) => f.name === "logs" && !f.trashed
  );

  if (existingLogsRoot) {
    logsRootId = existingLogsRoot.id;
  } else {
    // Create logs folder
    const createRes = await operations.folderOperations.createFolder(
      "logs",
      systemFolderId
    );
    logsRootId = createRes?.data?.id || (createRes as any)?.id;
  }

  if (!logsRootId) return null;

  // 2. Get/Create function specific log folder
  const logFiles = await operations.listOperations.listFoldersInFolder(
    logsRootId
  );
  const existingFuncLogs = logFiles.data?.files?.find(
    (f: any) => f.name === functionId && !f.trashed
  );

  if (existingFuncLogs) {
    return existingFuncLogs.id;
  } else {
    const createRes = await operations.folderOperations.createFolder(
      functionId,
      logsRootId
    );
    return createRes?.data?.id || (createRes as any)?.id;
  }
}
