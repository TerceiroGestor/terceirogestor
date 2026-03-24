"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { usePathname, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { formatDateOnlyPtBR } from "@/lib/date";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import type { ApiCycle, CycleAudienceType } from "@/modules/cycles/api";
import {
  cyclesListModuleDefinition,
  type CyclesListQueryState,
} from "@/modules/cycles/config/cycles-module-contract";
import { CYCLE_AUDIENCE_LABELS } from "@/modules/cycles/shared/domain/cycles.constants";
import { buildQueryFacets } from "@/web-client/control-panel/queryFacets";
import { createRestDataProvider } from "@/web-client/data-provider";
import { removeConditionAtIndex } from "@/web-client/domain/conditions";
import { matchesDomainRecord } from "@/web-client/domain/evaluate";
import { parseDomain, serializeDomain } from "@/web-client/domain/serialize";
import { EntityModuleShell } from "@/web-client/record/RecordListHost";
import {
  canUseModuleAction,
  getModuleGraphBuilderConfig,
  hasModulePermission,
} from "@/web-client/registry/module-utils";
import { useModuleQueryState } from "@/web-client/screen/useModuleQueryState";
import { PaginationBar } from "@/web-client/ui/PaginationBar";
import { buildGraphViewModel, GraphView } from "@/web-client/views/GraphView";
import { ListView } from "@/web-client/views/ListView";

type CyclesFavoriteState = Pick<
  CyclesListQueryState,
  "view" | "searchText" | "domain" | "groupBy" | "pageSize" | "graph"
>;

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function parseState(params: URLSearchParams): CyclesListQueryState {
  return {
    ...cyclesListModuleDefinition.defaultQueryState,
    view: (params.get("view") as CyclesListQueryState["view"]) ?? "table",
    searchText: params.get("q") ?? "",
    domain: parseDomain(params.get("d")) ?? null,
    groupBy: (params.get("g") ?? "").split(",").map((item) => item.trim()).filter(Boolean),
    pageIndex: parsePositiveInt(params.get("page"), 1) - 1,
    pageSize: Math.min(Math.max(parsePositiveInt(params.get("limit"), 20), 1), 100),
    graph: cyclesListModuleDefinition.defaultQueryState.graph,
  };
}

function serializeState(state: CyclesListQueryState) {
  return {
    view: state.view === "table" ? undefined : state.view,
    q: state.searchText.trim() || undefined,
    d: state.domain ? serializeDomain(state.domain) : undefined,
    g: state.groupBy.length ? state.groupBy.join(",") : undefined,
    page: state.pageIndex > 0 ? String(state.pageIndex + 1) : undefined,
    limit: state.pageSize === 20 ? undefined : String(state.pageSize),
  };
}

function formatAudienceType(value: CycleAudienceType | string | null | undefined) {
  if (!value) return "-";
  return CYCLE_AUDIENCE_LABELS[value as CycleAudienceType] ?? String(value);
}

function formatStatus(isActive: boolean) {
  return isActive ? "Ativo" : "Inativo";
}

function resolveStatusBadge(isActive: boolean) {
  return isActive ? <Badge variant="secondary">Ativo</Badge> : <Badge variant="outline">Inativo</Badge>;
}

function resolveGroupLabel(field: string, value: unknown) {
  if (field === "isActive") return value === false ? "Inativo" : "Ativo";
  if (field === "audienceType") return formatAudienceType(typeof value === "string" ? value : null);
  if (field === "createdAt") return typeof value === "string" && value ? formatDateOnlyPtBR(value) : "Sem cadastro";
  return String(value ?? "Sem valor");
}

function columns(): ColumnDef<ApiCycle>[] {
  return [
    {
      accessorKey: "name",
      header: "Ciclo",
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <div className="font-medium text-foreground">{row.original.name}</div>
          <div className="text-xs text-muted-foreground">
            {formatAudienceType(row.original.audienceType)}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "tags",
      header: "Tags",
      cell: ({ row }) => {
        const tags = row.original.tags ?? [];
        if (!tags.length) return <span className="text-muted-foreground">-</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <Badge key={`${row.original.id}:${tag}`} variant="outline" className="rounded-full px-2 text-[10px]">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 ? (
              <Badge variant="outline" className="rounded-full px-2 text-[10px]">
                +{tags.length - 3}
              </Badge>
            ) : null}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Cadastro",
      cell: ({ row }) => (
        <span className="text-foreground">
          {row.original.createdAt ? formatDateOnlyPtBR(row.original.createdAt.slice(0, 10)) : "-"}
        </span>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => resolveStatusBadge(row.original.isActive),
    },
  ];
}

export function CyclesListModuleClientPage() {
  const { token, isLoading: authLoading } = useAuth();
  const { permissions, isLoading: userLoading } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname) ?? "";
  const dataProvider = React.useMemo(() => createRestDataProvider({ token }), [token]);
  const columnDefs = React.useMemo(() => columns(), []);
  const graphBuilder = getModuleGraphBuilderConfig(cyclesListModuleDefinition);
  const canRead = hasModulePermission(cyclesListModuleDefinition, "canRead", permissions);
  const canCreate = canUseModuleAction(cyclesListModuleDefinition, "create", permissions);

  const [rows, setRows] = React.useState<ApiCycle[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [state, setState] = useModuleQueryState<CyclesListQueryState>({
    moduleDefinition: cyclesListModuleDefinition,
    trackedKeys: ["view", "q", "d", "g", "page", "limit"],
    parse: parseState,
    serialize: serializeState,
  });

  React.useEffect(() => {
    if (authLoading || userLoading) return;
    if (!token || !canRead) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    dataProvider
      .search<ApiCycle>("cycles.list", {
        searchText: state.searchText,
        all: true,
      })
      .then((result) => setRows(result.data))
      .catch((nextError) => {
        const message =
          nextError && typeof nextError === "object" && "message" in nextError
            ? String((nextError as { message?: string }).message)
            : "Falha ao carregar ciclos.";
        setRows([]);
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [authLoading, canRead, dataProvider, state.searchText, token, userLoading]);

  const filteredRows = React.useMemo(() => {
    if (!state.domain) return rows;
    return rows.filter((row) =>
      matchesDomainRecord(
        {
          audienceType: row.audienceType,
          isActive: row.isActive,
          tags: row.tags ?? [],
          createdAt: row.createdAt?.slice(0, 10) ?? null,
        },
        state.domain,
        (current, field) => current[field as keyof typeof current],
      ),
    );
  }, [rows, state.domain]);

  const pagedRows = React.useMemo(() => {
    const start = state.pageIndex * state.pageSize;
    return filteredRows.slice(start, start + state.pageSize);
  }, [filteredRows, state.pageIndex, state.pageSize]);
  const pageCount = Math.max(Math.ceil(Math.max(filteredRows.length, 1) / state.pageSize), 1);

  const openDetail = React.useCallback(
    (cycle: ApiCycle) => {
      router.push(withTenantPath(`/cycle/${cycle.id}`, tenantSlug));
    },
    [router, tenantSlug],
  );

  const removeDomainCondition = React.useCallback(
    (index: number) => {
      setState((previous) => ({
        ...previous,
        domain: removeConditionAtIndex(previous.domain, "and", index),
        pageIndex: 0,
      }));
    },
    [setState],
  );

  const queryFacets = React.useMemo(
    () =>
      buildQueryFacets({
        domain: state.domain,
        groupBy: state.groupBy,
        searchView: cyclesListModuleDefinition.searchConfig,
        onClearGroupBy: () => setState((previous) => ({ ...previous, groupBy: [] })),
        onClearDomain: () => setState((previous) => ({ ...previous, domain: null, pageIndex: 0 })),
        onRemoveDomainCondition: removeDomainCondition,
      }),
    [removeDomainCondition, setState, state.domain, state.groupBy],
  );

  const favoriteSnapshot = React.useMemo<CyclesFavoriteState>(
    () => ({
      view: state.view,
      searchText: state.searchText,
      domain: state.domain,
      groupBy: state.groupBy,
      pageSize: state.pageSize,
      graph: state.graph,
    }),
    [state.domain, state.graph, state.groupBy, state.pageSize, state.searchText, state.view],
  );

  const graphModel = React.useMemo(
    () =>
      graphBuilder
        ? buildGraphViewModel(
            filteredRows as Array<Record<string, unknown>>,
            state.graph,
            graphBuilder,
          )
        : null,
    [filteredRows, graphBuilder, state.graph],
  );

  if (!authLoading && !userLoading && !canRead) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Voce nao tem acesso a ciclos.</div>;
  }

  return (
    <EntityModuleShell<CyclesListQueryState, CyclesFavoriteState>
      moduleDefinition={cyclesListModuleDefinition}
      state={state}
      onStateChange={setState}
      queryFacets={queryFacets}
      favoriteSnapshot={favoriteSnapshot}
      isLoading={loading}
      totalCount={filteredRows.length}
      canCreate={canCreate}
      onCreate={() => router.push(withTenantPath("/cycle/new", tenantSlug))}
      onRefresh={() => setState((previous) => ({ ...previous }))}
    >
      {error ? <div className="px-4 py-3 text-sm text-destructive">{error}</div> : null}
      {state.view === "graph" && graphModel ? (
        <GraphView
          data={graphModel.data}
          xKey={graphModel.xKey}
          chartType={graphModel.chartType}
          series={graphModel.series}
          height={420}
          emptyState={graphModel.emptyState}
          downloadFileName={graphModel.downloadFileName}
        />
      ) : (
        <>
          <ListView
            data={pagedRows}
            columns={columnDefs}
            groupByFields={state.groupBy}
            resolveGroupLabel={resolveGroupLabel}
            onRowClick={openDetail}
            getRowId={(row) => row.id}
            initialColumnPinning={{ left: ["name"] }}
          />
          <PaginationBar
            pageIndex={state.pageIndex}
            pageCount={pageCount}
            pageSize={state.pageSize}
            onPageIndexChange={(next) => setState((previous) => ({ ...previous, pageIndex: next }))}
            onPageSizeChange={(next) => setState((previous) => ({ ...previous, pageSize: next, pageIndex: 0 }))}
          />
        </>
      )}
    </EntityModuleShell>
  );
}
