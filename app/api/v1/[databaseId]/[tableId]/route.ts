import { NextRequest, NextResponse } from "next/server";
import { getApiAuth } from "../../../../actions";
import { TableFile, RowData } from "../../../../../types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ databaseId: string; tableId: string }> }
) {
  const apiKey =
    req.headers.get("x-api-key") || req.nextUrl.searchParams.get("x-api-key");
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API Key" }, { status: 401 });
  }

  try {
    const { driveService } = await getApiAuth(apiKey);
    const { tableId } = await params;

    // Fetch table content
    // We use selectJsonContent which returns the parsed JSON
    const table = (await driveService.selectJsonContent(tableId)) as TableFile;

    return NextResponse.json(table.documents);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ databaseId: string; tableId: string }> }
) {
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

    const newDoc: RowData = {
      $id: crypto.randomUUID(),
      $createdAt: new Date().toISOString(),
      $updatedAt: new Date().toISOString(),
      ...body,
    };

    // Basic validation
    for (const col of table.schema) {
      if (
        col.required &&
        newDoc[col.key] === undefined &&
        !col.key.startsWith("$")
      ) {
        // simple validation, maybe skip for now or just warn
      }
    }

    table.documents.push(newDoc);

    await driveService.updateJsonContent(tableId, table);

    return NextResponse.json(newDoc, { status: 201 });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
