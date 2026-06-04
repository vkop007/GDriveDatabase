import { NextRequest, NextResponse } from "next/server";
import { operations } from "gdrivekit";
import { getApiAuth } from "@/app/actions";
import { getOrCreateBucketFolder } from "@/lib/gdrive/bucket-service";
import type { DriveFile, TableFile } from "@/types";

export type ExternalApiAuth = Awaited<ReturnType<typeof getApiAuth>>;

type ExternalApiAuthResult =
  | { auth: ExternalApiAuth }
  | { response: NextResponse };

type ExternalTableResult =
  | { table: TableFile }
  | { response: NextResponse };

type ExternalFileAccessResult =
  | { file: DriveFile }
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

function isTableFile(value: unknown): value is TableFile {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const record = value as Partial<TableFile>;
  return Array.isArray(record.schema) && Array.isArray(record.documents);
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

export async function requireExternalTable(
  auth: ExternalApiAuth,
  databaseId: string,
  tableId: string
): Promise<ExternalTableResult> {
  const listResponse = await operations.listOperations.listFilesInFolder(
    databaseId
  );
  const files = (listResponse.data?.files ?? []) as DriveFile[];
  const tableFile = files.find(
    (file) =>
      file.id === tableId &&
      !file.trashed &&
      file.mimeType === "application/json"
  );

  if (!tableFile) {
    return {
      response: externalApiError(
        "Table not found.",
        404,
        "table_not_found"
      ),
    };
  }

  const table = await auth.driveService.selectJsonContent(tableId);
  if (!isTableFile(table)) {
    return {
      response: externalApiError(
        "Table file is invalid or empty.",
        422,
        "invalid_table_file"
      ),
    };
  }

  return { table };
}

export async function requireExternalBucketFile(
  auth: ExternalApiAuth,
  fileId: string
): Promise<ExternalFileAccessResult> {
  const bucketId = await getOrCreateBucketFolder({
    clientId: auth.clientId,
    clientSecret: auth.clientSecret,
    projectId: auth.projectId,
    tokens: auth.tokens,
  });
  const listResponse = await operations.listOperations.listFilesInFolder(
    bucketId
  );
  const files = (listResponse.data?.files ?? []) as DriveFile[];
  const file = files.find(
    (candidate) =>
      candidate.id === fileId &&
      !candidate.trashed &&
      candidate.mimeType !== "application/vnd.google-apps.folder"
  );

  if (!file) {
    return {
      response: externalApiError("File not found.", 404, "file_not_found"),
    };
  }

  return { file };
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
