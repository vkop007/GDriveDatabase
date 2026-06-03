import { NextRequest, NextResponse } from "next/server";
import {
  externalApiErrorResponse,
  requireExternalApiAuth,
  requireExternalTable,
} from "@/lib/external-api";
import { RowData } from "@/types";

// GET - Get single document by ID
export async function GET(
  req: NextRequest,
  {
    params,
  }: { params: Promise<{ databaseId: string; tableId: string; docId: string }> }
) {
  const authResult = await requireExternalApiAuth(req);
  if ("response" in authResult) return authResult.response;

  try {
    const { databaseId, tableId, docId } = await params;
    const tableResult = await requireExternalTable(
      authResult.auth,
      databaseId,
      tableId
    );
    if ("response" in tableResult) return tableResult.response;

    const { table } = tableResult;

    const doc = table.documents.find((d) => d.$id === docId);

    if (!doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(doc);
  } catch (error) {
    return externalApiErrorResponse(error);
  }
}

// PATCH - Update single document
export async function PATCH(
  req: NextRequest,
  {
    params,
  }: { params: Promise<{ databaseId: string; tableId: string; docId: string }> }
) {
  const authResult = await requireExternalApiAuth(req);
  if ("response" in authResult) return authResult.response;

  try {
    const { driveService } = authResult.auth;
    const { databaseId, tableId, docId } = await params;
    const body = await req.json();
    const tableResult = await requireExternalTable(
      authResult.auth,
      databaseId,
      tableId
    );
    if ("response" in tableResult) return tableResult.response;

    const { table } = tableResult;

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
    const { checkUniqueConstraint, updateIndex } = await import(
      "@/lib/indexing"
    );
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
    return externalApiErrorResponse(error);
  }
}

// DELETE - Delete single document
export async function DELETE(
  req: NextRequest,
  {
    params,
  }: { params: Promise<{ databaseId: string; tableId: string; docId: string }> }
) {
  const authResult = await requireExternalApiAuth(req);
  if ("response" in authResult) return authResult.response;

  try {
    const { driveService } = authResult.auth;
    const { databaseId, tableId, docId } = await params;
    const tableResult = await requireExternalTable(
      authResult.auth,
      databaseId,
      tableId
    );
    if ("response" in tableResult) return tableResult.response;

    const { table } = tableResult;

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
    return externalApiErrorResponse(error);
  }
}
