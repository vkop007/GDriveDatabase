"use server";

import { operations, initDriveService } from "gdrivekit";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function authenticateWithGoogle(formData: FormData) {
  const clientId = formData.get("clientId") as string;
  const clientSecret = formData.get("clientSecret") as string;
  const projectId = formData.get("projectId") as string;

  if (!clientId || !clientSecret || !projectId) {
    throw new Error("Missing credentials");
  }

  let authUrl;
  try {
    // Construct Auth URL manually to avoid gdrivekit's CLI-centric behavior
    const scope = "https://www.googleapis.com/auth/drive";
    const redirectUri = "http://localhost:3000/oauth2callback";

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: scope,
      access_type: "offline",
      prompt: "consent",
    });

    authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    // Store credentials in cookies for the callback
    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === "production";

    cookieStore.set("gdrive_client_id", clientId, {
      secure: isProduction,
      httpOnly: true,
    });
    cookieStore.set("gdrive_client_secret", clientSecret, {
      secure: isProduction,
      httpOnly: true,
    });
    cookieStore.set("gdrive_project_id", projectId, {
      secure: isProduction,
      httpOnly: true,
    });

    console.log("Auth URL generated:", authUrl);
  } catch (error) {
    console.error("Error generating credentials:", error);
    throw error;
  }

  if (authUrl) {
    redirect(authUrl);
  }
}

export async function createDocument(formData: FormData) {
  const filename = formData.get("filename") as string;
  const content = formData.get("content") as string;

  if (!filename || !content) {
    throw new Error("Missing filename or content");
  }

  const cookieStore = await cookies();
  const tokensStr = cookieStore.get("gdrive_tokens")?.value;
  const clientId = cookieStore.get("gdrive_client_id")?.value;
  const clientSecret = cookieStore.get("gdrive_client_secret")?.value;
  const projectId = cookieStore.get("gdrive_project_id")?.value;

  if (!tokensStr || !clientId || !clientSecret || !projectId) {
    throw new Error("Not authenticated");
  }

  const tokens = JSON.parse(tokensStr);

  initDriveService(
    {
      client_id: clientId,
      client_secret: clientSecret,
      project_id: projectId,
      redirect_uris: ["http://localhost:3000/oauth2callback"],
    },
    tokens
  );

  try {
    let jsonContent;
    try {
      jsonContent = JSON.parse(content);
    } catch (e) {
      throw new Error("Invalid JSON content");
    }

    await operations.createJsonFile(filename, jsonContent);
  } catch (error) {
    console.error("Error creating file:", error);
    throw error;
  }

  redirect("/dashboard");
}

export async function deleteDocument(formData: FormData) {
  const filename = formData.get("filename") as string;
  const fileId = formData.get("fileId") as string;

  if (!fileId) {
    throw new Error("Missing fileId");
  }

  const cookieStore = await cookies();
  const tokensStr = cookieStore.get("gdrive_tokens")?.value;
  const clientId = cookieStore.get("gdrive_client_id")?.value;
  const clientSecret = cookieStore.get("gdrive_client_secret")?.value;
  const projectId = cookieStore.get("gdrive_project_id")?.value;

  if (!tokensStr || !clientId || !clientSecret || !projectId) {
    throw new Error("Not authenticated");
  }

  const tokens = JSON.parse(tokensStr);

  initDriveService(
    {
      client_id: clientId,
      client_secret: clientSecret,
      project_id: projectId,
      redirect_uris: ["http://localhost:3000/oauth2callback"],
    },
    tokens
  );

  try {
    await operations.deleteFile(fileId);
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }

  redirect("/dashboard");
}

export async function saveDocument(formData: FormData) {
  const filename = formData.get("filename") as string;
  const fileId = formData.get("fileId") as string;
  const content = formData.get("content") as string;

  if (!fileId || !content || !filename) {
    throw new Error("Missing parameters");
  }

  const cookieStore = await cookies();
  const tokensStr = cookieStore.get("gdrive_tokens")?.value;
  const clientId = cookieStore.get("gdrive_client_id")?.value;
  const clientSecret = cookieStore.get("gdrive_client_secret")?.value;
  const projectId = cookieStore.get("gdrive_project_id")?.value;

  if (!tokensStr || !clientId || !clientSecret || !projectId) {
    throw new Error("Not authenticated");
  }

  const tokens = JSON.parse(tokensStr);

  const driveService = initDriveService(
    {
      client_id: clientId,
      client_secret: clientSecret,
      project_id: projectId,
      redirect_uris: ["http://localhost:3000/oauth2callback"],
    },
    tokens
  );

  try {
    let jsonContent;
    try {
      jsonContent = JSON.parse(content);
    } catch (e) {
      throw new Error("Invalid JSON content");
    }

    // Use updateJsonContent to update the file in place
    // This preserves the File ID and is more efficient/safer than delete+create
    // Note: We do NOT wrap the content in { success: true, data: ... } here
    // because the API might do it, or we want clean files.
    const response = await driveService.updateJsonContent(fileId, jsonContent);

    if (!response.success) {
      return {
        success: false,
        error: response.error || "Failed to update file",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating file:", error);
    return { success: false, error: "Failed to update file" };
  }
}
