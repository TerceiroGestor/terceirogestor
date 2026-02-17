"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/DataTable";
import { Label } from "@/components/ui/label";
import { SectionCard } from "@/components/section-card";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { Switch } from "@/components/ui/switch";
import { UsageDocumentation } from "@/components/UsageDocumentation/UsageDocumentation";
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
import { useRequireAuth } from "@/hooks/use-require-auth";
import { formatDateOnlyPtBR } from "@/lib/date";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { listProjects, type ApiProject } from "@/modules/projects/api";
import {
  listProjectCycles,
  listProjectGroups,
  type ApiProjectCycle,
  type ApiProjectGroup,
} from "@/modules/projects/api";
import {
  listProjectActions,
  type ApiProjectAction,
  type ActionStatus,
} from "@/modules/actions/api";
import { ACTION_STATUS_LABELS } from "@/modules/actions/shared/domain/actions.constants";
import { ACTIONS_LIST_TEXT } from "../config/actions-list.constants";

const NONE_VALUE = "__none__";

function resolveStatusBadge(status: ActionStatus) {
  const label = ACTION_STATUS_LABELS[status] ?? status;
  switch (status) {
    case "CANCELED":
      return <Badge variant="outline">{label}</Badge>;
    case "EXECUTED":
      return <Badge variant="secondary">{label}</Badge>;
    case "PLANNED":
    default:
      return (
        <Badge className="border-transparent bg-blue-600 text-white">
          {label}
        </Badge>
      );
  }
}

function formatPeriod(start: string | null, end: string | null) {
  const startLabel = start ? formatDateOnlyPtBR(start) : "";
  const endLabel = end ? formatDateOnlyPtBR(end) : "";
  if (!startLabel && !endLabel) return ACTIONS_LIST_TEXT.filters.noneValueDash;
  if (startLabel && endLabel) return `${startLabel} — ${endLabel}`;
  return startLabel ? `${startLabel} —` : `— ${endLabel}`;
}

type ScopeType = "PROJECT" | "GROUP" | "CYCLE";

export function ActionsClientPage() {
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const { toast } = useToast();

  const canRead = permissions.includes("actions.read");
  const canCreate = permissions.includes("actions.create");
  const canManageAll = permissions.includes("actions.manage");
  const canUpdate = permissions.includes("actions.update");

  const [projects, setProjects] = React.useState<ApiProject[]>([]);
  const [projectId, setProjectId] = React.useState<string>(NONE_VALUE);

  const [scope, setScope] = React.useState<ScopeType>("PROJECT");
  const [groupId, setGroupId] = React.useState<string>(NONE_VALUE);
  const [cycleId, setCycleId] = React.useState<string>(NONE_VALUE);

  const [onlyMine, setOnlyMine] = React.useState(!canManageAll);

  const [groups, setGroups] = React.useState<ApiProjectGroup[]>([]);
  const [cycles, setCycles] = React.useState<ApiProjectCycle[]>([]);

  const [rows, setRows] = React.useState<ApiProjectAction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [pageCount, setPageCount] = React.useState(0);
  const [totalCount, setTotalCount] = React.useState(0);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    setOnlyMine(!canManageAll);
  }, [canManageAll]);

  const loadProjects = React.useCallback(async () => {
    if (!token || !canRead) return;
    try {
      const response = await listProjects(token, { all: true, limit: 200 });
      const list = response.data ?? [];
      setProjects(list);
      if (projectId === NONE_VALUE && list.length === 1) {
        setProjectId(list[0]?.id ?? NONE_VALUE);
      }
    } catch (err) {
      setProjects([]);
      toast({
        title: ACTIONS_LIST_TEXT.loadProjectsErrorTitle,
        description:
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : ACTIONS_LIST_TEXT.loadActionsFallbackError,
        variant: "destructive",
      });
    }
  }, [token, canRead, projectId, toast]);

  React.useEffect(() => {
    if (!isAuthenticated || authLoading) return;
    loadProjects();
  }, [isAuthenticated, authLoading, loadProjects]);

  const loadScopeLookups = React.useCallback(async () => {
    if (!token || !canRead) return;
    if (!projectId || projectId === NONE_VALUE) {
      setGroups([]);
      setCycles([]);
      return;
    }
    try {
      const [projectGroups, projectCycles] = await Promise.all([
        listProjectGroups(token, projectId),
        listProjectCycles(token, projectId),
      ]);
      setGroups(projectGroups);
      setCycles(projectCycles);
    } catch {
      setGroups([]);
      setCycles([]);
    }
  }, [token, canRead, projectId]);

  React.useEffect(() => {
    loadScopeLookups();
  }, [loadScopeLookups]);

  React.useEffect(() => {
    if (scope === "GROUP") setCycleId(NONE_VALUE);
    if (scope === "CYCLE") setGroupId(NONE_VALUE);
  }, [scope]);

  const loadActions = React.useCallback(async () => {
    if (!token || !canRead) return;
    if (!projectId || projectId === NONE_VALUE) {
      setRows([]);
      setTotalCount(0);
      setPageCount(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await listProjectActions(token, projectId, {
        q: search.trim() ? search.trim() : undefined,
        mine: canManageAll ? onlyMine : true,
        groupId:
          scope === "GROUP" && groupId !== NONE_VALUE ? groupId : undefined,
        cycleId:
          scope === "CYCLE" && cycleId !== NONE_VALUE ? cycleId : undefined,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      });
      setRows(response.data);
      const total = response.pagination?.total ?? 0;
      setTotalCount(total);
      const computedPageCount =
        response.pagination?.pages ??
        Math.ceil(total / Math.max(1, pagination.pageSize));
      setPageCount(computedPageCount);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : ACTIONS_LIST_TEXT.loadActionsFallbackError;
      setError(message);
      setRows([]);
      setTotalCount(0);
      setPageCount(0);
    } finally {
      setLoading(false);
    }
  }, [
    token,
    canRead,
    projectId,
    search,
    pagination.pageIndex,
    pagination.pageSize,
    scope,
    groupId,
    cycleId,
    canManageAll,
    onlyMine,
  ]);

  React.useEffect(() => {
    loadActions();
  }, [loadActions]);

  const projectOptions = React.useMemo(
    () => [
      { label: "Selecione um projeto", value: NONE_VALUE },
      ...projects.map((p) => ({ label: p.name, value: p.id })),
    ],
    [projects],
  );

  const groupOptions = React.useMemo(
    () => [
      { label: "Todos os grupos", value: NONE_VALUE },
      ...groups.map((g) => ({ label: g.name, value: g.id })),
    ],
    [groups],
  );

  const cycleOptions = React.useMemo(
    () => [
      { label: "Todos os ciclos", value: NONE_VALUE },
      ...cycles.map((c) => ({ label: c.name, value: c.id })),
    ],
    [cycles],
  );

  const columns = React.useMemo<ColumnDef<ApiProjectAction>[]>(() => {
    return [
      {
        id: "title",
        header: ACTIONS_LIST_TEXT.table.colTitle,
        accessorFn: (item) => item.title,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.title}</span>
            <span className="text-xs text-muted-foreground">
              {row.original.actionType?.name ?? ACTIONS_LIST_TEXT.table.unknownTypeDash}
              {row.original.group?.name ? ` • ${row.original.group.name}` : ""}
              {row.original.cycle?.name ? ` • ${row.original.cycle.name}` : ""}
            </span>
          </div>
        ),
      },
      {
        id: "status",
        header: ACTIONS_LIST_TEXT.table.colStatus,
        accessorFn: (item) => item.status,
        cell: ({ row }) => resolveStatusBadge(row.original.status),
      },
      {
        id: "planned",
        header: ACTIONS_LIST_TEXT.table.colPlanned,
        accessorFn: (item) =>
          `${item.plannedStartAt ?? ""}-${item.plannedEndAt ?? ""}`,
        cell: ({ row }) =>
          formatPeriod(row.original.plannedStartAt, row.original.plannedEndAt),
      },
      {
        id: "executed",
        header: ACTIONS_LIST_TEXT.table.colExecuted,
        accessorFn: (item) =>
          `${item.executedStartAt ?? ""}-${item.executedEndAt ?? ""}`,
        cell: ({ row }) =>
          formatPeriod(
            row.original.executedStartAt,
            row.original.executedEndAt,
          ),
      },
    ];
  }, []);

  if (!isAuthenticated || authLoading) return null;

  if (!canRead) {
    return (
      <SectionCard
        title={ACTIONS_LIST_TEXT.noAccessTitle}
        subtitle={ACTIONS_LIST_TEXT.noAccessSubtitle}
      >
        <p className="text-xs text-muted-foreground">
          {ACTIONS_LIST_TEXT.requestAccessHint}
        </p>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumb
        title={ACTIONS_LIST_TEXT.breadcrumbTitle}
        items={[{ label: ACTIONS_LIST_TEXT.breadcrumbTitle, href: "/actions" }]}
      />

      <SectionCard
        title={ACTIONS_LIST_TEXT.pageTitle}
        subtitle={ACTIONS_LIST_TEXT.pageSubtitle}
        actions={
          <Button
            type="button"
            disabled={!canCreate || projectId === NONE_VALUE}
            onClick={() => {
              const href = withTenantPath("/actions/new", tenantSlug);
              const params = new URLSearchParams();
              if (projectId !== NONE_VALUE) params.set("projectId", projectId);
              router.push(`${href}?${params.toString()}`);
            }}
          >
            <Plus className="mr-2 size-4" />
            {ACTIONS_LIST_TEXT.newActionButton}
          </Button>
        }
      >
        <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/20 p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label>{ACTIONS_LIST_TEXT.filters.projectLabel}</Label>
              <Select
                value={projectId}
                onValueChange={(value) => {
                  setProjectId(value);
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={ACTIONS_LIST_TEXT.filters.projectPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {projectOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{ACTIONS_LIST_TEXT.filters.scopeLabel}</Label>
              <Select
                value={scope}
                onValueChange={(value) => {
                  setScope(value as ScopeType);
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROJECT">{ACTIONS_LIST_TEXT.filters.scopeProject}</SelectItem>
                  <SelectItem value="GROUP">{ACTIONS_LIST_TEXT.filters.scopeGroup}</SelectItem>
                  <SelectItem value="CYCLE">{ACTIONS_LIST_TEXT.filters.scopeCycle}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>
                {scope === "GROUP"
                  ? ACTIONS_LIST_TEXT.filters.scopeGroup
                  : scope === "CYCLE"
                    ? ACTIONS_LIST_TEXT.filters.scopeCycle
                    : ACTIONS_LIST_TEXT.filters.scopeFilterLabel}
              </Label>
              {scope === "GROUP" ? (
                <Select
                  value={groupId}
                  onValueChange={(value) => {
                    setGroupId(value);
                    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                  }}
                  disabled={projectId === NONE_VALUE}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={ACTIONS_LIST_TEXT.filters.groupPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {groupOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : scope === "CYCLE" ? (
                <Select
                  value={cycleId}
                  onValueChange={(value) => {
                    setCycleId(value);
                    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                  }}
                  disabled={projectId === NONE_VALUE}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={ACTIONS_LIST_TEXT.filters.cyclePlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {cycleOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex h-10 items-center rounded-md border border-border/60 bg-background px-3 text-sm text-muted-foreground">
                  {ACTIONS_LIST_TEXT.filters.noneValueDash}
                </div>
              )}
            </div>
          </div>

          {canManageAll ? (
            <div className="flex items-center gap-3">
              <Switch
                checked={onlyMine}
                onCheckedChange={(value) => {
                  setOnlyMine(Boolean(value));
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                }}
              />
              <div className="text-sm">
                <span className="font-medium">{ACTIONS_LIST_TEXT.filters.onlyMineTitle}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {ACTIONS_LIST_TEXT.filters.onlyMineHint}
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <DataTable<ApiProjectAction>
          data={rows}
          columns={columns}
          manualPagination
          pageCount={pageCount}
          pagination={pagination}
          onPaginationChange={(next) => setPagination(next)}
          totalCount={totalCount}
          onGlobalFilterChange={setSearch}
          searchPlaceholder={ACTIONS_LIST_TEXT.table.searchPlaceholder}
          showExportMenu={false}
          rowActions={
            canUpdate
              ? [
                  {
                    id: "edit",
                    label: ACTIONS_LIST_TEXT.table.rowEdit,
                    onSelect: (row) => {
                      if (projectId === NONE_VALUE) return;
                      const href = withTenantPath(
                        `/actions/${row.id}`,
                        tenantSlug,
                      );
                      const next = new URLSearchParams();
                      next.set("projectId", projectId);
                      router.push(`${href}?${next.toString()}`);
                    },
                  },
                ]
              : []
          }
          onRowClick={(row) => {
            if (projectId === NONE_VALUE) return;
            const href = withTenantPath(
              `/actions/${(row as ApiProjectAction).id}`,
              tenantSlug,
            );
            const params = new URLSearchParams();
            params.set("projectId", projectId);
            router.push(`${href}?${params.toString()}`);
          }}
          summaryCards={{
            totalLabel: ACTIONS_LIST_TEXT.table.summaryTotal,
            filteredLabel: ACTIONS_LIST_TEXT.table.summaryFiltered,
          }}
        />
      </SectionCard>

      <UsageDocumentation
        title={ACTIONS_LIST_TEXT.usage.title}
        items={ACTIONS_LIST_TEXT.usage.sections.map((section, index) => ({
          id: `actions-list-${index}`,
          title: section.title,
          searchText: section.items.join(" "),
          content: (
            <ul className="list-disc space-y-1 pl-5">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ),
        }))}
      />
    </div>
  );
}
