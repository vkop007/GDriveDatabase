export const APP_SESSION_COOKIE = "gdrive_app_session";
export const APP_LOGIN_STATE_COOKIE = "gdrive_login_state";
export const DRIVE_TOKEN_COOKIE = "gdrive_tokens";
export const DRIVE_OAUTH_STATE_COOKIE = "gdrive_drive_state";
export const GOOGLE_TOKEN_COOKIE = DRIVE_TOKEN_COOKIE;

const APP_LOGIN_SCOPES = ["openid", "email", "profile"];

export const GOOGLE_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/script.projects",
  "https://www.googleapis.com/auth/script.deployments",
  "https://www.googleapis.com/auth/script.processes",
  "https://www.googleapis.com/auth/script.metrics",
  "https://www.googleapis.com/auth/script.scriptapp",
  "email",
  "profile",
];

export type GoogleLoginConfig = {
  clientId: string;
  clientSecret: string;
};

export type DriveOAuthConfig = GoogleLoginConfig & {
  projectId: string;
};

export type AppSession = {
  email: string;
  name?: string;
  picture?: string;
  sub?: string;
};

export function getGoogleOAuthConfig(): GoogleLoginConfig {
  const clientId =
    process.env.GOOGLE_CLIENT_ID || process.env.GDRIVE_GOOGLE_CLIENT_ID;
  const clientSecret =
    process.env.GOOGLE_CLIENT_SECRET ||
    process.env.GDRIVE_GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Google login is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."
    );
  }

  return { clientId, clientSecret };
}

export function isGoogleOAuthConfigured() {
  try {
    getGoogleOAuthConfig();
    return true;
  } catch {
    return false;
  }
}

export function getBaseUrl(baseUrl?: string) {
  const configuredUrl =
    baseUrl ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000";

  return configuredUrl.replace(/\/$/, "");
}

export function getBaseUrlFromHeaders(headerStore: Headers) {
  const origin = headerStore.get("origin");
  if (origin) return origin;

  const host = headerStore.get("x-forwarded-host") || headerStore.get("host");
  if (!host) return undefined;

  const proto = headerStore.get("x-forwarded-proto") || "http";
  return `${proto}://${host}`;
}

export function getAppLoginRedirectUri(baseUrl?: string) {
  return `${getBaseUrl(baseUrl)}/api/auth/callback/google`;
}

export function getGoogleRedirectUri(baseUrl?: string) {
  return `${getBaseUrl(baseUrl)}/oauth2callback`;
}

export function getDriveClientConfig(config: DriveOAuthConfig, baseUrl?: string) {
  return {
    client_id: config.clientId,
    client_secret: config.clientSecret,
    project_id: config.projectId,
    redirect_uris: [getGoogleRedirectUri(baseUrl)],
  };
}

export function createOAuthState() {
  return crypto.randomUUID();
}

export function getSessionCookieOptions(maxAge?: number) {
  return {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    ...(maxAge ? { maxAge } : {}),
  };
}

export function buildGoogleOAuthUrl(state: string, baseUrl?: string) {
  const { clientId } = getGoogleOAuthConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getAppLoginRedirectUri(baseUrl),
    response_type: "code",
    scope: APP_LOGIN_SCOPES.join(" "),
    access_type: "offline",
    include_granted_scopes: "true",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function buildDriveOAuthUrl(
  config: Pick<DriveOAuthConfig, "clientId">,
  state: string,
  baseUrl?: string
) {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: getGoogleRedirectUri(baseUrl),
    response_type: "code",
    scope: GOOGLE_OAUTH_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}
