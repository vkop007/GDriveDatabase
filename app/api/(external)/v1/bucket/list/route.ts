import { NextRequest, NextResponse } from "next/server";
import { getApiAuth } from "@/app/actions";
import { getOrCreateBucketFolder } from "@/lib/gdrive/bucket-service";
import { operations, initDriveService } from "gdrivekit";

export async function GET(request: NextRequest) {
  const apiKey =
    request.headers.get("x-api-key") ||
    request.nextUrl.searchParams.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json({ error: "Missing API Key" }, { status: 401 });
  }

  try {
    const apiAuth = await getApiAuth(apiKey);

    // Build auth object that getOrCreateBucketFolder expects
    const auth = {
      clientId: apiAuth.clientId,
      clientSecret: apiAuth.clientSecret,
      projectId: apiAuth.projectId,
      tokens: apiAuth.tokens,
    };

    // Initialize the drive service for operations
    initDriveService(
      {
        client_id: auth.clientId,
        client_secret: auth.clientSecret,
        project_id: auth.projectId,
        redirect_uris: [`${process.env.NEXT_PUBLIC_BASE_URL}/oauth2callback`],
      },
      auth.tokens
    );

    // Get or create bucket folder
    const bucketId = await getOrCreateBucketFolder(auth);

    // List files in bucket folder using operations
    const response = await operations.listOperations.listFilesInFolder(
      bucketId
    );
    const files = response.data?.files || [];

    // Filter for media/document files only (not folders)
    const bucketFiles = files.filter(
      (f: any) => f.mimeType !== "application/vnd.google-apps.folder"
    );

    return NextResponse.json({
      success: true,
      files: bucketFiles.map((f: any) => ({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        size: f.size,
        createdTime: f.createdTime,
        modifiedTime: f.modifiedTime,
        webViewLink: f.webViewLink,
        webContentLink: f.webContentLink,
        thumbnailLink: f.thumbnailLink,
      })),
    });
  } catch (error) {
    console.error("API List Bucket Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
