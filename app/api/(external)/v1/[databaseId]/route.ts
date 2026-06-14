import { NextRequest, NextResponse } from "next/server";
import {
  externalApiErrorResponse,
  requireExternalApiAuth,
} from "@/lib/external-api";
import { operations } from "gdrivekit";
import { DriveFile, TableFile, ColumnDefinition } from "@/types";
import { createFileInFolder } from "@/lib/gdrive/operations";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ databaseId: string }> }
) {
  const authResult = await requireExternalApiAuth(req);
  if ("response" in authResult) return authResult.response;

  try {
    const { databaseId } = await params;

    const listResponse = await operations.listOperations.listFilesInFolder(
      databaseId
    );

    if (!listResponse.success) {
      return NextResponse.json(
        { error: listResponse.error || "Failed to list tables in Google Drive" },
        { status: 500 }
      );
    }

    const files = (listResponse.data?.files ?? []) as DriveFile[];

    // Filter for JSON files, as tables are stored as JSON files
    const tables = files
      .filter((file) => !file.trashed && file.mimeType === "application/json")
      .map((file) => ({
        id: file.id,
        name: file.name,
      }));

    return NextResponse.json(tables);
  } catch (error) {
    return externalApiErrorResponse(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ databaseId: string }> }
) {
  const authResult = await requireExternalApiAuth(req);
  if ("response" in authResult) return authResult.response;

  try {
    const { driveService } = authResult.auth;
    const { databaseId } = await params;
    const body = await req.json();
    const { name, schema } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Table name is required" },
        { status: 400 }
      );
    }

    // Default schema if not provided
    const defaultSchema: ColumnDefinition[] = [
      { key: "$id", type: "string", required: true },
      { key: "$createdAt", type: "datetime", required: true },
      { key: "$updatedAt", type: "datetime", required: true },
    ];

    // Merge or use schema if provided
    let finalSchema = defaultSchema;
    if (schema && Array.isArray(schema)) {
      const systemFields = ["$id", "$createdAt", "$updatedAt"];
      const userSchema = schema.filter((col: any) => !systemFields.includes(col.key));
      finalSchema = [...defaultSchema, ...userSchema];
    }

    const initialContent: TableFile = {
      name,
      schema: finalSchema,
      documents: [],
    };

    console.log(`[API] Creating table '${name}' in database '${databaseId}'...`);
    const result = await createFileInFolder(
      databaseId,
      name,
      initialContent,
      driveService
    );

    if (!result.success || !result.data?.id) {
      return NextResponse.json(
        { error: "Failed to create table in Google Drive" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        id: result.data.id,
        name,
        schema: finalSchema,
      },
      { status: 201 }
    );
  } catch (error) {
    return externalApiErrorResponse(error);
  }
}
