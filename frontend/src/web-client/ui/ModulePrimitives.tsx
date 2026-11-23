"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const MODULE_SURFACE_CLASS_NAME =
  "overflow-hidden rounded-lg border border-border/60 bg-background/90";

export const MODULE_MUTED_SURFACE_CLASS_NAME =
  "overflow-hidden rounded-lg border border-border/50 bg-muted/10";

/**
 * Visual "fichário" (abas de pasta) - usado por todo `DetailTabsRenderer`
 * (`web-client/detail/DetailLayoutSections.tsx`), compartilhado por todos
 * os módulos. Só a aba ATIVA "funde" com o conteúdo abaixo: perde a borda
 * inferior própria e ganha `-mb-px` pra sobrepor exatamente 1px da linha
 * de base (`border-b` deste container) embaixo dela, na mesma cor do
 * conteúdo (`bg-background`) - cria a ilusão de ela ser parte física da
 * página, não um botão flutuante por cima. Abas inativas mantêm a borda
 * inferior (caixa "fechada" sobre a linha de base, levemente recuada em
 * `bg-muted/40`), como se estivessem atrás da aba ativa num fichário de
 * verdade. `w-max min-w-full` garante que a linha de base continue
 * esticando até a borda direita real mesmo com poucas abas (a lista some,
 * mas a borda >=100% continua lá).
 */
export const MODULE_TABS_LIST_CLASS_NAME =
  "flex h-auto w-max min-w-full flex-nowrap items-end justify-start gap-1 rounded-none border-0 border-b border-border/60 bg-transparent p-0";

export const MODULE_TAB_TRIGGER_CLASS_NAME =
  "group relative flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-t-md rounded-b-none border border-border/60 bg-muted/40 px-3 text-sm font-medium text-muted-foreground shadow-none transition-colors data-[state=active]:z-10 data-[state=active]:-mb-px data-[state=active]:border-b-0 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-none data-[state=inactive]:hover:bg-muted/70 data-[state=inactive]:hover:text-foreground";

export function ModuleSurface({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn(MODULE_SURFACE_CLASS_NAME, className)}>{children}</div>;
}

export function ModuleSectionHeader({
  kicker,
  title,
  description,
  meta,
  actionSlot,
  className,
}: {
  kicker?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  meta?: React.ReactNode;
  actionSlot?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 border-b border-border/50 pb-3",
        className,
      )}
    >
      <div className="min-w-0">
        {kicker ? (
          <div className="mb-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {kicker}
          </div>
        ) : null}
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <div className="truncate text-sm font-medium text-foreground">{title}</div>
          {meta ? (
            <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {meta}
            </div>
          ) : null}
        </div>
        {description ? (
          <div className="mt-1 text-xs text-muted-foreground">{description}</div>
        ) : null}
      </div>

      {actionSlot ? <div className="shrink-0">{actionSlot}</div> : null}
    </div>
  );
}

export function ModuleEmptyState({
  title = "Sem registros",
  description,
  actionSlot,
  compact = false,
  className,
}: {
  title?: React.ReactNode;
  description: React.ReactNode;
  actionSlot?: React.ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 px-4 text-center",
        compact ? "py-8" : "min-h-[180px] py-10",
        className,
      )}
    >
      {title ? (
        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </div>
      ) : null}
      <div className="max-w-[28rem] text-sm text-muted-foreground">{description}</div>
      {actionSlot ? <div className="pt-1">{actionSlot}</div> : null}
    </div>
  );
}
