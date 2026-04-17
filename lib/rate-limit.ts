// Rate Limit Middleware for API Routes
// Issue #76: Add API rate limiting

import { NextRequest, NextResponse } from "next/server";

// In-memory store (use Redis for production/serverless)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT = 100; // requests
const WINDOW_MS = 60 * 1000; // 1 minute

function getClientKey(req: NextRequest): string {
  const apiKey = req.headers.get("x-api-key") || 
                 req.headers.get("authorization")?.replace("Bearer ", "") ||
                 "anonymous";
  return apiKey;
}

export async function checkRateLimit(req: NextRequest): Promise<{ 
  success: boolean; 
  remaining: number;
  resetIn: number;
}> {
  const key = getClientKey(req);
  const now = Date.now();
  
  let client = rateLimitStore.get(key);
  
  if (!client || now > client.resetTime) {
    client = { count: 0, resetTime: now + WINDOW_MS };
    rateLimitStore.set(key, client);
  }
  
  client.count++;
  
  const remaining = Math.max(0, RATE_LIMIT - client.count);
  const resetIn = Math.max(0, client.resetTime - now);
  
  if (client.count > RATE_LIMIT) {
    return { success: false, remaining: 0, resetIn };
  }
  
  return { success: true, remaining, resetIn };
}

export function applyRateLimit(req: NextRequest): NextResponse | null {
  const { success, remaining, resetIn } = checkRateLimit(req);
  
  if (!success) {
    const response = NextResponse.json(
      { 
        error: "RATE_LIMITED",
        message: "Too many requests. Please try again later.",
        retryAfter: Math.ceil(resetIn / 1000)
      },
      { status: 429 }
    );
    
    response.headers.set("X-RateLimit-Limit", String(RATE_LIMIT));
    response.headers.set("X-RateLimit-Remaining", "0");
    response.headers.set("Retry-After", String(Math.ceil(resetIn / 1000)));
    
    return response;
  }
  
  return null;
}

// Example usage in a route:
// export async function GET(req: NextRequest) {
//   const rateLimitResponse = applyRateLimit(req);
//   if (rateLimitResponse) return rateLimitResponse;
//   
//   // ... your route logic
// }