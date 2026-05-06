"use client";

import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarFooter } from "@/components/ui/sidebar";
import { AppSidebarUserMenu } from "@/components/Sidebar/AppSidebarUserMenu";
export function AppSidebarFooter() {
  return (
    <SidebarFooter className="px-4 py-4">
      <Button
        type="button"
        variant="outline"
        className="mb-3 w-full justify-start"
        onClick={() => window.dispatchEvent(new Event("tg:usage-docs:open"))}
      >
        <Info className="mr-2 size-4" />
        Central de ajuda
      </Button>
      <AppSidebarUserMenu />
    </SidebarFooter>
  );
}
