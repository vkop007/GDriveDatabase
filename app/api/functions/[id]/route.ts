import { NextRequest, NextResponse } from "next/server";
import {
  externalApiErrorResponse,
  requireExternalApiAuth,
  externalApiError,
} from "@/lib/external-api";
import { getFunction } from "@/app/actions/function";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireExternalApiAuth(req);
  if ("response" in authResult) return authResult.response;

  try {
    const { id } = await params;
    const func = await getFunction(id, authResult.auth);

    if (!func) {
      return externalApiError("Function not found.", 404, "function_not_found");
    }

    return NextResponse.json(func);
  } catch (error) {
    return externalApiErrorResponse(error);
  }
}
