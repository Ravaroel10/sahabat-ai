import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Specify protected and public routes
const protectedRoutes = ["/chat"];
const authRoutes = ["/sign-in", "/sign-up"];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const sessionCookie = getSessionCookie(request);

  // Check if the current route is protected or auth-only
  const isProtectedRoute = protectedRoutes.some((route) =>
    path.startsWith(route)
  );
  const isAuthRoute = authRoutes.includes(path);

  // Redirect authenticated users away from auth pages
  if (sessionCookie && isAuthRoute) {
    return NextResponse.redirect(new URL("/chat", request.url));
  }

  // Redirect unauthenticated users to sign in
  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

// Routes proxy should run on
export const config = {
  matcher: ["/chat", "/sign-in", "/sign-up"],
};
