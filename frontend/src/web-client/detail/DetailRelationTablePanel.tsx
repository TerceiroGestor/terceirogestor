"use client";

import * as React from "react";
import Link from "next/link";
import type { ColumnDef, ColumnPinningState } from "@tanstack/react-table";
import { ChevronRight } from "lucide-react";
import { SearchBar } from "@/web-client/control-panel/SearchBar";
import { SearchPanelMenu } from "@/web-client/control-panel/SearchPanelMenu";
import { buildQueryFacets } from "@/web-client/control-panel/queryFacets";
import { removeConditionAtIndex } from "@/web-client/domain/conditions";
import { matchesDomainRecord } from "@/web-client/domain/evaluate";
import type { Domain } from "@/web-client/domain/types";
import type { SearchFieldDefinition, SearchViewDefinition } from "@/web-client/search/types";
import { TableView } from "@/web-client/views/TableView";

type DetailRelationTablePanelProps<TData> = {
  title?: string;
  subtitle?: string;
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  getRowId?: (row: TData, index: number) => string;
  searchPlaceholder?: string;
  filterRow?: (row: TData, query: string) => boolean;
  onAdd?: () => void;
  addHref?: string;
  addLabel?: string;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  tableMinWidthClassName?: string;
  onRowClick?: (row: TData) => void;
  tableInitialColumnPinning?: ColumnPinningState;
  filterFields?: SearchFieldDefinition[];
  buildSearchRecord?: (row: TData) => Record<string, unknown>;
  searchActionId?: string;
};

export function DetailRelationTablePanel<TData>({
  title,
  subtitle,
  data,
  columns,
  getRowId,
  searchPlaceholder = "Pesquisar registros",
  filterRow,
  onAdd,
  addHref,
  addLabel = "Novo registro",
  loading = false,
  error = null,
  emptyMessage = "Nenhum registro encontrado.",
  tableMinWidthClassName = "min-w-[1080px]",
  onRowClick,
  tableInitialColumnPinning,
  filterFields,
  buildSearchRecord,
  searchActionId,
}: DetailRelationTablePanelProps<TData>) {
  const [query, setQuery] = React.useState("");
  const [domain, setDomain] = React.useState<Domain>(null);
  const [groupBy, setGroupBy] = React.useState<string[]>([]);

  const resolvedSearchView = React.useMemo<SearchViewDefinition | null>(() => {
    if (!filterFields?.length) return null;
    return {
      id: searchActionId ?? `detail-relation:${title ?? addLabel ?? "records"}`,
      model: "detail.relation",
      fields: filterFields,
      features: {
        groupBy: false,
      },
    };
  }, [addLabel, filterFields, searchActionId, title]);

  const removeDomainCondition = React.useCallback((index: number) => {
    setDomain((previous) => removeConditionAtIndex(previous, "and", index));
  }, []);

  const queryFacets = React.useMemo(
    () =>
      resolvedSearchView
        ? buildQueryFacets({
            domain,
            groupBy,
            searchView: resolvedSearchView,
            onClearGroupBy: () => setGroupBy([]),
            onClearDomain: () => setDomain(null),
            onRemoveDomainCondition: removeDomainCondition,
          })
        : [],
    [domain, groupBy, removeDomainCondition, resolvedSearchView],
  );

  const filteredRows = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return data.filter((row) => {
      const matchesText = normalizedQuery
        ? filterRow
          ? filterRow(row, normalizedQuery)
          : true
        : true;

      if (!matchesText) return false;
      if (!resolvedSearchView || !buildSearchRecord) return true;

      const record = buildSearchRecord(row);
      return matchesDomainRecord(
        record,
        domain,
        (current, field) => current[field as keyof typeof current],
      );
    });
  }, [buildSearchRecord, data, domain, filterRow, query, resolvedSearchView]);

  const filteredCountLabel = filteredRows.length.toLocaleString("pt-BR");

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[280px] flex-1">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder={searchPlaceholder}
            facets={queryFacets}
            rightSlot={
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
                  {filteredCountLabel}
                </span>
                {resolvedSearchView ? (
                  <SearchPanelMenu
                    actionId={resolvedSearchView.id}
                    searchView={resolvedSearchView}
                    domain={domain}
                    onDomainChange={setDomain}
                    groupBy={groupBy}
                    onGroupByChange={setGroupBy}
                    groupByOptions={[]}
                    snapshot={{ searchText: query, domain, groupBy }}
                    onApplyFavorite={(snapshot) => {
                      setQuery(String(snapshot.searchText ?? ""));
                      setDomain((snapshot.domain as Domain) ?? null);
                      setGroupBy(
                        Array.isArray(snapshot.groupBy)
                          ? (snapshot.groupBy as string[])
                          : [],
                      );
                    }}
                    variant="compact"
                  />
                ) : null}
              </div>
            }
          />
        </div>
        {addHref ? (
          <Link
            href={addHref}
            className="inline-flex h-10 shrink-0 items-center justify-end gap-1 border-b border-transparent px-0 text-base font-medium text-foreground transition hover:text-primary"
          >
            <span>{addLabel}</span>
            <ChevronRight className="size-4" />
          </Link>
        ) : onAdd ? (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex h-10 shrink-0 items-center justify-end gap-1 border-b border-transparent px-0 text-base font-medium text-foreground transition hover:text-primary"
          >
            <span>{addLabel}</span>
            <ChevronRight className="size-4" />
          </button>
        ) : null}
      </div>

      {title || subtitle ? (
        <div className="sr-only">
          {title ? <h3>{title}</h3> : null}
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <TableView
        data={filteredRows}
        columns={columns}
        getRowId={getRowId}
        onRowClick={onRowClick}
        className="bg-transparent"
        minWidthClassName={tableMinWidthClassName}
        initialColumnPinning={tableInitialColumnPinning}
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : null}

      {!loading && !error && filteredRows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : null}
    </section>
  );
}
