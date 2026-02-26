"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormEngine } from "@/components/FormEngine";
import type { FormField, FormStep } from "@/components/FormEngine/types";
import { SectionList, SectionListItem } from "@/components/section-list";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { PackageSearch, Truck } from "lucide-react";
import {
  createPantryExit,
  createPantrySector,
  getPantryItemSectors,
  listPantryEntries,
  listPantrySectors,
  type ApiPantryEntry,
  type ApiPantrySectorBalance,
} from "@/modules/pantry/api";
import {
  PantryMovementTimeline,
  type PantryMovementTimelineRow,
} from "@/modules/pantry/shared/ui/pantry-movement-timeline";
import { formatDateOnlyPtBR, todayLocalIsoDate } from "@/lib/date";
import { PANTRY_ITEM_UNIT } from "@/modules/pantry/shared/domain/pantry.constant";
import { PANTRY_NEW_SECTOR_VALUE } from "@/modules/pantry/features/items/config/pantry-item-form-config";

function formatDate(value: string | null) {
  return formatDateOnlyPtBR(value);
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
  newSector?: string;
  quantity: number | "";
  unit?: string;
  exitDate?: string;
  type: "ATTENDED" | "DONATION" | "EVENT" | "PARTY";
  eventName?: string;
  notes?: string;
};

type PantryMovementWorkspaceProps = {
  enabled: boolean;
  item: PantryMovementDialogItem | null;
  preferredSector?: string;
  onSaved?: () => void | Promise<void>;
  onClose?: () => void;
  leftTopSlot?: React.ReactNode;
};

export function PantryMovementWorkspace({
  enabled,
  item,
  preferredSector,
  onSaved,
  onClose,
  leftTopSlot,
}: PantryMovementWorkspaceProps) {
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { toast } = useToast();

  const canRead = permissions.includes("pantry.read");
  const canCreate = permissions.includes("pantry.create");

  const [sectorBalances, setSectorBalances] = React.useState<
    ApiPantrySectorBalance[]
  >([]);
  const [sectorsLoading, setSectorsLoading] = React.useState(false);
  const [globalSectors, setGlobalSectors] = React.useState<
    Array<{ id: string; name: string }>
  >([]);

  const [itemEntries, setItemEntries] = React.useState<ApiPantryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [historyFromDate, setHistoryFromDate] = React.useState("");
  const [historyToDate, setHistoryToDate] = React.useState("");

  const [movementSaving, setMovementSaving] = React.useState(false);

  const [exitDefaults, setExitDefaults] = React.useState<QuickExitValues>({
    entryId: undefined,
    sector: preferredSector ?? "Geral",
    newSector: "",
    quantity: "",
    unit: "",
    exitDate: "",
    type: "ATTENDED",
    eventName: "",
    notes: "",
  });
  const liveExitValuesRef = React.useRef<QuickExitValues>(exitDefaults);

  React.useEffect(() => {
    liveExitValuesRef.current = exitDefaults;
  }, [exitDefaults]);

  React.useEffect(() => {
    if (!enabled) return;
    setExitDefaults({
      entryId: undefined,
      sector: preferredSector ?? "Geral",
      newSector: "",
      quantity: "",
      unit: "",
      exitDate: "",
      type: "ATTENDED",
      eventName: "",
      notes: "",
    });
    setHistoryFromDate("");
    setHistoryToDate("");
  }, [enabled, preferredSector, item?.id]);

  const selectedEntry = React.useMemo(() => {
    if (!exitDefaults.entryId) return null;
    return (
      itemEntries.find((entry) => entry.id === exitDefaults.entryId) ?? null
    );
  }, [exitDefaults.entryId, itemEntries]);

  const applyEntryDefaults = React.useCallback(
    (entry: ApiPantryEntry) => {
      const todayIso = todayLocalIsoDate();
      const live = liveExitValuesRef.current;
      setExitDefaults({
        ...live,
        entryId: entry.id,
        sector: entry.sector ?? live.sector,
        newSector: "",
        unit: entry.unit ?? item?.unit ?? live.unit ?? "",
        exitDate: live.exitDate || todayIso,
      });
    },
    [item?.unit],
  );

  const sectorOptions = React.useMemo(() => {
    const set = new Set<string>();
    const list: Array<{ label: string; value: string }> = [];

    const push = (name: string | null | undefined) => {
      const normalized = String(name ?? "").trim();
      if (!normalized) return;
      if (set.has(normalized)) return;
      set.add(normalized);
      list.push({ label: normalized, value: normalized });
    };

    (globalSectors ?? []).forEach((sector) => push(sector.name));
    (sectorBalances ?? []).forEach((sector) => push(sector.sector));
    push(preferredSector ?? "");
    push(exitDefaults.sector);
    push("Geral");

    return list.sort((a, b) => a.label.localeCompare(b.label));
  }, [exitDefaults.sector, globalSectors, preferredSector, sectorBalances]);

  const quickExitFields = React.useMemo<FormField<QuickExitValues>[]>(() => {
    return [
      {
        name: "entryId",
        label: "Lote (interno)",
        type: "text",
        hiddenWhen: () => true,
      },
      {
        name: "sector",
        label: "Setor (local físico)",
        type: "select",
        required: true,
        options: [
          ...sectorOptions,
          { label: "Adicionar setor...", value: PANTRY_NEW_SECTOR_VALUE },
        ],
        helperText: "Informe de onde o item está sendo retirado.",
      },
      {
        name: "newSector",
        label: "Novo setor",
        type: "text",
        requiredWhen: (values: QuickExitValues) =>
          values.sector === PANTRY_NEW_SECTOR_VALUE,
        visibleWhen: (values: QuickExitValues) =>
          values.sector === PANTRY_NEW_SECTOR_VALUE,
        helperText:
          "Digite o nome do setor e ele ficará disponível para toda a despensa.",
      },
      {
        name: "unit",
        label: "Unidade",
        type: "select",
        options: PANTRY_ITEM_UNIT.slice(),
        helperText: "Se vazio, usa a unidade padrão do alimento.",
      },
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
        name: "quantity",
        label: "Quantidade",
        type: "number",
        required: true,
      },
      { name: "exitDate", label: "Data da saída", type: "date" },
      {
        name: "notes",
        label: "Observações",
        type: "textarea",
        rows: 2,
      },
    ];
  }, [sectorOptions]);

  const quickExitSteps = React.useMemo<FormStep[]>(
    () => [
      {
        title: "Identificação",
        fields: ["sector", "newSector", "unit", "type", "eventName"],
        icon: PackageSearch,
      },
      {
        title: "Detalhes",
        fields: ["quantity", "exitDate", "notes"],
        icon: Truck,
      },
    ],
    [],
  );

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

  const loadGlobalSectors = React.useCallback(async () => {
    if (!token || !canRead) return;
    try {
      const sectorsResponse = await listPantrySectors(token);
      setGlobalSectors(sectorsResponse.data ?? []);
    } catch {
      setGlobalSectors([]);
    }
  }, [token, canRead]);

  const loadHistory = React.useCallback(async () => {
    if (!token || !item || !canRead) return;
    setHistoryLoading(true);
    try {
      const entriesResponse = await listPantryEntries(token, {
        itemId: item.id,
        page: 1,
        limit: 50,
      });
      setItemEntries(entriesResponse.data);
    } catch {
      setItemEntries([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [token, item, canRead]);

  React.useEffect(() => {
    if (!enabled || !item) return;
    void loadSectors();
    void loadGlobalSectors();
    void loadHistory();
  }, [enabled, item, loadSectors, loadGlobalSectors, loadHistory]);

  const handleQuickExit = React.useCallback(
    async (values: QuickExitValues) => {
      if (!token || !item) return;
      if (!canCreate) {
        toast({
          variant: "destructive",
          title: "Sem permissão",
          description: "Você não tem permissão para registrar saídas.",
        });
        return;
      }

      const rawSector = values.sector?.trim() ?? "";
      const rawNewSector = values.newSector?.trim() ?? "";
      const sector =
        rawSector === PANTRY_NEW_SECTOR_VALUE ? rawNewSector : rawSector;
      const quantity =
        typeof values.quantity === "number"
          ? values.quantity
          : Number(values.quantity);
      const rawUnit = values.unit?.trim() ?? "";
      const rawExitDate = values.exitDate?.trim() ?? "";
      const eventName = values.eventName?.trim() ?? "";
      const rawNotes = values.notes?.trim() ?? "";

      if (!sector) {
        toast({
          variant: "destructive",
          title: "Dados inválidos",
          description: "Informe o setor (local físico).",
        });
        return;
      }
      if (!Number.isFinite(quantity) || quantity <= 0) {
        toast({
          variant: "destructive",
          title: "Dados inválidos",
          description: "Informe uma quantidade válida.",
        });
        return;
      }
      if ((values.type === "EVENT" || values.type === "PARTY") && !eventName) {
        toast({
          variant: "destructive",
          title: "Dados inválidos",
          description: "Informe o nome do evento.",
        });
        return;
      }

      setMovementSaving(true);
      try {
        if (rawSector === PANTRY_NEW_SECTOR_VALUE) {
          try {
            await createPantrySector(token, { name: sector });
          } catch {
            // best-effort
          }
        }

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
          loadGlobalSectors(),
          loadHistory(),
        ]);

        setExitDefaults((prev) => ({
          ...prev,
          sector,
          newSector: "",
          quantity: "",
        }));
        toast({ variant: "success", title: "Saída registrada" });
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao registrar saída.";
        toast({
          variant: "destructive",
          title: "Falha ao registrar saída",
          description: message,
        });
      } finally {
        setMovementSaving(false);
      }
    },
    [
      token,
      item,
      canCreate,
      onSaved,
      loadSectors,
      loadGlobalSectors,
      loadHistory,
      toast,
    ],
  );

  const filteredEntries = React.useMemo(() => {
    if (!itemEntries.length) return [];

    return itemEntries.filter((entry) => {
      const entryDay =
        entry.entryDate.length >= 10
          ? entry.entryDate.slice(0, 10)
          : entry.entryDate;
      if (historyFromDate && entryDay < historyFromDate) return false;
      if (historyToDate && entryDay > historyToDate) return false;
      return true;
    });
  }, [itemEntries, historyFromDate, historyToDate]);

  const entryTimelineRows = React.useMemo<PantryMovementTimelineRow[]>(() => {
    const getRemaining = (entry: ApiPantryEntry) => {
      return typeof entry.remaining === "number"
        ? entry.remaining
        : Math.max(0, entry.quantity - (entry.allocatedTotal ?? 0));
    };

    const sorted = filteredEntries
      .filter((entry) => {
        const remaining = getRemaining(entry);
        return remaining > 0 && !entry.isClosed;
      })
      .sort((a, b) => {
        const aExpiry = a.expiryDate ? a.expiryDate.slice(0, 10) : "9999-12-31";
        const bExpiry = b.expiryDate ? b.expiryDate.slice(0, 10) : "9999-12-31";
        if (aExpiry !== bExpiry) return aExpiry.localeCompare(bExpiry);

        const aDay =
          a.entryDate.length >= 10 ? a.entryDate.slice(0, 10) : a.entryDate;
        const bDay =
          b.entryDate.length >= 10 ? b.entryDate.slice(0, 10) : b.entryDate;
        return bDay.localeCompare(aDay);
      });

    const nextUsableEntryId = sorted.find((entry) => {
      const remaining = getRemaining(entry);
      return remaining > 0 && !entry.isClosed && canCreate;
    })?.id;

    return sorted.map((entry) => {
      const remaining = getRemaining(entry);

      const isSelected = exitDefaults.entryId === entry.id;
      const canUse = remaining > 0 && !entry.isClosed && canCreate;
      const isNextExpiry = nextUsableEntryId
        ? nextUsableEntryId === entry.id
        : false;
      const actionLabel = isSelected
        ? "Selecionado"
        : isNextExpiry
          ? "Usar (próx. validade)"
          : "Usar";

      return {
        id: `entry:${entry.id}`,
        kind: "ENTRY",
        date: entry.entryDate,
        sector: entry.sector,
        quantity: entry.quantity,
        unit: entry.unit,
        remaining,
        actor: entry.createdBy ?? "Sistema",
        notes: entry.notes,
        expiryDate: entry.expiryDate,
        meta: entry.donor?.name ? `Doador: ${entry.donor.name}` : null,
        actions: (
          <Button
            type="button"
            size="sm"
            variant={isSelected ? "default" : "outline"}
            className="h-7 px-2 text-[11px]"
            disabled={!canUse}
            title={
              !canUse
                ? "Sem saldo disponível neste lote."
                : entry.expiryDate
                  ? `Usar este lote (validade ${formatDate(entry.expiryDate)}).`
                  : "Usar este lote."
            }
            onClick={(event) => {
              event.stopPropagation();
              applyEntryDefaults(entry);
            }}
          >
            {actionLabel}
          </Button>
        ),
      };
    });
  }, [filteredEntries, exitDefaults.entryId, applyEntryDefaults, canCreate]);

  if (!canRead) {
    return (
      <div className="px-3 py-4 text-sm text-muted-foreground">
        Você não tem permissão para acessar esta área.
      </div>
    );
  }

  if (!item) {
    return (
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-2">
          {leftTopSlot ? (
            <div className="rounded-lg border border-border/60 bg-card/40 px-3 py-2">
              {leftTopSlot}
            </div>
          ) : null}
          <div className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm text-muted-foreground">
            Selecione um alimento para registrar a saída.
          </div>
        </div>
        <div className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm text-muted-foreground">
          Após selecionar o alimento, o formulário de saída e o histórico
          aparecem aqui.
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="space-y-2">
        {leftTopSlot ? (
          <div className="rounded-lg border border-border/60 bg-card/40 px-3 py-2">
            {leftTopSlot}
          </div>
        ) : null}
        <div className="rounded-lg border border-border/60 bg-card/40 px-3 py-2">
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
                  showActionsOnHover={false}
                />
              ))}
            </SectionList>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
              Nenhum saldo encontrado.
            </p>
          )}
        </div>

        <div className="rounded-lg border border-border/60 bg-card/40 px-3 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-muted-foreground">
              Histórico do item (somente entradas)
            </p>
            <Button variant="outline" size="sm" onClick={loadHistory}>
              Atualizar
            </Button>
          </div>

          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <div>
              <p className="pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                De
              </p>
              <Input
                type="date"
                value={historyFromDate}
                onChange={(e) => setHistoryFromDate(e.target.value)}
              />
            </div>
            <div>
              <p className="pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Até
              </p>
              <Input
                type="date"
                value={historyToDate}
                onChange={(e) => setHistoryToDate(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-2">
            {historyLoading ? (
              <p className="text-xs text-muted-foreground">Carregando...</p>
            ) : (
              <PantryMovementTimeline
                rows={entryTimelineRows}
                formatDate={formatDate}
                emptyLabel="Sem entradas para este item."
                scrollClassName="max-h-[320px] xl:max-h-[360px]"
                scroll
              />
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="rounded-lg border border-border/60 bg-card/40 px-3 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-muted-foreground">
              Formulário de saída
            </p>
          </div>

          {selectedEntry ? (
            <div className="mt-2 rounded-lg border border-border/60 bg-background/40 px-3 py-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    Lote selecionado
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Setor{" "}
                    <span className="font-semibold text-foreground">
                      {selectedEntry.sector ?? "—"}
                    </span>
                    {selectedEntry.expiryDate ? (
                      <>
                        {" "}
                        • validade{" "}
                        <span className="font-semibold text-foreground">
                          {formatDate(selectedEntry.expiryDate)}
                        </span>
                      </>
                    ) : null}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setExitDefaults((prev) => ({ ...prev, entryId: undefined }))
                  }
                >
                  Limpar
                </Button>
              </div>
            </div>
          ) : null}

          <div className="mt-2">
            <FormEngine<QuickExitValues>
              fields={quickExitFields}
              steps={quickExitSteps}
              initialValues={exitDefaults}
              disabled={movementSaving}
              onFieldChange={({ name, value, nextValues }) => {
                if (name !== "sector") return;
                const nextSector = String(value ?? "").trim();
                if (
                  nextSector !== PANTRY_NEW_SECTOR_VALUE &&
                  nextValues.newSector
                ) {
                  return { newSector: "" };
                }
              }}
              onValuesChange={(values) => {
                liveExitValuesRef.current = values;
              }}
              onSubmit={handleQuickExit}
              actions={{
                cancel: onClose
                  ? { label: "Fechar", variant: "ghost", onClick: onClose }
                  : undefined,
                submit: {
                  label: movementSaving ? "Salvando..." : "Salvar",
                  variant: "primary",
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
