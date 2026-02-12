"use client";

import * as React from "react";
import clsx from "clsx";
import { Badge } from "@/components/ui/badge";
import { PantryTimeline } from "@/features/pantry/ui/pantry-timeline";

export type PantryMovementTimelineRow = {
  id: string;
  kind: "ENTRY" | "EXIT";
  date: string;
  sector: string;
  quantity: number;
  unit: string;
  actor: string;
  notes?: string | null;
  meta?: string | null;
  expiryDate?: string | null;
  usage?: string | null;
  itemName?: string | null;
  onClick?: () => void;
};

type PantryMovementTimelineProps = {
  rows: PantryMovementTimelineRow[];
  emptyLabel?: string;
  scrollClassName?: string;
  scroll?: boolean;
  formatDate: (value: string | null) => string;
  formatDateTime: (value: string) => string;
};

function formatRelativeShort(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = date.getTime() - Date.now();
  const absMs = Math.abs(diffMs);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  const rtf = new Intl.RelativeTimeFormat("pt-BR", {
    numeric: "auto",
    style: "short",
  });

  if (absMs < hour) {
    const minutes = Math.round(diffMs / minute);
    return rtf.format(minutes, "minute");
  }
  if (absMs < day) {
    const hours = Math.round(diffMs / hour);
    return rtf.format(hours, "hour");
  }
  const days = Math.round(diffMs / day);
  return rtf.format(days, "day");
}

export function PantryMovementTimeline({
  rows,
  emptyLabel,
  scrollClassName,
  scroll,
  formatDate,
  formatDateTime,
}: PantryMovementTimelineProps) {
  return (
    <PantryTimeline
      showRail={false}
      scroll={scroll}
      scrollClassName={scrollClassName}
      emptyLabel={emptyLabel}
      items={rows.map((movement) => ({
        id: movement.id,
        onClick: movement.onClick,
        title: (
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {movement.itemName ? (
                <span className="text-xs font-semibold text-foreground">
                  {movement.itemName}
                </span>
              ) : null}
              <Badge variant={movement.kind === "ENTRY"}>
                {movement.kind === "ENTRY" ? "Entrada" : "Saída"}
              </Badge>
              {movement.usage ? (
                <Badge variant="outline">{movement.usage}</Badge>
              ) : null}
              <span className="rounded-md bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                Setor: {movement.sector}
              </span>
            </div>
            <span
              className={clsx(
                "rounded-md px-2 py-0.5 font-mono text-[11px] tabular-nums",
                movement.kind === "ENTRY"
                  ? "bg-emerald-500/10 text-emerald-700"
                  : "bg-rose-500/10 text-rose-700",
              )}
            >
              {movement.kind === "ENTRY" ? "+" : "-"}
              {Number(movement.quantity).toLocaleString("pt-BR")} {movement.unit}
            </span>
          </div>
        ),
        subtitle: (
          <div className="flex flex-wrap items-center gap-2">
            {movement.meta ? (
              <span className="rounded-md bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {movement.meta}
              </span>
            ) : null}
            {movement.expiryDate ? (
              <span className="rounded-md bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                Validade: {formatDate(movement.expiryDate)}
              </span>
            ) : null}
          </div>
        ),
        meta: (
          <>
            <span className="text-foreground">Por: {movement.actor}</span>
            <span>•</span>
            <span className="font-mono tabular-nums">
              {formatDateTime(movement.date)}
            </span>
            <span>•</span>
            <span className="font-mono tabular-nums">
              {formatRelativeShort(movement.date)}
            </span>
            {movement.notes ? (
              <>
                <span>•</span>
                <span className="truncate">Obs.: {movement.notes}</span>
              </>
            ) : null}
          </>
        ),
      }))}
    />
  );
}
