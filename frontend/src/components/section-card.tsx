"use client";

import type { ReactNode } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import clsx from "clsx";

type SectionCardProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
};

export function SectionCard({
  title,
  subtitle,
  actions,
  footer,
  children,
  className,
  contentClassName,
  headerClassName,
}: SectionCardProps) {
  return (
    <Card className={clsx("border-border/60 shadow-none", className)}>
      <CardHeader
        className={clsx("border-b border-border/50", headerClassName)}
      >
        <div className="">
          <CardTitle className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {title}
          </CardTitle>
          {subtitle ? (
            <CardDescription className="text-[11px] tracking-[0.1em] text-muted-foreground">
              {subtitle}
            </CardDescription>
          ) : null}
        </div>
        {actions ? <CardAction>{actions}</CardAction> : null}
      </CardHeader>
      <CardContent
        className={clsx("space-y-4 px-5 pb-5 pt-3", contentClassName)}
      >
        {children}
      </CardContent>
      {footer ? (
        <div className="border-t border-border/40 px-5 py-3">{footer}</div>
      ) : null}
    </Card>
  );
}

export type { SectionCardProps };
