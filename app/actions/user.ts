"use server";

import { getAuth } from "../actions";
import { operations, initDriveService } from "gdrivekit";
import { unstable_cache, revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { moveFile, getOrCreateSystemFolder } from "../../lib/gdrive/operations";

const USER_PROFILE_FILE = "user-profile.json";

export interface UserProfile {
  name: string;
  email: string;
  picture: string;
}

export async function saveUserProfile(tokens: any) {
  const cookieStore = await cookies();
  const clientId = cookieStore.get("gdrive_client_id")?.value;
  const clientSecret = cookieStore.get("gdrive_client_secret")?.value;
  const projectId = cookieStore.get("gdrive_project_id")?.value;

  if (!clientId || !clientSecret || !projectId) {
    console.error("Missing credentials for saving user profile");
    return;
  }

  const auth = { tokens, clientId, clientSecret, projectId };

  try {
    // 1. Fetch user info from Google
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch user info:", response.statusText);
      return;
    }

    const userData = await response.json();
    const userProfile: UserProfile = {
      name: userData.name,
      email: userData.email,
      picture: userData.picture,
    };

    // 2. Save to Drive in _SystemData folder
    const driveService = initDriveService(
      {
        client_id: clientId,
        client_secret: clientSecret,
        project_id: projectId,
        redirect_uris: ["http://localhost:3000/oauth2callback"],
      },
      tokens
    );

    const systemFolderId = await getOrCreateSystemFolder(auth);
    const files = await operations.listOperations.listFilesInFolder(
      systemFolderId
    );
    const existingFile = files.data?.files?.find(
      (f: any) => f.name === USER_PROFILE_FILE && !f.trashed
    );

    if (existingFile) {
      await driveService.updateJsonContent(existingFile.id, userProfile);
    } else {
      const result = await operations.jsonOperations.createJsonFile(
        userProfile,
        USER_PROFILE_FILE
      );
      if (result.success && result.data.id) {
        await moveFile(result.data.id, systemFolderId);
      }
    }

    // Revalidate cache
    // @ts-ignore - Ignoring potential signature mismatch if environment differs
    revalidateTag("user-profile");
  } catch (error) {
    console.error("Error saving user profile:", error);
  }
}

async function _getUserProfile(auth: any) {
  try {
    const systemFolderId = await getOrCreateSystemFolder(auth);
    const files = await operations.listOperations.listFilesInFolder(
      systemFolderId
    );
    const file = files.data?.files?.find(
      (f: any) => f.name === USER_PROFILE_FILE && !f.trashed
    );

    if (!file) {
      return null;
    }

    // Fetch file content using gdrivekit
    // Need to initialize driveService here since valid auth is passed in
    const driveService = initDriveService(
      {
        client_id: auth.clientId,
        client_secret: auth.clientSecret,
        project_id: auth.projectId,
        redirect_uris: ["http://localhost:3000/oauth2callback"],
      },
      auth.tokens
    );

    const content = await driveService.selectJsonContent(file.id);
    return content as UserProfile;
  } catch (error) {
    console.error("Error fetching user profile from Drive:", error);
    return null;
  }
}

export const getUserProfile = async () => {
  try {
    const auth = await getAuth();
    return unstable_cache(
      async () => _getUserProfile(auth),
      ["user-profile", auth.tokens.refresh_token],
      { revalidate: 3600, tags: ["user-profile"] }
    )();
  } catch (error) {
    return null;
  }
};

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("gdrive_tokens");
  cookieStore.delete("gdrive_client_id");
  cookieStore.delete("gdrive_client_secret");
  cookieStore.delete("gdrive_project_id");
  redirect("/");
}
