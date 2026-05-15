import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { saveUserProfile } from "../actions/user";
import {
  getGoogleRedirectUri,
  getSessionCookieOptions,
  DRIVE_OAUTH_STATE_COOKIE,
  GOOGLE_TOKEN_COOKIE,
} from "@/lib/gdrive/google-oauth";
import {
  consumePendingDriveCredentials,
  saveDriveConnection,
} from "@/lib/gdrive/drive-connection-store";

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
  const expectedState = cookieStore.get(DRIVE_OAUTH_STATE_COOKIE)?.value;

  if (!state || !expectedState || state !== expectedState) {
    return NextResponse.json(
      { error: "Invalid Google sign-in state. Please try again." },
      { status: 400 }
    );
  }

  const pendingCredentials = await consumePendingDriveCredentials(state);
  const clientId =
    pendingCredentials?.clientId || cookieStore.get("gdrive_client_id")?.value;
  const clientSecret =
    pendingCredentials?.clientSecret ||
    cookieStore.get("gdrive_client_secret")?.value;
  const projectId =
    pendingCredentials?.projectId ||
    cookieStore.get("gdrive_project_id")?.value;

  if (!clientId || !clientSecret || !projectId) {
    return NextResponse.json(
      { error: "Missing Google Drive credentials. Please connect Drive again." },
      { status: 400 }
    );
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: getGoogleRedirectUri(request.nextUrl.origin),
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", tokens);
      return NextResponse.json(
        { error: tokens.error_description || "Failed to exchange tokens" },
        { status: 400 }
      );
    }

    cookieStore.delete(DRIVE_OAUTH_STATE_COOKIE);
    const savedConnection = await saveDriveConnection(
      { clientId, clientSecret, projectId },
      tokens,
      pendingCredentials
    );

    if (savedConnection) {
      cookieStore.delete(GOOGLE_TOKEN_COOKIE);
      cookieStore.delete("gdrive_client_id");
      cookieStore.delete("gdrive_client_secret");
      cookieStore.delete("gdrive_project_id");
    } else {
      cookieStore.set(
        GOOGLE_TOKEN_COOKIE,
        JSON.stringify(tokens),
        getSessionCookieOptions(60 * 60 * 24 * 30)
      );
    }

    // Save user profile to Drive
    await saveUserProfile(tokens, { clientId, clientSecret, projectId });

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (error: any) {
    console.error("OAuth error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
