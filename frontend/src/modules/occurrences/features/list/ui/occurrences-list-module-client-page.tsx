"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { usePathname, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import type { ApiOccurrence } from "@/modules/occurrences/api";
import {
  occurrencesListModuleDefinition,
  type OccurrencesListQueryState,
} from "@/modules/occurrences/config/occurrences-module-contract";
import { OCCURRENCE_CASE_STATUS_LABELS } from "@/modules/occurrences/shared/domain/occurrences.constants";
import { buildQueryFacets } from "@/web-client/control-panel/queryFacets";
import { createRestDataProvider } from "@/web-client/data-provider";
import { removeConditionAtIndex } from "@/web-client/domain/conditions";
import { matchesDomainRecord } from "@/web-client/domain/evaluate";
import { parseDomain, serializeDomain } from "@/web-client/domain/serialize";
import { EntityModuleShell } from "@/web-client/record/RecordListHost";
import { hasModulePermission } from "@/web-client/registry/module-utils";
import { useModuleQueryState } from "@/web-client/screen/useModuleQueryState";
import { PaginationBar } from "@/web-client/ui/PaginationBar";
import { ListView } from "@/web-client/views/ListView";

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function parseState(params: URLSearchParams): OccurrencesListQueryState {
  return {
    ...occurrencesListModuleDefinition.defaultQueryState,
    view: "table",
    searchText: params.get("q") ?? "",
    domain: parseDomain(params.get("d")) ?? null,
    groupBy: (params.get("g") ?? "").split(",").map((item) => item.trim()).filter(Boolean),
    pageIndex: parsePositiveInt(params.get("page"), 1) - 1,
    pageSize: Math.min(Math.max(parsePositiveInt(params.get("limit"), 20), 1), 100),
  };
}

function serializeState(state: OccurrencesListQueryState) {
  return {
    q: state.searchText.trim() || undefined,
    d: state.domain ? serializeDomain(state.domain) : undefined,
    g: state.groupBy.length ? state.groupBy.join(",") : undefined,
    page: state.pageIndex > 0 ? String(state.pageIndex + 1) : undefined,
    limit: state.pageSize === 20 ? undefined : String(state.pageSize),
  };
}

function formatCreatedAt(value: string | null | undefined) {
  if (!value) return "-";
  return value.slice(0, 10).split("-").reverse().join("/");
}

function resolveStatusLabel(status: ApiOccurrence["status"]) {
  return OCCURRENCE_CASE_STATUS_LABELS[status] ?? status;
}

function resolveStatusBadge(status: ApiOccurrence["status"]) {
  switch (status) {
    case "DESFECHO_DEFINIDO":
      return <Badge className="border-transparent bg-emerald-600 text-white">{resolveStatusLabel(status)}</Badge>;
    case "EM_ANALISE":
      return <Badge className="border-transparent bg-amber-500 text-white">{resolveStatusLabel(status)}</Badge>;
    default:
      return <Badge className="border-transparent bg-blue-600 text-white">{resolveStatusLabel(status)}</Badge>;
  }
}

function resolveGroupLabel(field: string, value: unknown) {
  if (field === "status") {
    return resolveStatusLabel(value as ApiOccurrence["status"]);
  }
  const label = String(value ?? "").trim();
  return label || "Sem valor";
}

function columns(): ColumnDef<ApiOccurrence>[] {
  return [
    {
      accessorKey: "title",
      header: "Ocorrência",
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <div className="font-medium text-foreground">{row.original.title}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.meeting ? row.original.meeting.action.title : "Externa"}
          </div>
        </div>
      ),
    },
    {
      id: "people",
      header: "Envolvidos",
      accessorFn: (row) => row.people.length,
      meta: { dataType: "number" },
      cell: ({ row }) => row.original.people.length,
    },
    {
      accessorKey: "createdAt",
      header: "Cadastro",
      cell: ({ row }) => formatCreatedAt(row.original.createdAt),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => resolveStatusBadge(row.original.status),
    },
  ];
}

export function OccurrencesListModuleClientPage() {
  const { token, isLoading: authLoading } = useAuth();
  const { permissions, isLoading: userLoading } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname) ?? "";
  const dataProvider = React.useMemo(() => createRestDataProvider({ token }), [token]);
  const columnDefs = React.useMemo(() => columns(), []);
  const canRead = hasModulePermission(occurrencesListModuleDefinition, "canRead", permissions);
  const canCreate = hasModulePermission(occurrencesListModuleDefinition, "canCreate", permissions);

  const [rows, setRows] = React.useState<ApiOccurrence[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [state, setState] = useModuleQueryState<OccurrencesListQueryState>({
    moduleDefinition: occurrencesListModuleDefinition,
    trackedKeys: ["q", "d", "g", "page", "limit"],
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
      .search<ApiOccurrence>("occurrences.list", {
        searchText: state.searchText,
        all: true,
      })
      .then((result) => setRows(result.data))
      .catch((nextError) => {
        const message =
          nextError && typeof nextError === "object" && "message" in nextError
            ? String((nextError as { message?: string }).message)
            : "Falha ao carregar ocorrências.";
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
          status: row.status,
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
    (occurrence: ApiOccurrence) => {
      router.push(withTenantPath(`/occurrences/${occurrence.id}`, tenantSlug));
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
        searchView: occurrencesListModuleDefinition.searchConfig,
        onClearGroupBy: () => setState((previous) => ({ ...previous, groupBy: [] })),
        onClearDomain: () => setState((previous) => ({ ...previous, domain: null, pageIndex: 0 })),
        onRemoveDomainCondition: removeDomainCondition,
      }),
    [removeDomainCondition, setState, state.domain, state.groupBy],
  );

  const favoriteSnapshot = React.useMemo(
    () => ({
      searchText: state.searchText,
      domain: state.domain,
      groupBy: state.groupBy,
      pageSize: state.pageSize,
    }),
    [state.domain, state.groupBy, state.pageSize, state.searchText],
  );

  if (!authLoading && !userLoading && !canRead) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Você não tem acesso a ocorrências.</div>;
  }

  return (
    <EntityModuleShell
      moduleDefinition={occurrencesListModuleDefinition}
      state={state}
      onStateChange={setState}
      queryFacets={queryFacets}
      columns={columnDefs}
      favoriteSnapshot={favoriteSnapshot}
      isLoading={loading}
      totalCount={filteredRows.length}
      canCreate={canCreate}
      onCreate={() => router.push(withTenantPath("/occurrences/new", tenantSlug))}
      onRefresh={() => setState((previous) => ({ ...previous }))}
    >
      {error ? <div className="px-4 py-3 text-sm text-destructive">{error}</div> : null}
      <ListView
        data={pagedRows}
        columns={columnDefs}
        groupByFields={state.groupBy}
        resolveGroupLabel={resolveGroupLabel}
        onRowClick={openDetail}
        getRowId={(row) => row.id}
        initialColumnPinning={{ left: ["title"] }}
      />
      <PaginationBar
        pageIndex={state.pageIndex}
        pageCount={pageCount}
        pageSize={state.pageSize}
        onPageIndexChange={(next) => setState((previous) => ({ ...previous, pageIndex: next }))}
        onPageSizeChange={(next) => setState((previous) => ({ ...previous, pageSize: next, pageIndex: 0 }))}
      />
    </EntityModuleShell>
  );
}
