"use client";

import { SidebarHeader } from "@/components/ui/sidebar";

export function AppSidebarHeader() {
  return (
    <SidebarHeader className="gap-3 px-4 py-5">
      <div className="flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
          OR
        </div>
        <div className="leading-tight">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Admin
          </p>
          <p className="text-sm font-semibold">Orion Suite</p>
        </div>
      </div>
    </SidebarHeader>
  );
}
