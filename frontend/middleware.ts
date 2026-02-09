import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function extractTenantPath(pathname: string) {
  const match = pathname.match(/^\/t\/([^/]+)(\/.*)?$/);
  if (!match) return null;
  const slug = match[1];
  const rest = match[2] && match[2].length > 0 ? match[2] : "/";
  return { slug, rest };
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const tenantPath = extractTenantPath(pathname);
  if (!tenantPath) {
    return NextResponse.next();
  }

  if (tenantPath.rest.startsWith("/login") || tenantPath.rest.startsWith("/register")) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = tenantPath.rest === "/" ? "/dashboard" : tenantPath.rest;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/t/:slug/:path*"],
};
