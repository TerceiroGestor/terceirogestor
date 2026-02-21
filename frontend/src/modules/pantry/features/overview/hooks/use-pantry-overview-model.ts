"use client";

import * as React from "react";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useToast } from "@/components/ui/use-toast";
import type { PantryDashboardResponse } from "@/modules/pantry/api";
import type { PantryMovementDialogItem } from "@/modules/pantry/shared/ui/pantry-item-movement-dialog";
import type { PantryRecentMovement } from "@/modules/pantry/features/overview/ui/sections/pantry-overview-movements-section";
import { usePantryAnalytics } from "@/modules/pantry/features/overview/hooks/use-pantry-analytics";
import { usePantryDashboard } from "@/modules/pantry/features/overview/hooks/use-pantry-dashboard";

type StockRow = PantryDashboardResponse["stockRows"][number];

export function usePantryOverviewModel() {
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const { toast } = useToast();

  const canRead = permissions.includes("pantry.read");
  const enabled = Boolean(token && isAuthenticated && canRead);

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
    Pick<StockRow, "itemId" | "name" | "group" | "unit" | "minStock" | "sector"> | null
  >(null);

  const [editEntryOpen, setEditEntryOpen] = React.useState(false);
  const [editingEntryId, setEditingEntryId] = React.useState<string | null>(null);
  const [editExitOpen, setEditExitOpen] = React.useState(false);
  const [editingExitId, setEditingExitId] = React.useState<string | null>(null);

  const dashboard = usePantryDashboard({ token, enabled, authLoading });
  const analytics = usePantryAnalytics({ token, enabled, authLoading });

  const openMovementDialog = React.useCallback(
    (params: { itemId: string; name: string; unit: string; sector?: string }) => {
      const resolvedItem =
        dashboard.itemSummaryById.get(params.itemId) ??
        ({
          id: params.itemId,
          name: params.name,
          unit: params.unit,
        } satisfies PantryMovementDialogItem);

      setMovementItem(resolvedItem);
      setMovementPreferredSector(params.sector);
      setMovementOpen(true);
    },
    [dashboard.itemSummaryById],
  );

  const handleMovementSaved = React.useCallback(async () => {
    await dashboard.loadDashboard();
    await analytics.loadConsumption();
  }, [dashboard, analytics]);

  const handleAlertsRefresh = React.useCallback(async () => {
    try {
      await dashboard.loadDashboard();
      toast({ title: "Alertas atualizados", variant: "success" });
    } catch {
      toast({ title: "Falha ao atualizar alertas", variant: "destructive" });
    }
  }, [dashboard, toast]);

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

  return {
    canRead,
    loading: dashboard.loading,
    error: dashboard.error,
    dashboard: dashboard.dashboard,
    loadDashboard: dashboard.loadDashboard,

    onlyLowStock: dashboard.onlyLowStock,
    setOnlyLowStock: dashboard.setOnlyLowStock,

    groups: dashboard.groups,
    items: dashboard.items,
    stockRows: dashboard.stockRows,

    consumption: analytics.consumption,
    consumptionLoading: analytics.consumptionLoading,
    consumptionError: analytics.consumptionError,
    flow: analytics.flow,
    flowError: analytics.flowError,
    usage: analytics.usage,
    usageError: analytics.usageError,

    consumptionView: analytics.consumptionView,
    setConsumptionView: analytics.setConsumptionView,
    consumptionFromMonth: analytics.consumptionFromMonth,
    setConsumptionFromMonth: analytics.setConsumptionFromMonth,
    consumptionToMonth: analytics.consumptionToMonth,
    setConsumptionToMonth: analytics.setConsumptionToMonth,
    selectedItemId: analytics.selectedItemId,
    setSelectedItemId: analytics.setSelectedItemId,
    selectedGroup: analytics.selectedGroup,
    setSelectedGroup: analytics.setSelectedGroup,
    consumptionExitType: analytics.consumptionExitType,
    setConsumptionExitType: analytics.setConsumptionExitType,
    consumptionEventName: analytics.consumptionEventName,
    setConsumptionEventName: analytics.setConsumptionEventName,
    loadConsumption: analytics.loadConsumption,

    movementOpen,
    setMovementOpen,
    movementItem,
    setMovementItem,
    movementPreferredSector,
    setMovementPreferredSector,
    openMovementDialog,

    createEntryOpen,
    setCreateEntryOpen,
    createItemOpen,
    setCreateItemOpen,
    editItemOpen,
    setEditItemOpen,
    editingItem,
    setEditingItem,

    editEntryOpen,
    setEditEntryOpen,
    editingEntryId,
    setEditingEntryId,
    editExitOpen,
    setEditExitOpen,
    editingExitId,
    setEditingExitId,

    handleMovementSaved,
    handleAlertsRefresh,

    expiringAlerts: dashboard.expiringAlerts,
    alertsCount: dashboard.expiringAlerts.totalCount,
    expiredItems: dashboard.expiredItems,
    recentMovements: dashboard.recentMovements,
    openMovementEdit,
  };
}
