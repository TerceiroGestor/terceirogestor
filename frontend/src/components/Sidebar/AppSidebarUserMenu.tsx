"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, User, ChevronUp } from "lucide-react";

const userActions = [
  { label: "Profile", icon: User },
  { label: "Account settings", icon: Settings },
];

export function AppSidebarUserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 text-left transition hover:bg-accent"
        >
          <div className="grid size-9 place-items-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
            AC
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">Ana Costa</p>
            <p className="truncate text-xs text-muted-foreground">
              ana@orion.io
            </p>
          </div>
          <ChevronUp className="size-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56">
        {userActions.map((action) => (
          <DropdownMenuItem key={action.label}>
            <action.icon />
            <span>{action.label}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <LogOut />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
