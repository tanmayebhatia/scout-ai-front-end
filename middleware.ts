import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip authentication for auth-related paths and static assets
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes("favicon") ||
    pathname.includes("_next") ||
    pathname.includes("public")
  ) {
    return NextResponse.next()
  }

  // Check if we're running in v0 environment
  const isV0Environment = detectV0Environment(request)

  // Bypass authentication in v0 environment
  if (isV0Environment) {
    console.log("Running in v0 environment - bypassing authentication")
    return NextResponse.next()
  }

  // Normal authentication flow for production
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // If user is not authenticated, redirect to sign-in page
  if (!token) {
    const signInUrl = new URL("/auth/signin", request.url)
    signInUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

// Function to detect if we're running in v0 environment
function detectV0Environment(request: NextRequest): boolean {
  // Check for v0 specific characteristics

  // Method 1: Check for v0 specific headers or cookies
  const hasV0Headers = request.headers.has("x-vercel-v0") || request.cookies.has("v0-environment")

  // Method 2: Check for localhost or preview domains that v0 uses
  const hostname = request.headers.get("host") || ""
  const isV0Domain = hostname.includes("v0.dev") || hostname.includes("localhost") || hostname.includes("127.0.0.1")

  // Method 3: Check for v0 specific environment variable
  // This requires setting a specific environment variable in v0
  const hasV0EnvVar = process.env.IS_V0_ENVIRONMENT === "true"

  // Method 4: Check if window object exists (browser environment)
  // This is a bit hacky but can help detect browser-based environments like v0
  const isBrowserEnv = typeof window !== "undefined"

  // Return true if any of the v0 detection methods are positive
  return hasV0Headers || isV0Domain || hasV0EnvVar || isBrowserEnv
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
