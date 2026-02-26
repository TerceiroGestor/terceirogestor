"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBreadcrumb } from "@/components/layout/BreadcrumbContext";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { useControlPanel } from "@/web-client/control-panel/ControlPanelContext";

export function ControlPanelShell() {
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const { breadcrumb } = useBreadcrumb();
  const { controlPanel } = useControlPanel();

  const actionSlot = breadcrumb.actionSlot;
  const primaryAction = controlPanel.primaryAction ?? breadcrumb.action;

  const createButtonNode = primaryAction ? (
    primaryAction.href ? (
      <Button
        size={primaryAction.size ?? "sm"}
        variant={primaryAction.variant ?? "default"}
        asChild
        className="h-8"
      >
        <Link href={withTenantPath(primaryAction.href, tenantSlug)}>
          {primaryAction.label}
        </Link>
      </Button>
    ) : (
      <Button
        size={primaryAction.size ?? "sm"}
        variant={primaryAction.variant ?? "default"}
        onClick={primaryAction.onClick}
        className="h-8"
      >
        {primaryAction.label}
      </Button>
    )
  ) : null;

  return (
    <div className="border-b border-border bg-card/95 px-3 backdrop-blur">
      <div className="grid grid-cols-1 gap-2 py-2 lg:grid-cols-[auto_1fr_auto] lg:items-center lg:gap-3 lg:py-1">
        <div className="flex min-w-0 items-center gap-2">
          {createButtonNode}
          {actionSlot}
          {controlPanel.leftSlot ? (
            <div className="flex flex-wrap items-center gap-2">{controlPanel.leftSlot}</div>
          ) : null}

          <div className="min-w-0">
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
            <div className="truncate text-sm font-semibold leading-tight text-foreground">
              {breadcrumb.title}
            </div>
          </div>
        </div>

        <div className="flex min-w-0 items-center justify-center gap-1">
          {controlPanel.searchSlot ? (
            <div className="w-full max-w-[560px] flex-1">{controlPanel.searchSlot}</div>
          ) : null}
          {controlPanel.filterSlot}
          {controlPanel.groupBySlot}
          {controlPanel.favoritesSlot}
        </div>

        <div className="flex items-center justify-end gap-1">
          {controlPanel.viewSwitcherSlot}
          {controlPanel.rightSlot}
        </div>
      </div>
    </div>
  );
}
