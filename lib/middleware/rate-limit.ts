// Rate Limiting Middleware
// Issue #76: Add API rate limiting

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Simple in-memory rate limiter (for serverless, use Redis in production)
const rateLimits = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 100; // 100 requests per minute

export async function rateLimit(request: NextRequest): Promise<{ allowed: boolean; remaining: number }> {
  // Get API key from header or cookie
  const apiKey = request.headers.get("x-api-key") || 
                 request.cookies.get("api-key")?.value ||
                 "anonymous";

  const now = Date.now();
  const key = `${apiKey}:${request.ip || "default"}`;

  let limit = rateLimits.get(key);

  if (!limit || now > limit.resetTime) {
    // Reset or create new limit
    rateLimits.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (limit.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  limit.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - limit.count };
}

export function withRateLimit(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async function (request: NextRequest): Promise<NextResponse> {
    const { allowed, remaining } = await rateLimit(request);

    if (!allowed) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Too many requests. Please try again later.",
            retryAfter: 60
          }
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(RATE_LIMIT_WINDOW),
            "Retry-After": "60"
          }
        }
      );
    }

    const response = await handler(request);
    
    // Add rate limit headers
    response.headers.set("X-RateLimit-Limit", String(RATE_LIMIT_MAX));
    response.headers.set("X-RateLimit-Remaining", String(remaining));
    
    return response;
  };
}