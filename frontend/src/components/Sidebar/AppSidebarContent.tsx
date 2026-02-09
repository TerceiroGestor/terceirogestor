"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { navGroups } from "@/components/Sidebar/sidebar-data";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";

export function AppSidebarContent() {
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const { permissions } = useCurrentUser();

  const canAccess = (item: { permissions?: string[] }) => {
    if (!item.permissions || item.permissions.length === 0) return true;
    return item.permissions.every((permission) =>
      permissions.includes(permission),
    );
  };

  return (
    <SidebarContent className="pb-4">
      {navGroups.map((group) => {
        const visibleItems = group.items.filter(canAccess);
        if (visibleItems.length === 0) return null;
        return (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={
                        item.exact
                          ? pathname === withTenantPath(item.href, tenantSlug)
                          : pathname.startsWith(
                              withTenantPath(item.href, tenantSlug),
                            )
                      }
                      tooltip={item.title}
                    >
                      <Link href={withTenantPath(item.href, tenantSlug)}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.badge ? (
                      <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        );
      })}
    </SidebarContent>
  );
}
