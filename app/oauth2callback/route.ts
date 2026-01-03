import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { saveUserProfile } from "../actions/user";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const clientId = cookieStore.get("gdrive_client_id")?.value;
  const clientSecret = cookieStore.get("gdrive_client_secret")?.value;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Missing credentials. Please try authenticating again." },
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
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/oauth2callback`,
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

    // Set cookies
    console.log("Setting gdrive_tokens cookie...");
    console.log("Tokens received:", Object.keys(tokens));

    cookieStore.set("gdrive_tokens", JSON.stringify(tokens), {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      path: "/",
      sameSite: "lax",
    });

    console.log("Cookie set. Saving user profile...");

    // Save user profile to Drive
    await saveUserProfile(tokens);

    console.log("Redirecting to /dashboard");
    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (error: any) {
    console.error("OAuth error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
