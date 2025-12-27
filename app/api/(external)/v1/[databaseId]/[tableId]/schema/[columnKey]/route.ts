import { NextRequest, NextResponse } from "next/server";
import { getApiAuth } from "@/app/actions";
import { TableFile } from "@/types";

// PATCH - Update a specific column
export async function PATCH(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ databaseId: string; tableId: string; columnKey: string }>;
  }
) {
  const apiKey =
    req.headers.get("x-api-key") || req.nextUrl.searchParams.get("x-api-key");
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API Key" }, { status: 401 });
  }

  try {
    const { driveService } = await getApiAuth(apiKey);
    const { tableId, columnKey } = await params;
    const body = await req.json();

    // Can't modify system columns
    if (columnKey.startsWith("$")) {
      return NextResponse.json(
        { error: "Cannot modify system columns" },
        { status: 400 }
      );
    }

    const table = (await driveService.selectJsonContent(tableId)) as TableFile;

    const columnIndex = table.schema.findIndex((c) => c.key === columnKey);
    if (columnIndex === -1) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 });
    }

    // Update column properties (but not the key)
    const existingColumn = table.schema[columnIndex];
    const updatedColumn = {
      ...existingColumn,
      ...body,
      key: columnKey, // Ensure key is not changed
    };

    table.schema[columnIndex] = updatedColumn;

    await driveService.updateJsonContent(tableId, table);

    return NextResponse.json({ column: updatedColumn });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a specific column
export async function DELETE(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ databaseId: string; tableId: string; columnKey: string }>;
  }
) {
  const apiKey =
    req.headers.get("x-api-key") || req.nextUrl.searchParams.get("x-api-key");
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API Key" }, { status: 401 });
  }

  try {
    const { driveService } = await getApiAuth(apiKey);
    const { tableId, columnKey } = await params;

    // Can't delete system columns
    if (columnKey.startsWith("$")) {
      return NextResponse.json(
        { error: "Cannot delete system columns" },
        { status: 400 }
      );
    }

    const table = (await driveService.selectJsonContent(tableId)) as TableFile;

    const columnIndex = table.schema.findIndex((c) => c.key === columnKey);
    if (columnIndex === -1) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 });
    }

    // Remove column from schema
    table.schema = table.schema.filter((c) => c.key !== columnKey);

    // Remove the key from all existing documents
    table.documents.forEach((doc) => {
      delete doc[columnKey];
    });

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
