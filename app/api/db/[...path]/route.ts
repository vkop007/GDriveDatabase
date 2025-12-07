import { NextRequest, NextResponse } from "next/server";
import { initDriveService, operations } from "gdrivekit";
import { cookies } from "next/headers";

// Helper to initialize drive service from cookies or headers
async function initService(req: NextRequest) {
  const cookieStore = await cookies();

  // Try cookies first
  let clientId = cookieStore.get("gdrive_client_id")?.value;
  let clientSecret = cookieStore.get("gdrive_client_secret")?.value;
  let projectId = cookieStore.get("gdrive_project_id")?.value;
  let tokensStr = cookieStore.get("gdrive_tokens")?.value;

  // If not in cookies, check headers
  if (!clientId) clientId = req.headers.get("x-gdrive-client-id") || undefined;
  if (!clientSecret)
    clientSecret = req.headers.get("x-gdrive-client-secret") || undefined;
  if (!projectId)
    projectId = req.headers.get("x-gdrive-project-id") || undefined;

  let tokens;
  if (tokensStr) {
    tokens = JSON.parse(tokensStr);
  } else {
    // Check for tokens in headers
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      // Construct a minimal token object
      tokens = {
        access_token: authHeader.split(" ")[1],
        // Refresh token might be needed for some ops, but let's try with just access token
        // If the user provides refresh token in header, use it
        refresh_token: req.headers.get("x-gdrive-refresh-token") || undefined,
        scope: "https://www.googleapis.com/auth/drive",
        token_type: "Bearer",
        expiry_date: Date.now() + 3600 * 1000, // Assume valid for now
      };
    }
  }

  if (!clientId || !clientSecret || !projectId || !tokens) {
    throw new Error("Missing credentials or tokens");
  }

  initDriveService(
    {
      client_id: clientId,
      client_secret: clientSecret,
      project_id: projectId,
      redirect_uris: ["http://localhost:3000/oauth2callback"],
    },
    tokens
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    await initService(req);
    const { path } = await params;
    const filename = path[path.length - 1]; // Assume last part is filename

    // Check if it's a file ID or name. For now assume name.
    // gdrivekit has getFileIdByName
    const fileIdRes = await operations.fileOperations.getFileIdByName(filename);

    if (!fileIdRes.success || !fileIdRes.fileId) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const data = await operations.jsonOperations.readJsonFileData(
      fileIdRes.fileId
    );
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    await initService(req);
    const { path } = await params;
    const filename = path[path.length - 1];
    const body = await req.json();

    // Check if file exists
    const fileIdRes = await operations.fileOperations.getFileIdByName(filename);

    if (fileIdRes.success && fileIdRes.fileId) {
      // Update
      // gdrivekit doesn't have a simple "overwrite JSON" function exposed in driveOperations?
      // It has updateJsonFieldAndValues.
      // Or we can use updateFile with media?
      // Let's use createJsonFile which might overwrite or create duplicate?
      // Google Drive allows duplicates. We should probably update if exists.
      // operations.updateFile(fileId, { ... })?

      // For NoSQL, usually POST is create, PUT is update.
      // But let's support upsert behavior or just create new if not exists.
      // If exists, we might want to append or merge?
      // For simplicity: Create new if not exists. If exists, return error or update?
      // Let's return error if exists for POST, use PUT for update.
      return NextResponse.json(
        { error: "File already exists. Use PUT to update." },
        { status: 409 }
      );
    } else {
      // Create
      const res = await operations.jsonOperations.createJsonFile(
        body,
        filename
      );
      return NextResponse.json(res);
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    await initService(req);
    const { path } = await params;
    const filename = path[path.length - 1];
    const body = await req.json();

    const fileIdRes = await operations.fileOperations.getFileIdByName(filename);

    if (!fileIdRes.success || !fileIdRes.fileId) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Update JSON content
    // We can use updateJsonFieldAndValues if body is partial?
    // Or just overwrite.
    // gdrivekit's updateJsonFieldAndValues takes (fileId, key, value).
    // If we want to replace the whole content, we might need a different approach.
    // operations.createJsonFile might not support overwriting by ID.

    // We can delete and recreate? That changes ID.
    // We can use the underlying drive service to update media.
    // But sticking to gdrivekit operations:
    // Maybe we iterate keys and update?

    // Actually, let's look at operations.d.ts again.
    // updateFile(fileId, metadata, media?)
    // But updateFile in d.ts only takes metadata?
    // export declare function updateFile(fileId: string, metadata: any, media?: any): Promise<any>;
    // If it takes media, we can pass the JSON string.

    // Let's try updateFile.
    // We need to convert body to string/stream?
    // gdrivekit usually handles this.

    // For now, let's just implement DELETE and CREATE (replace) which is inefficient but works.
    await operations.fileOperations.deleteFile(fileIdRes.fileId);
    const res = await operations.jsonOperations.createJsonFile(body, filename);
    return NextResponse.json(res);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    await initService(req);
    const { path } = await params;
    const filename = path[path.length - 1];

    const fileIdRes = await operations.fileOperations.getFileIdByName(filename);

    if (!fileIdRes.success || !fileIdRes.fileId) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    await operations.fileOperations.deleteFile(fileIdRes.fileId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
