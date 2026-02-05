"use client";

import * as React from "react";
import Link from "next/link";
import { useBreadcrumb } from "@/components/layout/BreadcrumbContext";
import type { BreadcrumbItem as BreadcrumbItemType } from "@/components/layout/BreadcrumbContext";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: BreadcrumbItemType[];
  showTitle?: boolean;
  showDescription?: boolean;
};

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  showTitle = true,
  showDescription = true,
}: PageHeaderProps) {
  const { breadcrumb } = useBreadcrumb();
  const items = breadcrumbs ?? breadcrumb.items;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-3">
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
          {showTitle ? (
            <h1 className="text-xl font-semibold">{title}</h1>
          ) : null}
        </div>
        {showDescription && description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
