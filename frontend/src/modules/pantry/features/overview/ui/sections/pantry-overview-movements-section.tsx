"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionCard } from "@/components/section-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PantryMovementTimeline,
  type PantryMovementTimelineRow,
} from "@/modules/pantry/shared/ui/pantry-movement-timeline";

export type PantryRecentMovement = {
  id: string;
  kind: "ENTRY" | "EXIT";
  date: string;
  itemId: string;
  itemName: string;
  unit: string;
  quantity: number;
  sector: string;
  actor: string;
  meta: string;
  notes: string | null;
  expiryDate: string | null;
  exitType?: string | null;
  eventName?: string | null;
};

type PantryOverviewMovementsSectionProps = {
  movements: PantryRecentMovement[];
  onMovementClick: (movement: PantryRecentMovement) => void;
  formatDate: (value: string | null) => string;
};

function toDateOnlyIso(value: string) {
  const iso = value.length >= 10 ? value.slice(0, 10) : value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  return iso;
}

export function PantryOverviewMovementsSection({
  movements,
  onMovementClick,
  formatDate,
}: PantryOverviewMovementsSectionProps) {
  const [kind, setKind] = React.useState<"ALL" | "ENTRY" | "EXIT">("ALL");
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [exitType, setExitType] = React.useState("all");
  const [eventQuery, setEventQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    if (!movements.length) return [];

    const query = search.trim().toLowerCase();
    const event = eventQuery.trim().toLowerCase();

    return movements
      .filter((movement) => {
        if (kind !== "ALL" && movement.kind !== kind) return false;

        const movementDay = toDateOnlyIso(movement.date);
        if (fromDate && movementDay && movementDay < fromDate) return false;
        if (toDate && movementDay && movementDay > toDate) return false;

        if (query && !movement.itemName.toLowerCase().includes(query)) return false;

        if (movement.kind === "EXIT") {
          if (exitType !== "all" && movement.exitType !== exitType) return false;
          if (event) {
            const match =
              (movement.eventName ?? "").toLowerCase().includes(event) ||
              (movement.meta ?? "").toLowerCase().includes(event);
            if (!match) return false;
          }
        }

        return true;
      })
      .slice()
      .sort((a, b) => {
        const aTime = new Date(a.date).getTime();
        const bTime = new Date(b.date).getTime();
        if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
        if (Number.isNaN(aTime)) return 1;
        if (Number.isNaN(bTime)) return -1;
        return bTime - aTime;
      });
  }, [movements, kind, fromDate, toDate, search, exitType, eventQuery]);

  const rows = React.useMemo<PantryMovementTimelineRow[]>(
    () =>
      filtered.map((movement) => ({
        id: movement.id,
        kind: movement.kind,
        date: movement.date,
        sector: movement.sector,
        quantity: movement.quantity,
        unit: movement.unit,
        actor: movement.actor,
        notes: movement.notes,
        meta: movement.meta,
        expiryDate: movement.expiryDate,
        itemName: movement.itemName,
        onClick: () => onMovementClick(movement),
      })),
    [filtered, onMovementClick],
  );

  return (
    <SectionCard
      title="Movimentos recentes"
      subtitle="Entradas e saídas mais recentes, com setor e responsável."
    >
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[200px]">
          <p className="pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Alimento
          </p>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar por alimento"
          />
        </div>
        <div className="min-w-[200px]">
          <p className="pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Tipo (saídas)
          </p>
          <Select value={exitType} onValueChange={setExitType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ATTENDED">Atendidos</SelectItem>
              <SelectItem value="DONATION">Doações</SelectItem>
              <SelectItem value="EVENT">Eventos</SelectItem>
              <SelectItem value="PARTY">Festas</SelectItem>
              <SelectItem value="CORRECTION">Correção</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[240px]">
          <p className="pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Evento (saídas)
          </p>
          <Input
            value={eventQuery}
            onChange={(e) => setEventQuery(e.target.value)}
            placeholder="Filtrar por evento"
          />
        </div>
        <div className="min-w-[150px]">
          <p className="pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            De
          </p>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div className="min-w-[150px]">
          <p className="pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Até
          </p>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
        <div className="flex flex-wrap items-center gap-3 py-2">
          <Button
            type="button"
            size="sm"
            variant={kind === "ALL" ? "default" : "outline"}
            onClick={() => setKind("ALL")}
          >
            Todos
          </Button>
          <Button
            type="button"
            size="sm"
            variant={kind === "ENTRY" ? "default" : "outline"}
            onClick={() => setKind("ENTRY")}
          >
            Entradas
          </Button>
          <Button
            type="button"
            size="sm"
            variant={kind === "EXIT" ? "default" : "outline"}
            onClick={() => setKind("EXIT")}
          >
            Saídas
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <PantryMovementTimeline
          rows={rows}
          formatDate={formatDate}
          emptyLabel="Sem movimentos recentes."
          scrollClassName="max-h-[420px]"
        />
      </div>
    </SectionCard>
  );
}
