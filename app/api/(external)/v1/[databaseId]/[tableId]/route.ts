import { NextRequest, NextResponse } from "next/server";
import { getApiAuth } from "@/app/actions";
import { TableFile } from "@/types";
import { checkRateLimit } from "@/lib/rate-limit";
import { processQuery } from "@/lib/query-processor";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ databaseId: string; tableId: string }> }
) {
  // Apply rate limiting
  const { success: rateOk, remaining, resetIn } = checkRateLimit(req);
  if (!rateOk) {
    return NextResponse.json(
      { error: "RATE_LIMITED", message: "Too many requests" },
      { status: 429 }
    );
  }

  const apiKey = req.headers.get("x-api-key") || req.nextUrl.searchParams.get("x-api-key");
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API Key" }, { status: 401 });
  }

  try {
    const { driveService } = await getApiAuth(apiKey);
    const { tableId } = await params;

    // Parse query parameters for server-side filtering
    const searchParams = req.nextUrl.searchParams;
    const queryParams = {
      filters: searchParams.get('filter') || undefined,
      sort: searchParams.get('sort') || undefined,
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
    };

    const table = (await driveService.selectJsonContent(tableId)) as TableFile;

    if (!table) {
      return NextResponse.json({ error: "Table not found or empty" }, { status: 404 });
    }

    // Apply server-side query processing (filter, sort, pagination)
    const { data, total, hasMore } = processQuery(
      table.documents || [],
      queryParams
    );

    const response = NextResponse.json({
      data,
      pagination: {
        total,
        limit: parseInt(queryParams.limit || '50'),
        offset: parseInt(queryParams.offset || '0'),
        hasMore
      }
    });

    response.headers.set("X-RateLimit-Remaining", String(remaining));
    response.headers.set("X-Total-Count", String(total));
    return response;
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ databaseId: string; tableId: string }> }
) {
  // Rate limiting check
  const { success: rateOk, remaining, resetIn } = checkRateLimit(req);
  if (!rateOk) {
    return NextResponse.json(
      { error: "RATE_LIMITED", message: "Too many requests" },
      { status: 429 }
    );
  }

  const apiKey = req.headers.get("x-api-key") || req.nextUrl.searchParams.get("x-api-key");
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

    // Check unique constraints
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
          { error: `Unique constraint failed for '${col.key}': ${check.error}` },
          { status: 409 }
        );
      }
    }

    const newDoc = {
      $id: crypto.randomUUID(),
      $createdAt: new Date().toISOString(),
      $updatedAt: new Date().toISOString(),
      ...validation.data,
    };

    table.documents.push(newDoc);
    await driveService.updateJsonContent(tableId, table);

    // Update indexes
    let schemaUpdated = false;
    for (const col of uniqueColumns) {
      const newIndexFileId = await updateIndex(
        databaseId, tableId, col.key, undefined, newDoc[col.key], newDoc.$id, driveService, col.indexFileId
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