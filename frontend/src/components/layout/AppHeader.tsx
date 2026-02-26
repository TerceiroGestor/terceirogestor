"use client";

import * as React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { PWAInstallButton } from "@/components/PWAInstallButton";

export function AppHeader() {
  const forceInstallButton =
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_PWA_FORCE_INSTALL === "1";

  return (
    <header className="flex min-w-0 items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur">
      <SidebarTrigger />
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
        <PWAInstallButton
          forceDisplay={forceInstallButton}
          className={forceInstallButton ? "animate-pulse" : undefined}
        />
      </div>
    </header>
  );
}
