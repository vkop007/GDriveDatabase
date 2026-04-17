import { NextRequest, NextResponse } from "next/server";
import { getApiAuth } from "@/app/actions";
import { TableFile, RowData } from "@/types";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ databaseId: string; tableId: string }> }
) {
  // Apply rate limiting
  const { success: rateOk, remaining, resetIn } = checkRateLimit(req);
  if (!rateOk) {
    const response = NextResponse.json(
      { error: "RATE_LIMITED", message: "Too many requests. Please try again later." },
      { status: 429 }
    );
    response.headers.set("X-RateLimit-Remaining", "0");
    response.headers.set("Retry-After", String(Math.ceil(resetIn / 1000)));
    return response;
  }

  const apiKey =
    req.headers.get("x-api-key") || req.nextUrl.searchParams.get("x-api-key");
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API Key" }, { status: 401 });
  }

  try {
    const { driveService } = await getApiAuth(apiKey);
    const { tableId } = await params;

    const table = (await driveService.selectJsonContent(tableId)) as TableFile;

    if (!table) {
      return NextResponse.json({ error: "Table not found or empty" }, { status: 404 });
    }

    const response = NextResponse.json(table.documents || []);
    response.headers.set("X-RateLimit-Remaining", String(remaining));
    return response;
  } catch (error) {
    console.error("API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ databaseId: string; tableId: string }> }
) {
  // Apply rate limiting
  const { success: rateOk, remaining, resetIn } = checkRateLimit(req);
  if (!rateOk) {
    const response = NextResponse.json(
      { error: "RATE_LIMITED", message: "Too many requests. Please try again later." },
      { status: 429 }
    );
    response.headers.set("X-RateLimit-Remaining", "0");
    response.headers.set("Retry-After", String(Math.ceil(resetIn / 1000)));
    return response;
  }

  const apiKey =
    req.headers.get("x-api-key") || req.nextUrl.searchParams.get("x-api-key");
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API Key" }, { status: 401 });
  }

  try {
    const { driveService } = await getApiAuth(apiKey);
    const { tableId } = await params;
    const body = await req.json();

    const table = (await driveService.selectJsonContent(tableId)) as TableFile;

    // Validate request body
    const { validateDocument } = await import("@/lib/validation");
    const validation = validateDocument(body, table.schema);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    // Check Unique Constraints
    const { checkUniqueConstraint, updateIndex } = await import("@/lib/indexing");
    const { databaseId } = await params;

    const uniqueColumns = table.schema.filter((col) => col.unique);
    for (const col of uniqueColumns) {
      const val = validation.data[col.key];
      const check = await checkUniqueConstraint(
        databaseId, tableId, col.key, val, undefined, driveService, col.indexFileId
      );
      if (!check.safe) {
        return NextResponse.json(
          { error: `Unique constraint failed for field '${col.key}': ${check.error}` },
          { status: 409 }
        );
      }
    }

    const newDoc: RowData = {
      $id: crypto.randomUUID(),
      $createdAt: new Date().toISOString(),
      $updatedAt: new Date().toISOString(),
      ...validation.data,
    };

    table.documents.push(newDoc);
    await driveService.updateJsonContent(tableId, table);

    // Update Indexes
    let schemaUpdated = false;
    for (const col of uniqueColumns) {
      const val = newDoc[col.key];
      const newIndexFileId = await updateIndex(
        databaseId, tableId, col.key, undefined, val, newDoc.$id, driveService, col.indexFileId
      );
      if (newIndexFileId && newIndexFileId !== col.indexFileId) {
        col.indexFileId = newIndexFileId;
        schemaUpdated = true;
      }
    }

    if (schemaUpdated) {
      await driveService.updateJsonContent(tableId, table);
    }

    const response = NextResponse.json(newDoc, { status: 201 });
    response.headers.set("X-RateLimit-Remaining", String(remaining));
    return response;
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}