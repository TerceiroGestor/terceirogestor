"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/Sidebar/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";

const AUTH_ROUTES = ["/auth/login", "/auth/register"];
const RESERVED_SEGMENTS = new Set([
  "",
  "_next",
  "api",
  "auth",
  "dashboard",
  "people",
  "settings",
  "admin",
  "t",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

function isTenantAuthRoute(pathname: string) {
  if (/^\/t\/[^/]+\/(login|register)/.test(pathname)) {
    return true;
  }
  const match = pathname.match(/^\/([^/]+)\/(login|register)/);
  if (!match) return false;
  const slug = match[1];
  return !RESERVED_SEGMENTS.has(slug);
}

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isAuthRoute =
    AUTH_ROUTES.some((route) => pathname?.startsWith(route)) ||
    (pathname ? isTenantAuthRoute(pathname) : false);

  if (!pathname || isAuthRoute || pathname === "/") {
    return <>{children}</>;
  }

  return (
    <>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        {children}
      </SidebarInset>
    </>
  );
}
