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
  remaining?: number | null;
  actor: string;
  notes?: string | null;
  meta?: string | null;
  expiryDate?: string | null;
  usage?: string | null;
  itemName?: string | null;
  actions?: React.ReactNode;
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

function formatExpiryDiffShort(value: string) {
  const iso = toDateOnlyIso(value);
  if (!iso) return "";

  const expiryDate = parseIsoDateToLocalNoon(iso);
  if (!expiryDate) return "";

  const now = new Date();
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
  const todayDate = parseIsoDateToLocalNoon(todayIso);
  if (!todayDate) return "";

  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((expiryDate.getTime() - todayDate.getTime()) / dayMs);

  if (diffDays === 0) return "Vence hoje";
  if (diffDays > 0) return `Vence em ${diffDays}d`;
  return `Vencido há ${Math.abs(diffDays)}d`;
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
          <div className="flex w-full flex-wrap items-start justify-between gap-2">
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
              {movement.meta ? (
                <span className="rounded-md bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {movement.meta}
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {movement.actions}
              <span
                className={clsx(
                  "rounded-md px-2 py-0.5 font-mono text-[11px] tabular-nums",
                  movement.kind === "ENTRY"
                    ? "bg-emerald-500/10 text-emerald-700"
                    : "bg-rose-500/10 text-rose-700",
                )}
              >
                {movement.kind === "ENTRY" ? "Entrada: +" : "Saída: -"}
                {Number(movement.quantity).toLocaleString("pt-BR")} {movement.unit}
              </span>
              {movement.kind === "ENTRY" && typeof movement.remaining === "number" ? (
                <span className="rounded-md bg-muted/40 px-2 py-0.5 font-mono text-[11px] tabular-nums text-foreground">
                  Restante: {Number(movement.remaining).toLocaleString("pt-BR")}{" "}
                  {movement.unit}
                </span>
              ) : null}
            </div>
          </div>
        ),
        subtitle: (
          <div className="flex flex-wrap items-center gap-2">
            {movement.expiryDate ? (
              <span className="rounded-md bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                Validade: {formatDate(movement.expiryDate)}{" "}
                <span className="font-mono tabular-nums text-foreground">
                  ({formatExpiryDiffShort(movement.expiryDate)})
                </span>
              </span>
            ) : null}
            <span className="rounded-md bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              Data: {formatDate(movement.date)}{" "}
              <span className="font-mono tabular-nums text-foreground">
                ({formatRelativeShortDateOnly(movement.date)})
              </span>
            </span>
          </div>
        ),
        meta: (
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-foreground">Por: {movement.actor}</span>
            </div>
            {movement.notes ? (
              <div className="break-words">
                <span className="text-foreground">Obs.:</span> {movement.notes}
              </div>
            ) : null}
          </div>
        ),
      }))}
    />
  );
}
