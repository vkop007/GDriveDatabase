import { NextRequest, NextResponse } from "next/server";
import { getApiAuth } from "@/app/actions";
import { getOrCreateBucketFolder } from "@/lib/gdrive/bucket-service";
import { writeFile, unlink, mkdir } from "fs/promises";
import path from "path";
import os from "os";

export async function POST(request: NextRequest) {
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

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided in 'files' field" },
        { status: 400 }
      );
    }

    // Get or create bucket folder
    const bucketId = await getOrCreateBucketFolder(auth);

    // Create temp directory for files
    const tempDir = path.join(
      os.tmpdir(),
      "gdrive-bucket-upload-" + Date.now()
    );
    await mkdir(tempDir, { recursive: true });

    const filePaths: string[] = [];
    const uploadedFiles: any[] = [];

    try {
      // Write files to temp directory
      for (const file of files) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filePath = path.join(tempDir, safeName);
        await writeFile(filePath, buffer);
        filePaths.push(filePath);
      }

      // Upload each file
      for (let i = 0; i < filePaths.length; i++) {
        const result = await apiAuth.driveService.uploadFile(
          filePaths[i],
          bucketId
        );
        if (result.data) {
          uploadedFiles.push({
            id: result.data.id,
            name: result.data.name,
            mimeType: result.data.mimeType,
          });
        }
      }

      const { revalidateTag } = await import("next/cache");
      revalidateTag("bucket-files", "max");

      return NextResponse.json({
        success: true,
        files: uploadedFiles,
      });
    } finally {
      // Clean up temp files
      for (const p of filePaths) {
        try {
          await unlink(p);
        } catch (e) {
          /* ignore */
        }
      }
    }
  } catch (error) {
    console.error("API Upload Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
