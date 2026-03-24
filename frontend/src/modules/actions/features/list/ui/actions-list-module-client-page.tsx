"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { usePathname, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { formatDateOnlyPtBR } from "@/lib/date";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import type { ApiProjectAction } from "@/modules/actions/api";
import {
  actionsListModuleDefinition,
  type ActionsListQueryState,
} from "@/modules/actions/config/actions-module-contract";
import { ACTION_STATUS_LABELS } from "@/modules/actions/shared/domain/actions.constants";
import {
  listProjectCycles,
  listProjectGroups,
  listProjects,
  type ApiProject,
  type ApiProjectCycle,
  type ApiProjectGroup,
} from "@/modules/projects/api";
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
import { ListView } from "@/web-client/views/ListView";

type ActionsFavoriteState = Pick<
  ActionsListQueryState,
  | "view"
  | "searchText"
  | "domain"
  | "groupBy"
  | "pageSize"
  | "projectId"
  | "onlyMine"
  | "groupId"
  | "cycleId"
>;

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function parseState(params: URLSearchParams): ActionsListQueryState {
  return {
    view: "list",
    searchText: params.get("q") ?? "",
    domain: parseDomain(params.get("d")) ?? null,
    groupBy: (params.get("g") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    pageIndex: parsePositiveInt(params.get("page"), 1) - 1,
    pageSize: Math.min(Math.max(parsePositiveInt(params.get("limit"), 20), 1), 100),
    projectId: params.get("projectId") ?? "",
    onlyMine: params.get("mine") === "1",
    groupId: params.get("groupId") ?? "",
    cycleId: params.get("cycleId") ?? "",
  };
}

function serializeState(state: ActionsListQueryState) {
  return {
    q: state.searchText.trim() || undefined,
    d: state.domain ? serializeDomain(state.domain) : undefined,
    g: state.groupBy.length ? state.groupBy.join(",") : undefined,
    page: state.pageIndex > 0 ? String(state.pageIndex + 1) : undefined,
    limit: state.pageSize === 20 ? undefined : String(state.pageSize),
    projectId: state.projectId || undefined,
    mine: state.onlyMine ? "1" : undefined,
    groupId: state.groupId || undefined,
    cycleId: state.cycleId || undefined,
  };
}

function resolveStatusBadge(status: ApiProjectAction["status"]) {
  const label = ACTION_STATUS_LABELS[status] ?? status;
  switch (status) {
    case "EXECUTED":
      return <Badge variant="secondary">{label}</Badge>;
    case "CANCELED":
      return <Badge variant="outline">{label}</Badge>;
    default:
      return <Badge className="border-transparent bg-blue-600 text-white">{label}</Badge>;
  }
}

function resolveGroupLabel(field: string, value: unknown) {
  if (field === "status" && typeof value === "string") {
    return ACTION_STATUS_LABELS[value as ApiProjectAction["status"]] ?? value;
  }
  return String(value ?? "Sem valor");
}

function resolveCyclePrimaryLabel(cycle: ApiProjectAction["cycle"]) {
  if (!cycle) return "Projeto";
  return cycle.segment?.name ?? cycle.catalogCycle?.name ?? cycle.name;
}

function resolveCycleSecondaryLabel(cycle: ApiProjectAction["cycle"]) {
  if (!cycle) return "";
  const parts = [
    cycle.segment?.category ?? cycle.catalogCycle?.audienceType ?? null,
    cycle.name && (cycle.segment?.name ?? cycle.catalogCycle?.name) !== cycle.name
      ? cycle.name
      : null,
  ].filter(Boolean);
  return parts.join(" • ");
}

function formatCycleFilterLabel(cycle: ApiProjectCycle) {
  const primary = cycle.segment?.name ?? cycle.catalogCycle?.name ?? cycle.name;
  const secondaryParts = [
    cycle.segment?.category ?? cycle.catalogCycle?.audienceType ?? null,
    cycle.name && cycle.name !== primary ? cycle.name : null,
  ].filter(Boolean);
  return secondaryParts.length ? `${primary} - ${secondaryParts.join(" - ")}` : primary;
}

function actionColumns(): ColumnDef<ApiProjectAction>[] {
  return [
    {
      accessorKey: "title",
      header: "Acao",
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <div className="font-medium text-foreground">{row.original.title}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.actionType?.name ?? row.original.group?.name ?? resolveCyclePrimaryLabel(row.original.cycle) ?? "Sem tipo"}
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
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => resolveStatusBadge(row.original.status),
    },
  ];
}

export function ActionsListModuleClientPage() {
  const { token, isLoading: authLoading } = useAuth();
  const { permissions, isLoading: userLoading } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const dataProvider = React.useMemo(() => createRestDataProvider({ token }), [token]);
  const columns = React.useMemo(() => actionColumns(), []);

  const canRead = hasModulePermission(actionsListModuleDefinition, "canRead", permissions);
  const canCreate = canUseModuleAction(actionsListModuleDefinition, "create", permissions);
  const canManageAll = permissions.includes("actions.manage");

  const [rows, setRows] = React.useState<ApiProjectAction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [totalCount, setTotalCount] = React.useState(0);
  const [pageCount, setPageCount] = React.useState(0);
  const [projects, setProjects] = React.useState<ApiProject[]>([]);
  const [groups, setGroups] = React.useState<ApiProjectGroup[]>([]);
  const [cycles, setCycles] = React.useState<ApiProjectCycle[]>([]);

  const [state, setState] = useModuleQueryState<ActionsListQueryState>({
    moduleDefinition: actionsListModuleDefinition,
    trackedKeys: ["q", "d", "g", "page", "limit", "projectId", "mine", "groupId", "cycleId"],
    parse: parseState,
    serialize: serializeState,
  });

  React.useEffect(() => {
    if (authLoading || userLoading || !token || !canRead) return;
    listProjects(token, { all: true, limit: 200 })
      .then((result) => setProjects(result.data ?? []))
      .catch(() => setProjects([]));
  }, [authLoading, canRead, token, userLoading]);

  React.useEffect(() => {
    if (!token || !canRead || !state.projectId) {
      setGroups([]);
      setCycles([]);
      return;
    }

    Promise.all([
      listProjectGroups(token, state.projectId),
      listProjectCycles(token, state.projectId),
    ])
      .then(([nextGroups, nextCycles]) => {
        setGroups(nextGroups);
        setCycles(nextCycles);
      })
      .catch(() => {
        setGroups([]);
        setCycles([]);
      });
  }, [canRead, state.projectId, token]);

  React.useEffect(() => {
    if (authLoading || userLoading) return;
    if (!token || !canRead) {
      setLoading(false);
      return;
    }

    if (!state.projectId) {
      setRows([]);
      setTotalCount(0);
      setPageCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    dataProvider
      .search<ApiProjectAction>("actions.list", {
        searchText: state.searchText,
        pagination: {
          pageIndex: state.pageIndex,
          pageSize: state.pageSize,
        },
        context: {
          projectId: state.projectId,
          onlyMine: canManageAll ? state.onlyMine : true,
          groupId: state.groupId || undefined,
          cycleId: state.cycleId || undefined,
        },
      })
      .then((result) => {
        setRows(result.data);
        setTotalCount(result.pagination.total);
        setPageCount(result.pagination.pages);
      })
      .catch((nextError) => {
        const message =
          nextError && typeof nextError === "object" && "message" in nextError
            ? String((nextError as { message?: string }).message)
            : "Falha ao carregar acoes.";
        setRows([]);
        setTotalCount(0);
        setPageCount(0);
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [authLoading, canManageAll, canRead, dataProvider, state.cycleId, state.groupId, state.onlyMine, state.pageIndex, state.pageSize, state.projectId, state.searchText, token, userLoading]);

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
        searchView: actionsListModuleDefinition.searchConfig,
        onClearGroupBy: () => setState((previous) => ({ ...previous, groupBy: [] })),
        onClearDomain: () =>
          setState((previous) => ({ ...previous, domain: null, pageIndex: 0 })),
        onRemoveDomainCondition: removeDomainCondition,
      }),
    [removeDomainCondition, setState, state.domain, state.groupBy],
  );

  const favoriteSnapshot = React.useMemo<ActionsFavoriteState>(
    () => ({
      view: "list",
      searchText: state.searchText,
      domain: state.domain,
      groupBy: state.groupBy,
      pageSize: state.pageSize,
      projectId: state.projectId,
      onlyMine: state.onlyMine,
      groupId: state.groupId,
      cycleId: state.cycleId,
    }),
    [state],
  );

  if (!authLoading && !userLoading && !canRead) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Voce nao tem acesso a Acoes.</div>;
  }

  return (
    <EntityModuleShell<ActionsListQueryState, ActionsFavoriteState>
      moduleDefinition={actionsListModuleDefinition}
      state={state}
      onStateChange={setState}
      queryFacets={queryFacets}
      favoriteSnapshot={favoriteSnapshot}
      isLoading={loading}
      totalCount={totalCount}
      canCreate={canCreate && Boolean(state.projectId)}
      onCreate={() => router.push(withTenantPath(`/actions/new?projectId=${state.projectId}`, tenantSlug))}
      onRefresh={() => setState((previous) => ({ ...previous }))}
      rightSlot={
        <div className="flex items-center gap-2 px-1">
          <Select
            value={state.projectId || "__none__"}
            onValueChange={(value) =>
              setState((previous) => ({
                ...previous,
                projectId: value === "__none__" ? "" : value,
                groupId: "",
                cycleId: "",
                pageIndex: 0,
              }))
            }
          >
            <SelectTrigger className="h-8 w-[180px] rounded-none border-0 border-b border-border/60 bg-transparent px-0 text-xs shadow-none">
              <SelectValue placeholder="Projeto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Projeto</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={state.groupId || "__none__"}
            onValueChange={(value) =>
              setState((previous) => ({
                ...previous,
                groupId: value === "__none__" ? "" : value,
                cycleId: "",
                pageIndex: 0,
              }))
            }
          >
            <SelectTrigger className="h-8 w-[140px] rounded-none border-0 border-b border-border/60 bg-transparent px-0 text-xs shadow-none">
              <SelectValue placeholder="Grupo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Todos os grupos</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={state.cycleId || "__none__"}
            onValueChange={(value) =>
              setState((previous) => ({
                ...previous,
                cycleId: value === "__none__" ? "" : value,
                groupId: "",
                pageIndex: 0,
              }))
            }
          >
            <SelectTrigger className="h-8 w-[140px] rounded-none border-0 border-b border-border/60 bg-transparent px-0 text-xs shadow-none">
              <SelectValue placeholder="Grupo de Pessoas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Todos os grupos de pessoas</SelectItem>
              {cycles.map((cycle) => (
                <SelectItem key={cycle.id} value={cycle.id}>
                  {formatCycleFilterLabel(cycle)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {canManageAll ? (
            <div className="flex items-center gap-2">
              <Switch
                id="actions-only-mine"
                checked={state.onlyMine}
                onCheckedChange={(checked) =>
                  setState((previous) => ({ ...previous, onlyMine: checked, pageIndex: 0 }))
                }
              />
              <Label htmlFor="actions-only-mine" className="text-xs text-muted-foreground">
                So minhas
              </Label>
            </div>
          ) : null}
        </div>
      }
    >
      {error ? <div className="px-4 py-3 text-sm text-destructive">{error}</div> : null}
      <ListView<ApiProjectAction>
        data={rows}
        columns={columns}
        groupByFields={state.groupBy}
        resolveGroupLabel={resolveGroupLabel}
        onRowClick={(row) =>
          router.push(withTenantPath(`/actions/${row.id}?projectId=${state.projectId}`, tenantSlug))
        }
      />
      <PaginationBar
        pageIndex={state.pageIndex}
        pageSize={state.pageSize}
        pageCount={pageCount}
        onPageIndexChange={(pageIndex: number) => setState((previous) => ({ ...previous, pageIndex }))}
        onPageSizeChange={(pageSize) => setState((previous) => ({ ...previous, pageSize, pageIndex: 0 }))}
      />
    </EntityModuleShell>
  );
}
