"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

function formatDateLabel(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${d}/${m}/${y}`;
}

export function TimelineView<TItem>({
  items,
  getDate,
  renderTitle,
  renderBody,
  className,
  emptyState = "Nada para exibir.",
}: {
  items: TItem[];
  getDate: (item: TItem) => Date | null;
  renderTitle: (item: TItem) => React.ReactNode;
  renderBody?: (item: TItem) => React.ReactNode;
  className?: string;
  emptyState?: string;
}) {
  const normalized = React.useMemo(() => {
    return items
      .map((item) => ({ item, date: getDate(item) }))
      .filter((x): x is { item: TItem; date: Date } => Boolean(x.date))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [getDate, items]);

  if (!normalized.length) {
    return (
      <div className="rounded-md border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
        {emptyState}
      </div>
    );
  }

  return (
    <div className={cn("rounded-md border border-border/60 bg-background", className)}>
      <div className="divide-y divide-border/60">
        {normalized.map(({ item, date }, index) => (
          <div key={index} className="flex gap-3 px-3 py-3">
            <div className="flex w-[5.5rem] shrink-0 flex-col items-end">
              <div className="text-[11px] font-medium text-muted-foreground">
                {formatDateLabel(date)}
              </div>
            </div>

            <div className="relative flex min-w-0 flex-1 gap-3">
              <div className="relative mt-1">
                <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-border/60" />
                <div className="relative size-2 rounded-full bg-primary" />
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="truncate text-sm font-semibold text-foreground">
                  {renderTitle(item)}
                </div>
                {renderBody ? (
                  <div className="text-xs text-muted-foreground">{renderBody(item)}</div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

