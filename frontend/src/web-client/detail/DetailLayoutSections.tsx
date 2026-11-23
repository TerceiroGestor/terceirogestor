"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, ListChecks, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import type {
  DetailHeaderActionConfig,
  DetailRelationConfig,
  DetailTabTemplate,
} from "@/web-client/registry/types";
import {
  ModuleEmptyState,
  MODULE_TABS_LIST_CLASS_NAME,
  MODULE_TAB_TRIGGER_CLASS_NAME,
} from "@/web-client/ui/ModulePrimitives";
import { DateRangeFilterButton } from "@/web-client/ui/DateRangeFilterButton";
import { ListView } from "@/web-client/views/ListView";

function renderRelationActionButton<TContext extends Record<string, unknown>>({
  action,
  context,
}: {
  action: NonNullable<DetailRelationConfig<TContext, unknown>["action"]>;
  context: TContext;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={action.variant ?? "ghost"}
      className="h-9 rounded-none border-b border-border/60 px-1"
      onClick={() => action.onClick(context)}
      disabled={action.disabled?.(context) ?? false}
    >
      {action.icon}
      {action.label}
    </Button>
  );
}

function DetailRelationSection<
  TContext extends Record<string, unknown>,
  TRow,
>({ relation, context }: {
  relation: DetailRelationConfig<TContext, TRow>;
  context: TContext;
}) {
  const isVisible = relation.visible ? relation.visible(context) : true;

  const loading = relation.loading?.(context) ?? false;
  const allRows = React.useMemo(() => relation.rows(context) ?? [], [context, relation]);
  const action = relation.action;
  const actionHidden = action?.hidden?.(context) ?? false;
  const actionDisabled = action?.disabled?.(context) ?? false;
  const primaryAction =
    relation.primaryAction && !(relation.primaryAction.hidden?.(context) ?? false)
      ? relation.primaryAction
      : action && !actionHidden
        ? {
          ...action,
          disabled: () => actionDisabled,
        }
        : null;
  const secondaryActions = (relation.secondaryActions ?? []).filter(
    (entry) => !(entry.hidden?.(context) ?? false),
  );
  const emptyLabel =
    typeof relation.emptyLabel === "function"
      ? relation.emptyLabel(context)
      : relation.emptyLabel;
  const errorMessage =
    typeof relation.error === "function" ? relation.error(context) : relation.error;
  const searchable = relation.searchable ?? true;
  const searchPlaceholder =
    typeof relation.searchPlaceholder === "function"
      ? relation.searchPlaceholder(context)
      : relation.searchPlaceholder;
  const filters = (relation.filters ?? []).filter(
    (filter) => !(filter.hidden?.(context) ?? false),
  );
  const stats = (relation.stats ?? []).filter(
    (stat) => !(stat.hidden?.(context) ?? false),
  );
  const selectionConfig = relation.selection;
  const selectionAllowed =
    selectionConfig !== undefined
      ? (selectionConfig.enabled?.(context) ?? true)
      : false;
  const selectionMode = selectionConfig?.mode ?? "always";
  const [searchText, setSearchText] = React.useState("");
  const [selectionEnabled, setSelectionEnabled] = React.useState(
    selectionAllowed && selectionMode === "always",
  );

  React.useEffect(() => {
    setSelectionEnabled(selectionAllowed && selectionMode === "always");
  }, [relation.key, selectionAllowed, selectionMode]);

  const rows = React.useMemo(() => {
    if (!searchText.trim()) return allRows;
    if (relation.filterRows) {
      return relation.filterRows(allRows, searchText, context);
    }
    const query = searchText.trim().toLocaleLowerCase();
    return allRows.filter((row) => {
      const haystack = Object.values(row as Record<string, unknown>)
        .flatMap((value) => {
          if (Array.isArray(value)) {
            return value.map((entry) => String(entry ?? ""));
          }
          if (value && typeof value === "object") {
            return Object.values(value as Record<string, unknown>).map((entry) =>
              String(entry ?? ""),
            );
          }
          return [String(value ?? "")];
        })
        .join(" ")
        .toLocaleLowerCase();
      return haystack.includes(query);
    });
  }, [allRows, context, relation, searchText]);
  const filteredCountLabel = rows.length.toLocaleString("pt-BR");
  const columns = React.useMemo(
    () =>
      typeof relation.columns === "function"
        ? relation.columns(context)
        : relation.columns,
    [context, relation],
  );
  const selectionToggleLabel =
    typeof selectionConfig?.toggleLabel === "function"
      ? selectionConfig.toggleLabel(context, selectionEnabled)
      : selectionConfig?.toggleLabel;
  const showToolbar =
    searchable ||
    filters.length > 0 ||
    secondaryActions.length > 0 ||
    Boolean(primaryAction) ||
    (selectionAllowed && selectionMode === "toggle");
  const showStats = stats.length > 0;

  if (!isVisible) return null;

  return (
    <section className="flex h-full min-h-0 flex-col border-t border-border/60 pt-4">
      <div className="flex h-full min-h-0 flex-col space-y-3">
        {showToolbar || showStats ? (
          <div className="sticky top-0 z-10 space-y-3 bg-background pb-3">
            {showToolbar ? (
              <div className="flex flex-wrap items-end gap-3">
                {searchable ? (
                  <div className="min-w-[220px] flex-1">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-0 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={searchText}
                        onChange={(event) => setSearchText(event.target.value)}
                        placeholder={searchPlaceholder ?? "Pesquisar"}
                        className="h-9 rounded-none border-x-0 border-t-0 border-border/70 pl-6 pr-12 text-sm shadow-none focus-visible:ring-0"
                      />
                      <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[11px] font-medium tabular-nums text-muted-foreground">
                        {filteredCountLabel}
                      </span>
                    </div>
                  </div>
                ) : null}
                {filters.map((filter) => {
                  const placeholder =
                    typeof filter.placeholder === "function"
                      ? filter.placeholder(context)
                      : filter.placeholder;

                  if (filter.type === "dateRange") {
                    return (
                      <div key={filter.key} className="space-y-2">
                        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                          {filter.label}
                        </div>
                        <DateRangeFilterButton
                          value={filter.value(context)}
                          onChange={(range) => filter.onChange(context, range)}
                          placeholder={placeholder}
                          disabled={filter.disabled?.(context) ?? false}
                        />
                      </div>
                    );
                  }

                  return (
                    <div key={filter.key} className="min-w-[220px] space-y-2">
                      <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        {filter.label}
                      </div>
                      <Select
                        value={filter.value(context)}
                        onValueChange={(value) => filter.onChange(context, value)}
                        disabled={filter.disabled?.(context) ?? false}
                      >
                        <SelectTrigger className="h-9 min-w-[220px]">
                          <SelectValue placeholder={placeholder ?? "Selecionar"} />
                        </SelectTrigger>
                        <SelectContent>
                          {filter.options(context).map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  {selectionAllowed && selectionMode === "toggle" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant={selectionEnabled ? "secondary" : "outline"}
                      className="h-9 rounded-none"
                      onClick={() => setSelectionEnabled((previous) => !previous)}
                    >
                      <ListChecks className="mr-2 size-4" />
                      {selectionToggleLabel ?? (selectionEnabled ? "Cancelar seleção" : "Selecionar")}
                    </Button>
                  ) : null}
                  {secondaryActions.map((entry) =>
                    renderRelationActionButton({ action: entry, context }),
                  )}
                  {primaryAction ? renderRelationActionButton({ action: primaryAction, context }) : null}
                </div>
              </div>
            ) : null}
            {showStats ? (
              <div className="flex flex-wrap gap-2">
                {stats.map((stat) => (
                  <div
                    key={stat.key}
                    className="min-w-[108px] border border-border/60 bg-muted/10 px-3 py-2"
                  >
                    <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      {stat.label}
                    </div>
                    <div className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                      {stat.value(context, rows)}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
        {errorMessage ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}
        {loading ? (
          <ModuleEmptyState
            title="Carregando"
            description="Buscando registros relacionados."
            compact
          />
        ) : rows.length ? (
          <div className="min-h-0 flex-1">
            <ListView<TRow>
              data={rows}
              columns={columns}
              className="h-full"
              enableRowSelection={selectionAllowed && selectionEnabled}
              bulkActions={
                selectionAllowed && selectionEnabled && selectionConfig?.bulkActions?.length
                  ? (selectedRows) => (
                    <>
                      {selectionConfig.bulkActions
                        ?.filter((entry) => !(entry.hidden?.(context, selectedRows) ?? false))
                        .map((entry) => (
                          <Button
                            key={entry.key}
                            type="button"
                            size="sm"
                            variant={entry.variant ?? "secondary"}
                            onClick={() => entry.onClick(context, selectedRows)}
                            disabled={entry.disabled?.(context, selectedRows) ?? false}
                          >
                            {entry.icon}
                            {entry.label}
                          </Button>
                        ))}
                    </>
                  )
                  : undefined
              }
              renderCard={
                relation.renderCard
                  ? (row) => relation.renderCard?.(row, context)
                  : undefined
              }
              groupByFields={relation.groupBy?.(context) ?? []}
              getRowId={relation.getRowId}
              onRowClick={
                relation.onRowClick
                  ? (row) => relation.onRowClick?.(row, context)
                  : undefined
              }
              showColumnVisibilityButton={false}
            />
          </div>
        ) : (
          <ModuleEmptyState
            title="Sem registros"
            description={emptyLabel ?? "Sem registros."}
            compact
          />
        )}
      </div>
    </section>
  );
}

export function DetailRelationsRenderer<
  TContext extends Record<string, unknown>,
>({
  relations,
  context,
  className,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  relations: DetailRelationConfig<TContext, any>[];
  context: TContext;
  className?: string;
}) {
  const visibleRelations = React.useMemo(
    () =>
      relations.filter((relation) =>
        relation.visible ? relation.visible(context) : true,
      ),
    [context, relations],
  );

  if (!visibleRelations.length) return null;

  return (
    <div className={cn("space-y-4", className)}>
      {visibleRelations.map((relation) => (
        <DetailRelationSection
          key={relation.key}
          relation={relation}
          context={context}
        />
      ))}
    </div>
  );
}

export function DetailHeaderActionsRenderer<
  TContext extends Record<string, unknown>,
>({
  actions,
  context,
}: {
  actions: DetailHeaderActionConfig<TContext>[];
  context: TContext;
}) {
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const visibleActions = React.useMemo(
    () => actions.filter((action) => !(action.hidden?.(context) ?? false)),
    [actions, context],
  );

  if (!visibleActions.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {visibleActions.map((action) => {
        if (action.render) {
          return <React.Fragment key={action.key}>{action.render(context)}</React.Fragment>;
        }

        const variant = action.variant ?? "action";
        const disabled = action.disabled?.(context) ?? false;
        const iconOnly = !action.label;
        const size = iconOnly ? "icon-sm" : "sm";
        const accessibleLabel = action.tooltip ?? action.label;

        if (action.href) {
          return (
            <Button
              key={action.key}
              type="button"
              variant={variant}
              size={size}
              disabled={disabled}
              aria-label={iconOnly ? accessibleLabel : undefined}
              title={accessibleLabel}
              asChild
            >
              <Link href={withTenantPath(action.href(context), tenantSlug)}>
                {action.icon}
                {action.label}
              </Link>
            </Button>
          );
        }

        return (
          <Button
            key={action.key}
            type="button"
            variant={variant}
            size={size}
            disabled={disabled}
            aria-label={iconOnly ? accessibleLabel : undefined}
            title={accessibleLabel}
            onClick={() => action.onClick?.(context)}
          >
            {action.icon}
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}

/**
 * Faixa de abas com scroll horizontal + setas quando nao cabem todas na
 * largura disponivel (ex.: People, 11 abas) - sem isso, muitas abas
 * quebrariam linha (`flex-wrap`) ou estourariam a largura do container.
 * Extraido do componente proprio que so People tinha
 * (`people-detail-tabs.tsx`) pra virar parte do motor generico de abas -
 * todo modulo com abas suficientes ganha o mesmo scroll+setas de graca.
 */
function ScrollableTabsRow({ children }: { children: React.ReactNode }) {
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const updateScrollState = React.useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;
    const remaining = element.scrollWidth - element.clientWidth - element.scrollLeft;
    setCanScrollLeft(element.scrollLeft > 12);
    setCanScrollRight(remaining > 12);
  }, []);

  React.useEffect(() => {
    updateScrollState();
    const element = scrollRef.current;
    if (!element) return;
    const handle = () => updateScrollState();
    element.addEventListener("scroll", handle, { passive: true });
    window.addEventListener("resize", handle);
    return () => {
      element.removeEventListener("scroll", handle);
      window.removeEventListener("resize", handle);
    };
  }, [updateScrollState]);

  const scrollBy = React.useCallback((direction: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: direction === "right" ? 220 : -220,
      behavior: "smooth",
    });
  }, []);

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className={cn(
          "overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
          canScrollLeft && "pl-9",
          canScrollRight && "pr-9",
        )}
      >
        {children}
      </div>
      {canScrollLeft ? (
        <button
          type="button"
          onClick={() => scrollBy("left")}
          className="absolute left-0 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-background/95 text-muted-foreground shadow-sm transition hover:text-foreground"
          aria-label="Ver abas anteriores"
          title="Ver abas anteriores"
        >
          <ChevronLeft className="size-4" />
        </button>
      ) : null}
      {canScrollRight ? (
        <button
          type="button"
          onClick={() => scrollBy("right")}
          className="absolute right-0 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-background/95 text-muted-foreground shadow-sm transition hover:text-foreground"
          aria-label="Ver mais abas"
          title="Ver mais abas"
        >
          <ChevronRight className="size-4" />
        </button>
      ) : null}
    </div>
  );
}

export function DetailTabsRenderer<
  TContext extends Record<string, unknown>,
>({
  tabs,
  context,
  value,
  onValueChange,
}: {
  tabs: DetailTabTemplate<TContext>[];
  context: TContext;
  /**
   * Controla a aba ativa de fora (ex.: People sincroniza com `?tab=` na
   * URL) - omitir os dois deixa `Tabs` descontrolado (`defaultValue`),
   * comportamento padrão de todo módulo que não precisa disso.
   */
  value?: string;
  onValueChange?: (key: string) => void;
}) {
  const visibleTabs = React.useMemo(
    () => tabs.filter((tab) => (tab.visible ? tab.visible(context) : true)),
    [context, tabs],
  );
  const defaultTab = visibleTabs[0]?.key;

  if (!defaultTab) return null;

  const tabsProps =
    value !== undefined && onValueChange
      ? { value, onValueChange }
      : { defaultValue: defaultTab };

  return (
    <Tabs {...tabsProps} className="flex h-full min-h-0 flex-col">
      <div
        className={cn(
          // O container pai (DetailShell.tsx) nao tem mais padding
          // horizontal proprio - cada bloco (header/abas/relation) cuida
          // do seu px-4 sozinho, sem depender/cancelar padding do pai.
          // lg:-mr-2 so cancela o lg:pr-2 (reserva de scroll) do wrapper
          // imediato em DetailShell.tsx ("lg:min-h-0 lg:flex-1 lg:pr-2") -
          // sem isso a faixa bg-toolbar fica 8px curta da borda direita
          // real em telas >=lg. Se esse pr-2 mudar, ajustar aqui junto.
          "sticky top-0 z-10 bg-toolbar px-4 pt-1 lg:-mr-2",
        )}
      >
        <ScrollableTabsRow>
          <TabsList className={MODULE_TABS_LIST_CLASS_NAME}>
            {visibleTabs.map((tab) => {
              const isDisabled =
                typeof tab.disabled === "function" ? tab.disabled(context) : Boolean(tab.disabled);
              return (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  disabled={isDisabled}
                  className={MODULE_TAB_TRIGGER_CLASS_NAME}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.badge ? (
                    <span className="text-[11px] font-medium tabular-nums text-blue-600">
                      {tab.badge(context)}
                    </span>
                  ) : null}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </ScrollableTabsRow>
      </div>

      {visibleTabs.map((tab) => {
        const hasRelations = Boolean(tab.relations?.length);
        const content = tab.content?.(context) ?? null;
        const hasVisibleContent = Boolean(content);

        return (
          <TabsContent
            key={tab.key}
            value={tab.key}
            className={cn(
              "min-h-0 flex-1",
              // Antes (sticky-contra-ancestral) abas flushContent (ex.:
              // Despensa/Deposito, Encontros) ficavam sem overflow-hidden
              // aqui pra nao quebrar o sticky do toolbar/cabecalho, que
              // dependia de um ancestral sem overflow proprio pra rolar. A
              // relation agora e seu proprio container de scroll
              // (RelationListHost.tsx + ListView.tsx, overflow-auto) -
              // overflow-hidden aqui so delimita a altura (flex-1/min-h-0)
              // sem vazar scroll pra tela inteira (achado em 2026-11-22).
              tab.flushContent ? "mt-0 overflow-hidden" : "mt-4 overflow-hidden px-4",
            )}
          >
            <div className="flex h-full min-h-0 flex-col space-y-4">
              {hasVisibleContent ? (
                <div
                  className={cn(
                    "lg:min-h-0",
                    tab.flushContent
                      ? "flex min-h-0 flex-1 flex-col overflow-hidden"
                      : "lg:shrink-0 lg:overflow-y-auto",
                  )}
                >
                  {content}
                </div>
              ) : null}
              {hasRelations ? (
                <div className="min-h-0 flex-1 overflow-hidden">
                  <DetailRelationsRenderer
                    relations={tab.relations ?? []}
                    context={context}
                    className="h-full min-h-0"
                  />
                </div>
              ) : null}
              {!content && !hasRelations ? (
                <ModuleEmptyState
                  title="Sem conteudo"
                  description={tab.emptyLabel ?? "Sem conteudo."}
                  compact
                />
              ) : null}
            </div>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
