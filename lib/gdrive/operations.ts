import { operations } from "gdrivekit";
import { getAuth } from "./auth";
import { cookies } from "next/headers";

export const ROOT_FOLDER_NAME = "GDriveDatabase";

export async function getOrCreateRootFolder() {
  await getAuth();

  try {
    // List all folders in the root directory
    // This is often more reliable than search queries for immediate consistency
    const response = await operations.listFoldersInFolder("root");

    // console.log(
    //   "Root folders list:",
    //   JSON.stringify(
    //     response.data?.files?.map((f: any) => ({
    //       name: f.name,
    //       id: f.id,
    //       mimeType: f.mimeType,
    //       trashed: f.trashed,
    //     }))
    //   )
    // );

    const folder = response.data?.files?.find(
      (f: any) => f.name === ROOT_FOLDER_NAME && !f.trashed
    );

    if (folder) {
      console.log("Found existing root folder via list:", folder.id);
      return folder.id;
    }
  } catch (error) {
    console.error("Error listing root folders:", error);
    // Fallback to search if list fails? Or just proceed to create?
    // Let's try search as a backup if list fails, but list should work for 'root'
  }

  console.log("Creating new root folder");
  // Create if not exists
  const createResponse = await operations.createFolder(ROOT_FOLDER_NAME);
  return createResponse.data.id;
}

// Custom move file implementation to bypass gdrivekit issue
export async function moveFile(fileId: string, folderId: string) {
  let { tokens, clientId, clientSecret } = await getAuth();

  const makeRequest = async (accessToken: string) => {
    // First we need to get the current parents to remove them
    const getResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=parents`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (getResponse.status === 401) {
      return { status: 401 };
    }

    if (!getResponse.ok) {
      throw new Error(`Failed to get file parents: ${getResponse.statusText}`);
    }

    const fileData = await getResponse.json();
    const previousParents = fileData.parents?.join(",") || "";

    // Now move the file
    const moveResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?addParents=${folderId}&removeParents=${previousParents}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (moveResponse.status === 401) {
      return { status: 401 };
    }

    if (!moveResponse.ok) {
      const errorText = await moveResponse.text();
      throw new Error(`Failed to move file: ${errorText}`);
    }

    return { status: 200, success: true };
  };

  let result = await makeRequest(tokens.access_token);

  if (result.status === 401) {
    console.log("Access token expired, refreshing...");
    if (!tokens.refresh_token) {
      throw new Error("Access token expired and no refresh token available");
    }

    const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: tokens.refresh_token,
        grant_type: "refresh_token",
      }),
    });

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text();
      throw new Error(`Failed to refresh token: ${errorText}`);
    }

    const newTokens = await refreshResponse.json();

    // Merge new tokens with old ones (to keep refresh_token if not returned)
    const updatedTokens = { ...tokens, ...newTokens };

    // Update cookie
    const cookieStore = await cookies();
    cookieStore.set("gdrive_tokens", JSON.stringify(updatedTokens), {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    });

    // Retry with new token
    console.log("Retrying move with new token...");
    result = await makeRequest(updatedTokens.access_token);

    if (result.status === 401) {
      throw new Error("Still unauthorized after token refresh");
    }
  }

  return { success: true };
}
