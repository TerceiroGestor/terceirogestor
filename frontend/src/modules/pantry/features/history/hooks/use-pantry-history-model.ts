"use client";

import * as React from "react";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { listPantryHistory, type ApiPantryHistoryMovement } from "@/modules/pantry/api";
import type { PantryRecentMovement } from "@/modules/pantry/features/overview/ui/sections/pantry-overview-movements-section";
import { exitTypeLabel } from "@/modules/pantry/features/overview/domain/overview.helpers";
import { useUrlSyncedState } from "@/components/record-browser/hooks/useUrlSyncedState";

export type PantryHistoryView = "cards" | "table" | "timeline" | "graph";

type PantryHistoryFilters = {
  view: PantryHistoryView;
  kind: "ALL" | "ENTRY" | "EXIT";
  fromDate: string;
  toDate: string;
  search: string;
  exitType: "all" | "ATTENDED" | "DONATION" | "EVENT" | "PARTY" | "CORRECTION";
  eventName: string;
  pageIndex: number;
  pageSize: number;
};

function normalizeView(value: string | null): PantryHistoryView {
  switch (value) {
    case "cards":
    case "table":
    case "timeline":
    case "graph":
      return value;
    default:
      return "timeline";
  }
}

function normalizeKind(value: string | null): PantryHistoryFilters["kind"] {
  switch (value) {
    case "ENTRY":
    case "EXIT":
      return value;
    default:
      return "ALL";
  }
}

function normalizeExitType(value: string | null): PantryHistoryFilters["exitType"] {
  switch (value) {
    case "ATTENDED":
    case "DONATION":
    case "EVENT":
    case "PARTY":
    case "CORRECTION":
      return value;
    default:
      return "all";
  }
}

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

const parsePantryHistoryFilters = (params: URLSearchParams): PantryHistoryFilters => {
  const view = normalizeView(params.get("view"));
  const kind = normalizeKind(params.get("kind"));
  const search = params.get("q") ?? "";
  const fromDate = params.get("from") ?? "";
  const toDate = params.get("to") ?? "";
  const exitType = normalizeExitType(params.get("type"));
  const eventName = params.get("event") ?? "";
  const page = parsePositiveInt(params.get("page"), 1);
  const limit = parsePositiveInt(params.get("limit"), 50);

  return {
    view,
    kind,
    search,
    fromDate,
    toDate,
    exitType,
    eventName,
    pageIndex: page - 1,
    pageSize: Math.min(Math.max(limit, 1), 200),
  };
};

const serializePantryHistoryFilters = (state: PantryHistoryFilters) => ({
  view: state.view === "timeline" ? undefined : state.view,
  kind: state.kind === "ALL" ? undefined : state.kind,
  q: state.search.trim() ? state.search.trim() : undefined,
  from: state.fromDate || undefined,
  to: state.toDate || undefined,
  type: state.exitType === "all" ? undefined : state.exitType,
  event: state.eventName.trim() ? state.eventName.trim() : undefined,
  page: state.pageIndex > 0 ? String(state.pageIndex + 1) : undefined,
  limit: state.pageSize === 50 ? undefined : String(state.pageSize),
});

function mapApiMovement(movement: ApiPantryHistoryMovement): PantryRecentMovement {
  if (movement.kind === "ENTRY") {
    return {
      id: `entry:${movement.id}`,
      kind: "ENTRY",
      date: movement.movementDate,
      sortDate: movement.createdAt ?? movement.movementDate,
      itemId: movement.itemId,
      itemName: movement.item.name,
      unit: movement.unit,
      quantity: Number(movement.quantity),
      sector: movement.sector,
      actor: movement.actor ?? "Sistema",
      meta: movement.donorName ? `Doador: ${movement.donorName}` : "Sem doador",
      notes: movement.notes,
      expiryDate: movement.expiryDate,
    };
  }

  return {
    id: `exit:${movement.id}`,
    kind: "EXIT",
    date: movement.movementDate,
    sortDate: movement.createdAt ?? movement.movementDate,
    itemId: movement.itemId,
    itemName: movement.item.name,
    unit: movement.unit,
    quantity: Number(movement.quantity),
    sector: movement.sector,
    actor: movement.actor ?? "Sistema",
    meta: movement.eventName ? `Evento: ${movement.eventName}` : exitTypeLabel(movement.type ?? ""),
    notes: movement.notes,
    expiryDate: null,
    exitType: movement.type,
    eventName: movement.eventName,
  };
}

export function usePantryHistoryModel() {
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();

  const canRead = permissions.includes("pantry.read");
  const enabled = Boolean(token && isAuthenticated && canRead);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [movements, setMovements] = React.useState<PantryRecentMovement[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [pageCount, setPageCount] = React.useState(0);

  const [filters, setFilters] = useUrlSyncedState<PantryHistoryFilters>({
    parse: parsePantryHistoryFilters,
    serialize: serializePantryHistoryFilters,
  });

  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [debouncedEventName, setDebouncedEventName] = React.useState("");

  const shouldFetchAll = filters.view === "graph";
  const requestKey = React.useMemo(
    () =>
      JSON.stringify({
        kind: filters.kind,
        from: filters.fromDate,
        to: filters.toDate,
        search: debouncedSearch,
        exitType: filters.exitType,
        eventName: debouncedEventName,
        page: shouldFetchAll ? 1 : filters.pageIndex + 1,
        limit: shouldFetchAll ? 0 : filters.pageSize,
        all: shouldFetchAll,
      }),
    [
      debouncedEventName,
      debouncedSearch,
      filters.exitType,
      filters.fromDate,
      filters.kind,
      filters.pageIndex,
      filters.pageSize,
      filters.toDate,
      filters.view,
      shouldFetchAll,
    ],
  );

  const inFlightRequestRef = React.useRef<string | null>(null);
  const lastRequestRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
    }, 350);
    return () => clearTimeout(handler);
  }, [filters.search]);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedEventName(filters.eventName.trim());
    }, 350);
    return () => clearTimeout(handler);
  }, [filters.eventName]);

  React.useEffect(() => {
    setFilters((prev) => ({ ...prev, pageIndex: 0 }));
  }, [
    debouncedSearch,
    debouncedEventName,
    filters.kind,
    filters.fromDate,
    filters.toDate,
    filters.exitType,
  ]);

  React.useEffect(() => {
    if (!shouldFetchAll) return;
    setFilters((prev) => ({ ...prev, pageIndex: 0 }));
  }, [shouldFetchAll]);

  const loadHistory = React.useCallback(
    async (force = false) => {
      if (!token || !enabled) return;
      if (!force) {
        if (inFlightRequestRef.current === requestKey) return;
        if (lastRequestRef.current === requestKey) return;
      }

      inFlightRequestRef.current = requestKey;
      setLoading(true);
      setError(null);

      try {
        const response = await listPantryHistory(token, {
          kind: filters.kind,
          from: filters.fromDate || undefined,
          to: filters.toDate || undefined,
          search: debouncedSearch || undefined,
          type: filters.exitType === "all" ? undefined : filters.exitType,
          eventName: debouncedEventName || undefined,
          page: shouldFetchAll ? undefined : filters.pageIndex + 1,
          limit: shouldFetchAll ? undefined : filters.pageSize,
          all: shouldFetchAll ? true : undefined,
        });

        setMovements(response.data.map(mapApiMovement));
        setTotalCount(response.pagination.total);
        setPageCount(response.pagination.pages);
        lastRequestRef.current = requestKey;
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao carregar histÃ³rico.";
        setError(message);
        setMovements([]);
        setTotalCount(0);
        setPageCount(0);
        lastRequestRef.current = requestKey;
      } finally {
        inFlightRequestRef.current = null;
        setLoading(false);
      }
    },
    [
      debouncedEventName,
      debouncedSearch,
      enabled,
      filters.exitType,
      filters.fromDate,
      filters.kind,
      filters.pageIndex,
      filters.pageSize,
      filters.toDate,
      requestKey,
      shouldFetchAll,
      token,
    ],
  );

  React.useEffect(() => {
    if (authLoading) return;
    if (!token || !enabled) {
      setLoading(false);
      return;
    }
    loadHistory();
  }, [authLoading, enabled, loadHistory, token]);

  const [editEntryOpen, setEditEntryOpen] = React.useState(false);
  const [editingEntryId, setEditingEntryId] = React.useState<string | null>(null);
  const [editExitOpen, setEditExitOpen] = React.useState(false);
  const [editingExitId, setEditingExitId] = React.useState<string | null>(null);

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
    token,
    canRead,
    loading,
    error,
    movements,
    totalCount,
    pageCount,
    filters,
    setFilters,
    reload: () => loadHistory(true),
    openMovementEdit,
    editEntryOpen,
    setEditEntryOpen,
    editingEntryId,
    setEditingEntryId,
    editExitOpen,
    setEditExitOpen,
    editingExitId,
    setEditingExitId,
  };
}
