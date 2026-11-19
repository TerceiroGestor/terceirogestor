"use client";

import * as React from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SearchBar } from "@/web-client/control-panel/SearchBar";
import { SearchPanelMenu } from "@/web-client/control-panel/SearchPanelMenu";
import { buildQueryFacets } from "@/web-client/control-panel/queryFacets";
import { removeConditionAtIndex } from "@/web-client/domain/conditions";
import type { Domain } from "@/web-client/domain/types";
import type {
  SearchFieldDefinition,
  SearchViewDefinition,
} from "@/web-client/search/types";
import {
  ColumnVisibilityMenu,
  ColumnVisibilityProvider,
} from "@/web-client/views/ListView";

type RelationGroupByOption = { field: string; label: string };

const CONTROL_BUTTON_CLASS_NAME =
  "h-8 w-8 text-muted-foreground hover:bg-background hover:text-foreground";

type RelationListHostProps<TData> = {
  title?: string;
  subtitle?: string;
  data: TData[];
  searchText: string;
  onSearchTextChange: (next: string) => void;
  domain: Domain;
  onDomainChange: (next: Domain) => void;
  groupBy?: string[];
  onGroupByChange?: (next: string[]) => void;
  groupByOptions?: RelationGroupByOption[];
  groupByMode?: "single" | "multi";
  allowEmptyGroupBy?: boolean;
  filterFields?: SearchFieldDefinition[];
  buildSearchRecord?: (row: TData) => Record<string, unknown>;
  searchActionId?: string;
  searchPlaceholder?: string;
  filteredCount: number;
  addHref?: string;
  onAdd?: () => void;
  /**
   * Renderizado entre a busca e o botão "Novo" - ex.: um seletor de
   * visualização (Lista/Calendário) com `RecordBrowserViewSwitcher`. Fica
   * na mesma linha, não é um slot separado abaixo da busca.
   */
  viewSwitcherSlot?: React.ReactNode;
  /**
   * Quando informado, mostra o botão "Colunas" na mesma barra do filtro
   * (via `ColumnVisibilityMenu`/`ColumnVisibilityProvider`,
   * `web-client/views/ListView.tsx`) - qualquer `ListView` renderizado
   * dentro de `children` sincroniza sozinho, sem prop extra nele.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns?: ColumnDef<any, unknown>[];
  /**
   * true quando a relation e o conteudo inteiro da aba (ex.: Encontros) e
   * a barra `bg-toolbar` deve encostar nas bordas reais do Detail (sem
   * `rounded-lg`, sangrando com `-mx-4`) em vez do "cartao" com cantos
   * arredondados usado quando a relation convive com outro conteudo.
   */
  flushToolbar?: boolean;
  children: React.ReactNode;
};

export function RelationListHost<TData>({
  title,
  subtitle,
  data,
  searchText,
  onSearchTextChange,
  domain,
  onDomainChange,
  groupBy = [],
  onGroupByChange,
  groupByOptions,
  groupByMode = "single",
  allowEmptyGroupBy = false,
  filterFields,
  buildSearchRecord,
  searchActionId,
  searchPlaceholder = "Pesquisar registros",
  filteredCount,
  addHref,
  onAdd,
  viewSwitcherSlot,
  columns,
  flushToolbar = false,
  children,
}: RelationListHostProps<TData>) {
  const resolvedSearchView = React.useMemo<SearchViewDefinition | null>(() => {
    if (!filterFields?.length) return null;
    return {
      id: searchActionId ?? `detail-relation:${title ?? "records"}`,
      model: "detail.relation",
      fields: filterFields,
      // Sem isso, o badge de agrupamento (queryFacets.tsx -> groupByLabel)
      // nao acha o rotulo e cai no nome bruto do campo (ingles, ex.:
      // "peopleGroups"/"scheduledDate") em vez do label de
      // groupByOptions (ex.: "Grupo de pessoas"/"Data").
      groupBy: groupByOptions,
    };
  }, [filterFields, groupByOptions, searchActionId, title]);

  const removeDomainCondition = React.useCallback((index: number) => {
    onDomainChange(removeConditionAtIndex(domain, "and", index));
  }, [domain, onDomainChange]);

  const queryFacets = React.useMemo(
    () =>
      resolvedSearchView
        ? buildQueryFacets({
          domain,
          groupBy,
          searchView: resolvedSearchView,
          onClearGroupBy: () => onGroupByChange?.([]),
          onClearDomain: () => onDomainChange(null),
          onRemoveDomainCondition: removeDomainCondition,
        })
        : [],
    [domain, groupBy, onDomainChange, onGroupByChange, removeDomainCondition, resolvedSearchView],
  );

  const valueSuggestions = React.useCallback(
    (fieldName: string) => {
      if (!resolvedSearchView || !buildSearchRecord) return [];
      const values = new Set<string>();
      data.forEach((row) => {
        const value = buildSearchRecord(row)[fieldName];
        if (Array.isArray(value)) {
          value.forEach((entry) => {
            const normalized = String(entry ?? "").trim();
            if (normalized) values.add(normalized);
          });
          return;
        }
        const normalized = String(value ?? "").trim();
        if (normalized) values.add(normalized);
      });
      return Array.from(values).sort((left, right) => left.localeCompare(right));
    },
    [buildSearchRecord, data, resolvedSearchView],
  );

  const filteredCountLabel = filteredCount.toLocaleString("pt-BR");
  const hasActiveFilters = Boolean(domain) || groupBy.length > 0;

  const content = (
    <section className="space-y-4">
      <div
        className={cn(
          "flex flex-wrap items-center gap-3 bg-toolbar",
          flushToolbar ? "sticky top-11 z-10 px-4 py-4 lg:-mr-2" : "rounded-lg px-3 py-2",
        )}
      >
        <div className="min-w-[200px] flex-1">
          <SearchBar
            value={searchText}
            onChange={onSearchTextChange}
            placeholder={searchPlaceholder}
            className="border-border"
            facets={queryFacets}
            rightSlot={
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
                  {filteredCountLabel}
                </span>
                {columns ? (
                  <ColumnVisibilityMenu
                    triggerVariant="ghost"
                    triggerSize="icon"
                    triggerClassName={CONTROL_BUTTON_CLASS_NAME}
                    showTriggerLabel={false}
                  />
                ) : null}
                {resolvedSearchView ? (
                  <SearchPanelMenu
                    actionId={resolvedSearchView.id}
                    searchView={resolvedSearchView}
                    domain={domain}
                    onDomainChange={onDomainChange}
                    groupBy={groupBy}
                    onGroupByChange={onGroupByChange ?? (() => undefined)}
                    groupByOptions={groupByOptions ?? []}
                    groupByMode={groupByMode}
                    allowEmptyGroupBy={allowEmptyGroupBy}
                    snapshot={{ searchText, domain, groupBy }}
                    valueSuggestions={valueSuggestions}
                    onApplyFavorite={(snapshot) => {
                      onSearchTextChange(String(snapshot.searchText ?? ""));
                      onDomainChange((snapshot.domain as Domain) ?? null);
                      onGroupByChange?.(
                        Array.isArray(snapshot.groupBy)
                          ? (snapshot.groupBy as string[])
                          : [],
                      );
                    }}
                    variant="compact"
                    trigger={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn(CONTROL_BUTTON_CLASS_NAME, "relative text-blue-600 dark:text-blue-400")}
                        title="Filtros"
                        aria-label="Filtros"
                      >
                        <SlidersHorizontal className="size-4" />
                        {hasActiveFilters ? (
                          <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary" />
                        ) : null}
                      </Button>
                    }
                  />
                ) : null}
              </div>
            }
          />
        </div>
        {viewSwitcherSlot ? <div className="shrink-0">{viewSwitcherSlot}</div> : null}
        {addHref ? (
          <Button type="button" size="sm" className="shrink-0" asChild>
            <Link href={addHref}>Novo</Link>
          </Button>
        ) : onAdd ? (
          <Button type="button" size="sm" className="shrink-0" onClick={onAdd}>
            Novo
          </Button>
        ) : null}
      </div>

      {title || subtitle ? (
        <div className="sr-only">
          {title ? <h3>{title}</h3> : null}
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      ) : null}

      {children}
    </section>
  );

  if (!columns) return content;

  return (
    <ColumnVisibilityProvider
      storageKey={searchActionId ?? "relation-list"}
      columns={columns}
    >
      {content}
    </ColumnVisibilityProvider>
  );
}
