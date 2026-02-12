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
} from "@/features/pantry/ui/pantry-movement-timeline";

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
  formatDateTime: (value: string) => string;
  formatDate: (value: string | null) => string;
};

export function PantryOverviewMovementsSection({
  movements,
  onMovementClick,
  formatDateTime,
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
    const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
    const to = toDate ? new Date(`${toDate}T23:59:59`) : null;
    const query = search.trim().toLowerCase();
    const event = eventQuery.trim().toLowerCase();

    return movements.filter((movement) => {
      if (kind !== "ALL" && movement.kind !== kind) return false;
      const movementDate = new Date(movement.date);
      if (from && movementDate < from) return false;
      if (to && movementDate > to) return false;
      if (query && !movement.itemName.toLowerCase().includes(query))
        return false;
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground pb-2">
            Alimento
          </p>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar por Alimento"
          />
        </div>
        <div className="min-w-[200px]">
          <p className="text-[11px] pb-2 font-semibold uppercase tracking-[0.18em] text-muted-foreground">
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
          <p className="text-[11px] pb-2 font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Evento (saídas)
          </p>
          <Input
            value={eventQuery}
            onChange={(e) => setEventQuery(e.target.value)}
            placeholder="Filtrar por evento"
          />
        </div>
        <div className="min-w-[150px]">
          <p className="text-[11px] pb-2 font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            De
          </p>
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div className="min-w-[150px]">
          <p className="text-[11px] pb-2 font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Até
          </p>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
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
          formatDateTime={formatDateTime}
          emptyLabel="Sem movimentos recentes."
          scrollClassName="max-h-[420px]"
        />
      </div>
    </SectionCard>
  );
}
