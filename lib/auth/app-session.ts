import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import {
  APP_SESSION_COOKIE,
  getSessionCookieOptions,
  type AppSession,
} from "@/lib/gdrive/google-oauth";

const SESSION_PREFIX = "v1";

function sessionSecret() {
  return (
    process.env.AUTH_SECRET ||
    process.env.ENCRYPTION_KEY ||
    process.env.NEXTAUTH_SECRET ||
    ""
  );
}

function base64Url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function signPayload(payload: string) {
  const secret = sessionSecret();
  if (!secret) {
    throw new Error("Set AUTH_SECRET or ENCRYPTION_KEY before using email/password sessions.");
  }

  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function serializeAppSession(session: AppSession) {
  const payload = base64Url(JSON.stringify(session));
  return `${SESSION_PREFIX}.${payload}.${signPayload(payload)}`;
}

export function parseAppSessionCookie(value?: string | null): AppSession | null {
  if (!value) return null;

  if (value.startsWith(`${SESSION_PREFIX}.`)) {
    const [, payload, signature] = value.split(".");
    if (!payload || !signature) return null;

    const expectedSignature = signPayload(payload);
    if (!safeEqual(signature, expectedSignature)) return null;

    try {
      return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AppSession;
    } catch {
      return null;
    }
  }

  try {
    return JSON.parse(value) as AppSession;
  } catch {
    return null;
  }
}

export async function setAppSessionCookie(session: AppSession) {
  const cookieStore = await cookies();
  cookieStore.set(
    APP_SESSION_COOKIE,
    serializeAppSession(session),
    getSessionCookieOptions(60 * 60 * 24 * 30)
  );
}
