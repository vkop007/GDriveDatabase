import { NextRequest, NextResponse } from "next/server";
import {
  externalApiErrorResponse,
  requireExternalApiAuth,
} from "@/lib/external-api";

export async function DELETE(request: NextRequest) {
  const authResult = await requireExternalApiAuth(request);
  if ("response" in authResult) return authResult.response;

  try {
    const { driveService } = authResult.auth;
    const body = await request.json();
    const { fileId } = body;

    if (!fileId) {
      return NextResponse.json(
        { error: "fileId is required" },
        { status: 400 }
      );
    }

    await driveService.deleteFile(fileId);

    const { revalidateTag } = await import("next/cache");
    revalidateTag("bucket-files", "max");

    return NextResponse.json({ success: true });
  } catch (error) {
    return externalApiErrorResponse(error);
  }
}
