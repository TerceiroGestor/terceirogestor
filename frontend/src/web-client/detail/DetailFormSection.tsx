"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const DETAIL_FIELD_LABEL_CLASS_NAME =
  "text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground";

/** Cabeçalho de seção do formulário de Detail: título curto + barra de acento colorida, sem texto descritivo. */
export function DetailSectionHeading({
  title,
  className,
}: {
  title: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="h-4 w-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
      <span className="text-sm font-semibold text-foreground">{title}</span>
    </div>
  );
}

export function DetailSectionField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className={DETAIL_FIELD_LABEL_CLASS_NAME}>{label}</div>
      {children}
    </div>
  );
}
