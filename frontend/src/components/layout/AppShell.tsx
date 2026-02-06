"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/Sidebar/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";

const AUTH_ROUTES = ["/login", "/register"];

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isAuthRoute = AUTH_ROUTES.some((route) =>
    pathname?.startsWith(route),
  );

  if (isAuthRoute) {
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
