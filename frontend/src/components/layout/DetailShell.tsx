"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PageBreadcrumb } from "./PageBreadcrumb";

export type DetailShellBreadcrumbItem = {
  label: string;
  href?: string;
};

export type DetailShellMode = "create" | "edit" | "view";

export type DetailShellLabels = Partial<{
  createSubtitle: string;
  detailsSubtitle: string;
  save: string;
  saving: string;
  loading: string;
  ready: string;
  closeAria: string;
  closeTitle: string;
}>;

export type DetailShellProps = {
  breadcrumbTitle: string;
  breadcrumbItems: DetailShellBreadcrumbItem[];
  actionSlot?: React.ReactNode;

  mode: DetailShellMode;
  headerTitle: string;
  saving: boolean;
  loading?: boolean;
  readOnly: boolean;
  onSave?: () => void;
  onClose: () => void;

  headerActionsSlot?: React.ReactNode;
  headerTitleSlot?: React.ReactNode;
  headerInfoSlot?: React.ReactNode;
  headerInfoClassName?: string;
  viewControlsSlot?: React.ReactNode;
  viewControlsClassName?: string;

  mainSlot?: React.ReactNode;
  sideSlot?: React.ReactNode;
  bottomSlot?: React.ReactNode;
  bodyClassName?: string;
  mainClassName?: string;
  sideClassName?: string;
  bottomClassName?: string;

  children?: React.ReactNode;
  className?: string;
  labels?: DetailShellLabels;
};

const DEFAULT_LABELS: Required<DetailShellLabels> = {
  createSubtitle: "Criar",
  detailsSubtitle: "Detalhes",
  save: "Salvar",
  saving: "Salvando...",
  loading: "Carregando...",
  ready: "Pronto",
  closeAria: "Fechar",
  closeTitle: "Fechar",
};

export function DetailShell({
  breadcrumbTitle,
  breadcrumbItems,
  actionSlot,
  mode,
  headerTitle,
  saving,
  loading,
  readOnly,
  onSave,
  onClose,
  headerActionsSlot,
  headerTitleSlot,
  headerInfoSlot,
  headerInfoClassName,
  viewControlsSlot,
  viewControlsClassName,
  mainSlot,
  sideSlot,
  bottomSlot,
  bodyClassName,
  mainClassName,
  sideClassName,
  bottomClassName,
  children,
  className,
  labels,
}: DetailShellProps) {
  const mergedLabels = React.useMemo(
    () => ({ ...DEFAULT_LABELS, ...(labels ?? {}) }),
    [labels],
  );

  const statusText = saving
    ? mergedLabels.saving
    : loading
      ? mergedLabels.loading
      : mergedLabels.ready;

  const headerBlock = (
    <div className="sticky top-[var(--app-shell-sticky-offset,0px)] z-20 -mx-4 mb-4 border-b border-border/60 bg-background/95 px-4 pb-4 pt-2 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            {headerTitleSlot ? (
              <div className="shrink-0">{headerTitleSlot}</div>
            ) : null}
            <h1 className="truncate text-[1.85rem] font-semibold tracking-tight text-foreground">
              {headerTitle}
            </h1>

            {mode === "create" ? (
              onSave ? (
                <Button
                  size="sm"
                  onClick={onSave}
                  disabled={saving || readOnly}
                >
                  {saving ? mergedLabels.saving : mergedLabels.save}
                </Button>
              ) : null
            ) : (
              <div className="border-b border-border/50 px-0 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {statusText}
              </div>
            )}

            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={onClose}
              aria-label={mergedLabels.closeAria}
              title={mergedLabels.closeTitle}
            >
              <X className="size-4" />
            </Button>
          </div>

          {headerActionsSlot ? (
            <div className="flex items-center gap-2">{headerActionsSlot}</div>
          ) : null}
        </div>

        {headerInfoSlot ? (
          <div className={cn("mt-4 min-w-0", headerInfoClassName)}>
            {headerInfoSlot}
          </div>
        ) : null}
      </div>
    </div>
  );

  const viewControlsBlock = viewControlsSlot ? (
    <div
      className={cn(
        "mb-4 flex flex-wrap items-center gap-2 border-b border-border/50 pb-3",
        viewControlsClassName,
      )}
    >
      {viewControlsSlot}
    </div>
  ) : null;

  return (
    <>
      <PageBreadcrumb
        title={breadcrumbTitle}
        items={breadcrumbItems}
        actionSlot={actionSlot}
      />

      <div className={cn("w-full px-4 py-3", className)}>
        {mainSlot || sideSlot || bottomSlot ? (
          <div
            className={cn(
              "grid grid-cols-1 gap-6",
              sideSlot ? "lg:grid-cols-[minmax(0,1fr)_minmax(420px,36vw)]" : null,
              bodyClassName,
            )}
          >
            <div className={cn("min-w-0", mainClassName)}>
              {headerBlock}
              {viewControlsBlock}

              <div className="space-y-6">
                {mainSlot}
                {bottomSlot ? (
                  <div className={cn("border-t border-border/50 pt-4", bottomClassName)}>
                    {bottomSlot}
                  </div>
                ) : null}
              </div>
            </div>
            {sideSlot ? (
              <div
                className={cn(
                  "min-w-0 lg:sticky lg:top-4 lg:flex lg:h-[calc(100vh-7.5rem)] lg:self-start lg:flex-col lg:overflow-hidden lg:border-l lg:border-border/60 lg:pl-8",
                  sideClassName,
                )}
              >
                {sideSlot}
              </div>
            ) : null}
          </div>
        ) : (
          <>
            {headerBlock}
            {viewControlsBlock}
            {children}
          </>
        )}
      </div>
    </>
  );
}
