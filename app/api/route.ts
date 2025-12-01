import { NextRequest, NextResponse } from "next/server";
import { operations, initDriveService } from "gdrivekit";
export async function GET(request: NextRequest) {
  initDriveService();
  const drive = await operations.listFiles();
  console.log(drive.data.files);
  return NextResponse.json(drive.data.files);
}
