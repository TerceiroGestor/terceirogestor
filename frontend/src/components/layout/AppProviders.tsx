"use client";

import * as React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { BreadcrumbProvider } from "@/components/layout/BreadcrumbContext";
import { AuthProvider } from "@/features/auth/auth-context";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <BreadcrumbProvider>
        <SidebarProvider>{children}</SidebarProvider>
      </BreadcrumbProvider>
    </AuthProvider>
  );
}
