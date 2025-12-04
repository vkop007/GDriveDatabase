import { initDriveService } from "gdrivekit";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function getAuth() {
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

  return { tokens, clientId, clientSecret, projectId };
}

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
    const scope = "https://www.googleapis.com/auth/drive email profile";
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
