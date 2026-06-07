import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Google app sign-in has been removed. Use email and password." },
    { status: 410 }
  );
}
