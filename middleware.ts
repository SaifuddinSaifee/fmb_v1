import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE_NAME, JWT_SECRET, type Role } from "@/lib/config";

const protectedPrefixes = ["/admin", "/cook", "/volunteer"];

const secretKey = new TextEncoder().encode(JWT_SECRET);

function isAuthorized(userRole: Role, requiredRole: Role) {
  return userRole === "admin" || userRole === requiredRole;
}

function redirectToLogin(request: NextRequest) {
  const nextUrl = request.nextUrl.pathname;
  return NextResponse.redirect(
    new URL(`/login?next=${encodeURIComponent(nextUrl)}`, request.url)
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const prefix = protectedPrefixes.find((p) => pathname.startsWith(p));

  if (!prefix) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return redirectToLogin(request);
  }

  try {
    const { payload } = await jwtVerify(token, secretKey);
    const role = payload.role as Role | undefined;

    if (!role) {
      return redirectToLogin(request);
    }

    const requiredRole = prefix.slice(1) as Role;
    if (!isAuthorized(role, requiredRole)) {
      return redirectToLogin(request);
    }

    return NextResponse.next();
  } catch {
    return redirectToLogin(request);
  }
}

export const config = {
  matcher: ["/admin/:path*", "/cook/:path*", "/volunteer/:path*"],
};
