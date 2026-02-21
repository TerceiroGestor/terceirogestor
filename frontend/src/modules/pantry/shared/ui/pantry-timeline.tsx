"use client";

import type * as React from "react";
import clsx from "clsx";

export type PantryTimelineItem = {
  id: string;
  marker?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
  onClick?: () => void;
};

type PantryTimelineProps = {
  items: PantryTimelineItem[];
  emptyLabel?: string;
  className?: string;
  scrollClassName?: string;
  scroll?: boolean;
  showRail?: boolean;
};

export function PantryTimeline({
  items,
  emptyLabel = "Sem registros.",
  className,
  scrollClassName,
  scroll = true,
  showRail = true,
}: PantryTimelineProps) {
  if (!items.length) {
    return <p className="text-xs text-muted-foreground">{emptyLabel}</p>;
  }

  const content = (
    <div className={clsx("relative", showRail ? "pl-8" : "")}>
      {showRail ? (
        <div className="absolute left-2 top-0 h-full w-px bg-border/60" />
      ) : null}
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="relative">
            {showRail ? (
              <>
                <div className="absolute left-2 top-3 -translate-x-1/2">
                  {item.marker ?? (
                    <span className="block size-2 rounded-full bg-muted-foreground" />
                  )}
                </div>
                <div className="absolute left-2 top-3 h-px w-5 bg-border/60" />
              </>
            ) : null}

            {item.onClick ? (
              <button
                type="button"
                onClick={item.onClick}
                className="w-full rounded-xl border border-border/60 bg-card/40 px-3 py-2 text-left shadow-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-foreground">{item.title}</div>
                  {item.subtitle ? (
                    <div className="text-[11px] text-muted-foreground">
                      {item.subtitle}
                    </div>
                  ) : null}
                  {item.meta ? (
                    <div className="text-[10px] text-muted-foreground">{item.meta}</div>
                  ) : null}
                </div>
              </button>
            ) : (
              <div className="w-full rounded-xl border border-border/60 bg-card/40 px-3 py-2 shadow-sm">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-foreground">{item.title}</div>
                  {item.subtitle ? (
                    <div className="text-[11px] text-muted-foreground">
                      {item.subtitle}
                    </div>
                  ) : null}
                  {item.meta ? (
                    <div className="text-[10px] text-muted-foreground">{item.meta}</div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={clsx("relative", className)}>
      {scroll ? (
        <div className={clsx(scrollClassName ?? "max-h-[360px]", "overflow-y-auto pr-2")}>
          {content}
        </div>
      ) : (
        content
      )}
    </div>
  );
}
