import { NextRequest, NextResponse } from "next/server";
import {
  externalApiErrorResponse,
  requireExternalApiAuth,
} from "@/lib/external-api";
import { TableFile, ColumnDefinition } from "@/types";
import { rebuildIndex } from "@/lib/indexing";

// GET - Get table schema
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ databaseId: string; tableId: string }> }
) {
  const authResult = await requireExternalApiAuth(req);
  if ("response" in authResult) return authResult.response;

  try {
    const { driveService } = authResult.auth;
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
    return externalApiErrorResponse(error);
  }
}

// POST - Add a new column to the schema
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

    const {
      key,
      type,
      required = false,
      array = false,
      default: defaultValue,
      relationTableId,
      validation,
      unique = false,
      indexed = false,
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
      unique,
      indexed,
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

    // If unique, build the index
    if (unique) {
      try {
        const indexFileId = await rebuildIndex(
          databaseId,
          tableId,
          key,
          table.documents,
          driveService
        );
        newColumn.indexFileId = indexFileId;

        // Save table again to persist the indexFileId
        await driveService.updateJsonContent(tableId, table);
      } catch (e) {
        console.error("Failed to build index for new column:", e);
        // We don't fail the request, but log it.
        // Ideally we might want to return a warning or revert.
      }
    }

    return NextResponse.json({ column: newColumn }, { status: 201 });
  } catch (error) {
    return externalApiErrorResponse(error);
  }
}

// PUT - Replace entire schema (non-system columns)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ databaseId: string; tableId: string }> }
) {
  const authResult = await requireExternalApiAuth(req);
  if ("response" in authResult) return authResult.response;

  try {
    const { driveService } = authResult.auth;
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
    return externalApiErrorResponse(error);
  }
}
