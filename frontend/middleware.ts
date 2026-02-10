import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const RESERVED_SEGMENTS = new Set([
  "_next",
  "api",
  "auth",
  "dashboard",
  "people",
  "settings",
  "admin",
  "login",
  "register",
  "t",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const legacyMatch = pathname.match(/^\/t\/([^/]+)\/?$/);
  if (legacyMatch) {
    const slug = legacyMatch[1];
    const url = req.nextUrl.clone();
    url.pathname = `/${slug}/dashboard`;
    return NextResponse.redirect(url);
  }

  const segments = pathname.split("/");
  const first = segments[1] ?? "";
  if (!first || RESERVED_SEGMENTS.has(first)) {
    return NextResponse.next();
  }
  if (segments.length === 2 || (segments.length === 3 && segments[2] === "")) {
    const url = req.nextUrl.clone();
    url.pathname = `/${first}/dashboard`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/t/:slug", "/t/:slug/", "/:slug", "/:slug/"],
};
