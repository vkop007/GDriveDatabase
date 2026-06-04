import { NextRequest, NextResponse } from "next/server";
import {
  externalApiErrorResponse,
  requireExternalApiAuth,
  requireExternalTable,
} from "@/lib/external-api";
import { RowData } from "@/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ databaseId: string; tableId: string }> }
) {
  const authResult = await requireExternalApiAuth(req);
  if ("response" in authResult) return authResult.response;

  try {
    const { databaseId, tableId } = await params;
    const tableResult = await requireExternalTable(
      authResult.auth,
      databaseId,
      tableId
    );
    if ("response" in tableResult) return tableResult.response;

    const { table } = tableResult;

    return NextResponse.json(table.documents || []);
  } catch (error) {
    return externalApiErrorResponse(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ databaseId: string; tableId: string }> }
) {
  const authResult = await requireExternalApiAuth(req);
  if ("response" in authResult) return authResult.response;

  try {
    const { driveService } = authResult.auth;
    const { databaseId, tableId } = await params;
    const body = await req.json();
    const tableResult = await requireExternalTable(
      authResult.auth,
      databaseId,
      tableId
    );
    if ("response" in tableResult) return tableResult.response;

    const { table } = tableResult;

    // Validate request body
    const { validateDocument } = await import("@/lib/validation");
    const validation = validateDocument(body, table.schema);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Check Unique Constraints
    const { checkUniqueConstraint, updateIndex } = await import(
      "@/lib/indexing"
    );
    // Check Unique Constraints (Optimized with indexFileId)
    const uniqueColumns = table.schema.filter((col) => col.unique);
    for (const col of uniqueColumns) {
      const val = validation.data[col.key];
      const check = await checkUniqueConstraint(
        databaseId,
        tableId,
        col.key,
        val,
        undefined, // excludeDocId
        driveService, // Pass driveService
        col.indexFileId // Pass indexFileId
      );
      if (!check.safe) {
        return NextResponse.json(
          {
            error: `Unique constraint failed for field '${col.key}': ${check.error}`,
          },
          { status: 409 }
        );
      }
    }

    const newDoc: RowData = {
      $id: crypto.randomUUID(),
      $createdAt: new Date().toISOString(),
      $updatedAt: new Date().toISOString(),
      ...validation.data, // Use validated (and coerced) data
    };

    table.documents.push(newDoc);

    await driveService.updateJsonContent(tableId, table);

    // Update Indexes
    let schemaUpdated = false;
    for (const col of uniqueColumns) {
      const val = newDoc[col.key];
      const newIndexFileId = await updateIndex(
        databaseId,
        tableId,
        col.key,
        undefined, // old value
        val, // new value
        newDoc.$id,
        driveService, // Pass driveService
        col.indexFileId // Pass indexFileId
      );

      if (newIndexFileId && newIndexFileId !== col.indexFileId) {
        col.indexFileId = newIndexFileId;
        schemaUpdated = true;
      }
    }

    if (schemaUpdated) {
      console.log("Schema updated with new index file IDs during POST");
      await driveService.updateJsonContent(tableId, table);
    }

    return NextResponse.json(newDoc, { status: 201 });
  } catch (error) {
    return externalApiErrorResponse(error);
  }
}
