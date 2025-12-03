import { NextRequest, NextResponse } from "next/server";
import { getApiAuth } from "../../../../../actions";
import { TableFile } from "../../../../../../types";

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
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

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
    const docIndex = table.documents.findIndex((d) => d.$id === docId);

    if (docIndex === -1) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const updatedDoc = {
      ...table.documents[docIndex],
      ...body,
      $updatedAt: new Date().toISOString(),
      $id: docId, // Ensure ID doesn't change
    };

    table.documents[docIndex] = updatedDoc;

    await driveService.updateJsonContent(tableId, table);

    return NextResponse.json(updatedDoc);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

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
    const initialLength = table.documents.length;
    table.documents = table.documents.filter((d) => d.$id !== docId);

    if (table.documents.length === initialLength) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    await driveService.updateJsonContent(tableId, table);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
