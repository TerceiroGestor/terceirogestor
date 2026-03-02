"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  Clock3,
  LayoutGrid,
  Table2,
  RefreshCcw,
  SlidersHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import {
  bucketLocalDate,
  formatDateOnlyPtBR,
  parseLocalDateOnly,
  type DateBucket,
  toLocalIsoDate,
} from "@/lib/date";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { PageControlPanel } from "@/web-client/control-panel/PageControlPanel";
import { SearchBar } from "@/web-client/control-panel/SearchBar";
import { SearchPanelMenu } from "@/web-client/control-panel/SearchPanelMenu";
import { ViewSwitcher } from "@/web-client/control-panel/ViewSwitcher";
import { buildQueryFacets } from "@/web-client/control-panel/queryFacets";
import { removeConditionAtIndex } from "@/web-client/domain/conditions";
import type { Domain } from "@/web-client/domain/types";
import { parseDomain, serializeDomain } from "@/web-client/domain/serialize";
import { pantryHistorySearchView } from "@/web-client/registry/searchViews/pantry";
import { usePersistedUrlState } from "@/web-client/screen/usePersistedUrlState";
import type { RecordBrowserViewOption } from "@/components/record-browser/RecordBrowserViewSwitcher";
import { createRestDataProvider } from "@/web-client/data-provider";
import { CalendarView } from "@/web-client/views/CalendarView";
import { GraphView, type GraphChartType } from "@/web-client/views/GraphView";
import { KanbanView } from "@/web-client/views/KanbanView";
import { ListView } from "@/web-client/views/ListView";
import { TimelineView } from "@/web-client/views/TimelineView";
import { PaginationBar } from "@/web-client/ui/PaginationBar";
import type { ApiPantryHistoryMovement } from "@/modules/pantry/api";
import { PANTRY_ACTION_IDS, PANTRY_ROUTES, PANTRY_SCREEN_STATE_KEYS } from "@/modules/pantry/shared/domain/pantry.constants";

type PantryHistoryView = "list" | "kanban" | "timeline" | "calendar" | "graph";

type HistoryRow = ApiPantryHistoryMovement & {
  itemName: string;
  itemGroup: string;
};

type PantryHistoryFilters = {
  view: PantryHistoryView;
  searchText: string;
  domain: Domain;
  groupBy: string[];
  pageIndex: number;
  pageSize: number;
  calendarField: string;
  calendarMode: DateBucket;
  calendarFrom: string;
  calendarTo: string;
  timelineField: string;
  graphGroupField: string;
  graphMetric: "count" | "quantity";
  graphType: GraphChartType;
  graphItemId: string;
  graphTimeField: string;
  graphFrom: string;
  graphTo: string;
  graphBucket: DateBucket;
};

type PantryHistoryFavoriteState = Pick<
  PantryHistoryFilters,
  | "view"
  | "searchText"
  | "domain"
  | "groupBy"
  | "pageSize"
  | "calendarField"
  | "calendarMode"
  | "calendarFrom"
  | "calendarTo"
  | "timelineField"
  | "graphGroupField"
  | "graphMetric"
  | "graphType"
  | "graphItemId"
  | "graphTimeField"
  | "graphFrom"
  | "graphTo"
  | "graphBucket"
>;

const DEFAULT_CALENDAR_FIELD = "movementDate";
const DEFAULT_CALENDAR_MODE: PantryHistoryFilters["calendarMode"] = "month";
const DEFAULT_TIMELINE_FIELD = "movementDate";
const DEFAULT_GRAPH_GROUP_FIELD = "kind";
const DEFAULT_GRAPH_METRIC: PantryHistoryFilters["graphMetric"] = "quantity";
const DEFAULT_GRAPH_TYPE: PantryHistoryFilters["graphType"] = "bar";
const DEFAULT_GRAPH_TIME_FIELD = "movementDate";
const DEFAULT_GRAPH_BUCKET: PantryHistoryFilters["graphBucket"] = "day";

const controlLineClassName =
  "h-8 rounded-none border-0 border-b border-border/60 bg-transparent px-0 text-xs shadow-none focus-visible:ring-0";

function normalizeView(value: string | null): PantryHistoryView {
  switch (value) {
    case "kanban":
    case "timeline":
    case "calendar":
    case "graph":
    case "list":
      return value;
    case "table":
      return "list";
    default:
      return "list";
  }
}

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function normalizeIsoDateOnly(value: string | null) {
  const text = String(value ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
}

function normalizeCalendarMode(value: string | null): PantryHistoryFilters["calendarMode"] {
  switch (value) {
    case "day":
    case "week":
    case "month":
    case "year":
      return value;
    default:
      return DEFAULT_CALENDAR_MODE;
  }
}

function normalizeBucket(value: string | null): DateBucket {
  switch (value) {
    case "day":
    case "week":
    case "month":
    case "year":
      return value;
    default:
      return DEFAULT_GRAPH_BUCKET;
  }
}

function normalizeGraphType(value: string | null): GraphChartType {
  switch (value) {
    case "bar":
    case "bar_horizontal":
    case "line":
    case "area":
    case "pie":
    case "donut":
      return value;
    default:
      return DEFAULT_GRAPH_TYPE;
  }
}

const parsePantryHistoryFilters = (params: URLSearchParams): PantryHistoryFilters => {
  const view = normalizeView(params.get("view") ?? params.get("v"));
  const searchText = params.get("q") ?? "";
  const domain = parseDomain(params.get("d")) ?? null;
  const groupParam = params.get("g");
  const groupBy =
    groupParam === "none"
      ? []
      : (groupParam ?? "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
  const page = parsePositiveInt(params.get("page"), 1);
  const limit = parsePositiveInt(params.get("limit"), 50);
  const calendarField = params.get("cf") ?? DEFAULT_CALENDAR_FIELD;
  const calendarMode = normalizeCalendarMode(params.get("cm"));
  const calendarFrom = normalizeIsoDateOnly(params.get("cfrom"));
  const calendarTo = normalizeIsoDateOnly(params.get("cto"));
  const timelineField = params.get("tf") ?? DEFAULT_TIMELINE_FIELD;
  const graphGroupField = params.get("gf") ?? DEFAULT_GRAPH_GROUP_FIELD;
  const graphMetric = (params.get("gm") as PantryHistoryFilters["graphMetric"]) ?? DEFAULT_GRAPH_METRIC;
  const graphType = normalizeGraphType(params.get("gt"));
  const graphItemId = params.get("gi") ?? "";
  const graphTimeField = params.get("gdf") ?? DEFAULT_GRAPH_TIME_FIELD;
  const graphFrom = normalizeIsoDateOnly(params.get("gfrom"));
  const graphTo = normalizeIsoDateOnly(params.get("gto"));
  const graphBucket = normalizeBucket(params.get("gb"));

  return {
    view,
    searchText,
    domain,
    groupBy: groupParam === "none" ? [] : groupBy,
    pageIndex: page - 1,
    pageSize: Math.min(Math.max(limit, 1), 200),
    calendarField,
    calendarMode,
    calendarFrom,
    calendarTo,
    timelineField,
    graphGroupField,
    graphMetric: graphMetric === "count" ? "count" : "quantity",
    graphType,
    graphItemId,
    graphTimeField,
    graphFrom,
    graphTo,
    graphBucket,
  };
};

const serializePantryHistoryFilters = (state: PantryHistoryFilters) => ({
  view: state.view === "list" ? undefined : state.view,
  q: state.searchText.trim() ? state.searchText.trim() : undefined,
  d: state.domain ? serializeDomain(state.domain) : undefined,
  g: state.groupBy.length ? state.groupBy.join(",") : undefined,
  page: state.pageIndex > 0 ? String(state.pageIndex + 1) : undefined,
  limit: state.pageSize === 50 ? undefined : String(state.pageSize),
  cf: state.calendarField !== DEFAULT_CALENDAR_FIELD ? state.calendarField : undefined,
  cm: state.calendarMode !== DEFAULT_CALENDAR_MODE ? state.calendarMode : undefined,
  cfrom: state.calendarFrom || undefined,
  cto: state.calendarTo || undefined,
  tf: state.timelineField !== DEFAULT_TIMELINE_FIELD ? state.timelineField : undefined,
  gf: state.graphGroupField !== DEFAULT_GRAPH_GROUP_FIELD ? state.graphGroupField : undefined,
  gm: state.graphMetric !== DEFAULT_GRAPH_METRIC ? state.graphMetric : undefined,
  gt: state.graphType !== DEFAULT_GRAPH_TYPE ? state.graphType : undefined,
  gi: state.graphItemId ? state.graphItemId : undefined,
  gdf: state.graphTimeField !== DEFAULT_GRAPH_TIME_FIELD ? state.graphTimeField : undefined,
  gfrom: state.graphFrom || undefined,
  gto: state.graphTo || undefined,
  gb: state.graphBucket !== DEFAULT_GRAPH_BUCKET ? state.graphBucket : undefined,
});

function resolveKindLabel(kind: ApiPantryHistoryMovement["kind"]) {
  return kind === "ENTRY" ? "Entrada" : "Saída";
}

function resolveExitTypeLabel(type?: string | null) {
  if (!type) return "";
  switch (type) {
    case "ATTENDED":
      return "Atendidos";
    case "DONATION":
      return "Doação";
    case "EVENT":
      return "Evento";
    case "PARTY":
      return "Festa";
    case "CORRECTION":
      return "Correção";
    default:
      return type;
  }
}

function resolveGroupValue(row: ApiPantryHistoryMovement, field: string) {
  switch (field) {
    case "kind":
      return resolveKindLabel(row.kind);
    case "sector":
      return row.sector?.trim() || "Geral";
    case "type":
      return resolveExitTypeLabel(row.type);
    case "itemId":
      return row.item?.name?.trim() || "Item";
    case "itemGroup":
      return row.item?.group?.trim() || "Sem grupo";
    case "movementDate":
      return formatDateOnlyPtBR(row.movementDate);
    case "expiryDate":
      return row.expiryDate ? formatDateOnlyPtBR(row.expiryDate) : "Sem validade";
    default:
      return String((row as Record<string, unknown>)[field] ?? "").trim() || "—";
  }
}

function resolveDate(row: ApiPantryHistoryMovement, field: string) {
  const raw = (row as Record<string, unknown>)[field];
  if (!raw) return null;
  return parseLocalDateOnly(String(raw));
}

export function PantryHistoryClientPage() {
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);

  const canRead = permissions.includes("pantry.read");

  const dataProvider = React.useMemo(() => createRestDataProvider({ token }), [token]);

  const [rows, setRows] = React.useState<ApiPantryHistoryMovement[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [pageCount, setPageCount] = React.useState(0);
  const [totalCount, setTotalCount] = React.useState(0);

  const [filters, setFilters] = usePersistedUrlState<PantryHistoryFilters>({
    storageKey: PANTRY_SCREEN_STATE_KEYS.history,
    trackedKeys: ["view", "v", "q", "d", "g", "page", "limit", "cf", "tf", "gf", "gm", "gt", "gi", "gdf", "gfrom", "gto", "gb"],
    parse: parsePantryHistoryFilters,
    serialize: serializePantryHistoryFilters,
  });

  const shouldFetchAll = filters.view === "calendar" || filters.view === "timeline" || filters.view === "graph";

  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const resetPaginationKeyRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(filters.searchText.trim());
    }, 350);
    return () => clearTimeout(handler);
  }, [filters.searchText]);

  React.useEffect(() => {
    const key = `${debouncedSearch}::${filters.domain ? serializeDomain(filters.domain) : ""}`;
    if (resetPaginationKeyRef.current === null) {
      resetPaginationKeyRef.current = key;
      return;
    }
    if (resetPaginationKeyRef.current === key) return;
    resetPaginationKeyRef.current = key;
    setFilters((prev) => (prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }));
  }, [debouncedSearch, filters.domain, setFilters]);

  const viewOptions = React.useMemo<RecordBrowserViewOption<PantryHistoryView>[]>(
    () => [
      { value: "list", label: "Tabela", icon: <Table2 className="size-4" /> },
      { value: "kanban", label: "Kanban", icon: <LayoutGrid className="size-4" /> },
      { value: "timeline", label: "Timeline", icon: <Clock3 className="size-4" /> },
      { value: "calendar", label: "Calendário", icon: <CalendarDays className="size-4" /> },
      { value: "graph", label: "Gráfico", icon: <BarChart3 className="size-4" /> },
    ],
    [],
  );

  const openItem = React.useCallback(
    (row: ApiPantryHistoryMovement) => {
      router.push(withTenantPath(`${PANTRY_ROUTES.items}/${row.itemId}`, tenantSlug));
    },
    [router, tenantSlug],
  );

  const itemLabelById = React.useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((row) => {
      map.set(row.itemId, row.item?.name ?? row.itemId);
    });
    return map;
  }, [rows]);

  const viewRows = React.useMemo<HistoryRow[]>(() => {
    return rows.map((row) => ({
      ...row,
      itemName: row.item?.name ?? "",
      itemGroup: row.item?.group ?? "",
    }));
  }, [rows]);

  const valueSuggestions = React.useMemo(() => {
    const sectors = new Set<string>();
    const donors = new Set<string>();
    const items = new Set<string>();
    const groups = new Set<string>();
    const actors = new Set<string>();
    const events = new Set<string>();

    rows.forEach((row) => {
      if (row.sector?.trim()) sectors.add(row.sector.trim());
      if (row.donorName?.trim()) donors.add(row.donorName.trim());
      if (row.item?.name?.trim()) items.add(row.item.name.trim());
      if (row.item?.group?.trim()) groups.add(row.item.group.trim());
      if (row.actor?.trim()) actors.add(row.actor.trim());
      if (row.eventName?.trim()) events.add(row.eventName.trim());
    });

    const sectorList = Array.from(sectors).sort((a, b) => a.localeCompare(b));
    const donorList = Array.from(donors).sort((a, b) => a.localeCompare(b));
    const itemList = Array.from(items).sort((a, b) => a.localeCompare(b));
    const groupList = Array.from(groups).sort((a, b) => a.localeCompare(b));
    const actorList = Array.from(actors).sort((a, b) => a.localeCompare(b));
    const eventList = Array.from(events).sort((a, b) => a.localeCompare(b));

    return (fieldName: string) => {
      if (fieldName === "sector") return sectorList;
      if (fieldName === "donorName") return donorList;
      if (fieldName === "itemName") return itemList;
      if (fieldName === "itemGroup") return groupList;
      if (fieldName === "actor") return actorList;
      if (fieldName === "eventName") return eventList;
      return [];
    };
  }, [rows]);

  const loadRows = React.useCallback(async () => {
    if (!token || !canRead) return;
    setLoading(true);
    setError(null);
    try {
      const response = await dataProvider.search<ApiPantryHistoryMovement>("pantry.history", {
        searchText: debouncedSearch,
        domain: filters.domain,
        all: shouldFetchAll ? true : undefined,
        pagination: shouldFetchAll ? undefined : { pageIndex: filters.pageIndex, pageSize: filters.pageSize },
      });

      setRows(response.data);
      const pages = response.pagination?.pages ?? 1;
      const total = response.pagination?.total ?? response.data.length;
      setPageCount(pages);
      setTotalCount(total);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar histórico.";
      setError(message);
      toast({ variant: "destructive", title: "Falha ao carregar", description: message });
      setRows([]);
      setPageCount(0);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [canRead, dataProvider, debouncedSearch, filters.domain, filters.pageIndex, filters.pageSize, shouldFetchAll, toast, token]);

  React.useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const removeDomainCondition = React.useCallback(
    (index: number) => {
      setFilters((prev) => {
        return {
          ...prev,
          domain: removeConditionAtIndex(prev.domain, "and", index),
          pageIndex: 0,
        };
      });
    },
    [setFilters],
  );

  const queryFacets = React.useMemo(
    () =>
      buildQueryFacets({
        domain: filters.domain,
        groupBy: filters.groupBy,
        searchView: pantryHistorySearchView,
        onClearGroupBy: () => setFilters((prev) => ({ ...prev, groupBy: [] })),
        onClearDomain: () => setFilters((prev) => ({ ...prev, domain: null, pageIndex: 0 })),
        onRemoveDomainCondition: removeDomainCondition,
      }),
    [filters.domain, filters.groupBy, removeDomainCondition, setFilters],
  );

  const columns = React.useMemo<ColumnDef<HistoryRow>[]>(
    () => [
      {
        id: "itemName",
        header: "Alimento",
        accessorFn: (row) => row.item?.name ?? "",
        cell: ({ row }) => (
          <div className="min-w-0 truncate font-medium text-foreground">{row.original.item?.name}</div>
        ),
      },
      {
        id: "itemGroup",
        header: "Grupo",
        accessorFn: (row) => row.item?.group ?? "",
        cell: ({ row }) => (
          <div className="truncate text-sm text-muted-foreground">{row.original.item?.group ?? "—"}</div>
        ),
      },
      {
        accessorKey: "kind",
        header: "Movimento",
        cell: ({ row }) => (
          <div className="text-sm">{resolveKindLabel(row.original.kind)}</div>
        ),
      },
      {
        accessorKey: "sector",
        header: "Setor",
        cell: ({ row }) => (
          <div className="truncate text-sm text-muted-foreground">{row.original.sector}</div>
        ),
      },
      {
        accessorKey: "type",
        header: "Tipo de saída",
        cell: ({ row }) => (
          <div className="truncate text-sm text-muted-foreground">
            {row.original.kind === "EXIT" && row.original.type
              ? resolveExitTypeLabel(row.original.type)
              : "—"}
          </div>
        ),
      },
      {
        accessorKey: "eventName",
        header: "Evento",
        cell: ({ row }) => (
          <div className="truncate text-sm text-muted-foreground">
            {row.original.kind === "EXIT" ? row.original.eventName ?? "—" : "—"}
          </div>
        ),
      },
      {
        accessorKey: "donorName",
        header: "Doador",
        cell: ({ row }) => (
          <div className="truncate text-sm text-muted-foreground">
            {row.original.kind === "ENTRY" ? row.original.donorName ?? "—" : "—"}
          </div>
        ),
      },
      {
        accessorKey: "quantity",
        header: "Qtd.",
        cell: ({ row }) => (
          <div className="font-mono tabular-nums">{Number(row.original.quantity).toLocaleString("pt-BR")}</div>
        ),
      },
      {
        accessorKey: "unit",
        header: "Un.",
        cell: ({ row }) => <div className="text-sm text-muted-foreground">{row.original.unit}</div>,
      },
      {
        accessorKey: "movementDate",
        header: "Data",
        cell: ({ row }) => formatDateOnlyPtBR(row.original.movementDate),
      },
      {
        accessorKey: "expiryDate",
        header: "Validade",
        cell: ({ row }) => (row.original.expiryDate ? formatDateOnlyPtBR(row.original.expiryDate) : "—"),
      },
      {
        accessorKey: "actor",
        header: "Usuário",
        cell: ({ row }) => <div className="truncate text-sm text-muted-foreground">{row.original.actor ?? "—"}</div>,
      },
      {
        accessorKey: "notes",
        header: "Notas",
        cell: ({ row }) => (
          <div className="max-w-[340px] truncate text-xs text-muted-foreground">{row.original.notes ?? ""}</div>
        ),
      },
    ],
    [],
  );

  const dateFields = React.useMemo(
    () => pantryHistorySearchView.fields.filter((f) => f.type === "date"),
    [],
  );

  const viewConfig = React.useMemo(() => {
    if (filters.view === "calendar") {
      return null;
    }

    if (filters.view === "timeline") {
      return (
        <Select value={filters.timelineField} onValueChange={(value) => setFilters((prev) => ({ ...prev, timelineField: value }))}>
          <SelectTrigger className={`${controlLineClassName} w-[11.5rem]`}>
            <SelectValue placeholder="Data..." />
          </SelectTrigger>
          <SelectContent>
            {dateFields.map((field) => (
              <SelectItem key={field.name} value={field.name}>
                {field.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (filters.view === "graph") {
      const groupByFields = pantryHistorySearchView.groupBy ?? [];
      return (
        <div className="flex flex-wrap items-center gap-1.5">
          <Select value={filters.graphGroupField} onValueChange={(value) => setFilters((prev) => ({ ...prev, graphGroupField: value }))}>
            <SelectTrigger className={`${controlLineClassName} w-[11rem]`}>
              <SelectValue placeholder="Agrupar..." />
            </SelectTrigger>
            <SelectContent>
              {groupByFields.map((opt) => (
                <SelectItem key={opt.field} value={opt.field}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.graphMetric} onValueChange={(value) => setFilters((prev) => ({ ...prev, graphMetric: value === "count" ? "count" : "quantity" }))}>
            <SelectTrigger className={`${controlLineClassName} w-[9.5rem]`}>
              <SelectValue placeholder="Métrica..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="quantity">Quantidade (soma)</SelectItem>
              <SelectItem value="count">Registros</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.graphType} onValueChange={(value) => setFilters((prev) => ({ ...prev, graphType: normalizeGraphType(value) }))}>
            <SelectTrigger className={`${controlLineClassName} w-[9.25rem]`}>
              <SelectValue placeholder="Gráfico..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">Barras</SelectItem>
              <SelectItem value="bar_horizontal">Barras (horizontal)</SelectItem>
              <SelectItem value="line">Linha</SelectItem>
              <SelectItem value="area">Área</SelectItem>
              <SelectItem value="pie">Pizza</SelectItem>
              <SelectItem value="donut">Rosca</SelectItem>
            </SelectContent>
          </Select>

          <div className="hidden h-6 w-px bg-border/60 sm:block" />

          <Select
            value={filters.graphItemId ? filters.graphItemId : "all"}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, graphItemId: value === "all" ? "" : value }))
            }
          >
            <SelectTrigger className={`${controlLineClassName} w-[12rem]`}>
              <SelectValue placeholder="Item..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os itens</SelectItem>
              {Array.from(itemLabelById.entries())
                .sort((a, b) => String(a[1]).localeCompare(String(b[1])))
                .slice(0, 200)
                .map(([id, label]) => (
                  <SelectItem key={id} value={id}>
                    {label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.graphTimeField}
            onValueChange={(value) => setFilters((prev) => ({ ...prev, graphTimeField: value }))}
          >
            <SelectTrigger className={`${controlLineClassName} w-[11.5rem]`}>
              <SelectValue placeholder="Tempo..." />
            </SelectTrigger>
            <SelectContent>
              {dateFields.map((field) => (
                <SelectItem key={field.name} value={field.name}>
                  {field.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={filters.graphFrom}
            onChange={(e) => setFilters((prev) => ({ ...prev, graphFrom: e.target.value }))}
            className={`${controlLineClassName} w-[9rem]`}
          />
          <Input
            type="date"
            value={filters.graphTo}
            onChange={(e) => setFilters((prev) => ({ ...prev, graphTo: e.target.value }))}
            className={`${controlLineClassName} w-[9rem]`}
          />

          <Select
            value={filters.graphBucket}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, graphBucket: normalizeBucket(value) }))
            }
          >
            <SelectTrigger className={`${controlLineClassName} w-[9rem]`}>
              <SelectValue placeholder="Agrupar tempo..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Dia</SelectItem>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="month">Mês</SelectItem>
              <SelectItem value="year">Ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    }

    return null;
  }, [
    dateFields,
    filters.graphBucket,
    filters.graphFrom,
    filters.graphGroupField,
    filters.graphItemId,
    filters.graphMetric,
    filters.graphTimeField,
    filters.graphTo,
    filters.graphType,
    filters.timelineField,
    filters.view,
    itemLabelById,
    setFilters,
  ]);

  const graphData = React.useMemo(() => {
    if (filters.view !== "graph") return [];
    const dateFieldNames = new Set(dateFields.map((field) => field.name));
    const from = filters.graphFrom;
    const to = filters.graphTo;

    const filtered = viewRows.filter((row) => {
      if (filters.graphItemId && row.itemId !== filters.graphItemId) return false;
      if (!from && !to) return true;
      const date = resolveDate(row, filters.graphTimeField);
      if (!date) return false;
      const iso = toLocalIsoDate(date);
      if (from && iso < from) return false;
      if (to && iso > to) return false;
      return true;
    });

    const map = new Map<string, { sortKey: string; x: string; value: number }>();

    filtered.forEach((row) => {
      const groupField = filters.graphGroupField;

      if (dateFieldNames.has(groupField)) {
        const date = resolveDate(row, groupField);
        if (!date) return;
        const bucketed = bucketLocalDate(date, filters.graphBucket);
        const current = map.get(bucketed.key) ?? { sortKey: bucketed.key, x: bucketed.label, value: 0 };
        current.value += filters.graphMetric === "count" ? 1 : Number(row.quantity);
        map.set(bucketed.key, current);
        return;
      }

      const label = resolveGroupValue(row, groupField);
      const current = map.get(label) ?? { sortKey: label, x: label, value: 0 };
      current.value += filters.graphMetric === "count" ? 1 : Number(row.quantity);
      map.set(label, current);
    });

    return Array.from(map.values())
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .slice(0, 120)
      .map(({ x, value }) => ({ x, value }));
  }, [
    dateFields,
    filters.graphBucket,
    filters.graphFrom,
    filters.graphGroupField,
    filters.graphItemId,
    filters.graphMetric,
    filters.graphTimeField,
    filters.graphTo,
    filters.view,
    viewRows,
  ]);

  if (!canRead) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Você não tem permissão.</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <PageControlPanel
        searchSlot={
          <SearchBar
            value={filters.searchText}
            onChange={(next) => setFilters((prev) => ({ ...prev, searchText: next }))}
            placeholder="Pesquisar"
            facets={queryFacets}
            rightSlot={
              <div className="flex items-center gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  title="Atualizar"
                  aria-label="Atualizar"
                  onClick={loadRows}
                  disabled={loading}
                >
                  <RefreshCcw className="size-4" />
                </Button>

                <SearchPanelMenu<PantryHistoryFavoriteState>
                  actionId={PANTRY_ACTION_IDS.history}
                  variant="compact"
                  allowEmptyGroupBy
                  groupByMode="multi"
                  valueSuggestions={valueSuggestions}
                  trigger={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      title="Filtros"
                      aria-label="Filtros"
                    >
                      <SlidersHorizontal className="size-4" />
                    </Button>
                  }
                  searchView={pantryHistorySearchView}
                  domain={filters.domain}
                  onDomainChange={(domain) => setFilters((prev) => ({ ...prev, domain }))}
                  groupBy={filters.groupBy}
                  onGroupByChange={(groupBy) => setFilters((prev) => ({ ...prev, groupBy }))}
                  snapshot={{
                    view: filters.view,
                    searchText: filters.searchText,
                    domain: filters.domain,
                    groupBy: filters.groupBy,
                    pageSize: filters.pageSize,
                    calendarField: filters.calendarField,
                    calendarMode: filters.calendarMode,
                    calendarFrom: filters.calendarFrom,
                    calendarTo: filters.calendarTo,
                    timelineField: filters.timelineField,
                    graphGroupField: filters.graphGroupField,
                    graphMetric: filters.graphMetric,
                    graphType: filters.graphType,
                    graphItemId: filters.graphItemId,
                    graphTimeField: filters.graphTimeField,
                    graphFrom: filters.graphFrom,
                    graphTo: filters.graphTo,
                    graphBucket: filters.graphBucket,
                  }}
                  onApplyFavorite={(state) =>
                    setFilters((prev) => ({
                      ...prev,
                      ...state,
                      calendarFrom: state.calendarFrom ?? "",
                      calendarTo: state.calendarTo ?? "",
                      pageIndex: 0,
                    }))
                  }
                />
              </div>
            }
          />
        }
        viewSwitcherSlot={
          <ViewSwitcher
            value={filters.view}
            options={viewOptions}
            onChange={(next) => setFilters((prev) => ({ ...prev, view: next }))}
          />
        }
        viewControlsSlot={viewConfig}
        rightSlot={
          <>
            <div className="whitespace-nowrap text-[11px] text-muted-foreground">
              Total: <span className="font-mono tabular-nums text-foreground">{totalCount.toLocaleString("pt-BR")}</span>
            </div>
          </>
        }
      />

      {error ? (
        <div className="rounded-md border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">{error}</div>
      ) : loading ? (
        <div className="text-sm text-muted-foreground">Carregando...</div>
      ) : rows.length ? (
        <>
          {filters.view === "kanban" ? (
            <KanbanView<HistoryRow>
              items={viewRows}
              getColumnKey={
                filters.groupBy[0]
                  ? (row) => resolveGroupValue(row, filters.groupBy[0]!)
                  : undefined
              }
              renderCard={(row) => (
                <div
                  className="rounded-md border border-border/60 bg-background px-3 py-2 hover:bg-muted/20"
                  role="button"
                  tabIndex={0}
                  onClick={() => openItem(row)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") openItem(row);
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-foreground">{row.item?.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {resolveKindLabel(row.kind)} • {row.sector || "Geral"}
                        {row.type ? ` • ${resolveExitTypeLabel(row.type)}` : ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm tabular-nums text-foreground">{Number(row.quantity).toLocaleString("pt-BR")}</div>
                      <div className="text-[11px] text-muted-foreground">{row.unit}</div>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{formatDateOnlyPtBR(row.movementDate)}</Badge>
                    <Badge variant="secondary">{row.actor}</Badge>
                  </div>
                </div>
              )}
            />
          ) : filters.view === "calendar" ? (
            <CalendarView<HistoryRow>
              items={viewRows}
              getDate={(row) => resolveDate(row, filters.calendarField)}
              mode={filters.calendarMode}
              onModeChange={(nextMode) =>
                setFilters((prev) => ({ ...prev, calendarMode: nextMode }))
              }
              dateFieldOptions={dateFields.map((field) => ({ value: field.name, label: field.label }))}
              activeDateField={filters.calendarField}
              onActiveDateFieldChange={(value) =>
                setFilters((prev) => ({ ...prev, calendarField: value }))
              }
              rangeFrom={filters.calendarFrom}
              rangeTo={filters.calendarTo}
              onRangeFromChange={(value) =>
                setFilters((prev) => ({ ...prev, calendarFrom: normalizeIsoDateOnly(value) }))
              }
              onRangeToChange={(value) =>
                setFilters((prev) => ({ ...prev, calendarTo: normalizeIsoDateOnly(value) }))
              }
              emptyState="Nenhum movimento neste dia."
              renderItem={(row) => (
                <div
                  className="rounded-md border border-border/60 bg-background px-3 py-2 hover:bg-muted/20"
                  role="button"
                  tabIndex={0}
                  onClick={() => openItem(row)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") openItem(row);
                  }}
                >
                  <div className="truncate text-sm font-semibold text-foreground">{row.item?.name}</div>
                  <div className="text-xs text-muted-foreground">{resolveKindLabel(row.kind)} • {row.sector || "Geral"}</div>
                </div>
              )}
            />
          ) : filters.view === "timeline" ? (
            <TimelineView<HistoryRow>
              items={viewRows}
              getDate={(row) => resolveDate(row, filters.timelineField)}
              renderTitle={(row) => row.item?.name ?? "Movimento"}
              renderBody={(row) => (
                <span>
                  {resolveKindLabel(row.kind)} • {row.sector || "Geral"} • {Number(row.quantity).toLocaleString("pt-BR")} {row.unit}
                </span>
              )}
            />
          ) : filters.view === "graph" ? (
            <GraphView
              data={graphData}
              xKey="x"
              series={[{ key: "value", label: filters.graphMetric === "count" ? "Registros" : "Quantidade (soma)", color: "var(--chart-1)" }]}
              chartType={filters.graphType}
              className="mt-3"
              downloadFileName="historico"
            />
          ) : (
            <ListView<HistoryRow>
              data={viewRows}
              columns={columns}
              groupByFields={filters.groupBy}
              resolveGroupLabel={(field, value) => {
                if (field === "kind") {
                  if (value === "ENTRY") return "Entrada";
                  if (value === "EXIT") return "Saída";
                  return "Movimento";
                }
                if (field === "sector") return String(value ?? "").trim() || "Geral";
                if (field === "type") return typeof value === "string" ? resolveExitTypeLabel(value) : "Sem tipo";
                if (field === "itemId") return itemLabelById.get(String(value ?? "")) ?? "Item";
                if (field === "itemGroup") return String(value ?? "").trim() || "Sem grupo";
                if (field === "eventName") return String(value ?? "").trim() || "Sem evento";
                if (field === "donorName") return String(value ?? "").trim() || "Sem doador";
                if (field === "quantity") {
                  const num = typeof value === "number" ? value : Number(value);
                  return Number.isFinite(num) ? num.toLocaleString("pt-BR") : "Sem valor";
                }
                if (field === "unit") return String(value ?? "").trim() || "—";
                if (field === "movementDate") return String(value ?? "").trim() ? formatDateOnlyPtBR(String(value)) : "Sem data";
                if (field === "expiryDate") return String(value ?? "").trim() ? formatDateOnlyPtBR(String(value)) : "Sem validade";
                if (field === "actor") return String(value ?? "").trim() || "Sistema";
                if (field === "notes") return String(value ?? "").trim() || "Sem notas";
                return String(value ?? "").trim() || "Sem valor";
              }}
              getRowId={(row) => row.id}
              onRowClick={openItem}
            />
          )}

          <PaginationBar
            pageIndex={filters.pageIndex}
            pageSize={filters.pageSize}
            pageCount={pageCount}
            onPageIndexChange={(pageIndex) => setFilters((prev) => ({ ...prev, pageIndex }))}
            onPageSizeChange={(pageSize) =>
              setFilters((prev) => ({ ...prev, pageSize, pageIndex: 0 }))
            }
          />
        </>
      ) : (
        <div className="rounded-md border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">Nenhum resultado.</div>
      )}
    </div>
  );
}
