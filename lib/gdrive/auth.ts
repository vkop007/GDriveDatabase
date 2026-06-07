import { initDriveService } from "gdrivekit";
import { cookies } from "next/headers";
import { cache } from "react";
import {
  getDriveClientConfig,
  getSessionCookieOptions,
  GOOGLE_TOKEN_COOKIE,
} from "./google-oauth";
import {
  getCurrentDriveConnection,
  saveCurrentDriveTokens,
  type OAuthTokens,
} from "./drive-connection-store";

const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;
type ActiveOAuthTokens = OAuthTokens & {
  access_token: string;
  refresh_token: string;
};

function tokenString(value: unknown) {
  return typeof value === "string" && value ? value : undefined;
}

function hasFreshAccessToken(tokens: OAuthTokens) {
  const expiryDate = Number(tokens.expiry_date);

  return (
    Boolean(tokenString(tokens.access_token)) &&
    Number.isFinite(expiryDate) &&
    expiryDate > Date.now() + TOKEN_REFRESH_BUFFER_MS
  );
}

function requireActiveTokens(tokens: OAuthTokens): ActiveOAuthTokens {
  const accessToken = tokenString(tokens.access_token);
  const refreshToken = tokenString(tokens.refresh_token);

  if (!accessToken || !refreshToken) {
    throw new Error("Google Drive authorization expired. Please reconnect Drive.");
  }

  return { ...tokens, access_token: accessToken, refresh_token: refreshToken };
}

async function refreshDriveTokensIfNeeded(args: {
  tokens: OAuthTokens;
  clientId: string;
  clientSecret: string;
}): Promise<ActiveOAuthTokens> {
  const { tokens, clientId, clientSecret } = args;
  const refreshToken = tokenString(tokens.refresh_token);

  if (hasFreshAccessToken(tokens)) {
    return requireActiveTokens(tokens);
  }

  if (!refreshToken) {
    return requireActiveTokens(tokens);
  }

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
    throw new Error(`Failed to refresh token: ${errorText}`);
  }

  const refreshed = (await refreshResponse.json()) as OAuthTokens;
  const expiresIn = Number(refreshed.expires_in);
  const updatedTokens: OAuthTokens = {
    ...tokens,
    ...refreshed,
    refresh_token: tokenString(refreshed.refresh_token) ?? refreshToken,
    expiry_date: Number.isFinite(expiresIn)
      ? Date.now() + expiresIn * 1000
      : tokens.expiry_date,
  };

  await saveCurrentDriveTokens(updatedTokens);
  return requireActiveTokens(updatedTokens);
}

export const getAuth = cache(async function getAuth() {
  const connection = await getCurrentDriveConnection();

  if (!connection) {
    throw new Error("Not authenticated");
  }

  const tokens = await refreshDriveTokensIfNeeded({
    tokens: connection.tokens,
    clientId: connection.clientId,
    clientSecret: connection.clientSecret,
  });

  const driveService = initDriveService(
    getDriveClientConfig({
      clientId: connection.clientId,
      clientSecret: connection.clientSecret,
      projectId: connection.projectId,
    }),
    tokens
  );

  return { ...connection, tokens, driveService };
});

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const { tokens, clientId, clientSecret } = await getAuth();

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
    await saveCurrentDriveTokens(updatedTokens);

    // Note: Cookie update may fail in Server Components - that's OK
    // Middleware will handle persistent token updates
    try {
      const cookieStore = await cookies();
      cookieStore.set(
        GOOGLE_TOKEN_COOKIE,
        JSON.stringify(updatedTokens),
        getSessionCookieOptions()
      );
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
