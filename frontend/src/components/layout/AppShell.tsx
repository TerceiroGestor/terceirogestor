"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/Sidebar/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { UsageDocumentationProvider } from "@/components/UsageDocumentation/UsageDocumentationProvider";
import { ControlPanelShell } from "@/web-client/control-panel/ControlPanelShell";

const AUTH_ROUTES = ["/auth/login", "/auth/register"];
const PUBLIC_ROUTES = ["/register"];
const TENANT_AUTH_SEGMENTS = new Set([
  "login",
  "register",
  "forgot-password",
  "reset-password",
]);
const RESERVED_SEGMENTS = new Set([
  "",
  "_next",
  "api",
  "auth",
  "dashboard",
  "people",
  "person",
  "settings",
  "admin",
  "t",
  // PWA/static app resources (must not be treated as tenant slugs)
  "manifest.webmanifest",
  "sw.js",
  "icon.png",
  "pwa",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

function isTenantAuthRoute(pathname: string) {
  if (/^\/t\/[^/]+\/(login|register|forgot-password|reset-password)/.test(pathname)) {
    return true;
  }
  const match = pathname.match(
    /^\/([^/]+)\/(login|register|forgot-password|reset-password)/,
  );
  if (!match) return false;
  const slug = match[1];
  const segment = match[2];
  return !RESERVED_SEGMENTS.has(slug) && TENANT_AUTH_SEGMENTS.has(segment);
}

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isAuthRoute =
    AUTH_ROUTES.some((route) => pathname?.startsWith(route)) ||
    PUBLIC_ROUTES.some((route) => pathname?.startsWith(route)) ||
    (pathname ? isTenantAuthRoute(pathname) : false);

  if (!pathname || isAuthRoute || pathname === "/") {
    return <>{children}</>;
  }

  return (
    <>
      <AppSidebar />
      <SidebarInset>
        <div className="sticky top-0 z-30">
          <AppHeader />
          <ControlPanelShell />
        </div>
        <UsageDocumentationProvider>
          <div className="min-w-0 flex-1 px-3 py-4 sm:px-0 sm:py-0">
            {children}
          </div>
        </UsageDocumentationProvider>
      </SidebarInset>
    </>
  );
}
