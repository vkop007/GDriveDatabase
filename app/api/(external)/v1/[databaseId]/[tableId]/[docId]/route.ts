import { NextRequest, NextResponse } from "next/server";
import { getApiAuth } from "@/app/actions";
import { TableFile, RowData } from "@/types";

// GET - Get single document by ID
export async function GET(
  req: NextRequest,
  {
    params,
  }: { params: Promise<{ databaseId: string; tableId: string; docId: string }> }
) {
  const apiKey =
    req.headers.get("x-api-key") || req.nextUrl.searchParams.get("x-api-key");
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API Key" }, { status: 401 });
  }

  try {
    const { driveService } = await getApiAuth(apiKey);
    const { tableId, docId } = await params;

    const table = (await driveService.selectJsonContent(tableId)) as TableFile;

    if (!table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    const doc = table.documents.find((d) => d.$id === docId);

    if (!doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(doc);
  } catch (error) {
    console.error("API Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PATCH - Update single document
export async function PATCH(
  req: NextRequest,
  {
    params,
  }: { params: Promise<{ databaseId: string; tableId: string; docId: string }> }
) {
  const apiKey =
    req.headers.get("x-api-key") || req.nextUrl.searchParams.get("x-api-key");
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API Key" }, { status: 401 });
  }

  try {
    const { driveService } = await getApiAuth(apiKey);
    const { tableId, docId } = await params;
    const body = await req.json();

    const table = (await driveService.selectJsonContent(tableId)) as TableFile;

    if (!table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    const docIndex = table.documents.findIndex((d) => d.$id === docId);

    if (docIndex === -1) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Validate request body
    const { validateDocument } = await import("@/lib/validation");
    // Merge existing doc with updates for validation to ensure required fields aren't missing if they aren't in the update
    // But for PATCH, we usually only validate fields that are present.
    // However, validateDocument validates the whole object against the schema.
    // So we should construct the potential new object and validate that.

    const potentialNewDoc = {
      ...table.documents[docIndex],
      ...body,
    };

    const validation = validateDocument(potentialNewDoc, table.schema);

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
    const { checkUniqueConstraint, updateIndex, deleteIndex } = await import(
      "@/lib/indexing"
    );
    const { databaseId } = await params;

    const uniqueColumns = table.schema.filter((col) => col.unique);
    const oldDoc = table.documents[docIndex];

    // Only check constraints for fields that are being changed
    // Only check constraints for fields that are being changed
    for (const col of uniqueColumns) {
      if (body[col.key] !== undefined && body[col.key] !== oldDoc[col.key]) {
        const val = validation.data[col.key];
        const check = await checkUniqueConstraint(
          databaseId,
          tableId,
          col.key,
          val,
          docId, // Exclude self
          driveService,
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
    }

    // Update document fields (preserve system fields)
    const updatedDoc: RowData = {
      ...validation.data, // Use validated data
      $id: docId, // Preserve $id (just in case validation messed with it, though it shouldn't)
      $createdAt: table.documents[docIndex].$createdAt, // Preserve createdAt
      $updatedAt: new Date().toISOString(), // Update timestamp
    };

    table.documents[docIndex] = updatedDoc;

    await driveService.updateJsonContent(tableId, table);

    // Update Indexes
    let schemaUpdated = false;
    for (const col of uniqueColumns) {
      const newVal = updatedDoc[col.key];
      const oldVal = oldDoc[col.key]; // Use captured oldDoc

      if (newVal !== oldVal) {
        const newIndexFileId = await updateIndex(
          databaseId,
          tableId,
          col.key,
          oldVal,
          newVal,
          docId,
          driveService,
          col.indexFileId
        );

        if (newIndexFileId && newIndexFileId !== col.indexFileId) {
          col.indexFileId = newIndexFileId;
          schemaUpdated = true;
        }
      }
    }

    if (schemaUpdated) {
      await driveService.updateJsonContent(tableId, table);
    }

    return NextResponse.json(updatedDoc);
  } catch (error) {
    console.error("API Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE - Delete single document
export async function DELETE(
  req: NextRequest,
  {
    params,
  }: { params: Promise<{ databaseId: string; tableId: string; docId: string }> }
) {
  const apiKey =
    req.headers.get("x-api-key") || req.nextUrl.searchParams.get("x-api-key");
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API Key" }, { status: 401 });
  }

  try {
    const { driveService } = await getApiAuth(apiKey);
    const { databaseId, tableId, docId } = await params;

    const table = (await driveService.selectJsonContent(tableId)) as TableFile;

    if (!table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    const docIndex = table.documents.findIndex((d) => d.$id === docId);

    if (docIndex === -1) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const docToDelete = table.documents[docIndex];
    const { updateIndex } = await import("@/lib/indexing");

    // Remove the document
    table.documents.splice(docIndex, 1);

    // Cleanup indexes for unique columns
    const uniqueColumns = table.schema.filter((col) => col.unique);
    for (const col of uniqueColumns) {
      await updateIndex(
        databaseId,
        tableId,
        col.key,
        docToDelete[col.key], // old value
        undefined, // new value (undefined means remove)
        docId,
        driveService,
        col.indexFileId
      );
    }

    const updateResult = await driveService.updateJsonContent(tableId, table);

    if (!updateResult.success) {
      return NextResponse.json(
        { error: `Failed to delete: ${updateResult.error}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, deletedId: docId });
  } catch (error) {
    console.error("API Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
