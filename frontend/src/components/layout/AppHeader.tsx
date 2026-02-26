"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { PWAInstallButton } from "@/components/PWAInstallButton";
import { useBreadcrumb } from "@/components/layout/BreadcrumbContext";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";

export function AppHeader() {
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const { breadcrumb } = useBreadcrumb();

  const forceInstallButton =
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_PWA_FORCE_INSTALL === "1";

  return (
    <header className="flex min-w-0 items-center gap-2 border-b border-border bg-card/95 px-3 py-2 backdrop-blur">
      <SidebarTrigger />

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="min-w-0 flex-1">
          {breadcrumb.items.length ? (
            <Breadcrumb className="min-w-0">
              <BreadcrumbList className="min-w-0 flex-nowrap overflow-hidden text-[11px]">
                {breadcrumb.items.map((item, index) => {
                  const isLast = index === breadcrumb.items.length - 1;
                  return (
                    <React.Fragment key={`${item.label}-${index}`}>
                      <BreadcrumbItem>
                        {isLast || !item.href ? (
                          <BreadcrumbPage className="truncate text-[11px]">
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
          ) : null}
          {breadcrumb.title ? (
            <div className="truncate text-sm font-semibold leading-tight text-foreground">
              {breadcrumb.title}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2">
        <PWAInstallButton
          forceDisplay={forceInstallButton}
          className={forceInstallButton ? "animate-pulse" : undefined}
        />
        </div>
      </div>
    </header>
  );
}
