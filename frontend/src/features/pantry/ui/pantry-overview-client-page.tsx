"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import {
  getPantryConsumption,
  getPantryFlow,
  getPantryUsage,
  getPantryDashboard,
  type PantryConsumptionResponse,
  type PantryFlowResponse,
  type PantryUsageResponse,
  type PantryDashboardResponse,
} from "@/features/pantry/api";
import {
  PantryItemMovementDialog,
  type PantryMovementDialogItem,
} from "@/features/pantry/ui/pantry-item-movement-dialog";
import { PantryEntryCreateDialog } from "@/features/pantry/ui/pantry-entry-create-dialog";
import { PantryEntryEditDialog } from "@/features/pantry/ui/pantry-entry-edit-dialog";
import { PantryItemCreateDialog } from "@/features/pantry/ui/pantry-item-create-dialog";
import { PantryItemEditDialog } from "@/features/pantry/ui/pantry-item-edit-dialog";
import { PantryExitEditDialog } from "@/features/pantry/ui/pantry-exit-edit-dialog";
import { PantryOverviewAlertsSection } from "@/features/pantry/ui/overview/pantry-overview-alerts-section";
import { PantryOverviewConsumptionSection } from "@/features/pantry/ui/overview/pantry-overview-consumption-section";
import {
  PantryOverviewMovementsSection,
  type PantryRecentMovement,
} from "@/features/pantry/ui/overview/pantry-overview-movements-section";
import { PantryOverviewStockSection } from "@/features/pantry/ui/overview/pantry-overview-stock-section";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { Bell, History, PackagePlus } from "lucide-react";
import { formatDateOnlyPtBR, toLocalIsoDate } from "@/lib/date";

function startMonthValue(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
}

function monthStartIso(monthValue: string) {
  return `${monthValue}-01`;
}

function monthEndIso(monthValue: string) {
  const [yearRaw, monthRaw] = monthValue.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  if (!year || !month) return undefined;
  const lastDay = new Date(year, month, 0);
  return toLocalIsoDate(lastDay);
}

function formatDate(value: string | null) {
  return formatDateOnlyPtBR(value);
}

function exitTypeLabel(type: string) {
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

export function PantryOverviewClientPage() {
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const { toast } = useToast();

  const canRead = permissions.includes("pantry.read");

  const [dashboard, setDashboard] = React.useState<PantryDashboardResponse | null>(
    null,
  );
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [onlyLowStock, setOnlyLowStock] = React.useState(false);

  const now = React.useMemo(() => new Date(), []);
  const defaultFromMonth = React.useMemo(
    () => startMonthValue(new Date(now.getFullYear(), now.getMonth() - 11, 1)),
    [now],
  );
  const defaultToMonth = React.useMemo(
    () => startMonthValue(new Date(now.getFullYear(), now.getMonth(), 1)),
    [now],
  );

  const [consumptionView, setConsumptionView] = React.useState<"item" | "group">(
    "item",
  );
  const [consumptionFromMonth, setConsumptionFromMonth] =
    React.useState(defaultFromMonth);
  const [consumptionToMonth, setConsumptionToMonth] =
    React.useState(defaultToMonth);
  const [selectedItemId, setSelectedItemId] = React.useState<string>("all");
  const [selectedGroup, setSelectedGroup] = React.useState<string>("all");
  const [consumption, setConsumption] =
    React.useState<PantryConsumptionResponse | null>(null);
  const [consumptionLoading, setConsumptionLoading] = React.useState(false);
  const [consumptionError, setConsumptionError] = React.useState<string | null>(
    null,
  );
  const [flow, setFlow] = React.useState<PantryFlowResponse | null>(null);
  const [flowError, setFlowError] = React.useState<string | null>(null);
  const [usage, setUsage] = React.useState<PantryUsageResponse | null>(null);
  const [usageError, setUsageError] = React.useState<string | null>(null);
  const [consumptionExitType, setConsumptionExitType] = React.useState<
    "all" | "ATTENDED" | "DONATION" | "EVENT" | "PARTY" | "CORRECTION"
  >("all");
  const [consumptionEventName, setConsumptionEventName] = React.useState("");

  const [movementOpen, setMovementOpen] = React.useState(false);
  const [movementItem, setMovementItem] =
    React.useState<PantryMovementDialogItem | null>(null);
  const [movementPreferredSector, setMovementPreferredSector] = React.useState<
    string | undefined
  >(undefined);
  const [createEntryOpen, setCreateEntryOpen] = React.useState(false);
  const [createItemOpen, setCreateItemOpen] = React.useState(false);
  const [editItemOpen, setEditItemOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<
    Pick<PantryDashboardResponse["stockRows"][number], "itemId" | "name" | "group" | "unit" | "minStock"> | null
  >(null);

  const [editEntryOpen, setEditEntryOpen] = React.useState(false);
  const [editingEntryId, setEditingEntryId] = React.useState<string | null>(null);
  const [editExitOpen, setEditExitOpen] = React.useState(false);
  const [editingExitId, setEditingExitId] = React.useState<string | null>(null);

  const loadDashboard = React.useCallback(async () => {
    if (!token || !canRead) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getPantryDashboard(token);
      setDashboard(data);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar despensa.";
      setError(message);
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, [token, canRead]);

  const loadConsumption = React.useCallback(async () => {
    if (!token || !canRead) return;
    setConsumptionLoading(true);
    setConsumptionError(null);
    setFlowError(null);
    setUsageError(null);

    const from = monthStartIso(consumptionFromMonth);
    const to = monthEndIso(consumptionToMonth) ?? undefined;
    const params = {
      view: consumptionView,
      from,
      to,
      itemId:
        consumptionView === "item" && selectedItemId !== "all"
          ? selectedItemId
          : undefined,
      group:
        consumptionView === "group" && selectedGroup !== "all"
          ? selectedGroup
          : undefined,
      type: consumptionExitType === "all" ? undefined : consumptionExitType,
      eventName: consumptionEventName.trim()
        ? consumptionEventName.trim()
        : undefined,
    } as const;

    const [consumptionResult, flowResult, usageResult] = await Promise.allSettled([
      getPantryConsumption(token, params),
      getPantryFlow(token, params),
      getPantryUsage(token, params),
    ]);

    if (consumptionResult.status === "fulfilled") {
      setConsumption(consumptionResult.value);
    } else {
      const err = consumptionResult.reason as { message?: string } | undefined;
      setConsumptionError(err?.message ?? "Falha ao carregar consumo.");
      setConsumption(null);
    }

    if (flowResult.status === "fulfilled") {
      setFlow(flowResult.value);
    } else {
      const err = flowResult.reason as { message?: string } | undefined;
      setFlowError(err?.message ?? "Falha ao carregar fluxo.");
      setFlow(null);
    }

    if (usageResult.status === "fulfilled") {
      setUsage(usageResult.value);
    } else {
      const err = usageResult.reason as { message?: string } | undefined;
      setUsageError(err?.message ?? "Falha ao carregar consumo por tipo.");
      setUsage(null);
    }

    setConsumptionLoading(false);
  }, [
    token,
    canRead,
    consumptionFromMonth,
    consumptionToMonth,
    consumptionView,
    selectedItemId,
    selectedGroup,
    consumptionExitType,
    consumptionEventName,
  ]);

  React.useEffect(() => {
    if (authLoading) return;
    if (!token || !isAuthenticated || !canRead) {
      setLoading(false);
      return;
    }
    loadDashboard();
  }, [authLoading, token, isAuthenticated, canRead, loadDashboard]);

  React.useEffect(() => {
    if (authLoading) return;
    if (!token || !isAuthenticated || !canRead) return;
    loadConsumption();
  }, [authLoading, token, isAuthenticated, canRead, loadConsumption]);

  const groups = React.useMemo(() => {
    const set = new Set<string>();
    (dashboard?.stockRows ?? []).forEach((row) => {
      if (row.group) set.add(row.group);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [dashboard]);

  const items = React.useMemo(() => {
    const map = new Map<string, string>();
    (dashboard?.stockRows ?? []).forEach((row) => {
      map.set(row.itemId, row.name);
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [dashboard]);

  const stockRows = React.useMemo(() => {
    if (!dashboard) return [];
    const rows = dashboard.stockRows;
    return onlyLowStock ? rows.filter((row) => row.isBelowMin) : rows;
  }, [dashboard, onlyLowStock]);

  const itemSummaryById = React.useMemo(() => {
    const map = new Map<string, PantryMovementDialogItem>();
    (dashboard?.stockRows ?? []).forEach((row) => {
      if (map.has(row.itemId)) return;
      map.set(row.itemId, {
        id: row.itemId,
        name: row.name,
        unit: row.unit,
        stock: row.itemStock,
        minStock: row.minStock,
      });
    });
    return map;
  }, [dashboard]);

  const openMovementDialog = React.useCallback(
    (params: {
      itemId: string;
      name: string;
      unit: string;
      sector?: string;
    }) => {
      const resolvedItem =
        itemSummaryById.get(params.itemId) ??
        ({
          id: params.itemId,
          name: params.name,
          unit: params.unit,
        } satisfies PantryMovementDialogItem);

      setMovementItem(resolvedItem);
      setMovementPreferredSector(params.sector);
      setMovementOpen(true);
    },
    [itemSummaryById],
  );

  const handleMovementSaved = React.useCallback(async () => {
    await loadDashboard();
    await loadConsumption();
  }, [loadDashboard, loadConsumption]);

  const handleAlertsRefresh = React.useCallback(async () => {
    try {
      await loadDashboard();
      toast({ title: "Alertas atualizados", variant: "success" });
    } catch {
      toast({ title: "Falha ao atualizar alertas", variant: "destructive" });
    }
  }, [loadDashboard, toast]);

  const stockColumns = React.useMemo<
    ColumnDef<PantryDashboardResponse["stockRows"][number]>[]
  >(
    () => [
      {
        accessorKey: "name",
        header: "Alimento",
        cell: ({ row }) => (
          <span className="text-xs font-semibold text-foreground">
            {row.original.name}
          </span>
        ),
      },
      {
        id: "group",
        header: "Grupo",
        accessorFn: (row) => row.group ?? "Sem grupo",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.group || "Sem grupo"}
          </span>
        ),
      },
      {
        accessorKey: "sector",
        header: "Setor",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">{row.original.sector}</span>
        ),
      },
      {
        accessorKey: "sectorStock",
        header: "Saldo setor",
        cell: ({ row }) => (
          <span className="text-xs font-mono tabular-nums text-foreground">
            {Number(row.original.sectorStock).toLocaleString("pt-BR")}{" "}
            {row.original.unit}
          </span>
        ),
      },
      {
        accessorKey: "itemStock",
        header: "Saldo total",
        cell: ({ row }) => (
          <span className="text-xs font-mono tabular-nums text-foreground">
            {Number(row.original.itemStock).toLocaleString("pt-BR")}{" "}
            {row.original.unit}
          </span>
        ),
      },
      {
        id: "alerts",
        header: "Alertas",
        accessorFn: (row) => (row.isBelowMin ? "Abaixo do mínimo" : "OK"),
        cell: ({ row }) => (
          <div className="flex flex-wrap items-center gap-2">
            {row.original.isBelowMin ? (
              <Badge variant="destructive">Abaixo do mínimo</Badge>
            ) : (
              <Badge variant="secondary">OK</Badge>
            )}
            <span className="text-[11px] text-muted-foreground">
              Mínimo: {Number(row.original.minStock).toLocaleString("pt-BR")}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "nextExpiryDate",
        header: "Próx. validade",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.original.nextExpiryDate)}
          </span>
        ),
      },
    ],
    [],
  );

  const expiredItems = React.useMemo(() => {
    return (dashboard?.expiring ?? []).filter((row) => row.validityStatus === "Vencido");
  }, [dashboard]);

  const recentMovements = React.useMemo<PantryRecentMovement[]>(() => {
    const entries =
      dashboard?.recentEntries?.map((entry) => ({
        id: `entry:${entry.id}`,
        kind: "ENTRY" as const,
        date: entry.entryDate,
        itemId: entry.itemId,
        itemName: entry.item.name,
        unit: entry.unit,
        quantity: entry.quantity,
        sector: entry.sector,
        actor: entry.createdBy,
        meta: entry.donor?.name ? `Doador: ${entry.donor.name}` : "Sem doador",
        notes: entry.notes,
        expiryDate: entry.expiryDate,
      })) ?? [];

    const exits =
      dashboard?.recentExits?.map((exit) => ({
        id: `exit:${exit.id}`,
        kind: "EXIT" as const,
        date: exit.exitDate,
        itemId: exit.itemId,
        itemName: exit.item.name,
        unit: exit.unit,
        quantity: exit.quantity,
        sector: exit.sector,
        actor: exit.removedBy,
        meta: exit.eventName ? `Evento: ${exit.eventName}` : exitTypeLabel(exit.type),
        notes: exit.notes,
        expiryDate: null as string | null,
        exitType: exit.type,
        eventName: exit.eventName ?? null,
      })) ?? [];

    return [...entries, ...exits]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20);
  }, [dashboard]);

  const openMovementEdit = React.useCallback((movement: PantryRecentMovement) => {
    if (movement.kind === "ENTRY") {
      const entryId = movement.id.startsWith("entry:")
        ? movement.id.slice("entry:".length)
        : movement.id;
      setEditingEntryId(entryId);
      setEditEntryOpen(true);
      return;
    }

    const exitId = movement.id.startsWith("exit:")
      ? movement.id.slice("exit:".length)
      : movement.id;
    setEditingExitId(exitId);
    setEditExitOpen(true);
  }, []);

  if (!canRead) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Você não tem permissão para acessar esta área.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      <PageBreadcrumb
        title="Despensa"
        items={[{ label: "Despensa", href: "/pantry" }]}
        action={{
          label: "Novo alimento",
          onClick: () => setCreateItemOpen(true),
          variant: "default",
          size: "sm",
        }}
        actionSlot={
          <>
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Movimentos recentes"
                  title="Movimentos recentes"
                >
                  <History className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[calc(100vw-2rem)] sm:!max-w-[780px]">
                <SheetHeader className="sr-only">
                  <SheetTitle>Movimentos recentes</SheetTitle>
                </SheetHeader>
                <div className="px-4 pb-6 pt-12">
                  <PantryOverviewMovementsSection
                    movements={recentMovements}
                    onMovementClick={openMovementEdit}
                    formatDate={formatDate}
                  />
                </div>
              </SheetContent>
            </Sheet>

            <Button
              variant="outline"
              size="icon"
              aria-label="Nova entrada (lote)"
              title="Nova entrada (lote)"
              onClick={() => setCreateEntryOpen(true)}
            >
              <PackagePlus className="size-4" />
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Alertas"
                  title="Alertas"
                  className="relative"
                >
                  <Bell className="size-4" />
                  {expiredItems.length ? (
                    <span className="absolute -right-0.5 -top-0.5 block size-2 rounded-full bg-rose-500" />
                  ) : null}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[calc(100vw-2rem)] sm:!max-w-[780px]">
                <SheetHeader className="sr-only">
                  <SheetTitle>Alertas</SheetTitle>
                </SheetHeader>
                <div className="px-4 pb-6 pt-12">
                  <PantryOverviewAlertsSection
                    expiredItems={expiredItems}
                    formatDate={formatDate}
                    onOpenMovement={openMovementDialog}
                    onRefresh={handleAlertsRefresh}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </>
        }
      />

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <PantryOverviewStockSection
        rows={stockRows}
        columns={stockColumns}
        onlyLowStock={onlyLowStock}
        onToggleOnlyLowStock={() => setOnlyLowStock((prev) => !prev)}
        onRowClick={(row) => {
          openMovementDialog({
            itemId: row.itemId,
            name: row.name,
            unit: row.unit,
            sector: row.sector,
          });
        }}
        rowActions={[
          {
            id: "edit",
            label: "Editar alimento",
            onSelect: (row) => {
              setEditingItem({
                itemId: row.itemId,
                name: row.name,
                group: row.group,
                unit: row.unit,
                minStock: row.minStock,
              });
              setEditItemOpen(true);
            },
          },
        ]}
      />

      <PantryOverviewConsumptionSection
        consumption={consumption}
        consumptionLoading={consumptionLoading}
        consumptionError={consumptionError}
        flow={flow}
        flowError={flowError}
        usage={usage}
        usageError={usageError}
        onRefresh={loadConsumption}
        view={consumptionView}
        onViewChange={(value) => {
          setConsumptionView(value);
          setSelectedItemId("all");
          setSelectedGroup("all");
        }}
        exitType={consumptionExitType}
        eventName={consumptionEventName}
        onExitTypeChange={setConsumptionExitType}
        onEventNameChange={setConsumptionEventName}
        fromMonth={consumptionFromMonth}
        toMonth={consumptionToMonth}
        onFromMonthChange={setConsumptionFromMonth}
        onToMonthChange={setConsumptionToMonth}
        selectedItemId={selectedItemId}
        selectedGroup={selectedGroup}
        onSelectedItemIdChange={setSelectedItemId}
        onSelectedGroupChange={setSelectedGroup}
        groups={groups}
        items={items}
      />

      <PantryItemMovementDialog
        open={movementOpen}
        onOpenChange={(open) => {
          setMovementOpen(open);
          if (!open) {
            setMovementItem(null);
            setMovementPreferredSector(undefined);
          }
        }}
        item={movementItem}
        preferredSector={movementPreferredSector}
        onSaved={handleMovementSaved}
      />

      <PantryEntryCreateDialog
        open={createEntryOpen}
        onOpenChange={setCreateEntryOpen}
        onCreated={handleMovementSaved}
      />

      <PantryEntryEditDialog
        open={editEntryOpen}
        onOpenChange={(open) => {
          setEditEntryOpen(open);
          if (!open) setEditingEntryId(null);
        }}
        entryId={editingEntryId}
        onSaved={handleMovementSaved}
      />

      <PantryExitEditDialog
        open={editExitOpen}
        onOpenChange={(open) => {
          setEditExitOpen(open);
          if (!open) setEditingExitId(null);
        }}
        exitId={editingExitId}
        onSaved={handleMovementSaved}
      />

      <PantryItemCreateDialog
        open={createItemOpen}
        onOpenChange={setCreateItemOpen}
        onCreated={async (item) => {
          await handleMovementSaved();
        }}
      />

      <PantryItemEditDialog
        open={editItemOpen}
        onOpenChange={(open) => {
          setEditItemOpen(open);
          if (!open) setEditingItem(null);
        }}
        item={
          editingItem
            ? {
                id: editingItem.itemId,
                name: editingItem.name,
                group: editingItem.group ?? null,
                unit: editingItem.unit,
                minStock: editingItem.minStock,
              }
            : null
        }
        onSaved={async () => {
          await handleMovementSaved();
        }}
      />
    </div>
  );
}
