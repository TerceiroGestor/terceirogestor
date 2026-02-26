"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

function toDateOnlyKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function CalendarView<TItem>({
  items,
  getDate,
  renderItem,
  className,
  emptyState = "Nenhum evento neste dia.",
}: {
  items: TItem[];
  getDate: (item: TItem) => Date | null;
  renderItem: (item: TItem) => React.ReactNode;
  className?: string;
  emptyState?: string;
}) {
  const [selected, setSelected] = React.useState<Date | undefined>(new Date());

  const byDay = React.useMemo(() => {
    const map = new Map<string, TItem[]>();
    items.forEach((item) => {
      const date = getDate(item);
      if (!date) return;
      const key = toDateOnlyKey(date);
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    });
    return map;
  }, [getDate, items]);

  const selectedKey = selected ? toDateOnlyKey(selected) : null;
  const selectedItems = selectedKey ? byDay.get(selectedKey) ?? [] : [];

  return (
    <div className={cn("grid gap-4 lg:grid-cols-[320px_1fr]", className)}>
      <div className="rounded-md border border-border/60 bg-background">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={setSelected}
          modifiers={{
            hasItems: (date) => byDay.has(toDateOnlyKey(date)),
          }}
          modifiersClassNames={{
            hasItems: "after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-primary",
          }}
        />
      </div>

      <div className="rounded-md border border-border/60 bg-background p-3">
        <div className="mb-2 text-xs font-semibold text-muted-foreground">
          {selectedKey ?? "Selecione uma data"}
        </div>
        {selectedItems.length ? (
          <div className="space-y-2">
            {selectedItems.map((item, index) => (
              <div key={index}>{renderItem(item)}</div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
            {emptyState}
          </div>
        )}
      </div>
    </div>
  );
}

