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

    // Update document fields (preserve system fields)
    const updatedDoc: RowData = {
      ...table.documents[docIndex],
      ...body,
      $id: docId, // Preserve $id
      $createdAt: table.documents[docIndex].$createdAt, // Preserve createdAt
      $updatedAt: new Date().toISOString(), // Update timestamp
    };

    table.documents[docIndex] = updatedDoc;

    const updateResult = await driveService.updateJsonContent(tableId, table);

    if (!updateResult.success) {
      return NextResponse.json(
        { error: `Failed to update: ${updateResult.error}` },
        { status: 500 }
      );
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
    const { tableId, docId } = await params;

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

    // Remove the document
    table.documents.splice(docIndex, 1);

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
