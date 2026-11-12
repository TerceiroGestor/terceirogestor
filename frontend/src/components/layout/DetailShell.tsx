"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
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
  contentScrollMode?: "page" | "split";

  children?: React.ReactNode;
  className?: string;
  labels?: DetailShellLabels;
};

const SIDE_WIDTH_STORAGE_KEY = "detailshell.sideWidth";
const DEFAULT_SIDE_WIDTH = 420;
const MIN_SIDE_WIDTH = 320;
const MAX_SIDE_WIDTH = 720;

function readStoredSideWidth(): number {
  if (typeof window === "undefined") return DEFAULT_SIDE_WIDTH;
  try {
    const raw = window.localStorage.getItem(SIDE_WIDTH_STORAGE_KEY);
    const parsed = raw ? Number(raw) : NaN;
    if (Number.isFinite(parsed)) {
      return Math.min(MAX_SIDE_WIDTH, Math.max(MIN_SIDE_WIDTH, parsed));
    }
  } catch {
    // Armazenamento indisponivel (modo privado, cota excedida) - usa o padrao.
  }
  return DEFAULT_SIDE_WIDTH;
}

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
  contentScrollMode = "page",
  children,
  className,
  labels,
}: DetailShellProps) {
  const isMobile = useIsMobile();
  const hasSideSlot = Boolean(sideSlot);
  const [sideOpen, setSideOpen] = React.useState(false);
  const lastViewportModeRef = React.useRef<boolean | null>(null);
  const mergedLabels = React.useMemo(
    () => ({ ...DEFAULT_LABELS, ...(labels ?? {}) }),
    [labels],
  );

  const [sideWidth, setSideWidth] = React.useState(readStoredSideWidth);
  const [isResizingSide, setIsResizingSide] = React.useState(false);
  const resizeStateRef = React.useRef<{ startX: number; startWidth: number } | null>(null);

  const handleResizeStart = React.useCallback(
    (event: React.PointerEvent) => {
      event.preventDefault();
      resizeStateRef.current = { startX: event.clientX, startWidth: sideWidth };
      setIsResizingSide(true);
    },
    [sideWidth],
  );

  React.useEffect(() => {
    if (!isResizingSide) return;

    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handleMove = (event: PointerEvent) => {
      const dragState = resizeStateRef.current;
      if (!dragState) return;
      // A alça fica na borda esquerda do painel: arrastar pra esquerda (clientX
      // menor) deve alargar o painel, por isso o delta e' invertido.
      const delta = dragState.startX - event.clientX;
      const nextWidth = Math.min(
        MAX_SIDE_WIDTH,
        Math.max(MIN_SIDE_WIDTH, dragState.startWidth + delta),
      );
      setSideWidth(nextWidth);
    };

    const handleUp = () => {
      setIsResizingSide(false);
      resizeStateRef.current = null;
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
    };
  }, [isResizingSide]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(SIDE_WIDTH_STORAGE_KEY, String(sideWidth));
    } catch {
      // Armazenamento indisponivel - a largura so' nao persiste, sem quebrar a tela.
    }
  }, [sideWidth]);

  React.useEffect(() => {
    if (!hasSideSlot) {
      setSideOpen(false);
      lastViewportModeRef.current = null;
      return;
    }

    if (
      lastViewportModeRef.current === null ||
      lastViewportModeRef.current !== isMobile
    ) {
      setSideOpen(false);
      lastViewportModeRef.current = isMobile;
    }
  }, [hasSideSlot, isMobile]);

  const statusText = saving
    ? mergedLabels.saving
    : loading
      ? mergedLabels.loading
      : mergedLabels.ready;

  const sideToggleButton = hasSideSlot ? (
    <Button
      type="button"
      size="icon"
      variant="outline"
      className="h-9 w-9"
      onClick={() => setSideOpen((previous) => !previous)}
      aria-label={sideOpen ? "Ocultar lateral" : "Mostrar lateral"}
      title={sideOpen ? "Ocultar lateral" : "Mostrar lateral"}
    >
      {sideOpen ? (
        <ChevronRight className="size-4" />
      ) : (
        <ChevronLeft className="size-4" />
      )}
    </Button>
  ) : null;

  const headerBlock = (
    <div className="sticky top-0 z-20 -mx-4 mb-2 border-b border-border/60 bg-background/95 px-4 pb-2 pt-0 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2.5">
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

          {sideToggleButton || headerActionsSlot ? (
            <div className="flex items-center gap-2 pt-1">
              {headerActionsSlot}
              {sideToggleButton}
            </div>
          ) : null}
        </div>

        {headerInfoSlot ? (
          <div className={cn("mt-2 min-w-0", headerInfoClassName)}>
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

      <div
        className={cn(
          "w-full px-4 pb-3 pt-0 lg:h-[calc(100vh-var(--app-shell-sticky-offset,0px))] lg:overflow-hidden",
          className,
        )}
      >
        {mainSlot || sideSlot || bottomSlot ? (
          <div
            className={cn(
              "grid grid-cols-1 lg:h-full lg:items-start lg:overflow-hidden",
              hasSideSlot && sideOpen && !isMobile ? null : "gap-6",
              bodyClassName,
            )}
            style={
              hasSideSlot && sideOpen && !isMobile
                ? { gridTemplateColumns: `minmax(0,1fr) auto ${sideWidth}px` }
                : undefined
            }
          >
            <div
              className={cn(
                "min-w-0 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:self-stretch lg:overflow-hidden",
                mainClassName,
              )}
            >
              {headerBlock}
              {viewControlsBlock}

              <div
                className={cn(
                  "space-y-4 lg:min-h-0 lg:flex-1 lg:pr-2",
                  contentScrollMode === "split"
                    ? "lg:grid lg:grid-rows-[auto_minmax(0,1fr)] lg:overflow-hidden"
                    : "lg:overflow-y-auto",
                )}
              >
                {mainSlot ? (
                  <div
                    className={cn(
                      contentScrollMode === "split"
                        ? "lg:max-h-[28vh] lg:overflow-y-auto"
                        : null,
                    )}
                  >
                    {mainSlot}
                  </div>
                ) : null}
                {bottomSlot ? (
                  <div
                    className={cn(
                      "border-t border-border/50 pt-4 lg:mt-4",
                      contentScrollMode === "split"
                        ? "lg:min-h-0 lg:h-full lg:overflow-hidden lg:bg-background"
                        : null,
                      bottomClassName,
                    )}
                  >
                    {bottomSlot}
                  </div>
                ) : null}
              </div>
            </div>
            {hasSideSlot && sideOpen && !isMobile ? (
              <div
                role="separator"
                aria-orientation="vertical"
                aria-label="Redimensionar painel lateral"
                onPointerDown={handleResizeStart}
                className={cn(
                  "relative hidden self-stretch lg:block",
                  "w-3 shrink-0 cursor-col-resize touch-none select-none",
                  "after:absolute after:inset-y-0 after:left-1/2 after:w-px after:-translate-x-1/2 after:bg-border/60",
                  isResizingSide ? "after:bg-primary/70" : "hover:after:bg-primary/40",
                )}
              />
            ) : null}
            {hasSideSlot && sideOpen && !isMobile ? (
              <div
                className={cn(
                  "min-w-0 lg:flex lg:min-h-0 lg:h-full lg:flex-col lg:overflow-hidden",
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
      {hasSideSlot && isMobile ? (
        <Sheet open={sideOpen} onOpenChange={setSideOpen}>
          <SheetContent
            side="right"
            className="w-[min(88vw,24rem)] max-w-[24rem] p-0"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Painel lateral</SheetTitle>
              <SheetDescription>
                Exibe anotações, contexto, histórico e auditoria do registro.
              </SheetDescription>
            </SheetHeader>
            <div className={cn("flex h-full min-h-0 flex-col p-4", sideClassName)}>
              {sideSlot}
            </div>
          </SheetContent>
        </Sheet>
      ) : null}
    </>
  );
}
