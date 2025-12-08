import { NextRequest, NextResponse } from "next/server";

import { fetchWithAuth } from "../../../lib/gdrive/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get("id");

  if (!fileId) {
    return NextResponse.json({ error: "Missing file ID" }, { status: 400 });
  }

  try {
    const apiUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const resourceRes = await fetchWithAuth(apiUrl);

    if (!resourceRes || !resourceRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch resource" },
        { status: resourceRes?.status || 500 }
      );
    }

    const arrayBuffer = await resourceRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          resourceRes.headers.get("content-type") || "application/octet-stream",
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Resource fetch error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
