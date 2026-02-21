"use client";

import * as React from "react";
import Link from "next/link";
import { useBreadcrumb } from "@/components/layout/BreadcrumbContext";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { PWAInstallButton } from "@/components/PWAInstallButton";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function AppHeader() {
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const { breadcrumb } = useBreadcrumb();
  const items = breadcrumb.items;
  const action = breadcrumb.action;
  const actionSlot = breadcrumb.actionSlot;
  const forceInstallButton =
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_PWA_FORCE_INSTALL === "1";

  return (
    <header className="sticky top-0 z-30 flex min-w-0 items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur">
      <SidebarTrigger />
      <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
        {items.length ? (
          <Breadcrumb className="min-w-0">
            <BreadcrumbList className="min-w-0 flex-nowrap overflow-hidden text-xs">
              {items.map((item, index) => {
                const isLast = index === items.length - 1;
                return (
                  <React.Fragment key={`${item.label}-${index}`}>
                    <BreadcrumbItem>
                      {isLast || !item.href ? (
                        <BreadcrumbPage className="truncate text-xs">
                          {item.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link href={withTenantPath(item.href, tenantSlug)}>
                            <span className="truncate">{item.label}</span>
                          </Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {isLast ? null : <BreadcrumbSeparator />}
                  </React.Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        ) : (
          <div className="min-w-0" />
        )}

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {actionSlot}
          {action ? (
            action.href ? (
              <Button
                size={action.size ?? "sm"}
                variant={action.variant ?? "default"}
                asChild
              >
                <Link href={withTenantPath(action.href, tenantSlug)}>
                  {action.label}
                </Link>
              </Button>
            ) : (
              <Button
                size={action.size ?? "sm"}
                variant={action.variant ?? "default"}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            )
          ) : null}
          <PWAInstallButton
            forceDisplay={forceInstallButton}
            className={forceInstallButton ? "animate-pulse" : undefined}
          />
        </div>
      </div>
    </header>
  );
}
