"use client";

import * as React from "react";
import Link from "next/link";
import { useBreadcrumb } from "@/components/layout/BreadcrumbContext";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function AppHeader() {
  const { breadcrumb } = useBreadcrumb();
  const items = breadcrumb.items;
  const action = breadcrumb.action;
  const actionSlot = breadcrumb.actionSlot;

  return (
    <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur">
      <SidebarTrigger />
      <div className="flex flex-1 items-center justify-between gap-3">
        {items.length ? (
          <Breadcrumb>
            <BreadcrumbList className="text-xs">
              {items.map((item, index) => {
                const isLast = index === items.length - 1;
                return (
                  <React.Fragment key={`${item.label}-${index}`}>
                    <BreadcrumbItem>
                      {isLast || !item.href ? (
                        <BreadcrumbPage className="text-xs">
                          {item.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link href={item.href}>{item.label}</Link>
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
        {actionSlot || action ? (
          <div className="flex items-center gap-2">
            {actionSlot}
            {action ? (
              action.href ? (
                <Button
                  size={action.size ?? "sm"}
                  variant={action.variant ?? "default"}
                  asChild
                >
                  <Link href={action.href}>{action.label}</Link>
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
          </div>
        ) : null}
      </div>
    </header>
  );
}
