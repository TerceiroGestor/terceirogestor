"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBreadcrumb } from "@/components/layout/BreadcrumbContext";
import { Button } from "@/components/ui/button";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { useControlPanel } from "@/web-client/control-panel/ControlPanelContext";

export function ControlPanelShell() {
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const { breadcrumb } = useBreadcrumb();
  const { controlPanel } = useControlPanel();

  const actionSlot = breadcrumb.actionSlot;
  const primaryAction = controlPanel.primaryAction ?? breadcrumb.action;
  const primaryActionSlot = controlPanel.primaryActionSlot;

  const createButtonNode =
    primaryActionSlot ??
    (primaryAction ? (
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
    ) : null);

  const hasContent = Boolean(
    createButtonNode ||
      actionSlot ||
      controlPanel.leftSlot ||
      controlPanel.searchSlot ||
      controlPanel.filterSlot ||
      controlPanel.groupBySlot ||
      controlPanel.favoritesSlot ||
      controlPanel.viewSwitcherSlot ||
      controlPanel.rightSlot ||
      controlPanel.viewControlsSlot,
  );

  if (!hasContent) {
    return null;
  }

  const hasLeftContent = Boolean(actionSlot || controlPanel.leftSlot);

  return (
    <div
      data-slot="control-panel-shell"
      className="border-b border-border/60 bg-toolbar px-4"
    >
      <div
        className={`grid grid-cols-1 gap-3 py-3 lg:items-center lg:gap-4 lg:py-2.5 ${
          hasLeftContent
            ? "lg:grid-cols-[auto_minmax(0,1fr)_auto]"
            : "lg:grid-cols-[minmax(0,1fr)_auto]"
        }`}
      >
        {hasLeftContent ? (
          <div className="flex min-w-0 items-center gap-2">
            {actionSlot}
            {controlPanel.leftSlot ? (
              <div className="flex flex-wrap items-center gap-2">
                {controlPanel.leftSlot}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex min-w-0 items-center gap-2">
          {controlPanel.searchSlot ? (
            <div className="w-full flex-1">{controlPanel.searchSlot}</div>
          ) : null}
          {controlPanel.filterSlot}
          {controlPanel.groupBySlot}
          {controlPanel.favoritesSlot}
        </div>

        <div className="flex items-center justify-end gap-2">
          {controlPanel.viewSwitcherSlot}
          {controlPanel.rightSlot}
          {createButtonNode}
        </div>
      </div>
      {controlPanel.viewControlsSlot ? (
        <div className="border-t border-border/50 py-2.5">
          <div className="flex flex-wrap items-center justify-end gap-2">
            {controlPanel.viewControlsSlot}
          </div>
        </div>
      ) : null}
    </div>
  );
}
