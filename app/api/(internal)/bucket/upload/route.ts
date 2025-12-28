import { NextRequest, NextResponse } from "next/server";
import { processAndUploadFiles } from "@/lib/gdrive/bucket-service";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided in 'files' field" },
        { status: 400 }
      );
    }

    const result = await processAndUploadFiles(files);

    // We don't revalidateTag here because API usage might not need immediate dashboard UI update,
    // or we can't trigger Next.js cache revalidation easily from API route without importing revalidateTag.
    // Actually we can import it.

    // Lazy import to avoid some edge cases? Nah standard import fine.
    const { revalidateTag } = await import("next/cache");
    revalidateTag("bucket-files", "max");

    return NextResponse.json({
      success: true,
      files: result.files,
    });
  } catch (error) {
    console.error("API Upload Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
