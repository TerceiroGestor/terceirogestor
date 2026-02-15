"use client";

import * as React from "react";
import clsx from "clsx";
import { Badge } from "@/components/ui/badge";
import { PantryTimeline } from "@/modules/pantry/shared/ui/pantry-timeline";

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
};

function toDateOnlyIso(value: string) {
  const iso = value.length >= 10 ? value.slice(0, 10) : value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  return iso;
}

function parseIsoDateToLocalNoon(iso: string) {
  const [yearRaw, monthRaw, dayRaw] = iso.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function formatRelativeShortDateOnly(value: string) {
  const iso = toDateOnlyIso(value);
  if (!iso) return "";

  const movementDate = parseIsoDateToLocalNoon(iso);
  if (!movementDate) return "";

  const now = new Date();
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
  const todayDate = parseIsoDateToLocalNoon(todayIso);
  if (!todayDate) return "";

  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((movementDate.getTime() - todayDate.getTime()) / dayMs);

  const rtf = new Intl.RelativeTimeFormat("pt-BR", {
    numeric: "auto",
    style: "short",
  });
  return rtf.format(diffDays, "day");
}

export function PantryMovementTimeline({
  rows,
  emptyLabel,
  scrollClassName,
  scroll,
  formatDate,
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
              {movement.usage ? <Badge variant="outline">{movement.usage}</Badge> : null}
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
            <span className="font-mono tabular-nums">{formatDate(movement.date)}</span>
            <span>•</span>
            <span className="font-mono tabular-nums">
              {formatRelativeShortDateOnly(movement.date)}
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
