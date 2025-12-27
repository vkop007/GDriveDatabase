import { NextRequest, NextResponse } from "next/server";
import { getApiAuth } from "@/app/actions";

export async function DELETE(request: NextRequest) {
  const apiKey =
    request.headers.get("x-api-key") ||
    request.nextUrl.searchParams.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json({ error: "Missing API Key" }, { status: 401 });
  }

  try {
    const { driveService } = await getApiAuth(apiKey);
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
    console.error("API Delete Bucket File Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
