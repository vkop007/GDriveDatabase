import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
  const tokensStr = request.cookies.get("gdrive_tokens")?.value;
  const clientId = request.cookies.get("gdrive_client_id")?.value;
  const clientSecret = request.cookies.get("gdrive_client_secret")?.value;
  const { pathname } = request.nextUrl;

  // If user has tokens and is on the root page, redirect to dashboard
  if (tokensStr && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If user does not have tokens and is NOT on the root page, redirect to root
  if (!tokensStr && pathname !== "/") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // For dashboard routes, proactively refresh expired tokens
  if (
    pathname.startsWith("/dashboard") &&
    tokensStr &&
    clientId &&
    clientSecret
  ) {
    try {
      const tokens = JSON.parse(tokensStr);

      // Check if access token is expired or about to expire
      if (tokens.access_token && isTokenExpired(tokens.access_token)) {
        console.log("🔄 Proxy: Proactively refreshing expired access token...");

        if (!tokens.refresh_token) {
          console.error("No refresh token available");
          return NextResponse.redirect(new URL("/", request.url));
        }

        const newTokenData = await refreshAccessToken(
          tokens.refresh_token,
          clientId,
          clientSecret
        );

        if (!newTokenData) {
          console.error("Failed to refresh token, redirecting to login");
          return NextResponse.redirect(new URL("/", request.url));
        }

        // Update tokens with new access token
        const updatedTokens = {
          ...tokens,
          access_token: newTokenData.access_token,
        };

        console.log("✅ Proxy: Token refreshed successfully");

        // Create response and set updated cookie
        const response = NextResponse.next();
        response.cookies.set("gdrive_tokens", JSON.stringify(updatedTokens), {
          secure: process.env.NODE_ENV === "production",
          httpOnly: true,
        });

        return response;
      }
    } catch (error) {
      console.error("Proxy auth error:", error);
      return NextResponse.redirect(new URL("/", request.url));
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
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.well-known|oauth2callback).*)",
  ],
};
