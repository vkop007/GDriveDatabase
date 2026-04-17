import { NextRequest, NextResponse } from "next/server";
import { getApiAuth } from "@/app/actions";
import { TableFile } from "@/types";
import { processQuery } from "@/lib/query-processor";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ databaseId: string; tableId: string }> }
) {
  const apiKey = req.headers.get("x-api-key") || req.nextUrl.searchParams.get("x-api-key");
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API Key" }, { status: 401 });
  }

  try {
    const { driveService } = await getApiAuth(apiKey);
    const { tableId } = await params;
    const sp = req.nextUrl.searchParams;

    const table = (await driveService.selectJsonContent(tableId)) as TableFile;
    if (!table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    const { data, total, hasMore } = processQuery(
      table.documents || [],
      { filters: sp.get('filter') || undefined, sort: sp.get('sort') || undefined, limit: sp.get('limit') || undefined, offset: sp.get('offset') || undefined }
    );

    return NextResponse.json({ data, pagination: { total, limit: parseInt(sp.get('limit') || '50'), offset: parseInt(sp.get('offset') || '0'), hasMore } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ databaseId: string; tableId: string }> }
) {
  const apiKey = req.headers.get("x-api-key") || req.nextUrl.searchParams.get("x-api-key");
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API Key" }, { status: 401 });
  }

  try {
    const { driveService } = await getApiAuth(apiKey);
    const { tableId } = await params;
    const body = await req.json();
    const table = (await driveService.selectJsonContent(tableId)) as TableFile;

    const { validateDocument } = await import("@/lib/validation");
    const validation = validateDocument(body, table.schema);
    if (!validation.success) {
      return NextResponse.json({ error: "Validation failed", details: validation.errors }, { status: 400 });
    }

    const { checkUniqueConstraint, updateIndex } = await import("@/lib/indexing");
    const { databaseId } = await params;
    for (const col of table.schema.filter(c => c.unique)) {
      const check = await checkUniqueConstraint(databaseId, tableId, col.key, validation.data[col.key], undefined, driveService, col.indexFileId);
      if (!check.safe) {
        return NextResponse.json({ error: `Unique constraint failed for '${col.key}'` }, { status: 409 });
      }
    }

    const newDoc = { $id: crypto.randomUUID(), $createdAt: new Date().toISOString(), $updatedAt: new Date().toISOString(), ...validation.data };
    table.documents.push(newDoc);
    await driveService.updateJsonContent(tableId, table);

    for (const col of table.schema.filter(c => c.unique)) {
      const newIndexFileId = await updateIndex(databaseId, tableId, col.key, undefined, newDoc[col.key], newDoc.$id, driveService, col.indexFileId);
      if (newIndexFileId && newIndexFileId !== col.indexFileId) {
        col.indexFileId = newIndexFileId;
        await driveService.updateJsonContent(tableId, table);
      }
    }

    return NextResponse.json(newDoc, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 500 });
  }
}