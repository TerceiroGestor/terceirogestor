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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { navGroups } from "@/components/Sidebar/sidebar-data";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";

export function AppSidebarContent() {
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const { permissions } = useCurrentUser();

  const canAccess = (item: {
    permissions?: string[];
    permissionsAny?: string[];
  }) => {
    if (item.permissionsAny && item.permissionsAny.length) {
      return item.permissionsAny.some((permission) =>
        permissions.includes(permission),
      );
    }
    if (!item.permissions || item.permissions.length === 0) return true;
    return item.permissions.every((permission) => permissions.includes(permission));
  };

  const isActiveHref = (itemHref: string, exact?: boolean) => {
    const resolvedHref = withTenantPath(itemHref, tenantSlug);
    if (exact) return pathname === resolvedHref;
    return pathname === resolvedHref || pathname.startsWith(`${resolvedHref}/`);
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
                {visibleItems.map((item) => {
                  const visibleChildren =
                    item.children?.filter(canAccess) ?? [];
                  const active =
                    isActiveHref(item.href, item.exact) ||
                    visibleChildren.some((child) =>
                      isActiveHref(child.href, child.exact),
                    );

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
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

                      {visibleChildren.length ? (
                        <SidebarMenuSub>
                          {visibleChildren.map((child) => (
                            <SidebarMenuSubItem
                              key={`${item.title}-${child.title}`}
                            >
                              <SidebarMenuSubButton
                                asChild
                                isActive={isActiveHref(child.href, child.exact)}
                              >
                                <Link
                                  href={withTenantPath(child.href, tenantSlug)}
                                >
                                  <child.icon />
                                  <span>{child.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      ) : null}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        );
      })}
    </SidebarContent>
  );
}
