import { NextRequest, NextResponse } from "next/server";
import {
  externalApiErrorResponse,
  requireExternalApiAuth,
} from "@/lib/external-api";
import { getOrCreateBucketFolder } from "@/lib/gdrive/bucket-service";
import { operations, initDriveService } from "gdrivekit";

type DriveFile = {
  createdTime?: string;
  id?: string;
  mimeType?: string;
  modifiedTime?: string;
  name?: string;
  size?: string;
  thumbnailLink?: string;
  webContentLink?: string;
  webViewLink?: string;
};

export async function GET(request: NextRequest) {
  const authResult = await requireExternalApiAuth(request);
  if ("response" in authResult) return authResult.response;

  try {
    const apiAuth = authResult.auth;

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
    const files = (response.data?.files || []) as DriveFile[];

    // Filter for media/document files only (not folders)
    const bucketFiles = files.filter(
      (f) => f.mimeType !== "application/vnd.google-apps.folder"
    );

    return NextResponse.json({
      success: true,
      files: bucketFiles.map((f) => ({
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
    return externalApiErrorResponse(error);
  }
}
