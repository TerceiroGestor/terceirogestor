"use client";

import * as React from "react";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { listPantryHistory, type ApiPantryHistoryMovement } from "@/modules/pantry/api";
import type { PantryRecentMovement } from "@/modules/pantry/features/overview/ui/sections/pantry-overview-movements-section";
import { exitTypeLabel } from "@/modules/pantry/features/overview/domain/overview.helpers";
import { useUrlSyncedState } from "@/components/record-browser/hooks/useUrlSyncedState";
import type { Domain, DomainCondition } from "@/web-client/domain/types";
import { parseDomain, serializeDomain } from "@/web-client/domain/serialize";

export type PantryHistoryView = "cards" | "table" | "timeline" | "graph";
type PantryHistoryExitType = "ATTENDED" | "DONATION" | "EVENT" | "PARTY" | "CORRECTION";

type PantryHistoryFilters = {
  view: PantryHistoryView;
  searchText: string;
  domain: Domain;
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
  const page = parsePositiveInt(params.get("page"), 1);
  const limit = parsePositiveInt(params.get("limit"), 50);

  return {
    view,
    searchText,
    domain,
    pageIndex: page - 1,
    pageSize: Math.min(Math.max(limit, 1), 200),
  };
};

const serializePantryHistoryFilters = (state: PantryHistoryFilters) => ({
  view: state.view === "timeline" ? undefined : state.view,
  q: state.searchText.trim() ? state.searchText.trim() : undefined,
  d: state.domain ? serializeDomain(state.domain) : undefined,
  page: state.pageIndex > 0 ? String(state.pageIndex + 1) : undefined,
  limit: state.pageSize === 50 ? undefined : String(state.pageSize),
});

function collectAndConditions(domain: Domain): DomainCondition[] | null {
  if (!domain) return [];
  if (domain.type === "condition") return [domain];
  if (domain.type === "not") return null;
  if (domain.type === "group") {
    if (domain.combinator !== "and") return null;
    const all: DomainCondition[] = [];
    for (const child of domain.children) {
      const flattened = collectAndConditions(child);
      if (!flattened) return null;
      all.push(...flattened);
    }
    return all;
  }
  return null;
}

function resolveHistoryQuery(domain: Domain) {
  const conditions = collectAndConditions(domain);
  if (!conditions) {
    return {
      ok: false as const,
      message: "Este endpoint ainda suporta apenas filtros combinados com AND.",
      params: null,
    };
  }

  const params: {
    kind?: "ALL" | "ENTRY" | "EXIT";
    from?: string;
    to?: string;
    type?: PantryHistoryExitType;
    eventName?: string;
    itemId?: string;
  } = {};

  conditions.forEach((condition) => {
    const value = condition.value;
    switch (condition.field) {
      case "kind":
        if (condition.operator === "=" && (value === "ENTRY" || value === "EXIT")) {
          params.kind = value;
        }
        break;
      case "movementDate":
        if (condition.operator === "between" && Array.isArray(value)) {
          const [from, to] = value;
          if (typeof from === "string" && from) params.from = from;
          if (typeof to === "string" && to) params.to = to;
        } else if (condition.operator === ">=" && typeof value === "string") {
          params.from = value;
        } else if (condition.operator === "<=" && typeof value === "string") {
          params.to = value;
        } else if (condition.operator === "=" && typeof value === "string") {
          params.from = value;
          params.to = value;
        }
        break;
      case "type":
        if (
          condition.operator === "=" &&
          (value === "ATTENDED" ||
            value === "DONATION" ||
            value === "EVENT" ||
            value === "PARTY" ||
            value === "CORRECTION")
        ) {
          params.type = value;
        }
        break;
      case "eventName":
        if (
          (condition.operator === "contains" ||
            condition.operator === "ilike" ||
            condition.operator === "=") &&
          typeof value === "string"
        ) {
          params.eventName = value;
        }
        break;
      case "itemId":
        if (condition.operator === "=" && typeof value === "string") {
          params.itemId = value;
        }
        break;
      default:
        break;
    }
  });

  return { ok: true as const, message: null, params };
}

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
  const [debouncedDomainKey, setDebouncedDomainKey] = React.useState("");

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

  React.useEffect(() => {
    setFilters((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedSearch, debouncedDomainKey, setFilters]);

  React.useEffect(() => {
    if (!shouldFetchAll) return;
    setFilters((prev) => ({ ...prev, pageIndex: 0 }));
  }, [shouldFetchAll, setFilters]);

  const loadHistory = React.useCallback(
    async (force = false) => {
      if (!token || !enabled) return;

      const query = resolveHistoryQuery(filters.domain);
      if (!query.ok) {
        setError(query.message);
        setMovements([]);
        setTotalCount(0);
        setPageCount(0);
        return;
      }

      if (!force) {
        if (inFlightRequestRef.current === requestKey) return;
        if (lastRequestRef.current === requestKey) return;
      }

      inFlightRequestRef.current = requestKey;
      setLoading(true);
      setError(null);

      try {
        const response = await listPantryHistory(token, {
          kind: query.params?.kind,
          from: query.params?.from,
          to: query.params?.to,
          search: debouncedSearch || undefined,
          type: query.params?.type,
          eventName: query.params?.eventName,
          itemId: query.params?.itemId,
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
      debouncedSearch,
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
