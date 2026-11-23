"use client";

import * as React from "react";
import type { ColumnDef, ColumnPinningState } from "@tanstack/react-table";
import { matchesDomainRecord } from "@/web-client/domain/evaluate";
import type { Domain } from "@/web-client/domain/types";
import type { SearchFieldDefinition } from "@/web-client/search/types";
import { RelationListHost } from "@/web-client/relation/RelationListHost";
import { ListView } from "@/web-client/views/ListView";

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
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
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
  loading = false,
  error = null,
  emptyMessage = "Nenhum registro encontrado.",
  onRowClick,
  tableInitialColumnPinning,
  filterFields,
  buildSearchRecord,
  searchActionId,
}: DetailRelationTablePanelProps<TData>) {
  const [query, setQuery] = React.useState("");
  const [domain, setDomain] = React.useState<Domain>(null);
  const [groupBy, setGroupBy] = React.useState<string[]>([]);

  const filteredRows = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return data.filter((row) => {
      const matchesText = normalizedQuery
        ? filterRow
          ? filterRow(row, normalizedQuery)
          : true
        : true;

      if (!matchesText) return false;
      if (!filterFields?.length || !buildSearchRecord) return true;

      const record = buildSearchRecord(row);
      return matchesDomainRecord(
        record,
        domain,
        (current, field) => current[field as keyof typeof current],
      );
    });
  }, [buildSearchRecord, data, domain, filterFields?.length, filterRow, query]);

  return (
    <RelationListHost
      flushToolbar
      title={title}
      subtitle={subtitle}
      data={data}
      searchText={query}
      onSearchTextChange={setQuery}
      domain={domain}
      onDomainChange={setDomain}
      groupBy={groupBy}
      onGroupByChange={setGroupBy}
      filterFields={filterFields}
      buildSearchRecord={buildSearchRecord}
      searchActionId={searchActionId}
      searchPlaceholder={searchPlaceholder}
      filteredCount={filteredRows.length}
      addHref={addHref}
      onAdd={onAdd}
      columns={columns}
    >
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Carregando...</p>
      ) : !error && filteredRows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ListView
          data={filteredRows}
          columns={columns}
          getRowId={getRowId}
          onRowClick={onRowClick}
          initialColumnPinning={tableInitialColumnPinning}
          showColumnVisibilityButton={false}
          bordered={false}
          stickyHeaderOffsetPx={117}
        />
      )}
    </RelationListHost>
  );
}
