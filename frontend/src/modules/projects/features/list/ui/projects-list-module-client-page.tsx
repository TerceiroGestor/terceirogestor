"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { formatDateOnlyPtBR } from "@/lib/date";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { usePathname, useRouter } from "next/navigation";
import type { ApiProject } from "@/modules/projects/api";
import {
  projectsListModuleDefinition,
  type ProjectsListQueryState,
} from "@/modules/projects/config/projects-module-contract";
import { PROJECT_STATUS_LABELS } from "@/modules/projects/shared/domain/projects.constants";
import { PROGRAM_TYPE_LABELS } from "@/modules/programs/shared/domain/programs.constants";
import { buildQueryFacets } from "@/web-client/control-panel/queryFacets";
import { createRestDataProvider } from "@/web-client/data-provider";
import { removeConditionAtIndex } from "@/web-client/domain/conditions";
import { parseDomain, serializeDomain } from "@/web-client/domain/serialize";
import { EntityModuleShell } from "@/web-client/record/RecordListHost";
import {
  canUseModuleAction,
  hasModulePermission,
} from "@/web-client/registry/module-utils";
import { useModuleQueryState } from "@/web-client/screen/useModuleQueryState";
import { PaginationBar } from "@/web-client/ui/PaginationBar";
import { CalendarView } from "@/web-client/views/CalendarView";
import { buildGraphViewModel, GraphView } from "@/web-client/views/GraphView";
import { GanttView } from "@/web-client/views/GanttView";
import { KanbanView } from "@/web-client/views/KanbanView";
import { TableView } from "@/web-client/views/TableView";
import { TimelineView } from "@/web-client/views/TimelineView";

type ProjectsFavoriteState = Pick<
  ProjectsListQueryState,
  "view" | "searchText" | "domain" | "groupBy" | "pageSize"
>;

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function parseState(params: URLSearchParams): ProjectsListQueryState {
  return {
    ...projectsListModuleDefinition.defaultQueryState,
    view: (params.get("view") as ProjectsListQueryState["view"]) ?? "table",
    searchText: params.get("q") ?? "",
    domain: parseDomain(params.get("d")) ?? null,
    groupBy: (params.get("g") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    pageIndex: parsePositiveInt(params.get("page"), 1) - 1,
    pageSize: Math.min(Math.max(parsePositiveInt(params.get("limit"), 20), 1), 100),
  };
}

function serializeState(state: ProjectsListQueryState) {
  return {
    view: state.view === "table" ? undefined : state.view,
    q: state.searchText.trim() || undefined,
    d: state.domain ? serializeDomain(state.domain) : undefined,
    g: state.groupBy.length ? state.groupBy.join(",") : undefined,
    page: state.pageIndex > 0 ? String(state.pageIndex + 1) : undefined,
    limit: state.pageSize === 20 ? undefined : String(state.pageSize),
  };
}

function resolveStatusBadge(status: ApiProject["status"]) {
  const label = PROJECT_STATUS_LABELS[status] ?? status;
  switch (status) {
    case "ACTIVE":
      return <Badge variant="secondary">{label}</Badge>;
    case "CLOSED":
      return <Badge variant="outline">{label}</Badge>;
    default:
      return <Badge className="border-transparent bg-blue-600 text-white">{label}</Badge>;
  }
}

function projectColumns(): ColumnDef<ApiProject>[] {
  return [
    {
      accessorKey: "name",
      header: "Projeto",
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <div className="font-medium text-foreground">{row.original.name}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.program?.name ?? "Sem programa"}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => resolveStatusBadge(row.original.status),
    },
    {
      accessorKey: "program.type",
      header: "Tipo",
      cell: ({ row }) => (
        <span className="text-foreground">
          {row.original.program?.type
            ? PROGRAM_TYPE_LABELS[row.original.program.type] ?? row.original.program.type
            : "-"}
        </span>
      ),
    },
    {
      accessorKey: "startsAt",
      header: "Vigencia",
      cell: ({ row }) => {
        const { startsAt, endsAt } = row.original;
        return startsAt || endsAt
          ? `${startsAt ? formatDateOnlyPtBR(startsAt) : "-"} ate ${endsAt ? formatDateOnlyPtBR(endsAt) : "-"}`
          : "Nao informada";
      },
    },
  ];
}

function ProjectCalendarCard({ project }: { project: ApiProject }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background px-3 py-3">
      <div className="truncate text-sm font-medium text-foreground">{project.name}</div>
      <div className="mt-2 text-xs text-muted-foreground">
        {project.program?.name ?? "Sem programa"}
      </div>
    </div>
  );
}

export function ProjectsListModuleClientPage() {
  const { token, isLoading: authLoading } = useAuth();
  const { permissions, isLoading: userLoading } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const dataProvider = React.useMemo(() => createRestDataProvider({ token }), [token]);
  const columns = React.useMemo(() => projectColumns(), []);

  const canRead = hasModulePermission(projectsListModuleDefinition, "canRead", permissions);
  const canCreate = canUseModuleAction(projectsListModuleDefinition, "create", permissions);

  const [rows, setRows] = React.useState<ApiProject[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [state, setState] = useModuleQueryState<ProjectsListQueryState>({
    moduleDefinition: projectsListModuleDefinition,
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
      .search<ApiProject>("projects.list", {
        searchText: state.searchText,
        all: true,
      })
      .then((result) => setRows(result.data))
      .catch((nextError) => {
        const message =
          nextError && typeof nextError === "object" && "message" in nextError
            ? String((nextError as { message?: string }).message)
            : "Falha ao carregar projetos.";
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
    (project: ApiProject) => {
      router.push(withTenantPath(`/projects/${project.id}`, tenantSlug));
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
        searchView: projectsListModuleDefinition.searchConfig,
        onClearGroupBy: () => setState((previous) => ({ ...previous, groupBy: [] })),
        onClearDomain: () =>
          setState((previous) => ({ ...previous, domain: null, pageIndex: 0 })),
        onRemoveDomainCondition: removeDomainCondition,
      }),
    [removeDomainCondition, setState, state.domain, state.groupBy],
  );

  const favoriteSnapshot = React.useMemo<ProjectsFavoriteState>(
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
    const graphView = projectsListModuleDefinition.views.find(
      (view) => view.id === "graph" && view.viewType === "graph",
    );
    return graphView?.viewType === "graph" ? graphView.params?.builder : undefined;
  }, []);

  const graphModel = React.useMemo(
    () =>
      graphBuilder
        ? buildGraphViewModel(
            rows as Array<Record<string, unknown>>,
            projectsListModuleDefinition.defaultQueryState.graph,
            graphBuilder,
          )
        : null,
    [graphBuilder, rows],
  );

  if (!authLoading && !userLoading && !canRead) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Voce nao tem acesso a Projetos.</div>;
  }

  return (
    <EntityModuleShell<ProjectsListQueryState, ProjectsFavoriteState>
      moduleDefinition={projectsListModuleDefinition}
      state={state}
      onStateChange={setState}
      queryFacets={queryFacets}
      favoriteSnapshot={favoriteSnapshot}
      isLoading={loading}
      totalCount={rows.length}
      canCreate={canCreate}
      onCreate={() => router.push(withTenantPath("/projects/new", tenantSlug))}
      onRefresh={() => setState((previous) => ({ ...previous }))}
    >
      {error ? <div className="px-4 py-3 text-sm text-destructive">{error}</div> : null}
      {state.view === "kanban" ? (
        <KanbanView
          items={rows}
          getColumnKey={(project) =>
            state.groupBy[0] === "program.name"
              ? project.program?.name ?? "Sem programa"
              : state.groupBy[0] === "program.type"
                ? project.program?.type
                  ? PROGRAM_TYPE_LABELS[project.program.type] ?? project.program.type
                  : "Sem tipo"
                : PROJECT_STATUS_LABELS[project.status] ?? project.status
          }
          getColumnLabel={(value) => value}
          renderCard={(project) => (
            <button type="button" className="w-full text-left" onClick={() => openDetail(project)}>
              <ProjectCalendarCard project={project} />
            </button>
          )}
        />
      ) : state.view === "timeline" ? (
        <TimelineView
          items={rows}
          getDate={(project) =>
            project.startsAt ? new Date(`${project.startsAt}T00:00:00`) : null
          }
          renderTitle={(project) => project.name}
          renderBody={(project) => (
            <div className="grid gap-1 text-[12px]">
              <div>{PROJECT_STATUS_LABELS[project.status] ?? project.status}</div>
              <div>{project.program?.name ?? "Sem programa"}</div>
            </div>
          )}
          sortDirection="desc"
        />
      ) : state.view === "calendar" ? (
        <CalendarView
          items={rows}
          getDate={(project) =>
            project.startsAt ? new Date(`${project.startsAt}T00:00:00`) : null
          }
          mode="month"
          onModeChange={() => undefined}
          renderItem={(project) => (
            <button type="button" className="w-full text-left" onClick={() => openDetail(project)}>
              <ProjectCalendarCard project={project} />
            </button>
          )}
          showModeSelect={false}
          showDateFieldSelect={false}
          showRangeInputs={false}
        />
      ) : state.view === "gantt" ? (
        <GanttView
          items={rows}
          getItemId={(project) => project.id}
          getItemLabel={(project) => project.name}
          getStartDate={(project) =>
            project.startsAt
              ? new Date(`${project.startsAt}T00:00:00`)
              : project.endsAt
                ? new Date(`${project.endsAt}T00:00:00`)
                : null
          }
          getEndDate={(project) =>
            project.endsAt
              ? new Date(`${project.endsAt}T00:00:00`)
              : project.startsAt
                ? new Date(`${project.startsAt}T00:00:00`)
                : null
          }
          renderTitle={(project) => project.name}
          renderMeta={(project) => PROJECT_STATUS_LABELS[project.status] ?? project.status}
          renderExternalLabel={(project) => project.program?.name ?? null}
          getGroupValue={(project) =>
            state.groupBy[0] === "program.name"
              ? project.program?.name ?? "Sem programa"
              : PROJECT_STATUS_LABELS[project.status] ?? project.status
          }
          getGroupLabel={(value) => String(value ?? "Sem valor")}
          onItemClick={openDetail}
          scale="month"
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
          <TableView<ApiProject>
            data={pagedRows}
            columns={columns}
            onRowClick={openDetail}
            getRowId={(row) => row.id}
            initialColumnPinning={{ left: ["name"] }}
          />
          <PaginationBar
            pageIndex={state.pageIndex}
            pageSize={state.pageSize}
            pageCount={pageCount}
            onPageIndexChange={(pageIndex) => setState((previous) => ({ ...previous, pageIndex }))}
            onPageSizeChange={(pageSize) =>
              setState((previous) => ({ ...previous, pageSize, pageIndex: 0 }))
            }
          />
        </>
      )}
    </EntityModuleShell>
  );
}
