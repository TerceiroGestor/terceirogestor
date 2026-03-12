"use client";

import * as React from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { ColumnDef, ColumnPinningState } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
}: DetailRelationTablePanelProps<TData>) {
  const [query, setQuery] = React.useState("");

  const filteredRows = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return data;
    if (filterRow) {
      return data.filter((row) => filterRow(row, normalizedQuery));
    }
    return data;
  }, [data, filterRow, query]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[280px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9"
          />
        </div>
        {addHref ? (
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href={addHref}>{addLabel}</Link>
          </Button>
        ) : onAdd ? (
          <Button type="button" variant="outline" size="sm" onClick={onAdd}>
            {addLabel}
          </Button>
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
