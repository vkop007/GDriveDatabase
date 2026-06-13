import { NextRequest, NextResponse } from "next/server";
import {
  externalApiErrorResponse,
  requireExternalApiAuth,
} from "@/lib/external-api";
import { listFunctions } from "@/app/actions/function";

export async function GET(req: NextRequest) {
  const authResult = await requireExternalApiAuth(req);
  if ("response" in authResult) return authResult.response;

  try {
    const functions = await listFunctions(authResult.auth);
    return NextResponse.json(functions || []);
  } catch (error) {
    return externalApiErrorResponse(error);
  }
}
