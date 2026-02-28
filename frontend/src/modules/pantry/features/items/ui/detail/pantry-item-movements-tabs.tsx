"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateOnlyPtBR } from "@/lib/date";
import { cn } from "@/lib/utils";
import type {
  ApiPantryDonor,
  ApiPantryEntry,
  ApiPantryExit,
  ApiPantryHistoryMovement,
} from "@/modules/pantry/api";
import type {
  EntryDraft,
  ExitDraft,
  PantryItemDetailMode,
} from "@/modules/pantry/features/items/domain/pantry-item-detail.types";
import { toNumber, resolveExitTypeLabel } from "@/modules/pantry/features/items/domain/pantry-item-detail.helpers";
import {
  PANTRY_DEFAULT_SECTOR,
  PANTRY_ENTRY_DONOR_NONE_VALUE,
  PANTRY_EXIT_ENTRY_AUTO_VALUE,
  PANTRY_EXIT_TYPE_LABELS,
} from "@/modules/pantry/shared/domain/pantry.constants";

function resolveKindLabel(kind: ApiPantryHistoryMovement["kind"]) {
  return kind === "ENTRY" ? "Entrada" : "Saída";
}

export type PantryItemMovementsTabsProps = {
  mode: PantryItemDetailMode;
  saving: boolean;
  readOnly: boolean;
  movementsLoading: boolean;
  entryRows: ApiPantryEntry[];
  exitRows: ApiPantryExit[];
  historyRows: ApiPantryHistoryMovement[];
  entryDraft: EntryDraft;
  setEntryDraft: React.Dispatch<React.SetStateAction<EntryDraft>>;
  exitDraft: ExitDraft;
  setExitDraft: React.Dispatch<React.SetStateAction<ExitDraft>>;
  sectorOptions: string[];
  sectorsLoading: boolean;
  donors: ApiPantryDonor[];
  donorsLoading: boolean;
  onOpenNewDonor: () => void;
  submitEntry: () => void;
  submitExit: () => void;
  exitEntryOptions: ApiPantryEntry[];
  exitEntryTriggerLabel: string;
  inputLineClassName: string;
};

export function PantryItemMovementsTabs({
  mode,
  saving,
  readOnly,
  movementsLoading,
  entryRows,
  exitRows,
  historyRows,
  entryDraft,
  setEntryDraft,
  exitDraft,
  setExitDraft,
  sectorOptions,
  sectorsLoading,
  donors,
  donorsLoading,
  onOpenNewDonor,
  submitEntry,
  submitExit,
  exitEntryOptions,
  exitEntryTriggerLabel,
  inputLineClassName,
}: PantryItemMovementsTabsProps) {
  return (
    <div className="pt-3">
      <Tabs defaultValue="entries">
        <TabsList className="h-9 w-full justify-start gap-4 rounded-none border-0 border-b border-border/60 bg-transparent p-0">
          <TabsTrigger
            value="entries"
            className="rounded-none border-b-2 border-transparent bg-transparent px-0 text-xs text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=inactive]:hover:bg-transparent"
          >
            Entradas
          </TabsTrigger>
          <TabsTrigger
            value="exits"
            className="rounded-none border-b-2 border-transparent bg-transparent px-0 text-xs text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=inactive]:hover:bg-transparent"
          >
            Saídas
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-none border-b-2 border-transparent bg-transparent px-0 text-xs text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=inactive]:hover:bg-transparent"
          >
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entries" className="mt-3">
          {mode !== "edit" ? (
            <div className="rounded-md border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
              Salve o alimento para registrar entradas.
            </div>
          ) : movementsLoading ? (
            <div className="text-sm text-muted-foreground">Carregando...</div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-md border border-border/60 bg-background px-3 py-2">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-[120px_90px_1fr_1fr_160px_160px_1fr_auto] md:items-end">
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={String(entryDraft.quantity)}
                    onChange={(e) =>
                      setEntryDraft((prev) => ({
                        ...prev,
                        quantity: toNumber(e.target.value),
                      }))
                    }
                    className={inputLineClassName}
                    placeholder="Qtd."
                    readOnly={saving || readOnly}
                  />

                  <Input
                    value={entryDraft.unit}
                    onChange={(e) => setEntryDraft((prev) => ({ ...prev, unit: e.target.value }))}
                    className={inputLineClassName}
                    placeholder="Un."
                    readOnly={saving || readOnly}
                  />

                  <Select
                    value={entryDraft.sector}
                    onValueChange={(value) => setEntryDraft((prev) => ({ ...prev, sector: value }))}
                    disabled={saving || readOnly || sectorsLoading}
                  >
                    <SelectTrigger className={inputLineClassName}>
                      <SelectValue placeholder="Setor" />
                    </SelectTrigger>
                    <SelectContent>
                      {sectorOptions.map((sector) => (
                        <SelectItem key={sector} value={sector}>
                          {sector}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex items-end gap-2">
                    <Select
                      value={entryDraft.donorId ?? PANTRY_ENTRY_DONOR_NONE_VALUE}
                      onValueChange={(value) => {
                        if (value === PANTRY_ENTRY_DONOR_NONE_VALUE) {
                          setEntryDraft((prev) => ({ ...prev, donorId: null }));
                          return;
                        }
                        setEntryDraft((prev) => ({ ...prev, donorId: value }));
                      }}
                      disabled={saving || readOnly || donorsLoading}
                    >
                      <SelectTrigger className={inputLineClassName}>
                        <SelectValue placeholder="Doador" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={PANTRY_ENTRY_DONOR_NONE_VALUE}>Sem doador</SelectItem>
                        {donors.map((donor) => (
                          <SelectItem key={donor.id} value={donor.id}>
                            {donor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      title="Novo doador"
                      aria-label="Novo doador"
                      onClick={onOpenNewDonor}
                      disabled={saving || readOnly}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>

                  <Input
                    type="date"
                    value={entryDraft.entryDate}
                    onChange={(e) => setEntryDraft((prev) => ({ ...prev, entryDate: e.target.value }))}
                    className={inputLineClassName}
                    readOnly={saving || readOnly}
                    title="Data da entrada"
                  />

                  <Input
                    type="date"
                    value={entryDraft.expiryDate}
                    onChange={(e) => setEntryDraft((prev) => ({ ...prev, expiryDate: e.target.value }))}
                    className={inputLineClassName}
                    readOnly={saving || readOnly}
                    title="Validade (opcional)"
                  />

                  <Input
                    value={entryDraft.notes}
                    onChange={(e) => setEntryDraft((prev) => ({ ...prev, notes: e.target.value }))}
                    className={inputLineClassName}
                    placeholder="Notas (opcional)"
                    readOnly={saving || readOnly}
                  />

                  <Button
                    type="button"
                    size="sm"
                    onClick={submitEntry}
                    disabled={saving || readOnly}
                    className="h-8"
                  >
                    {saving ? "..." : "Adicionar"}
                  </Button>
                </div>
              </div>

              {entryRows.length ? (
                <div className="space-y-2">
                  {entryRows.slice(0, 80).map((row) => (
                    <div
                      key={row.id}
                      className="rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge className="border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-200">
                              Entrada
                            </Badge>
                            <div className="truncate text-sm font-semibold text-foreground">
                              {formatDateOnlyPtBR(row.entryDate)}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {row.sector || PANTRY_DEFAULT_SECTOR}
                            {row.donor?.name ? ` • ${row.donor.name}` : ""}
                            {row.expiryDate ? ` • validade ${formatDateOnlyPtBR(row.expiryDate)}` : ""}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-sm tabular-nums text-foreground">
                            {Number(row.quantity).toLocaleString("pt-BR")}
                          </div>
                          <div className="text-[11px] text-muted-foreground">{row.unit}</div>
                        </div>
                      </div>
                      {row.notes ? (
                        <div className="mt-1 text-xs text-muted-foreground">{row.notes}</div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
                  Sem entradas.
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="exits" className="mt-3">
          {mode !== "edit" ? (
            <div className="rounded-md border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
              Salve o alimento para registrar saídas.
            </div>
          ) : movementsLoading ? (
            <div className="text-sm text-muted-foreground">Carregando...</div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-md border border-border/60 bg-background px-3 py-2">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_120px_90px_1fr_160px] md:items-end">
                  <Select
                    value={exitDraft.entryId || PANTRY_EXIT_ENTRY_AUTO_VALUE}
                    onValueChange={(value) => {
                      if (value === PANTRY_EXIT_ENTRY_AUTO_VALUE) {
                        setExitDraft((prev) => ({ ...prev, entryId: "" }));
                        return;
                      }

                      const entry = exitEntryOptions.find((row) => row.id === value);
                      setExitDraft((prev) => ({
                        ...prev,
                        entryId: value,
                        sector: entry?.sector ?? prev.sector,
                        unit: entry?.unit ?? prev.unit,
                      }));
                    }}
                    disabled={saving || readOnly}
                  >
                    <SelectTrigger className={cn(inputLineClassName, "min-w-0")}>
                      <span className="min-w-0 flex-1 truncate text-xs" title={exitEntryTriggerLabel}>
                        {exitEntryTriggerLabel}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PANTRY_EXIT_ENTRY_AUTO_VALUE}>Automático</SelectItem>
                      {exitEntryOptions.map((entry) => {
                        const remaining =
                          typeof entry.remaining === "number" ? entry.remaining : entry.quantity;
                        const expiry = entry.expiryDate ? formatDateOnlyPtBR(entry.expiryDate) : "—";
                        const entryDate = entry.entryDate ? formatDateOnlyPtBR(entry.entryDate) : "—";
                        return (
                          <SelectItem key={entry.id} value={entry.id}>
                            <div className="flex flex-col">
                              <div className="text-xs font-medium text-foreground">
                                Validade {expiry} • {Number(remaining).toLocaleString("pt-BR")} {entry.unit}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {entryDate} • {entry.sector || PANTRY_DEFAULT_SECTOR}
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>

                  <Input
                    type="number"
                    inputMode="decimal"
                    value={String(exitDraft.quantity)}
                    onChange={(e) =>
                      setExitDraft((prev) => ({
                        ...prev,
                        quantity: toNumber(e.target.value),
                      }))
                    }
                    className={inputLineClassName}
                    placeholder="Qtd."
                    readOnly={saving || readOnly}
                  />

                  <Input
                    value={exitDraft.unit}
                    onChange={(e) => setExitDraft((prev) => ({ ...prev, unit: e.target.value }))}
                    className={inputLineClassName}
                    placeholder="Un."
                    readOnly={saving || readOnly}
                  />

                  <Select
                    value={exitDraft.type}
                    onValueChange={(value) =>
                      setExitDraft((prev) => ({ ...prev, type: value as ExitDraft["type"] }))
                    }
                    disabled={saving || readOnly}
                  >
                    <SelectTrigger className={inputLineClassName}>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PANTRY_EXIT_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="date"
                    value={exitDraft.exitDate}
                    onChange={(e) => setExitDraft((prev) => ({ ...prev, exitDate: e.target.value }))}
                    className={inputLineClassName}
                    readOnly={saving || readOnly}
                    title="Data da saída"
                  />
                </div>

                <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_auto] md:items-end">
                  <Input
                    value={exitDraft.eventName}
                    onChange={(e) => setExitDraft((prev) => ({ ...prev, eventName: e.target.value }))}
                    className={inputLineClassName}
                    placeholder={
                      exitDraft.type === "EVENT" || exitDraft.type === "PARTY"
                        ? "Nome do evento (obrigatório)"
                        : "Evento (opcional)"
                    }
                    readOnly={saving || readOnly}
                  />

                  <Input
                    value={exitDraft.notes}
                    onChange={(e) => setExitDraft((prev) => ({ ...prev, notes: e.target.value }))}
                    className={inputLineClassName}
                    placeholder="Notas (opcional)"
                    readOnly={saving || readOnly}
                  />

                  <Button
                    type="button"
                    size="sm"
                    onClick={submitExit}
                    disabled={saving || readOnly}
                    className="h-8"
                  >
                    {saving ? "..." : "Adicionar"}
                  </Button>
                </div>
              </div>

              {exitRows.length ? (
                <div className="space-y-2">
                  {exitRows.slice(0, 80).map((row) => (
                    <div
                      key={row.id}
                      className="rounded-md border border-rose-500/20 bg-rose-500/5 px-3 py-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge className="border-transparent bg-rose-500/15 text-rose-700 dark:text-rose-200">
                              Saída
                            </Badge>
                            <div className="truncate text-sm font-semibold text-foreground">
                              {resolveExitTypeLabel(row.type)}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDateOnlyPtBR(row.exitDate)} • {row.sector || PANTRY_DEFAULT_SECTOR}
                            {row.eventName ? ` • ${row.eventName}` : ""}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-sm tabular-nums text-foreground">
                            {Number(row.quantity).toLocaleString("pt-BR")}
                          </div>
                          <div className="text-[11px] text-muted-foreground">{row.unit}</div>
                        </div>
                      </div>
                      {row.notes ? (
                        <div className="mt-1 text-xs text-muted-foreground">{row.notes}</div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
                  Sem saídas.
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-3">
          {mode !== "edit" ? (
            <div className="rounded-md border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
              Salve o alimento para ver o histórico.
            </div>
          ) : movementsLoading ? (
            <div className="text-sm text-muted-foreground">Carregando...</div>
          ) : historyRows.length ? (
            <div className="space-y-2">
              {historyRows.slice(0, 120).map((row) => (
                <div key={row.id} className="rounded-md border border-border/60 bg-background px-3 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={cn(
                            "border-transparent",
                            row.kind === "ENTRY"
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-200"
                              : "bg-rose-500/15 text-rose-700 dark:text-rose-200",
                          )}
                        >
                          {resolveKindLabel(row.kind)}
                        </Badge>
                        <div className="truncate text-sm font-semibold text-foreground">
                          {formatDateOnlyPtBR(row.movementDate)}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {row.sector || PANTRY_DEFAULT_SECTOR}
                        {row.kind === "EXIT" && row.type ? ` • ${resolveExitTypeLabel(row.type)}` : ""}
                        {row.kind === "EXIT" && row.eventName ? ` • ${row.eventName}` : ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm tabular-nums text-foreground">
                        {Number(row.quantity).toLocaleString("pt-BR")}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{row.unit}</div>
                    </div>
                  </div>
                  {row.notes ? (
                    <div className="mt-1 text-xs text-muted-foreground">{row.notes}</div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
              Sem movimentos.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

