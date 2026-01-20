import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const adminPaths = ["/admin"];
const ownerPaths = ["/owner"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdminRoute = adminPaths.some((p) => pathname.startsWith(p));
  const isOwnerRoute = ownerPaths.some((p) => pathname.startsWith(p));

  if (!isAdminRoute && !isOwnerRoute) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.redirect(new URL("/signin", req.url));

  const role = token.role as string | undefined;

  if (isAdminRoute && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (isOwnerRoute && role !== "OWNER" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/owner/:path*"],
};
