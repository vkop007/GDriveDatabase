import { initDriveService } from "gdrivekit";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

interface StoredTokens {
  access_token: string;
  refresh_token: string;
  expiry_date?: number;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

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
  "use server";

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
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    cookieStore.set("gdrive_client_secret", clientSecret, {
      secure: isProduction,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    cookieStore.set("gdrive_project_id", projectId, {
      secure: isProduction,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
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

async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<StoredTokens> {
  const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!refreshResponse.ok) {
    const errorText = await refreshResponse.text();
    console.error("Token refresh failed:", errorText);
    throw new Error(`Failed to refresh token: ${errorText}`);
  }

  const newTokens: TokenResponse = await refreshResponse.json();

  return {
    access_token: newTokens.access_token,
    refresh_token: newTokens.refresh_token || refreshToken,
    expiry_date: Date.now() + newTokens.expires_in * 1000,
  };
}

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  let { tokens, clientId, clientSecret } = await getAuth();

  const makeRequest = async (accessToken: string) => {
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    } as HeadersInit;

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      return null;
    }

    return response;
  };

  let response = await makeRequest(tokens.access_token);

  if (!response) {
    console.log("Access token expired in fetchWithAuth, refreshing...");

    if (!tokens.refresh_token) {
      throw new Error("Access token expired and no refresh token available");
    }

    // Refresh the token
    const updatedTokens = await refreshAccessToken(
      tokens.refresh_token,
      clientId,
      clientSecret
    );

    // Return the updated tokens in the response metadata
    // We'll handle cookie update in a separate server action
    const newResponse = await makeRequest(updatedTokens.access_token);

    if (!newResponse) {
      throw new Error("Still unauthorized after token refresh");
    }

    // Attach updated tokens as metadata that can be used by server actions
    (newResponse as any).__updatedTokens = updatedTokens;

    return newResponse;
  }

  return response;
}

// Server action to update stored tokens - MUST be called from server actions only
export async function updateStoredTokens(updatedTokens: StoredTokens) {
  "use server";

  const cookieStore = await cookies();
  cookieStore.set("gdrive_tokens", JSON.stringify(updatedTokens), {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

// Helper function to set tokens (used during OAuth callback)
export async function setTokens(tokens: StoredTokens) {
  "use server";

  const cookieStore = await cookies();
  cookieStore.set("gdrive_tokens", JSON.stringify(tokens), {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

// Helper function to clear tokens (for logout)
export async function clearTokens() {
  "use server";

  const cookieStore = await cookies();
  cookieStore.delete("gdrive_tokens");
  cookieStore.delete("gdrive_client_id");
  cookieStore.delete("gdrive_client_secret");
  cookieStore.delete("gdrive_project_id");
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const tokensStr = cookieStore.get("gdrive_tokens")?.value;
  const clientId = cookieStore.get("gdrive_client_id")?.value;
  const clientSecret = cookieStore.get("gdrive_client_secret")?.value;
  const projectId = cookieStore.get("gdrive_project_id")?.value;

  return !!(tokensStr && clientId && clientSecret && projectId);
}

// Wrapper for fetchWithAuth - handles token refresh gracefully
// NOTE: Token updates during SSR cannot be persisted to cookies.
// The token will be refreshed again on subsequent requests if needed.
export async function fetchWithAuthAndUpdate(
  url: string,
  options: RequestInit = {}
) {
  const response = await fetchWithAuth(url, options);

  // Log if tokens were refreshed (but we can't persist during SSR)
  if ((response as any).__updatedTokens) {
    console.log(
      "🔄 Token was refreshed for this request (not persisted during SSR)"
    );
    delete (response as any).__updatedTokens;
  }

  return response;
}
