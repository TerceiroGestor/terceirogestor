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
import { useToast } from "@/components/ui/use-toast";
import type { RecordBrowserViewOption } from "@/components/record-browser/RecordBrowserViewSwitcher";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { formatDateOnlyPtBR } from "@/lib/date";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { buildQueryFacets } from "@/web-client/control-panel/queryFacets";
import { PageControlPanel } from "@/web-client/control-panel/PageControlPanel";
import { SearchBar } from "@/web-client/control-panel/SearchBar";
import { SearchPanelMenu } from "@/web-client/control-panel/SearchPanelMenu";
import { ViewSwitcher } from "@/web-client/control-panel/ViewSwitcher";
import { createRestDataProvider } from "@/web-client/data-provider";
import type { ApiPantryItem } from "@/modules/pantry/api";
import type { Domain } from "@/web-client/domain/types";
import { parseDomain, serializeDomain } from "@/web-client/domain/serialize";
import { removeConditionAtIndex } from "@/web-client/domain/conditions";
import { pantryItemsSearchView } from "@/web-client/registry/searchViews/pantry";
import { usePersistedUrlState } from "@/web-client/screen/usePersistedUrlState";
import { PaginationBar } from "@/web-client/ui/PaginationBar";
import { CalendarView } from "@/web-client/views/CalendarView";
import { GraphView } from "@/web-client/views/GraphView";
import { KanbanView } from "@/web-client/views/KanbanView";
import { ListView } from "@/web-client/views/ListView";
import { TimelineView } from "@/web-client/views/TimelineView";

function formatDate(value: string | null) {
  return formatDateOnlyPtBR(value);
}

function resolveValidityBadge(status: ApiPantryItem["validityStatus"]) {
  switch (status) {
    case "Normal":
      return <Badge variant="secondary">Normal</Badge>;
    case "Atencao":
      return <Badge className="border-transparent bg-amber-500 text-white">Atenção</Badge>;
    case "Alerta":
      return <Badge className="border-transparent bg-orange-500 text-white">Alerta</Badge>;
    case "Urgente":
      return <Badge variant="destructive">Urgente</Badge>;
    case "Vencido":
      return <Badge variant="destructive">Vencido</Badge>;
    default:
      return <Badge variant="outline">Sem validade</Badge>;
  }
}

type PantryItemsView = "list" | "kanban" | "timeline" | "calendar" | "graph";

type PantryItemsFilters = {
  view: PantryItemsView;
  searchText: string;
  domain: Domain;
  groupBy: string[];
  pageIndex: number;
  pageSize: number;
  calendarField: string;
  timelineField: string;
  graphGroupField: string;
  graphMetric: "count" | "stock";
  graphType: "bar" | "line" | "area";
};

type PantryItemsFavoriteState = Pick<
  PantryItemsFilters,
  | "view"
  | "searchText"
  | "domain"
  | "groupBy"
  | "pageSize"
  | "calendarField"
  | "timelineField"
  | "graphGroupField"
  | "graphMetric"
  | "graphType"
>;

const DEFAULT_CALENDAR_FIELD = "nextExpiryDate";
const DEFAULT_TIMELINE_FIELD = "lastMovementDate";
const DEFAULT_GRAPH_GROUP_FIELD = "defaultSector";
const DEFAULT_GRAPH_METRIC: PantryItemsFilters["graphMetric"] = "count";
const DEFAULT_GRAPH_TYPE: PantryItemsFilters["graphType"] = "bar";

function normalizeView(value: string | null): PantryItemsView {
  switch (value) {
    case "table":
      return "list";
    case "kanban":
    case "timeline":
    case "calendar":
    case "graph":
    case "list":
      return value;
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

const parsePantryItemsFilters = (params: URLSearchParams): PantryItemsFilters => {
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
  const limit = parsePositiveInt(params.get("limit"), 10);
  const calendarField = params.get("cf") ?? DEFAULT_CALENDAR_FIELD;
  const timelineField = params.get("tf") ?? DEFAULT_TIMELINE_FIELD;
  const graphGroupField = params.get("gf") ?? DEFAULT_GRAPH_GROUP_FIELD;
  const graphMetric = (params.get("gm") as PantryItemsFilters["graphMetric"]) ?? DEFAULT_GRAPH_METRIC;
  const graphTypeRaw = (params.get("gt") as PantryItemsFilters["graphType"]) ?? DEFAULT_GRAPH_TYPE;
  const graphType =
    graphTypeRaw === "line" || graphTypeRaw === "area" || graphTypeRaw === "bar"
      ? graphTypeRaw
      : DEFAULT_GRAPH_TYPE;

  return {
    view,
    searchText,
    domain,
    groupBy: groupParam === "none" ? [] : groupBy,
    pageIndex: page - 1,
    pageSize: Math.min(Math.max(limit, 1), 200),
    calendarField,
    timelineField,
    graphGroupField,
    graphMetric: graphMetric === "stock" ? "stock" : "count",
    graphType,
  };
};

const serializePantryItemsFilters = (state: PantryItemsFilters) => ({
  view: state.view === "list" ? undefined : state.view,
  q: state.searchText.trim() ? state.searchText.trim() : undefined,
  d: state.domain ? serializeDomain(state.domain) : undefined,
  g: state.groupBy.length ? state.groupBy.join(",") : undefined,
  page: state.pageIndex > 0 ? String(state.pageIndex + 1) : undefined,
  limit: state.pageSize === 10 ? undefined : String(state.pageSize),
  cf: state.calendarField !== DEFAULT_CALENDAR_FIELD ? state.calendarField : undefined,
  tf: state.timelineField !== DEFAULT_TIMELINE_FIELD ? state.timelineField : undefined,
  gf: state.graphGroupField !== DEFAULT_GRAPH_GROUP_FIELD ? state.graphGroupField : undefined,
  gm: state.graphMetric !== DEFAULT_GRAPH_METRIC ? state.graphMetric : undefined,
  gt: state.graphType !== DEFAULT_GRAPH_TYPE ? state.graphType : undefined,
});

function resolveGroupValue(item: ApiPantryItem, field: string) {
  switch (field) {
    case "defaultSector":
      return item.defaultSector?.trim() || "Geral";
    case "group":
      return item.group?.trim() || "Sem grupo";
    case "validityStatus":
      return item.validityStatus;
    case "isBelowMin":
      return item.isBelowMin ? "Abaixo do mínimo" : "OK";
    default:
      return String((item as Record<string, unknown>)[field] ?? "").trim() || "—";
  }
}

function resolveDate(item: ApiPantryItem, field: string) {
  const raw = (item as Record<string, unknown>)[field];
  if (!raw) return null;
  const text = String(raw).trim();
  if (!text) return null;

  const iso = text.length >= 10 ? text.slice(0, 10) : text;
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [year, month, day] = iso.split("-").map((part) => Number(part));
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  }

  const ms = Date.parse(text);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms);
}

export function PantryItemsClientPage() {
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);

  const canRead = permissions.includes("pantry.read");
  const canCreate = permissions.includes("pantry.create");
  const canUpdate = permissions.includes("pantry.update");

  const dataProvider = React.useMemo(() => createRestDataProvider({ token }), [token]);

  const [rows, setRows] = React.useState<ApiPantryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [pageCount, setPageCount] = React.useState(0);
  const [totalCount, setTotalCount] = React.useState(0);

  const [filters, setFilters] = usePersistedUrlState<PantryItemsFilters>({
    storageKey: "screenState:pantry.items",
    trackedKeys: ["view", "v", "q", "d", "g", "page", "limit", "cf", "tf", "gf", "gm", "gt"],
    parse: parsePantryItemsFilters,
    serialize: serializePantryItemsFilters,
  });

  const shouldFetchAll =
    filters.view === "calendar" || filters.view === "graph" || filters.view === "timeline";

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

  const viewOptions = React.useMemo<RecordBrowserViewOption<PantryItemsView>[]>(
    () => [
      { value: "list", label: "Tabela", icon: <Table2 className="size-4" /> },
      { value: "kanban", label: "Kanban", icon: <LayoutGrid className="size-4" /> },
      { value: "timeline", label: "Timeline", icon: <Clock3 className="size-4" /> },
      { value: "calendar", label: "Calendário", icon: <CalendarDays className="size-4" /> },
      { value: "graph", label: "Gráfico", icon: <BarChart3 className="size-4" /> },
    ],
    [],
  );

  const openCreate = React.useCallback(() => {
    router.push(withTenantPath("/pantry/items/new", tenantSlug));
  }, [router, tenantSlug]);

  const openDetail = React.useCallback(
    (item: ApiPantryItem) => {
      router.push(withTenantPath(`/pantry/items/${item.id}`, tenantSlug));
    },
    [router, tenantSlug],
  );

  const columns = React.useMemo<ColumnDef<ApiPantryItem>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Alimento",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-foreground">{row.original.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {row.original.group || "Sem grupo"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "defaultSector",
        header: "Setor",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.defaultSector || "Geral"}
          </span>
        ),
      },
      {
        accessorKey: "unit",
        header: "Unidade",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">{row.original.unit}</span>
        ),
      },
      {
        accessorKey: "stock",
        header: "Saldo",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <p className="text-xs font-mono tabular-nums text-foreground">
              {Number(row.original.stock).toLocaleString("pt-BR")}
            </p>
            {row.original.isBelowMin ? (
              <Badge variant="destructive">Abaixo do mínimo</Badge>
            ) : (
              <Badge variant="secondary">OK</Badge>
            )}
          </div>
        ),
      },
      {
        accessorKey: "minStock",
        header: "Mínimo",
        cell: ({ row }) => (
          <span className="text-xs font-mono tabular-nums text-muted-foreground">
            {Number(row.original.minStock).toLocaleString("pt-BR")}
          </span>
        ),
      },
      {
        accessorKey: "validityStatus",
        header: "Validade",
        cell: ({ row }) => (
          <div className="space-y-1">
            {resolveValidityBadge(row.original.validityStatus)}
            <p className="text-[11px] text-muted-foreground">
              {row.original.nextExpiryDate
                ? `${formatDate(row.original.nextExpiryDate)}${
                    row.original.daysToExpire !== null
                      ? ` • ${row.original.daysToExpire} dia(s)`
                      : ""
                  }`
                : "—"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "lastMovementDate",
        header: "Último movimento",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.original.lastMovementDate)}
          </span>
        ),
      },
    ],
    [],
  );

  const requestKey = React.useMemo(
    () =>
      JSON.stringify({
        q: debouncedSearch,
        d: filters.domain ? serializeDomain(filters.domain) : "",
        g: filters.groupBy,
        pageIndex: filters.pageIndex,
        pageSize: filters.pageSize,
        all: shouldFetchAll,
      }),
    [
      debouncedSearch,
      filters.domain,
      filters.groupBy,
      filters.pageIndex,
      filters.pageSize,
      shouldFetchAll,
    ],
  );

  const inFlightRequestRef = React.useRef<string | null>(null);

  const loadItems = React.useCallback(async () => {
    if (!token || !canRead) return;
    inFlightRequestRef.current = requestKey;
    setLoading(true);
    setError(null);
    try {
      const response = await dataProvider.search<ApiPantryItem>("pantry.items", {
        domain: filters.domain,
        searchText: debouncedSearch || undefined,
        pagination: shouldFetchAll
          ? undefined
          : { pageIndex: filters.pageIndex, pageSize: filters.pageSize },
        all: shouldFetchAll ? true : undefined,
      });
      if (inFlightRequestRef.current !== requestKey) return;
      setRows(response.data);
      setTotalCount(response.pagination.total);
      setPageCount(response.pagination.pages);
    } catch (err) {
      if (inFlightRequestRef.current !== requestKey) return;
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar alimentos.";
      toast({ variant: "destructive", title: "Falha ao carregar", description: message });
      setError(message);
      setRows([]);
      setTotalCount(0);
      setPageCount(0);
    } finally {
      if (inFlightRequestRef.current === requestKey) inFlightRequestRef.current = null;
      setLoading(false);
    }
  }, [
    canRead,
    dataProvider,
    debouncedSearch,
    filters.domain,
    filters.pageIndex,
    filters.pageSize,
    requestKey,
    shouldFetchAll,
    toast,
    token,
  ]);

  React.useEffect(() => {
    if (authLoading) return;
    if (!token || !isAuthenticated || !canRead) {
      setLoading(false);
      return;
    }
    void loadItems();
  }, [authLoading, canRead, isAuthenticated, loadItems, requestKey, token]);

  const resolvedPageCount =
    pageCount > 0 ? pageCount : totalCount > 0 ? Math.ceil(totalCount / filters.pageSize) : 0;

  const removeDomainCondition = React.useCallback(
    (index: number) => {
      setFilters((prev) => ({
        ...prev,
        domain: removeConditionAtIndex(prev.domain, "and", index),
        pageIndex: 0,
      }));
    },
    [setFilters],
  );

  const queryFacets = React.useMemo(
    () =>
      buildQueryFacets({
        domain: filters.domain,
        groupBy: filters.groupBy,
        searchView: pantryItemsSearchView,
        onClearGroupBy: () => setFilters((prev) => ({ ...prev, groupBy: [] })),
        onClearDomain: () => setFilters((prev) => ({ ...prev, domain: null, pageIndex: 0 })),
        onRemoveDomainCondition: removeDomainCondition,
      }),
    [filters.domain, filters.groupBy, removeDomainCondition, setFilters],
  );

  const valueSuggestions = React.useMemo(() => {
    const sectors = new Set<string>();
    const groups = new Set<string>();
    const units = new Set<string>();

    rows.forEach((row) => {
      const sector = String(row.defaultSector ?? "").trim();
      if (sector) sectors.add(sector);
      const group = String(row.group ?? "").trim();
      if (group) groups.add(group);
      const unit = String(row.unit ?? "").trim();
      if (unit) units.add(unit);
    });

    const sectorList = Array.from(sectors).sort((a, b) => a.localeCompare(b));
    const groupList = Array.from(groups).sort((a, b) => a.localeCompare(b));
    const unitList = Array.from(units).sort((a, b) => a.localeCompare(b));

    return (fieldName: string) => {
      if (fieldName === "defaultSector") return sectorList;
      if (fieldName === "group") return groupList;
      if (fieldName === "unit") return unitList;
      return [];
    };
  }, [rows]);

  const dateFields = React.useMemo(
    () => pantryItemsSearchView.fields.filter((f) => f.type === "date"),
    [],
  );

  const viewConfig = React.useMemo(() => {
    if (filters.view === "calendar") {
      return (
        <Select
          value={filters.calendarField}
          onValueChange={(value) => setFilters((prev) => ({ ...prev, calendarField: value }))}
        >
          <SelectTrigger className="h-8 w-[11.5rem] text-xs">
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

    if (filters.view === "timeline") {
      return (
        <Select
          value={filters.timelineField}
          onValueChange={(value) => setFilters((prev) => ({ ...prev, timelineField: value }))}
        >
          <SelectTrigger className="h-8 w-[11.5rem] text-xs">
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
      const groupByFields = pantryItemsSearchView.groupBy ?? [];
      return (
        <div className="flex items-center gap-1">
          <Select
            value={filters.graphGroupField}
            onValueChange={(value) => setFilters((prev) => ({ ...prev, graphGroupField: value }))}
          >
            <SelectTrigger className="h-8 w-[11rem] text-xs">
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

          <Select
            value={filters.graphMetric}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, graphMetric: value === "stock" ? "stock" : "count" }))
            }
          >
            <SelectTrigger className="h-8 w-[9.5rem] text-xs">
              <SelectValue placeholder="Métrica..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="count">Quantidade</SelectItem>
              <SelectItem value="stock">Saldo (soma)</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.graphType}
            onValueChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                graphType: value === "line" || value === "area" ? value : "bar",
              }))
            }
          >
            <SelectTrigger className="h-8 w-[9.25rem] text-xs">
              <SelectValue placeholder="Gráfico..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">Barras</SelectItem>
              <SelectItem value="line">Linha</SelectItem>
              <SelectItem value="area">Área</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    }

    return null;
  }, [
    dateFields,
    filters.calendarField,
    filters.graphGroupField,
    filters.graphMetric,
    filters.graphType,
    filters.timelineField,
    filters.view,
    setFilters,
  ]);

  const graphData = React.useMemo(() => {
    if (filters.view !== "graph") return [];
    const map = new Map<string, { x: string; value: number }>();
    rows.forEach((row) => {
      const key = resolveGroupValue(row, filters.graphGroupField);
      const current = map.get(key) ?? { x: key, value: 0 };
      current.value += filters.graphMetric === "stock" ? Number(row.stock) : 1;
      map.set(key, current);
    });
    return Array.from(map.values())
      .sort((a, b) => a.x.localeCompare(b.x))
      .slice(0, 40);
  }, [filters.graphGroupField, filters.graphMetric, filters.view, rows]);

  if (!canRead) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Você não tem permissão.</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <PageControlPanel
        primaryAction={canCreate ? { label: "Novo", onClick: openCreate } : undefined}
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
                  onClick={loadItems}
                  disabled={loading}
                >
                  <RefreshCcw className="size-4" />
                </Button>

                <SearchPanelMenu<PantryItemsFavoriteState>
                  actionId="pantry.items"
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
                  searchView={pantryItemsSearchView}
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
                    timelineField: filters.timelineField,
                    graphGroupField: filters.graphGroupField,
                    graphMetric: filters.graphMetric,
                    graphType: filters.graphType,
                  }}
                  onApplyFavorite={(state) =>
                    setFilters((prev) => ({
                      ...prev,
                      ...state,
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
        rightSlot={
          <>
            {viewConfig}
            <div className="whitespace-nowrap text-[11px] text-muted-foreground">
              Total:{" "}
              <span className="font-mono tabular-nums text-foreground">
                {totalCount.toLocaleString("pt-BR")}
              </span>
            </div>
          </>
        }
      />

      <div className="w-full space-y-3">
        {filters.view === "kanban" ? (
          <KanbanView<ApiPantryItem>
            items={rows}
            getColumnKey={
              filters.groupBy[0]
                ? (item) => resolveGroupValue(item, filters.groupBy[0]!)
                : undefined
            }
            renderCard={(item) => (
              <div
                className="rounded-md border border-border/60 bg-background px-3 py-2 hover:bg-muted/20"
                role="button"
                tabIndex={0}
                onClick={() => openDetail(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") openDetail(item);
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-foreground">{item.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.group || "Sem grupo"} • {item.defaultSector || "Geral"} • {item.unit}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm tabular-nums text-foreground">
                      {Number(item.stock).toLocaleString("pt-BR")}
                    </div>
                    <div className="text-[11px] text-muted-foreground">saldo</div>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {resolveValidityBadge(item.validityStatus)}
                  {item.isBelowMin ? (
                    <Badge variant="destructive">Abaixo do mínimo</Badge>
                  ) : (
                    <Badge variant="secondary">OK</Badge>
                  )}
                </div>
              </div>
            )}
          />
        ) : filters.view === "calendar" ? (
          <CalendarView<ApiPantryItem>
            items={rows}
            getDate={(item) => resolveDate(item, filters.calendarField)}
            renderItem={(item) => (
              <div
                className="rounded-md border border-border/60 bg-background px-3 py-2 hover:bg-muted/20"
                role="button"
                tabIndex={0}
                onClick={() => openDetail(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") openDetail(item);
                }}
              >
                <div className="truncate text-sm font-semibold text-foreground">{item.name}</div>
                <div className="text-xs text-muted-foreground">
                  {item.defaultSector || "Geral"} • {item.group || "Sem grupo"}
                </div>
              </div>
            )}
          />
        ) : filters.view === "timeline" ? (
          <TimelineView<ApiPantryItem>
            items={rows}
            getDate={(item) => resolveDate(item, filters.timelineField)}
            renderTitle={(item) => item.name}
            renderBody={(item) => (
              <span>
                {item.defaultSector || "Geral"} • {item.group || "Sem grupo"} • saldo{" "}
                {Number(item.stock).toLocaleString("pt-BR")} {item.unit}
              </span>
            )}
          />
        ) : filters.view === "graph" ? (
          <GraphView
            data={graphData}
            xKey="x"
            series={[
              {
                key: "value",
                label: filters.graphMetric === "stock" ? "Saldo" : "Quantidade",
                color: "hsl(var(--chart-1))",
              },
            ]}
            chartType={filters.graphType}
          />
        ) : (
          <ListView<ApiPantryItem>
            data={rows}
            columns={columns}
            groupByFields={filters.groupBy}
            resolveGroupLabel={(field, value) => {
              if (field === "group") return String(value ?? "").trim() || "Sem grupo";
              if (field === "defaultSector") return String(value ?? "").trim() || "Geral";
              if (field === "isBelowMin")
                return String(value ?? "").includes("true") ? "Abaixo do mínimo" : "OK";
              return String(value ?? "").trim() || "Sem valor";
            }}
            getRowId={(row) => row.id}
            onRowClick={openDetail}
            renderCard={(item) => (
              <div
                className="rounded-md border border-border/60 bg-background px-3 py-2 hover:bg-muted/20"
                role="button"
                tabIndex={0}
                onClick={() => openDetail(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") openDetail(item);
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-foreground">{item.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.group || "Sem grupo"} • {item.defaultSector || "Geral"} • {item.unit}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm tabular-nums text-foreground">
                      {Number(item.stock).toLocaleString("pt-BR")}
                    </div>
                    <div className="text-[11px] text-muted-foreground">saldo</div>
                  </div>
                </div>
              </div>
            )}
          />
        )}

        {!shouldFetchAll && filters.view !== "graph" ? (
          <PaginationBar
            pageIndex={filters.pageIndex}
            pageCount={resolvedPageCount}
            pageSize={filters.pageSize}
            onPageIndexChange={(next) => setFilters((prev) => ({ ...prev, pageIndex: next }))}
            onPageSizeChange={(next) =>
              setFilters((prev) => ({ ...prev, pageSize: next, pageIndex: 0 }))
            }
            disabled={loading}
          />
        ) : null}

        {loading ? <p className="text-xs text-muted-foreground">Carregando...</p> : null}
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        {!loading && !rows.length ? (
          <div className="rounded-md border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
            Nenhum registro.
          </div>
        ) : null}

        {!canUpdate ? (
          <p className="text-[11px] text-muted-foreground">
            Você tem permissão somente de leitura.
          </p>
        ) : null}
      </div>
    </div>
  );
}

