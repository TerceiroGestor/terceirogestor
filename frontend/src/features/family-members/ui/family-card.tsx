"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import clsx from "clsx";

type FamilyCardProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function FamilyCard({
  title,
  subtitle,
  actions,
  footer,
  children,
  className,
}: FamilyCardProps) {
  return (
    <Card className={clsx("shadow-none border-border/60", className)}>
      <CardHeader className="flex items-center justify-between gap-3 px-5 pt-5">
        <div>
          <CardTitle className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {title}
          </CardTitle>
          {subtitle ? (
            <CardDescription className="text-[11px] text-muted-foreground">
              {subtitle}
            </CardDescription>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </CardHeader>
      <CardContent className="space-y-4 px-5 pb-5 pt-3">{children}</CardContent>
      {footer ? (
        <div className="border-t border-border/40 px-5 py-3">{footer}</div>
      ) : null}
    </Card>
  );
}
