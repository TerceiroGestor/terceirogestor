"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type SearchFacet = {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onRemove?: () => void;
  removeLabel?: string;
};

export function SearchBar({
  value,
  onChange,
  placeholder = "Pesquisar...",
  className,
  facets,
  rightSlot,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
  facets?: SearchFacet[];
  rightSlot?: React.ReactNode;
}) {
  const showFacets = Boolean(facets?.length);
  const showRight = Boolean(rightSlot);

  if (showFacets || showRight) {
    return (
      <div className={cn("w-full", className)}>
        <div className="flex h-8 w-full items-center gap-1 rounded-md border border-input bg-transparent px-2 shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
          <Search className="size-4 shrink-0 text-muted-foreground" />

          {showFacets ? (
            <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {facets?.map((facet) => (
                <span
                  key={facet.key}
                  className="inline-flex shrink-0 items-center gap-1 rounded-sm border border-border/60 bg-muted/30 px-1.5 py-0.5 text-[11px] text-muted-foreground"
                  title={facet.label}
                >
                  {facet.icon ? (
                    <span className="shrink-0 text-muted-foreground">{facet.icon}</span>
                  ) : null}
                  <span className="max-w-[12rem] truncate">{facet.label}</span>
                  {facet.onRemove ? (
                    <button
                      type="button"
                      className="ml-0.5 inline-flex size-4 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                      title={facet.removeLabel ?? "Remover"}
                      aria-label={facet.removeLabel ?? "Remover"}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        facet.onRemove?.();
                      }}
                    >
                      <X className="size-3.5" />
                    </button>
                  ) : null}
                </span>
              ))}

              <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="h-7 min-w-[120px] flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
          ) : (
            <input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="h-7 min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
            />
          )}

          {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full", className)}>
      <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 pl-8 text-xs"
      />
    </div>
  );
}
