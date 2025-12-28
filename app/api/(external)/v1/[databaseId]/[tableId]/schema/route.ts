import { NextRequest, NextResponse } from "next/server";
import { getApiAuth } from "@/app/actions";
import { TableFile, ColumnDefinition } from "@/types";

// GET - Get table schema
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

    const table = (await driveService.selectJsonContent(tableId)) as TableFile;

    if (!table) {
      return NextResponse.json(
        { error: "Table not found or empty" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      schema: table.schema || [],
    });
  } catch (error) {
    console.error("API Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// POST - Add a new column to the schema
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

    const {
      key,
      type,
      required = false,
      array = false,
      default: defaultValue,
      relationTableId,
      validation,
    } = body;

    if (!key || !type) {
      return NextResponse.json(
        { error: "Missing required fields: key, type" },
        { status: 400 }
      );
    }

    // Validate key doesn't start with $
    if (key.startsWith("$")) {
      return NextResponse.json(
        { error: "Column key cannot start with $" },
        { status: 400 }
      );
    }

    const table = (await driveService.selectJsonContent(tableId)) as TableFile;

    // Check if column already exists
    if (table.schema.some((c) => c.key === key)) {
      return NextResponse.json(
        { error: "Column already exists" },
        { status: 409 }
      );
    }

    const newColumn: ColumnDefinition = {
      key,
      type,
      required,
      array,
      default: defaultValue,
      relationTableId: type === "relation" ? relationTableId : undefined,
      validation,
    };

    table.schema.push(newColumn);

    // Add default value to existing documents if provided
    if (defaultValue !== undefined) {
      table.documents.forEach((doc) => {
        if (doc[key] === undefined) {
          doc[key] = defaultValue;
        }
      });
    }

    await driveService.updateJsonContent(tableId, table);

    return NextResponse.json({ column: newColumn }, { status: 201 });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PUT - Replace entire schema (non-system columns)
export async function PUT(
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

    const { columns } = body;

    if (!columns || !Array.isArray(columns)) {
      return NextResponse.json(
        { error: "Missing columns array" },
        { status: 400 }
      );
    }

    // Validate columns don't have system keys
    for (const col of columns) {
      if (col.key.startsWith("$")) {
        return NextResponse.json(
          { error: `Column key '${col.key}' cannot start with $` },
          { status: 400 }
        );
      }
    }

    let table = (await driveService.selectJsonContent(
      tableId
    )) as TableFile | null;

    // If table is null or doesn't have proper structure, initialize it
    if (!table || !table.schema) {
      // Initialize with default system columns
      const defaultSchema: ColumnDefinition[] = [
        { key: "$id", type: "string", required: true },
        { key: "$createdAt", type: "datetime", required: true },
        { key: "$updatedAt", type: "datetime", required: true },
      ];

      table = {
        name: "Table",
        schema: [...defaultSchema, ...columns],
        documents: [],
      };
    } else {
      // Keep system columns, replace user columns
      const systemColumns = table.schema.filter((c) => c.key.startsWith("$"));
      table.schema = [...systemColumns, ...columns];
    }

    const updateResult = await driveService.updateJsonContent(tableId, table);

    if (!updateResult.success) {
      console.error("Failed to update table:", updateResult.error);
      return NextResponse.json(
        { error: `Failed to update table: ${updateResult.error}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ schema: table.schema });
  } catch (error) {
    console.error("API Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
