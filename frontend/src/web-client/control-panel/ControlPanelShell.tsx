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

  const action = breadcrumb.action;
  const actionSlot = breadcrumb.actionSlot;

  return (
    <div className="border-b border-border bg-background/85 px-4 py-3 backdrop-blur">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
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

            {controlPanel.leftSlot ? (
              <div className="flex flex-wrap items-center gap-2">
                {controlPanel.leftSlot}
              </div>
            ) : null}
          </div>

          <div className="min-w-0">
            {breadcrumb.items.length ? (
              <Breadcrumb className="min-w-0">
                <BreadcrumbList className="min-w-0 flex-nowrap overflow-hidden text-xs">
                  {breadcrumb.items.map((item, index) => {
                    const isLast = index === breadcrumb.items.length - 1;
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
            ) : null}

            <h1 className="truncate text-base font-semibold leading-tight text-foreground">
              {breadcrumb.title}
            </h1>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 lg:items-end">
          <div className="flex flex-wrap items-center justify-end gap-2">
            {controlPanel.searchSlot}
            {controlPanel.filterSlot}
            {controlPanel.groupBySlot}
            {controlPanel.favoritesSlot}
            {controlPanel.viewSwitcherSlot}
            {actionSlot}
            {controlPanel.rightSlot}
          </div>
        </div>
      </div>
    </div>
  );
}

