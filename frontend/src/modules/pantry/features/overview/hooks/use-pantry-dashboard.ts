"use client";

import * as React from "react";
import { getPantryDashboard, type PantryDashboardResponse } from "@/modules/pantry/api";
import type { PantryMovementDialogItem } from "@/modules/pantry/shared/ui/pantry-item-movement-dialog";
import { exitTypeLabel } from "@/modules/pantry/features/overview/domain/overview.helpers";
import type { PantryExpiringItem } from "@/modules/pantry/features/overview/ui/sections/pantry-overview-alerts-section";
import type { PantryRecentMovement } from "@/modules/pantry/features/overview/ui/sections/pantry-overview-movements-section";

type StockRow = PantryDashboardResponse["stockRows"][number];

type UsePantryDashboardArgs = {
  token: string | null;
  enabled: boolean;
  authLoading: boolean;
};

export function usePantryDashboard({ token, enabled, authLoading }: UsePantryDashboardArgs) {
  const [dashboard, setDashboard] = React.useState<PantryDashboardResponse | null>(
    null,
  );
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [onlyLowStock, setOnlyLowStock] = React.useState(false);

  const loadDashboard = React.useCallback(async () => {
    if (!token || !enabled) return;
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
  }, [token, enabled]);

  React.useEffect(() => {
    if (authLoading) return;
    if (!token || !enabled) {
      setLoading(false);
      return;
    }
    loadDashboard();
  }, [authLoading, token, enabled, loadDashboard]);

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

  const stockRows = React.useMemo<StockRow[]>(() => {
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

  const expiredItems = React.useMemo<PantryExpiringItem[]>(() => {
    return (dashboard?.expiring ?? []).filter(
      (row) => row.validityStatus === "Vencido",
    );
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

  return {
    dashboard,
    loading,
    error,
    loadDashboard,
    onlyLowStock,
    setOnlyLowStock,
    groups,
    items,
    stockRows,
    itemSummaryById,
    expiredItems,
    recentMovements,
  };
}

