"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
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
import { parseDomain, serializeDomain } from "@/web-client/domain/serialize";
import { EntityModuleShell } from "@/web-client/record/RecordListHost";
import { hasModulePermission } from "@/web-client/registry/module-utils";
import { useModuleQueryState } from "@/web-client/screen/useModuleQueryState";
import { PaginationBar } from "@/web-client/ui/PaginationBar";
import { buildGraphViewModel, GraphView } from "@/web-client/views/GraphView";
import { TableView } from "@/web-client/views/TableView";

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

function formatAgeRange(ageMin: number | null | undefined, ageMax: number | null | undefined) {
  if (ageMin == null && ageMax == null) return "Livre";
  return `${ageMin ?? "-"} a ${ageMax ?? "-"}`;
}

function columns(): ColumnDef<ApiCycle>[] {
  return [
    {
      accessorKey: "name",
      header: "Ciclo",
      cell: ({ row }) => <span className="font-medium text-foreground">{row.original.name}</span>,
    },
    {
      accessorKey: "audienceType",
      header: "Publico",
      cell: ({ row }) => formatAudienceType(row.original.audienceType),
    },
    {
      id: "ageRange",
      header: "Faixa etaria",
      accessorFn: (row) => formatAgeRange(row.ageMin, row.ageMax),
      cell: ({ row }) => formatAgeRange(row.original.ageMin, row.original.ageMax),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => formatStatus(row.original.isActive),
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
  const canRead = hasModulePermission(cyclesListModuleDefinition, "canRead", permissions);
  const canCreate = hasModulePermission(cyclesListModuleDefinition, "canCreate", permissions);

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

  const pagedRows = React.useMemo(() => {
    const start = state.pageIndex * state.pageSize;
    return rows.slice(start, start + state.pageSize);
  }, [rows, state.pageIndex, state.pageSize]);
  const pageCount = Math.max(Math.ceil(Math.max(rows.length, 1) / state.pageSize), 1);

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

  const favoriteSnapshot = React.useMemo(
    () => ({
      view: state.view,
      searchText: state.searchText,
      domain: state.domain,
      groupBy: state.groupBy,
      pageSize: state.pageSize,
    }),
    [state.domain, state.groupBy, state.pageSize, state.searchText, state.view],
  );

  const graphBuilder = React.useMemo(() => {
    const graphView = cyclesListModuleDefinition.views.find(
      (view) => view.id === "graph" && view.viewType === "graph",
    );
    return graphView?.viewType === "graph" ? graphView.params?.builder : undefined;
  }, []);

  const graphModel = React.useMemo(
    () =>
      graphBuilder
        ? buildGraphViewModel(
            rows as Array<Record<string, unknown>>,
            state.graph,
            graphBuilder,
          )
        : null,
    [graphBuilder, rows, state.graph],
  );

  if (!authLoading && !userLoading && !canRead) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Voce nao tem acesso a ciclos.</div>;
  }

  return (
    <EntityModuleShell
      moduleDefinition={cyclesListModuleDefinition}
      state={state}
      onStateChange={setState}
      queryFacets={queryFacets}
      favoriteSnapshot={favoriteSnapshot}
      isLoading={loading}
      totalCount={rows.length}
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
          <TableView data={pagedRows} columns={columnDefs} onRowClick={openDetail} />
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
