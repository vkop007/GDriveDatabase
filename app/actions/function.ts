"use server";

import { operations, initDriveService } from "gdrivekit";
import { getAuth } from "../actions";
import { getOrCreateSystemFolder, moveFile } from "../../lib/gdrive/operations";
import { revalidateTag } from "next/cache";

const FUNCTIONS_REGISTRY_FILE = "functions-registry.json";

export interface FunctionInfo {
  id: string;
  scriptId: string;
  name: string;
  code: string;
  webAppUrl?: string;
  deploymentId?: string;
  status: "draft" | "deployed" | "error";
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
      redirect_uris: ["http://localhost:3000/oauth2callback"],
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
      redirect_uris: ["http://localhost:3000/oauth2callback"],
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
        redirect_uris: ["http://localhost:3000/oauth2callback"],
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
 * Create a new function
 */
export async function createFunction(
  name: string,
  code: string
): Promise<{ success: boolean; function?: FunctionInfo; error?: string }> {
  try {
    const { tokens, clientId, clientSecret, projectId } = await getAuth();
    initDriveService(
      {
        client_id: clientId,
        client_secret: clientSecret,
        project_id: projectId,
        redirect_uris: ["http://localhost:3000/oauth2callback"],
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

    // Wrap user code in a callable function structure for web app
    const wrappedCode = `
function doGet(e) {
  try {
    var funcName = e.parameter.func || "run";
    var paramsStr = e.parameter.params || "{}";
    var params = JSON.parse(paramsStr);
    
    var result;
    if (funcName === "run") {
      result = run(params);
    } else {
      result = { error: "Unknown function: " + funcName };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function run(params) {
  ${code}
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
      id: crypto.randomUUID(),
      scriptId,
      name,
      code,
      webAppUrl: deployResult?.webAppUrl,
      deploymentId: deployResult?.deploymentId,
      status: deployResult?.webAppUrl ? "deployed" : "draft",
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
        redirect_uris: ["http://localhost:3000/oauth2callback"],
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
        redirect_uris: ["http://localhost:3000/oauth2callback"],
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
    const wrappedCode = `
function run(params) {
  try {
    ${code}
  } catch (e) {
    return { error: e.toString() };
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
        redirect_uris: ["http://localhost:3000/oauth2callback"],
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
export async function runFunction(
  id: string,
  params?: Record<string, any>
): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    const { tokens, clientId, clientSecret, projectId } = await getAuth();
    initDriveService(
      {
        client_id: clientId,
        client_secret: clientSecret,
        project_id: projectId,
        redirect_uris: ["http://localhost:3000/oauth2callback"],
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

    if (text.includes("Authorization needed")) {
      return {
        success: false,
        error:
          "Function needs authorization. Please open the web app URL to authorize.",
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
