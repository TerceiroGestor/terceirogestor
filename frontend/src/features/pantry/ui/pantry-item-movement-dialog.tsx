"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormEngine } from "@/components/FormEngine";
import type { FormField } from "@/components/FormEngine/types";
import { SectionDialog } from "@/components/section-dialog";
import { SectionList, SectionListItem } from "@/components/section-list";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import {
  createPantryExit,
  getPantryItemSectors,
  listPantryEntries,
  listPantryExits,
  type ApiPantryEntry,
  type ApiPantryExit,
  type ApiPantrySectorBalance,
} from "@/features/pantry/api";
import {
  PantryMovementTimeline,
  type PantryMovementTimelineRow,
} from "@/features/pantry/ui/pantry-movement-timeline";
import { formatDateOnlyPtBR, todayLocalIsoDate } from "@/lib/date";

function formatDate(value: string | null) {
  return formatDateOnlyPtBR(value);
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function exitTypeLabel(type: ApiPantryExit["type"]) {
  switch (type) {
    case "ATTENDED":
      return "Atendidos";
    case "DONATION":
      return "Doações";
    case "EVENT":
      return "Eventos";
    case "PARTY":
      return "Festas";
    case "CORRECTION":
      return "Correção";
    default:
      return type;
  }
}

export type PantryMovementDialogItem = {
  id: string;
  name: string;
  unit: string;
  stock?: number;
  minStock?: number;
};

type QuickExitValues = {
  entryId?: string;
  sector: string;
  quantity: number | "";
  unit?: string;
  exitDate?: string;
  type: "ATTENDED" | "DONATION" | "EVENT" | "PARTY";
  eventName?: string;
  notes?: string;
};

type PantryItemMovementDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: PantryMovementDialogItem | null;
  preferredSector?: string;
  onSaved?: () => void | Promise<void>;
};

export function PantryItemMovementDialog({
  open,
  onOpenChange,
  item,
  preferredSector,
  onSaved,
}: PantryItemMovementDialogProps) {
  const { token } = useAuth();
  const { permissions } = useCurrentUser();

  const canRead = permissions.includes("pantry.read");
  const canCreate = permissions.includes("pantry.create");

  const [sectorBalances, setSectorBalances] = React.useState<
    ApiPantrySectorBalance[]
  >([]);
  const [sectorsLoading, setSectorsLoading] = React.useState(false);

  const [itemEntries, setItemEntries] = React.useState<ApiPantryEntry[]>([]);
  const [itemExits, setItemExits] = React.useState<ApiPantryExit[]>([]);
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [historyKind, setHistoryKind] = React.useState<"ALL" | "ENTRY" | "EXIT">(
    "ALL",
  );
  const [historyFromDate, setHistoryFromDate] = React.useState("");
  const [historyToDate, setHistoryToDate] = React.useState("");

  const [movementSaving, setMovementSaving] = React.useState(false);
  const [movementError, setMovementError] = React.useState<string | null>(null);

  const [exitDefaults, setExitDefaults] = React.useState<QuickExitValues>({
    entryId: undefined,
    sector: preferredSector ?? "Geral",
    quantity: "",
    unit: item?.unit ?? "",
    exitDate: "",
    type: "ATTENDED",
    eventName: "",
    notes: "",
  });

  const selectedSector = exitDefaults.sector;
  const selectedSectorBalance = React.useMemo(
    () =>
      sectorBalances.find((balance) => balance.sector === selectedSector) ?? null,
    [sectorBalances, selectedSector],
  );

  const applySectorDefaults = React.useCallback(
    (sector: ApiPantrySectorBalance) => {
      const todayIso = todayLocalIsoDate();
      setMovementError(null);

      setExitDefaults((prev) => {
        const expiryHint = sector.nextExpiryDate
          ? `Retirar primeiro (FEFO): validade ${formatDate(sector.nextExpiryDate)}.`
          : null;

        const nextNotes =
          expiryHint && !prev.notes
            ? expiryHint
            : expiryHint && prev.notes && !prev.notes.includes("FEFO")
              ? `${prev.notes} | ${expiryHint}`
              : prev.notes;

        return {
          ...prev,
          entryId: sector.nextExpiryEntryId ?? prev.entryId,
          sector: sector.sector,
          unit: prev.unit ?? item?.unit,
          exitDate: prev.exitDate || todayIso,
          notes: nextNotes ?? prev.notes,
        };
      });
    },
    [item?.unit],
  );

  const quickExitFields = React.useMemo<FormField<QuickExitValues>[]>(() => {
    return [
      {
        name: "sector",
        label: "Setor (local físico)",
        type: "text",
        required: true,
        helperText: "Informe de onde o item está sendo retirado.",
      },
      {
        name: "quantity",
        label: "Quantidade",
        type: "number",
        required: true,
      },
      {
        name: "unit",
        label: "Unidade",
        type: "text",
        helperText: "Se vazio, usa a unidade padrão do alimento.",
      },
      { name: "exitDate", label: "Data da saída", type: "date" },
      {
        name: "type",
        label: "Tipo",
        type: "select",
        required: true,
        options: [
          { label: "Atendidos", value: "ATTENDED" },
          { label: "Doações", value: "DONATION" },
          { label: "Eventos", value: "EVENT" },
          { label: "Festas", value: "PARTY" },
        ],
      },
      {
        name: "eventName",
        label: "Evento",
        type: "text",
        helperText: "Obrigatório para Eventos e Festas.",
        requiredWhen: (values: QuickExitValues) =>
          values.type === "EVENT" || values.type === "PARTY",
      },
      {
        name: "notes",
        label: "Observações",
        type: "textarea",
        rows: 2,
      },
    ];
  }, []);

  const loadSectors = React.useCallback(async () => {
    if (!token || !item || !canRead) return;
    setSectorsLoading(true);
    try {
      const response = await getPantryItemSectors(token, item.id);
      setSectorBalances(response.sectors);
    } catch {
      setSectorBalances([]);
    } finally {
      setSectorsLoading(false);
    }
  }, [token, item, canRead]);

  const loadHistory = React.useCallback(async () => {
    if (!token || !item || !canRead) return;
    setHistoryLoading(true);
    try {
      const [entriesResponse, exitsResponse] = await Promise.all([
        listPantryEntries(token, { itemId: item.id, page: 1, limit: 10 }),
        listPantryExits(token, { itemId: item.id, page: 1, limit: 10 }),
      ]);
      setItemEntries(entriesResponse.data);
      setItemExits(exitsResponse.data);
    } catch {
      setItemEntries([]);
      setItemExits([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [token, item, canRead]);

  React.useEffect(() => {
    if (!open || !item) return;

    setMovementError(null);
    setExitDefaults((prev) => ({
      ...prev,
      entryId: undefined,
      sector: preferredSector ?? "Geral",
      unit: item.unit,
      quantity: "",
    }));

    void loadSectors();
    void loadHistory();
  }, [open, item?.id, item?.unit, preferredSector, loadSectors, loadHistory]);

  const handleQuickExit = React.useCallback(
    async (values: QuickExitValues) => {
      if (!token || !item) return;
      if (!canCreate) {
        setMovementError("Você não tem permissão para registrar saídas.");
        return;
      }

      const sector = values.sector?.trim() ?? "";
      const quantity =
        typeof values.quantity === "number" ? values.quantity : Number(values.quantity);
      const rawUnit = values.unit?.trim() ?? "";
      const rawExitDate = values.exitDate?.trim() ?? "";
      const eventName = values.eventName?.trim() ?? "";
      const rawNotes = values.notes?.trim() ?? "";

      if (!sector) {
        setMovementError("Informe o setor (local físico).");
        return;
      }
      if (!Number.isFinite(quantity) || quantity <= 0) {
        setMovementError("Informe uma quantidade válida.");
        return;
      }
      if ((values.type === "EVENT" || values.type === "PARTY") && !eventName) {
        setMovementError("Informe o nome do evento.");
        return;
      }

      setMovementSaving(true);
      setMovementError(null);
      try {
        await createPantryExit(token, {
          itemId: item.id,
          entryId: values.entryId,
          sector,
          quantity,
          unit: rawUnit || item.unit,
          exitDate: rawExitDate || undefined,
          type: values.type,
          eventName: eventName ? eventName : null,
          notes: rawNotes ? rawNotes : null,
        });

        await Promise.all([
          Promise.resolve(onSaved?.()),
          loadSectors(),
          loadHistory(),
        ]);

        setExitDefaults((prev) => ({ ...prev, sector, quantity: "" }));
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao registrar saída.";
        setMovementError(message);
      } finally {
        setMovementSaving(false);
      }
    },
    [token, item, canCreate, onSaved, loadSectors, loadHistory],
  );

  const movementHistory = React.useMemo<PantryMovementTimelineRow[]>(() => {
    const entries: PantryMovementTimelineRow[] = itemEntries.map((entry) => ({
      id: `entry:${entry.id}`,
      kind: "ENTRY",
      date: entry.entryDate,
      sector: entry.sector,
      quantity: entry.quantity,
      unit: entry.unit,
      actor: entry.createdBy ?? "Sistema",
      notes: entry.notes,
      expiryDate: entry.expiryDate,
    }));

    const exits: PantryMovementTimelineRow[] = itemExits.map((exit) => ({
      id: `exit:${exit.id}`,
      kind: "EXIT",
      date: exit.exitDate,
      sector: exit.sector,
      quantity: exit.quantity,
      unit: exit.unit,
      actor: exit.removedBy ?? "Sistema",
      notes: exit.notes,
      usage: exitTypeLabel(exit.type),
    }));

    return [...entries, ...exits]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20);
  }, [itemEntries, itemExits]);

  const filteredHistory = React.useMemo(() => {
    if (!movementHistory.length) return [];

    const from = historyFromDate ? new Date(`${historyFromDate}T00:00:00`) : null;
    const to = historyToDate ? new Date(`${historyToDate}T23:59:59`) : null;

    return movementHistory.filter((movement) => {
      if (historyKind !== "ALL" && movement.kind !== historyKind) return false;

      const movementDate = new Date(movement.date);
      if (from && movementDate < from) return false;
      if (to && movementDate > to) return false;

      return true;
    });
  }, [movementHistory, historyFromDate, historyToDate, historyKind]);

  return (
    <SectionDialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          setMovementError(null);
        }
      }}
      title={item ? item.name : "Movimentar estoque"}
      description="Registre saídas por setor e acompanhe o saldo físico."
      contentClassName="sm:!max-w-[1200px]"
    >
      {movementError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {movementError}
        </div>
      ) : null}

      {item ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            {typeof item.stock === "number" || typeof item.minStock === "number" ? (
              <div className="rounded-lg border border-border/60 bg-card/40 px-4 py-3">
                {typeof item.stock === "number" ? (
                  <p className="text-xs text-muted-foreground">
                    Saldo total{" "}
                    <span className="font-mono tabular-nums text-foreground">
                      {Number(item.stock).toLocaleString("pt-BR")} {item.unit}
                    </span>
                  </p>
                ) : null}
                {typeof item.minStock === "number" ? (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Estoque mínimo{" "}
                    <span className="font-mono tabular-nums text-foreground">
                      {Number(item.minStock).toLocaleString("pt-BR")}
                    </span>
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="rounded-lg border border-border/60 bg-card/40 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-muted-foreground">
                  Saldo por setor
                </p>
                <Button variant="outline" size="sm" onClick={loadSectors}>
                  Atualizar
                </Button>
              </div>
              {sectorsLoading ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Carregando setores...
                </p>
              ) : sectorBalances.length ? (
                <SectionList className="mt-2">
                  {sectorBalances.map((sector) => (
                    <SectionListItem
                      key={sector.sector}
                      title={
                        <span className="text-xs font-semibold text-foreground">
                          {sector.sector}
                        </span>
                      }
                      subtitle={
                        sector.nextExpiryDate
                          ? `Próxima validade: ${formatDate(sector.nextExpiryDate)}`
                          : "Sem validade"
                      }
                      meta={
                        <span className="font-mono tabular-nums">
                          {Number(sector.stock).toLocaleString("pt-BR")} {item.unit}
                        </span>
                      }
                      actions={
                        <Button
                          variant="ghost"
                          size="sm"
                      onClick={() => {
                        applySectorDefaults(sector);
                      }}
                      title={
                        sector.nextExpiryDate
                          ? `Usar e sugerir retirada pela validade mais próxima (${formatDate(
                              sector.nextExpiryDate,
                            )}).`
                          : "Usar este setor no formulário."
                      }
                    >
                      {sector.nextExpiryDate ? "Usar (próx. validade)" : "Usar"}
                    </Button>
                  }
                  showActionsOnHover={false}
                  inlineActions
                />
                  ))}
                </SectionList>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                  Nenhum saldo por setor encontrado.
                </p>
              )}
            </div>

            <div className="rounded-lg border border-border/60 bg-card/40">
              <div className="max-h-[420px] overflow-y-auto">
                <div className="sticky top-0 z-10 border-b border-border/50 bg-background/95 px-4 py-3 backdrop-blur">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-muted-foreground">
                      Histórico do item
                    </p>
                    <Button variant="outline" size="sm" onClick={loadHistory}>
                      Atualizar
                    </Button>
                  </div>

                  <div className="mt-3 flex flex-wrap items-end gap-2">
                    <div className="min-w-[150px]">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        De
                      </p>
                      <Input
                        type="date"
                        value={historyFromDate}
                        onChange={(e) => setHistoryFromDate(e.target.value)}
                      />
                    </div>
                    <div className="min-w-[150px]">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Até
                      </p>
                      <Input
                        type="date"
                        value={historyToDate}
                        onChange={(e) => setHistoryToDate(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={historyKind === "ALL" ? "default" : "outline"}
                        onClick={() => setHistoryKind("ALL")}
                      >
                        Todos
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={historyKind === "ENTRY" ? "default" : "outline"}
                        onClick={() => setHistoryKind("ENTRY")}
                      >
                        Entradas
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={historyKind === "EXIT" ? "default" : "outline"}
                        onClick={() => setHistoryKind("EXIT")}
                      >
                        Saídas
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="px-4 pb-4 pt-3">
                  {historyLoading ? (
                    <p className="text-xs text-muted-foreground">
                      Carregando histórico...
                    </p>
                  ) : (
                    <PantryMovementTimeline
                      rows={filteredHistory}
                      scroll={false}
                      formatDate={formatDate}
                      formatDateTime={(value) => formatDateTime(value)}
                      emptyLabel="Nenhum movimento encontrado."
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border border-border/60 bg-card/40 px-4 py-3">
              <p className="text-xs font-semibold text-muted-foreground">
                Registrar saída
              </p>
              <div className="mt-3">
                {selectedSectorBalance?.nextExpiryDate ? (
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-3 rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">
                        Sugestão FEFO
                      </p>
                      <p>
                        Setor <span className="font-semibold">{selectedSectorBalance.sector}</span>{" "}
                        • validade mais próxima{" "}
                        <span className="font-semibold text-foreground">
                          {formatDate(selectedSectorBalance.nextExpiryDate)}
                        </span>{" "}
                        • saldo{" "}
                        <span className="font-mono tabular-nums text-foreground">
                          {Number(selectedSectorBalance.stock).toLocaleString("pt-BR")}{" "}
                          {item?.unit}
                        </span>
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => applySectorDefaults(selectedSectorBalance)}
                    >
                      Aplicar
                    </Button>
                  </div>
                ) : null}
                <FormEngine<QuickExitValues>
                  fields={quickExitFields}
                  initialValues={exitDefaults}
                  disabled={movementSaving}
                  onSubmit={handleQuickExit}
                  actions={{
                    submit: {
                      label: movementSaving ? "Salvando..." : "Salvar",
                      variant: "primary",
                    },
                    cancel: {
                      label: "Fechar",
                      variant: "ghost",
                      onClick: () => onOpenChange(false),
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </SectionDialog>
  );
}
