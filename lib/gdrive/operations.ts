import { operations } from "gdrivekit";
import { getAuth } from "./auth";
import { cookies } from "next/headers";

export const ROOT_FOLDER_NAME = "GDriveDatabase";

export async function getOrCreateRootFolder(auth?: any) {
  if (!auth) {
    await getAuth();
  }

  try {
    const response = await operations.folderOperations.getFolderIdByName(
      ROOT_FOLDER_NAME
    );
    console.log("Response from getFolderIdByName:", response);
    if (response.folderId) {
      console.log("Found existing root folder via list:", response.folderId);
      return response.folderId;
    }
  } catch (error) {
    console.error("Error listing root folders:", error);
  }

  // Create if not exists
  console.log("Creating new root folder (operations.ts)");
  const createResponse = await operations.folderOperations.createFolder(
    ROOT_FOLDER_NAME
  );
  console.log(
    "Create folder response (operations.ts):",
    JSON.stringify(createResponse)
  );

  if (createResponse?.data?.id) {
    return createResponse.data.id;
  } else if ((createResponse as any)?.id) {
    return (createResponse as any).id;
  }

  throw new Error(
    "Failed to create root folder: Valid ID not found in response"
  );
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

export async function createFileInFolder(
  folderId: string,
  name: string,
  content: any
) {
  let { tokens, clientId, clientSecret } = await getAuth();

  const makeRequest = async (accessToken: string) => {
    const boundary = "-------314159265358979323846";
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const metadata = JSON.stringify({
      name: name,
      parents: [folderId],
      mimeType: "application/json",
    });
    const fileContent = JSON.stringify(content);

    const multipartRequestBody =
      "--" +
      boundary +
      "\r\n" +
      "Content-Type: application/json\r\n\r\n" +
      metadata +
      delimiter +
      "Content-Type: application/json\r\n\r\n" +
      fileContent +
      close_delim;

    const response = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": 'multipart/related; boundary="' + boundary + '"',
        },
        body: multipartRequestBody,
      }
    );

    if (response.status === 401) {
      return { status: 401 };
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create file: ${errorText}`);
    }

    const data = await response.json();
    return { status: 200, success: true, data };
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
    const updatedTokens = { ...tokens, ...newTokens };

    const cookieStore = await cookies();
    cookieStore.set("gdrive_tokens", JSON.stringify(updatedTokens), {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    });

    console.log("Retrying create with new token...");
    result = await makeRequest(updatedTokens.access_token);

    if (result.status === 401) {
      throw new Error("Still unauthorized after token refresh");
    }
  }

  return result;
}

export async function renameFile(fileId: string, newName: string) {
  let { tokens, clientId, clientSecret } = await getAuth();

  const makeRequest = async (accessToken: string) => {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newName,
        }),
      }
    );

    if (response.status === 401) {
      return { status: 401 };
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to rename file: ${errorText}`);
    }

    const data = await response.json();
    return { status: 200, success: true, data };
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
    const updatedTokens = { ...tokens, ...newTokens };

    const cookieStore = await cookies();
    cookieStore.set("gdrive_tokens", JSON.stringify(updatedTokens), {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    });

    console.log("Retrying rename with new token...");
    result = await makeRequest(updatedTokens.access_token);

    if (result.status === 401) {
      throw new Error("Still unauthorized after token refresh");
    }
  }

  return result;
}
