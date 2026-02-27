"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  Clock3,
  LayoutGrid,
  List,
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
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { formatDateOnlyPtBR, parseLocalDateOnly } from "@/lib/date";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { PageControlPanel } from "@/web-client/control-panel/PageControlPanel";
import { SearchBar } from "@/web-client/control-panel/SearchBar";
import { SearchPanelMenu } from "@/web-client/control-panel/SearchPanelMenu";
import { ViewSwitcher } from "@/web-client/control-panel/ViewSwitcher";
import { buildQueryFacets } from "@/web-client/control-panel/queryFacets";
import type { Domain } from "@/web-client/domain/types";
import { parseDomain, serializeDomain } from "@/web-client/domain/serialize";
import { pantryEntriesSearchView } from "@/web-client/registry/searchViews/pantry";
import { usePersistedUrlState } from "@/web-client/screen/usePersistedUrlState";
import type { RecordBrowserViewOption } from "@/components/record-browser/RecordBrowserViewSwitcher";
import { createRestDataProvider } from "@/web-client/data-provider";
import { CalendarView } from "@/web-client/views/CalendarView";
import { GraphView } from "@/web-client/views/GraphView";
import { KanbanView } from "@/web-client/views/KanbanView";
import { ListView } from "@/web-client/views/ListView";
import { TimelineView } from "@/web-client/views/TimelineView";
import { PaginationBar } from "@/web-client/ui/PaginationBar";
import type { ApiPantryEntry } from "@/modules/pantry/api";

type PantryEntriesView = "list" | "kanban" | "timeline" | "calendar" | "graph";

type PantryEntriesFilters = {
  view: PantryEntriesView;
  searchText: string;
  domain: Domain;
  groupBy: string[];
  pageIndex: number;
  pageSize: number;
  calendarField: string;
  timelineField: string;
  graphGroupField: string;
  graphMetric: "count" | "quantity";
  graphType: "bar" | "line" | "area";
};

type PantryEntriesFavoriteState = Pick<
  PantryEntriesFilters,
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

const DEFAULT_GROUP_BY = ["sector"];
const DEFAULT_CALENDAR_FIELD = "entryDate";
const DEFAULT_TIMELINE_FIELD = "entryDate";
const DEFAULT_GRAPH_GROUP_FIELD = "sector";
const DEFAULT_GRAPH_METRIC: PantryEntriesFilters["graphMetric"] = "quantity";
const DEFAULT_GRAPH_TYPE: PantryEntriesFilters["graphType"] = "bar";

function normalizeView(value: string | null): PantryEntriesView {
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

const parsePantryEntriesFilters = (params: URLSearchParams): PantryEntriesFilters => {
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
  const timelineField = params.get("tf") ?? DEFAULT_TIMELINE_FIELD;
  const graphGroupField = params.get("gf") ?? DEFAULT_GRAPH_GROUP_FIELD;
  const graphMetric = (params.get("gm") as PantryEntriesFilters["graphMetric"]) ?? DEFAULT_GRAPH_METRIC;
  const graphTypeRaw = (params.get("gt") as PantryEntriesFilters["graphType"]) ?? DEFAULT_GRAPH_TYPE;
  const graphType = graphTypeRaw === "line" || graphTypeRaw === "area" || graphTypeRaw === "bar" ? graphTypeRaw : DEFAULT_GRAPH_TYPE;

  return {
    view,
    searchText,
    domain,
    groupBy: groupParam === "none" ? [] : groupBy.length ? groupBy : DEFAULT_GROUP_BY,
    pageIndex: page - 1,
    pageSize: Math.min(Math.max(limit, 1), 200),
    calendarField,
    timelineField,
    graphGroupField,
    graphMetric: graphMetric === "count" ? "count" : "quantity",
    graphType,
  };
};

const serializePantryEntriesFilters = (state: PantryEntriesFilters) => ({
  view: state.view === "list" ? undefined : state.view,
  q: state.searchText.trim() ? state.searchText.trim() : undefined,
  d: state.domain ? serializeDomain(state.domain) : undefined,
  g:
    state.groupBy.length === 0
      ? "none"
      : state.groupBy.length === 1 && state.groupBy[0] === DEFAULT_GROUP_BY[0]
        ? undefined
        : state.groupBy.join(","),
  page: state.pageIndex > 0 ? String(state.pageIndex + 1) : undefined,
  limit: state.pageSize === 50 ? undefined : String(state.pageSize),
  cf: state.calendarField !== DEFAULT_CALENDAR_FIELD ? state.calendarField : undefined,
  tf: state.timelineField !== DEFAULT_TIMELINE_FIELD ? state.timelineField : undefined,
  gf: state.graphGroupField !== DEFAULT_GRAPH_GROUP_FIELD ? state.graphGroupField : undefined,
  gm: state.graphMetric !== DEFAULT_GRAPH_METRIC ? state.graphMetric : undefined,
  gt: state.graphType !== DEFAULT_GRAPH_TYPE ? state.graphType : undefined,
});

function resolveGroupValue(row: ApiPantryEntry, field: string) {
  switch (field) {
    case "sector":
      return row.sector?.trim() || "Geral";
    case "itemId":
      return row.item?.name?.trim() || "Item";
    case "donorId":
      return row.donor?.name?.trim() || "Sem doador";
    case "entryDate":
      return formatDateOnlyPtBR(row.entryDate);
    default:
      return String((row as Record<string, unknown>)[field] ?? "").trim() || "—";
  }
}

function resolveDate(row: ApiPantryEntry, field: string) {
  const raw = (row as Record<string, unknown>)[field];
  if (!raw) return null;
  return parseLocalDateOnly(String(raw));
}

export function PantryEntriesClientPage() {
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);

  const canRead = permissions.includes("pantry.read");
  const canCreate = permissions.includes("pantry.create");

  const dataProvider = React.useMemo(() => createRestDataProvider({ token }), [token]);

  const [rows, setRows] = React.useState<ApiPantryEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [pageCount, setPageCount] = React.useState(0);
  const [totalCount, setTotalCount] = React.useState(0);

  const [filters, setFilters] = usePersistedUrlState<PantryEntriesFilters>({
    storageKey: "screenState:pantry.entries",
    trackedKeys: ["view", "v", "q", "d", "g", "page", "limit", "cf", "tf", "gf", "gm", "gt"],
    parse: parsePantryEntriesFilters,
    serialize: serializePantryEntriesFilters,
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

  const viewOptions = React.useMemo<RecordBrowserViewOption<PantryEntriesView>[]>(
    () => [
      { value: "list", label: "Lista", icon: <List className="size-4" /> },
      { value: "kanban", label: "Kanban", icon: <LayoutGrid className="size-4" /> },
      { value: "timeline", label: "Timeline", icon: <Clock3 className="size-4" /> },
      { value: "calendar", label: "Calendário", icon: <CalendarDays className="size-4" /> },
      { value: "graph", label: "Gráfico", icon: <BarChart3 className="size-4" /> },
    ],
    [],
  );

  const openCreate = React.useCallback(() => {
    router.push(withTenantPath("/pantry/entries/new", tenantSlug));
  }, [router, tenantSlug]);

  const itemLabelById = React.useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((row) => {
      map.set(row.itemId, row.item?.name ?? row.itemId);
    });
    return map;
  }, [rows]);

  const donorLabelById = React.useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((row) => {
      if (row.donorId) map.set(row.donorId, row.donor?.name ?? row.donorId);
    });
    return map;
  }, [rows]);

  const loadRows = React.useCallback(async () => {
    if (!token || !canRead) return;
    setLoading(true);
    setError(null);
    try {
      const response = await dataProvider.search<ApiPantryEntry>("pantry.entries", {
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
          : "Falha ao carregar entradas.";
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
        if (!prev.domain || prev.domain.type !== "group" || prev.domain.combinator !== "and")
          return prev;
        const next = prev.domain.children.filter((_child, i) => i !== index);
        return {
          ...prev,
          domain: next.length ? { type: "group", combinator: "and", children: next } : null,
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
        searchView: pantryEntriesSearchView,
        onClearGroupBy: () => setFilters((prev) => ({ ...prev, groupBy: [] })),
        onClearDomain: () => setFilters((prev) => ({ ...prev, domain: null, pageIndex: 0 })),
        onRemoveDomainCondition: removeDomainCondition,
      }),
    [filters.domain, filters.groupBy, removeDomainCondition, setFilters],
  );

  const valueSuggestions = React.useMemo(() => {
    const sectors = new Set<string>();
    rows.forEach((row) => {
      const sector = String(row.sector ?? "").trim();
      if (sector) sectors.add(sector);
    });
    const sectorList = Array.from(sectors).sort((a, b) => a.localeCompare(b));

    return (fieldName: string) => {
      if (fieldName === "sector") return sectorList;
      return [];
    };
  }, [rows]);

  const columns = React.useMemo<ColumnDef<ApiPantryEntry>[]>(
    () => [
      {
        accessorKey: "itemId",
        header: "Item",
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate font-medium text-foreground">{row.original.item?.name}</div>
            <div className="truncate text-xs text-muted-foreground">
              {row.original.sector || "Geral"}
              {row.original.donor?.name ? ` • ${row.original.donor.name}` : ""}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "quantity",
        header: "Quantidade",
        cell: ({ row }) => (
          <div className="font-mono tabular-nums">
            {Number(row.original.quantity).toLocaleString("pt-BR")} {row.original.unit}
          </div>
        ),
      },
      {
        accessorKey: "entryDate",
        header: "Data",
        cell: ({ row }) => formatDateOnlyPtBR(row.original.entryDate),
      },
      {
        accessorKey: "expiryDate",
        header: "Validade",
        cell: ({ row }) => formatDateOnlyPtBR(row.original.expiryDate),
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
    () => [
      ...pantryEntriesSearchView.fields.filter((f) => f.type === "date"),
      { name: "expiryDate", label: "Validade", type: "date" as const, operators: ["between", ">=", "<="] },
    ],
    [],
  );

  const viewConfig = React.useMemo(() => {
    if (filters.view === "calendar") {
      return (
        <Select value={filters.calendarField} onValueChange={(value) => setFilters((prev) => ({ ...prev, calendarField: value }))}>
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
        <Select value={filters.timelineField} onValueChange={(value) => setFilters((prev) => ({ ...prev, timelineField: value }))}>
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
      const groupByFields = pantryEntriesSearchView.groupBy ?? [];
      return (
        <div className="flex items-center gap-1">
          <Select value={filters.graphGroupField} onValueChange={(value) => setFilters((prev) => ({ ...prev, graphGroupField: value }))}>
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

          <Select value={filters.graphMetric} onValueChange={(value) => setFilters((prev) => ({ ...prev, graphMetric: value === "count" ? "count" : "quantity" }))}>
            <SelectTrigger className="h-8 w-[9.5rem] text-xs">
              <SelectValue placeholder="Métrica..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="quantity">Quantidade (soma)</SelectItem>
              <SelectItem value="count">Registros</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.graphType} onValueChange={(value) => setFilters((prev) => ({ ...prev, graphType: value === "line" || value === "area" ? value : "bar" }))}>
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
  }, [dateFields, filters.calendarField, filters.graphGroupField, filters.graphMetric, filters.graphType, filters.timelineField, filters.view, setFilters]);

  const graphData = React.useMemo(() => {
    if (filters.view !== "graph") return [];
    const map = new Map<string, { x: string; value: number }>();
    rows.forEach((row) => {
      const key = resolveGroupValue(row, filters.graphGroupField);
      const current = map.get(key) ?? { x: key, value: 0 };
      current.value += filters.graphMetric === "count" ? 1 : Number(row.quantity);
      map.set(key, current);
    });
    return Array.from(map.values()).sort((a, b) => a.x.localeCompare(b.x)).slice(0, 40);
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
                  onClick={loadRows}
                  disabled={loading}
                >
                  <RefreshCcw className="size-4" />
                </Button>

                <SearchPanelMenu<PantryEntriesFavoriteState>
                  actionId="pantry.entries"
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
                  searchView={pantryEntriesSearchView}
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
            <KanbanView<ApiPantryEntry>
              items={rows}
              getColumnKey={
                filters.groupBy[0]
                  ? (row) => resolveGroupValue(row, filters.groupBy[0]!)
                  : undefined
              }
              renderCard={(row) => (
                <div className="rounded-md border border-border/60 bg-background px-3 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-foreground">{row.item?.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {row.sector || "Geral"}
                        {row.donor?.name ? ` • ${row.donor.name}` : ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm tabular-nums text-foreground">{Number(row.quantity).toLocaleString("pt-BR")}</div>
                      <div className="text-[11px] text-muted-foreground">{row.unit}</div>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{formatDateOnlyPtBR(row.entryDate)}</Badge>
                    {row.expiryDate ? <Badge variant="secondary">validade {formatDateOnlyPtBR(row.expiryDate)}</Badge> : null}
                  </div>
                </div>
              )}
            />
          ) : filters.view === "calendar" ? (
            <CalendarView<ApiPantryEntry>
              items={rows}
              getDate={(row) => resolveDate(row, filters.calendarField)}
              emptyState="Nenhuma entrada neste dia."
              renderItem={(row) => (
                <div className="rounded-md border border-border/60 bg-background px-3 py-2">
                  <div className="truncate text-sm font-semibold text-foreground">{row.item?.name}</div>
                  <div className="text-xs text-muted-foreground">{row.sector || "Geral"}</div>
                </div>
              )}
            />
          ) : filters.view === "timeline" ? (
            <TimelineView<ApiPantryEntry>
              items={rows}
              getDate={(row) => resolveDate(row, filters.timelineField)}
              renderTitle={(row) => row.item?.name ?? "Entrada"}
              renderBody={(row) => (
                <span>
                  {row.sector || "Geral"}
                  {row.donor?.name ? ` • ${row.donor.name}` : ""} • {Number(row.quantity).toLocaleString("pt-BR")} {row.unit}
                </span>
              )}
            />
          ) : filters.view === "graph" ? (
            <GraphView
              data={graphData}
              xKey="x"
              series={[{ key: "value", label: filters.graphMetric === "count" ? "Registros" : "Quantidade (soma)", color: "hsl(var(--chart-1))" }]}
              chartType={filters.graphType}
            />
          ) : (
            <ListView<ApiPantryEntry>
              data={rows}
              columns={columns}
              groupByFields={filters.groupBy}
              resolveGroupLabel={(field, value) => {
                if (field === "sector") return String(value ?? "").trim() || "Geral";
                if (field === "itemId") return itemLabelById.get(String(value ?? "")) ?? "Item";
                if (field === "donorId") return donorLabelById.get(String(value ?? "")) ?? "Sem doador";
                if (field === "entryDate") return formatDateOnlyPtBR(String(value ?? ""));
                return String(value ?? "").trim() || "Sem valor";
              }}
              getRowId={(row) => row.id}
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
