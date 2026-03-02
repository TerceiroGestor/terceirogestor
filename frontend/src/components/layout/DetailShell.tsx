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
  headerInfoSlot?: React.ReactNode;
  headerInfoClassName?: string;

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
  headerInfoSlot,
  headerInfoClassName,
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

  return (
    <>
      <PageBreadcrumb
        title={breadcrumbTitle}
        items={breadcrumbItems}
        actionSlot={actionSlot}
      />

      <div className={cn("w-full px-4 py-4", className)}>
        <div className="mb-3 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_420px] lg:items-start">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold text-foreground">
              {headerTitle}
            </h1>

            {headerInfoSlot ? (
              <div className={cn("mt-2 min-w-0", headerInfoClassName)}>
                {headerInfoSlot}
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-2">
            {headerActionsSlot ? (
              <div className="flex items-center gap-2">{headerActionsSlot}</div>
            ) : null}

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
              <div className="rounded-sm border border-border/60 bg-muted/20 px-2 py-1 text-[11px] text-muted-foreground">
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
        </div>

        {mainSlot || sideSlot || bottomSlot ? (
          <div className={cn("grid grid-cols-1 gap-4 lg:grid-cols-[1fr_420px]", bodyClassName)}>
            <div className={cn("min-w-0 space-y-4", mainClassName)}>
              {mainSlot}
              {bottomSlot ? <div className={bottomClassName}>{bottomSlot}</div> : null}
            </div>
            <div className={cn("min-w-0", sideClassName)}>{sideSlot}</div>
          </div>
        ) : (
          children
        )}
      </div>
    </>
  );
}
