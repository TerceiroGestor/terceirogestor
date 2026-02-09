"use client";

import * as React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { BreadcrumbProvider } from "@/components/layout/BreadcrumbContext";
import { AuthProvider } from "@/features/auth/auth-context";
import { CurrentUserProvider } from "@/features/auth/current-user-context";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CurrentUserProvider>
        <BreadcrumbProvider>
          <SidebarProvider>{children}</SidebarProvider>
        </BreadcrumbProvider>
      </CurrentUserProvider>
    </AuthProvider>
  );
}
