import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  APP_SESSION_COOKIE,
  getSessionCookieOptions,
  GOOGLE_TOKEN_COOKIE,
} from "@/lib/gdrive/google-oauth";

// Helper to decode JWT and check expiry (without verification)
function isTokenExpired(accessToken: string, bufferSeconds = 300): boolean {
  try {
    // JWT format: header.payload.signature
    const parts = accessToken.split(".");
    if (parts.length !== 3) return true;

    const payload = JSON.parse(atob(parts[1]));
    const exp = payload.exp;
    if (!exp) return true;

    // Check if token expires within bufferSeconds (default 5 minutes)
    const now = Math.floor(Date.now() / 1000);
    return exp < now + bufferSeconds;
  } catch {
    // If we can't parse the token, assume it might be expired
    return true;
  }
}

async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ access_token: string; expires_in: number } | null> {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      console.error("Token refresh failed:", await response.text());
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Token refresh error:", error);
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const appSession = request.cookies.get(APP_SESSION_COOKIE)?.value;
  const tokensStr = request.cookies.get(GOOGLE_TOKEN_COOKIE)?.value;
  const clientId = request.cookies.get("gdrive_client_id")?.value;
  const clientSecret = request.cookies.get("gdrive_client_secret")?.value;
  const { pathname } = request.nextUrl;

  // If user is signed in to the app and is on the root page, redirect to dashboard
  if (appSession && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If user is not signed into the app, protect dashboard routes.
  if (!appSession && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // For dashboard routes, proactively refresh expired tokens
  if (pathname.startsWith("/dashboard") && tokensStr) {
    try {
      if (!clientId || !clientSecret) {
        const response = NextResponse.next();
        response.cookies.delete(GOOGLE_TOKEN_COOKIE);
        return response;
      }

      const tokens = JSON.parse(tokensStr);

      // Check if access token is expired or about to expire
      if (tokens.access_token && isTokenExpired(tokens.access_token)) {
        console.log("🔄 Proxy: Proactively refreshing expired access token...");

        if (!tokens.refresh_token) {
          console.error("No refresh token available");
          const response = NextResponse.next();
          response.cookies.delete(GOOGLE_TOKEN_COOKIE);
          return response;
        }

        const newTokenData = await refreshAccessToken(
          tokens.refresh_token,
          clientId,
          clientSecret
        );

        if (!newTokenData) {
          console.error("Failed to refresh token, redirecting to login");
          const response = NextResponse.next();
          response.cookies.delete(GOOGLE_TOKEN_COOKIE);
          return response;
        }

        // Update tokens with new access token
        const updatedTokens = {
          ...tokens,
          access_token: newTokenData.access_token,
        };

        console.log("✅ Proxy: Token refreshed successfully");

        // Create response and set updated cookie
        const response = NextResponse.next();
        response.cookies.set(
          GOOGLE_TOKEN_COOKIE,
          JSON.stringify(updatedTokens),
          getSessionCookieOptions(60 * 60 * 24 * 30)
        );

        return response;
      }
    } catch (error) {
      console.error("Proxy auth error:", error);
      const response = NextResponse.next();
      response.cookies.delete(GOOGLE_TOKEN_COOKIE);
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Static files (images, etc.)
     */
    "/((?!api|auth|_next/static|_next/image|favicon.ico|.well-known|oauth2callback|.*\\.png$|.*\\.svg$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.ico$|.*\\.webp$).*)",
  ],
};
