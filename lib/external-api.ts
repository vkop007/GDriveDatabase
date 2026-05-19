import { NextRequest, NextResponse } from "next/server";
import { getApiAuth } from "@/app/actions";

export type ExternalApiAuth = Awaited<ReturnType<typeof getApiAuth>>;

type ExternalApiAuthResult =
  | { auth: ExternalApiAuth }
  | { response: NextResponse };

export function externalApiError(
  message: string,
  status: number,
  code?: string
) {
  return NextResponse.json(
    {
      error: message,
      ...(code ? { code } : {}),
    },
    { status }
  );
}

function bearerToken(request: NextRequest): string | null {
  const authorization = request.headers.get("authorization")?.trim();
  if (!authorization) {
    return null;
  }

  const [scheme, ...tokenParts] = authorization.split(/\s+/);
  if (scheme.toLowerCase() !== "bearer" || tokenParts.length !== 1) {
    return "";
  }

  return tokenParts[0]?.trim() || "";
}

function apiKeyFromHeaders(request: NextRequest): string | null {
  const token = bearerToken(request);
  if (token !== null) {
    return token;
  }

  return request.headers.get("x-api-key")?.trim() || null;
}

export async function requireExternalApiAuth(
  request: NextRequest
): Promise<ExternalApiAuthResult> {
  if (request.nextUrl.searchParams.has("x-api-key")) {
    return {
      response: externalApiError(
        "API keys in URL query parameters are not accepted. Use the Authorization: Bearer <api-key> header.",
        400,
        "insecure_api_key_transport"
      ),
    };
  }

  const apiKey = apiKeyFromHeaders(request);
  if (!apiKey) {
    return {
      response: externalApiError(
        "Missing API key. Use Authorization: Bearer <api-key>.",
        401,
        "missing_api_key"
      ),
    };
  }

  try {
    return { auth: await getApiAuth(apiKey) };
  } catch {
    return {
      response: externalApiError(
        "Missing or invalid API key.",
        401,
        "invalid_api_key"
      ),
    };
  }
}

export function externalApiErrorResponse(
  error: unknown,
  fallback = "Internal Server Error"
) {
  console.error("External API Error:", error);

  if (error instanceof SyntaxError) {
    return externalApiError("Invalid JSON request body.", 400, "invalid_json");
  }

  return externalApiError(fallback, 500, "internal_error");
}
