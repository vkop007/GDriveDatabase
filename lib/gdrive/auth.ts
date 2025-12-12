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
    const scope =
      "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/script.projects email profile";
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

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  let { tokens, clientId, clientSecret } = await getAuth();

  const makeRequest = async (accessToken: string) => {
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    } as HeadersInit;

    const response = await fetch(url, { ...options, headers });

    // If 401, return a special marker or the response itself to be checked
    if (response.status === 401) {
      return null;
    }

    return response;
  };

  let response = await makeRequest(tokens.access_token);

  if (!response) {
    // This is a fallback - middleware should normally handle refresh
    console.log("Access token expired in fetchWithAuth (fallback refresh)...");
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

    // Note: Cookie update may fail in Server Components - that's OK
    // Middleware will handle persistent token updates
    try {
      const cookieStore = await cookies();
      cookieStore.set("gdrive_tokens", JSON.stringify(updatedTokens), {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
      });
    } catch {
      // Expected in Server Components - middleware handles this
    }

    console.log("Retrying request with new token...");
    response = await makeRequest(updatedTokens.access_token);

    if (!response) {
      throw new Error("Still unauthorized after token refresh");
    }
  }

  return response;
}
