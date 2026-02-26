"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Column<TItem> = {
  key: string;
  label: string;
  items: TItem[];
};

export function KanbanView<TItem>({
  items,
  getColumnKey,
  getColumnLabel,
  columnOrder,
  renderCard,
  className,
  emptyState = "Nenhum registro.",
}: {
  items: TItem[];
  getColumnKey?: (item: TItem) => string;
  getColumnLabel?: (key: string) => string;
  columnOrder?: string[];
  renderCard: (item: TItem) => React.ReactNode;
  className?: string;
  emptyState?: string;
}) {
  const columns = React.useMemo<Column<TItem>[]>(() => {
    if (!getColumnKey) {
      return [{ key: "__all__", label: "", items }];
    }

    const map = new Map<string, TItem[]>();
    items.forEach((item) => {
      const key = getColumnKey(item) || "__empty__";
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    });

    const keys = columnOrder?.length ? columnOrder : Array.from(map.keys()).sort();
    return keys
      .map((key) => ({
        key,
        label: getColumnLabel ? getColumnLabel(key) : key,
        items: map.get(key) ?? [],
      }))
      .filter((col) => col.items.length || col.key === "__empty__" || col.key === "__all__");
  }, [columnOrder, getColumnKey, getColumnLabel, items]);

  if (!items.length) {
    return (
      <div className="rounded-md border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
        {emptyState}
      </div>
    );
  }

  const isGrouped = Boolean(getColumnKey);

  return (
    <div
      className={cn(
        isGrouped
          ? "flex gap-3 overflow-x-auto pb-2"
          : "grid gap-2 md:grid-cols-2 xl:grid-cols-3",
        className,
      )}
    >
      {columns.map((column) =>
        isGrouped ? (
          <div
            key={column.key}
            className="min-w-[18rem] max-w-[20rem] shrink-0 rounded-md border border-border/60 bg-muted/20"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2">
              <div className="text-xs font-semibold text-foreground">{column.label}</div>
              <div className="rounded bg-background/60 px-2 py-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
                {column.items.length}
              </div>
            </div>
            <div className="grid gap-2 p-2">
              {column.items.length ? (
                column.items.map((item, index) => (
                  <div key={`${column.key}-${index}`}>{renderCard(item)}</div>
                ))
              ) : (
                <div className="rounded-md border border-dashed border-border/60 p-3 text-center text-xs text-muted-foreground">
                  Vazio
                </div>
              )}
            </div>
          </div>
        ) : (
          <React.Fragment key={column.key}>
            {column.items.map((item, index) => (
              <div key={`${column.key}-${index}`}>{renderCard(item)}</div>
            ))}
          </React.Fragment>
        ),
      )}
    </div>
  );
}

