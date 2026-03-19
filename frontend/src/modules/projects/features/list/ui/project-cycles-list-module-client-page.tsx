"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { formatDateOnlyPtBR } from "@/lib/date";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import type { ApiProjectCycle } from "@/modules/projects/api";
import {
  projectCyclesListModuleDefinition,
  type ProjectCyclesListQueryState,
} from "@/modules/projects/config/project-cycles-module-contract";
import { buildQueryFacets } from "@/web-client/control-panel/queryFacets";
import { createRestDataProvider } from "@/web-client/data-provider";
import { removeConditionAtIndex } from "@/web-client/domain/conditions";
import { parseDomain, serializeDomain } from "@/web-client/domain/serialize";
import { EntityModuleShell } from "@/web-client/record/RecordListHost";
import { hasModulePermission } from "@/web-client/registry/module-utils";
import { useModuleQueryState } from "@/web-client/screen/useModuleQueryState";
import { PaginationBar } from "@/web-client/ui/PaginationBar";
import { CalendarView } from "@/web-client/views/CalendarView";
import { buildGraphViewModel, GraphView } from "@/web-client/views/GraphView";
import { TableView } from "@/web-client/views/TableView";
import { TimelineView } from "@/web-client/views/TimelineView";

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function parseState(params: URLSearchParams): ProjectCyclesListQueryState {
  return {
    ...projectCyclesListModuleDefinition.defaultQueryState,
    view: (params.get("view") as ProjectCyclesListQueryState["view"]) ?? "table",
    searchText: params.get("q") ?? "",
    domain: parseDomain(params.get("d")) ?? null,
    groupBy: (params.get("g") ?? "").split(",").map((item) => item.trim()).filter(Boolean),
    pageIndex: parsePositiveInt(params.get("page"), 1) - 1,
    pageSize: Math.min(Math.max(parsePositiveInt(params.get("limit"), 20), 1), 100),
    timelineField: "startsAt",
    timelineSortDirection: "desc",
    calendarField: "startsAt",
    calendarMode: "month",
    graph: projectCyclesListModuleDefinition.defaultQueryState.graph,
  };
}

function serializeState(state: ProjectCyclesListQueryState) {
  return {
    view: state.view === "table" ? undefined : state.view,
    q: state.searchText.trim() || undefined,
    d: state.domain ? serializeDomain(state.domain) : undefined,
    g: state.groupBy.length ? state.groupBy.join(",") : undefined,
    page: state.pageIndex > 0 ? String(state.pageIndex + 1) : undefined,
    limit: state.pageSize === 20 ? undefined : String(state.pageSize),
  };
}

function formatPeriod(startsAt: string | null | undefined, endsAt: string | null | undefined) {
  if (!startsAt && !endsAt) return "Nao informada";
  return `${startsAt ? formatDateOnlyPtBR(startsAt) : "-"} ate ${endsAt ? formatDateOnlyPtBR(endsAt) : "-"}`;
}

function columns(): ColumnDef<ApiProjectCycle>[] {
  return [
    {
      id: "catalogCycle",
      header: "Segmento",
      accessorFn: (row) => row.segment?.name ?? row.catalogCycle?.name ?? row.name,
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span className="font-medium text-foreground">
            {row.original.segment?.name ?? row.original.catalogCycle?.name ?? row.original.name}
          </span>
          <div className="text-xs text-muted-foreground">
            {row.original.segment?.category?.trim() ||
              row.original.catalogCycle?.audienceType?.trim() ||
              "Segmento institucional"}
          </div>
        </div>
      ),
    },
    {
      id: "project",
      header: "Projeto",
      accessorFn: (row) => row.project?.name ?? null,
      cell: ({ row }) => row.original.project?.name ?? "-",
    },
    {
      id: "bindingName",
      header: "Vinculo",
      accessorFn: (row) => row.name,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.original.name}</span>
      ),
    },
    {
      id: "period",
      header: "Periodo",
      accessorFn: (row) => formatPeriod(row.startsAt, row.endsAt),
      cell: ({ row }) => formatPeriod(row.original.startsAt, row.original.endsAt),
    },
    {
      id: "participations",
      header: "Participantes",
      accessorFn: (row) => row._count?.participations ?? 0,
      meta: { dataType: "number" },
      cell: ({ row }) => row.original._count?.participations ?? 0,
    },
  ];
}

export function ProjectCyclesListModuleClientPage() {
  const { token, isLoading: authLoading } = useAuth();
  const { permissions, isLoading: userLoading } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname) ?? "";
  const dataProvider = React.useMemo(() => createRestDataProvider({ token }), [token]);
  const columnDefs = React.useMemo(() => columns(), []);
  const canRead = hasModulePermission(projectCyclesListModuleDefinition, "canRead", permissions);

  const [rows, setRows] = React.useState<ApiProjectCycle[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [state, setState] = useModuleQueryState<ProjectCyclesListQueryState>({
    moduleDefinition: projectCyclesListModuleDefinition,
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
      .search<ApiProjectCycle>("project-cycles.list", {
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
    (cycle: ApiProjectCycle) => {
      const listReturnTo = withTenantPath("/project-cycle", tenantSlug);
      router.push(
        withTenantPath(
          `/projects/${cycle.projectId}/cycles?cycleId=${encodeURIComponent(cycle.id)}&returnTo=${encodeURIComponent(listReturnTo)}`,
          tenantSlug,
        ),
      );
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
        searchView: projectCyclesListModuleDefinition.searchConfig,
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
    const graphView = projectCyclesListModuleDefinition.views.find(
      (view) => view.id === "graph" && view.viewType === "graph",
    );
    return graphView?.viewType === "graph" ? graphView.params?.builder : undefined;
  }, []);

  const graphModel = React.useMemo(
    () =>
      graphBuilder
        ? buildGraphViewModel(
            rows as Array<Record<string, unknown>>,
            projectCyclesListModuleDefinition.defaultQueryState.graph,
            graphBuilder,
          )
        : null,
    [graphBuilder, rows],
  );

  if (!authLoading && !userLoading && !canRead) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Voce nao tem acesso a ciclos.</div>;
  }

  return (
    <EntityModuleShell
      moduleDefinition={projectCyclesListModuleDefinition}
      state={state}
      onStateChange={setState}
      queryFacets={queryFacets}
      favoriteSnapshot={favoriteSnapshot}
      isLoading={loading}
      totalCount={rows.length}
      canCreate={false}
      onRefresh={() => setState((previous) => ({ ...previous }))}
    >
      {error ? <div className="px-4 py-3 text-sm text-destructive">{error}</div> : null}
      {state.view === "timeline" ? (
        <TimelineView
          items={rows}
          getDate={(cycle) => (cycle.startsAt ? new Date(`${cycle.startsAt}T00:00:00`) : null)}
          renderTitle={(cycle) => cycle.name}
          renderBody={(cycle) => <div className="text-[12px]">{cycle.project?.name ?? "-"}</div>}
          sortDirection="desc"
        />
      ) : state.view === "calendar" ? (
        <CalendarView
          items={rows}
          getDate={(cycle) => (cycle.startsAt ? new Date(`${cycle.startsAt}T00:00:00`) : null)}
          mode="month"
          onModeChange={() => undefined}
          renderItem={(cycle) => (
            <button type="button" className="w-full rounded-md border border-border/60 bg-background px-3 py-3 text-left" onClick={() => openDetail(cycle)}>
              <div className="truncate text-sm font-medium text-foreground">{cycle.name}</div>
              <div className="mt-2 text-xs text-muted-foreground">{cycle.project?.name ?? "-"}</div>
            </button>
          )}
          showModeSelect={false}
          showDateFieldSelect={false}
          showRangeInputs={false}
        />
      ) : state.view === "graph" && graphModel ? (
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
