"use client";

import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, User, ChevronUp } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { usePathname } from "next/navigation";

const userActions = [
  { label: "Configuracões", icon: Settings, href: "/settings" },
];

export function AppSidebarUserMenu() {
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const { logout, isAuthenticated, token } = useAuth();
  const { user } = useCurrentUser();
  const email = user?.email ?? "";
  const name = user?.name ?? email.split("@")[0] ?? "Usuario";
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "US";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 text-left transition hover:bg-accent"
        >
          <div className="grid size-9 place-items-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
          <ChevronUp className="size-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56">
        {userActions.map((action) => (
          <DropdownMenuItem key={action.label} asChild>
            <Link href={withTenantPath(action.href, tenantSlug)}>
              <action.icon />
              <span>{action.label}</span>
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={logout}
          disabled={!isAuthenticated}
        >
          <LogOut />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
