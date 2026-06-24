import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require a logged-in user
const PROTECTED_PREFIXES = ["/dashboard"];

// Routes only accessible when NOT logged in
const AUTH_ROUTES = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read the auth token persisted by Zustand in localStorage.
  // Zustand persist stores the whole state as JSON under the key "convosum-auth".
  // We access it via the cookie-equivalent: the Next.js cookies API reads
  // server-side cookies, but Zustand uses localStorage (client-only).
  // The recommended pattern for App Router is to store the token in an
  // HttpOnly cookie on login so middleware can read it.
  // For now we use a lightweight signed-cookie approach:
  const token = request.cookies.get("convosum_token")?.value ?? null;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_ROUTES.some((p) => pathname.startsWith(p));

  // Unauthenticated user trying to access a protected page → redirect to login
  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user trying to visit login/register → redirect to dashboard
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except Next.js internals and static files
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
