"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type MentionSuggestionUser = {
  id: string;
  name: string;
  email?: string | null;
};

export type MentionSuggestionListHandle = {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
};

export const MentionSuggestionList = React.forwardRef<
  MentionSuggestionListHandle,
  { items: MentionSuggestionUser[]; command: (user: MentionSuggestionUser) => void }
>(function MentionSuggestionList({ items, command }, ref) {
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  const selectItem = React.useCallback(
    (index: number) => {
      const item = items[index];
      if (item) command(item);
    },
    [command, items],
  );

  React.useImperativeHandle(
    ref,
    () => ({
      onKeyDown: ({ event }) => {
        if (!items.length) return false;

        if (event.key === "ArrowDown") {
          setSelectedIndex((previous) => (previous + 1) % items.length);
          return true;
        }
        if (event.key === "ArrowUp") {
          setSelectedIndex((previous) => (previous + items.length - 1) % items.length);
          return true;
        }
        if (event.key === "Enter") {
          selectItem(selectedIndex);
          return true;
        }
        return false;
      },
    }),
    [items.length, selectItem, selectedIndex],
  );

  if (!items.length) {
    return (
      <div className="w-64 rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground shadow-md">
        Nenhuma pessoa encontrada.
      </div>
    );
  }

  return (
    <div className="max-h-56 w-64 overflow-y-auto rounded-md border border-border bg-background py-1 shadow-md">
      {items.map((item, index) => (
        <button
          key={item.id}
          type="button"
          className={cn(
            "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm",
            index === selectedIndex
              ? "bg-primary/10 text-foreground"
              : "text-foreground hover:bg-muted/60",
          )}
          onMouseDown={(event) => {
            event.preventDefault();
            selectItem(index);
          }}
        >
          <span className="truncate font-medium">{item.name}</span>
          {item.email ? (
            <span className="truncate text-xs text-muted-foreground">{item.email}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
});
