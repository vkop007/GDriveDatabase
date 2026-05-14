import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  APP_LOGIN_STATE_COOKIE,
  APP_SESSION_COOKIE,
  AppSession,
  getAppLoginRedirectUri,
  getGoogleOAuthConfig,
  getSessionCookieOptions,
} from "@/lib/gdrive/google-oauth";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(APP_LOGIN_STATE_COOKIE)?.value;

  if (!state || !expectedState || state !== expectedState) {
    return NextResponse.json(
      { error: "Invalid Google sign-in state. Please try again." },
      { status: 400 }
    );
  }

  try {
    const { clientId, clientSecret } = getGoogleOAuthConfig();
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: getAppLoginRedirectUri(request.nextUrl.origin),
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Google login token exchange failed:", tokens);
      return NextResponse.json(
        { error: tokens.error_description || "Failed to exchange tokens" },
        { status: 400 }
      );
    }

    const profileResponse = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    if (!profileResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch Google profile" },
        { status: 400 }
      );
    }

    const profile = await profileResponse.json();
    const session: AppSession = {
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      sub: profile.sub,
    };

    cookieStore.delete(APP_LOGIN_STATE_COOKIE);
    cookieStore.set(
      APP_SESSION_COOKIE,
      JSON.stringify(session),
      getSessionCookieOptions(60 * 60 * 24 * 30)
    );

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (error: any) {
    console.error("Google login error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
