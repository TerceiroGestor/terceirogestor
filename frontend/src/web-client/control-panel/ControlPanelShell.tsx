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

  const createButtonNode = action ? (
    action.href ? (
      <Button size={action.size ?? "sm"} variant={action.variant ?? "default"} asChild>
        <Link href={withTenantPath(action.href, tenantSlug)}>{action.label}</Link>
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
  ) : null;

  return (
    <div className="border-b border-border bg-card/95 px-3 backdrop-blur">
      <div className="flex min-h-[var(--ui-controlpanel-height)] flex-col gap-2 py-2 lg:flex-row lg:items-center lg:gap-2 lg:py-0">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 lg:flex-nowrap">
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

          {controlPanel.searchSlot ? (
            <div className="w-full lg:mx-2 lg:w-auto lg:min-w-[320px] lg:flex-1">
              {controlPanel.searchSlot}
            </div>
          ) : null}

          <div className="flex w-full flex-wrap items-center justify-end gap-2 lg:w-auto lg:gap-1">
            {controlPanel.filterSlot}
            {controlPanel.groupBySlot}
            {controlPanel.favoritesSlot}
            {controlPanel.viewSwitcherSlot}
            {controlPanel.rightSlot}
          </div>
        </div>
      </div>
    </div>
  );
}
