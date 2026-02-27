"use client";

import * as React from "react";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { useRequireAuth } from "@/hooks/use-require-auth";
import type { ApiPantryHistoryMovement } from "@/modules/pantry/api";
import type { PantryRecentMovement } from "@/modules/pantry/features/overview/ui/sections/pantry-overview-movements-section";
import { exitTypeLabel } from "@/modules/pantry/features/overview/domain/overview.helpers";
import type { Domain, DomainCondition } from "@/web-client/domain/types";
import { parseDomain, serializeDomain } from "@/web-client/domain/serialize";
import { createRestDataProvider } from "@/web-client/data-provider";
import { usePersistedUrlState } from "@/web-client/screen/usePersistedUrlState";

export type PantryHistoryView = "kanban" | "table" | "timeline" | "graph";

type PantryHistoryFilters = {
  view: PantryHistoryView;
  searchText: string;
  domain: Domain;
  groupBy: string[];
  pageIndex: number;
  pageSize: number;
};

const DEFAULT_GROUP_BY = ["kind"];

function normalizeView(value: string | null): PantryHistoryView {
  switch (value) {
    case "kanban":
      return "kanban";
    // legacy alias
    case "cards":
      return "kanban";
    case "table":
    case "timeline":
    case "graph":
      return value;
    default:
      return "timeline";
  }
}

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function buildDomainFromLegacyParams(params: URLSearchParams): Domain {
  const kind = params.get("kind");
  const from = params.get("from");
  const to = params.get("to");
  const type = params.get("type");
  const event = params.get("event");
  const itemId = params.get("itemId");

  const conditions: DomainCondition[] = [];

  if (kind === "ENTRY" || kind === "EXIT") {
    conditions.push({ type: "condition", field: "kind", operator: "=", value: kind });
  }

  if (from || to) {
    if (from && to) {
      conditions.push({
        type: "condition",
        field: "movementDate",
        operator: "between",
        value: [from || null, to || null],
      });
    } else if (from) {
      conditions.push({
        type: "condition",
        field: "movementDate",
        operator: ">=",
        value: from,
      });
    } else if (to) {
      conditions.push({
        type: "condition",
        field: "movementDate",
        operator: "<=",
        value: to,
      });
    }
  }

  if (type) {
    conditions.push({ type: "condition", field: "type", operator: "=", value: type });
  }

  if (event) {
    conditions.push({
      type: "condition",
      field: "eventName",
      operator: "ilike",
      value: event,
    });
  }

  if (itemId) {
    conditions.push({ type: "condition", field: "itemId", operator: "=", value: itemId });
  }

  if (!conditions.length) return null;
  if (conditions.length === 1) return conditions[0];
  return { type: "group", combinator: "and", children: conditions };
}

const parsePantryHistoryFilters = (params: URLSearchParams): PantryHistoryFilters => {
  const view = normalizeView(params.get("view"));
  const searchText = params.get("q") ?? "";
  const domain = parseDomain(params.get("d")) ?? buildDomainFromLegacyParams(params);
  const groupBy = (params.get("g") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const page = parsePositiveInt(params.get("page"), 1);
  const limit = parsePositiveInt(params.get("limit"), 100);

  return {
    view,
    searchText,
    domain,
    groupBy: groupBy.length ? groupBy : DEFAULT_GROUP_BY,
    pageIndex: page - 1,
    pageSize: Math.min(Math.max(limit, 1), 200),
  };
};

const serializePantryHistoryFilters = (state: PantryHistoryFilters) => ({
  view: state.view === "timeline" ? undefined : state.view,
  q: state.searchText.trim() ? state.searchText.trim() : undefined,
  d: state.domain ? serializeDomain(state.domain) : undefined,
  g: state.groupBy[0] && state.groupBy[0] !== DEFAULT_GROUP_BY[0] ? state.groupBy.join(",") : undefined,
  page: state.pageIndex > 0 ? String(state.pageIndex + 1) : undefined,
  limit: state.pageSize === 100 ? undefined : String(state.pageSize),
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

  const [filters, setFilters] = usePersistedUrlState<PantryHistoryFilters>({
    storageKey: "screenState:pantry.history",
    trackedKeys: ["view", "q", "d", "g", "page", "limit", "kind", "from", "to", "type", "event", "itemId"],
    parse: parsePantryHistoryFilters,
    serialize: serializePantryHistoryFilters,
  });

  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [debouncedDomainKey, setDebouncedDomainKey] = React.useState("");

  const dataProvider = React.useMemo(() => createRestDataProvider({ token }), [token]);

  const shouldFetchAll = filters.view === "graph";
  const requestKey = React.useMemo(() => {
    const pagePart = shouldFetchAll ? "all" : `page:${filters.pageIndex}:${filters.pageSize}`;
    return `${pagePart}:${debouncedSearch}:${debouncedDomainKey}`;
  }, [debouncedDomainKey, debouncedSearch, filters.pageIndex, filters.pageSize, shouldFetchAll]);

  const inFlightRequestRef = React.useRef<string | null>(null);
  const lastRequestRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(filters.searchText.trim());
    }, 350);
    return () => clearTimeout(handler);
  }, [filters.searchText]);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedDomainKey(filters.domain ? serializeDomain(filters.domain) : "");
    }, 350);
    return () => clearTimeout(handler);
  }, [filters.domain]);

  const resetPaginationKeyRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    const key = `${debouncedSearch}:${debouncedDomainKey}`;
    if (resetPaginationKeyRef.current === null) {
      resetPaginationKeyRef.current = key;
      return;
    }
    if (resetPaginationKeyRef.current === key) return;
    resetPaginationKeyRef.current = key;
    setFilters((prev) => (prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }));
  }, [debouncedSearch, debouncedDomainKey, setFilters]);

  React.useEffect(() => {
    if (!shouldFetchAll) return;
    setFilters((prev) => (prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }));
  }, [shouldFetchAll, setFilters]);

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
        const response = await dataProvider.search<ApiPantryHistoryMovement>("pantry.history", {
          domain: filters.domain,
          searchText: debouncedSearch || undefined,
          pagination: {
            pageIndex: filters.pageIndex,
            pageSize: filters.pageSize,
          },
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
      debouncedSearch,
      dataProvider,
      enabled,
      filters.domain,
      filters.pageIndex,
      filters.pageSize,
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
