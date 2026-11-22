"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { usePathname, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { formatDateOnlyPtBR } from "@/lib/date";
import type { ApiAttendance } from "@/modules/attendances/api";
import {
  attendancesListModuleDefinition,
  type AttendancesListQueryState,
} from "@/modules/attendances/config/attendances-module-contract";
import {
  ATTENDANCE_CASE_STATUS_LABELS,
  ATTENDANCE_TYPE_LABELS,
} from "@/modules/attendances/shared/domain/attendances.constants";
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

function parseState(params: URLSearchParams): AttendancesListQueryState {
  return {
    ...attendancesListModuleDefinition.defaultQueryState,
    view: "table",
    searchText: params.get("q") ?? "",
    domain: parseDomain(params.get("d")) ?? null,
    groupBy: (params.get("g") ?? "").split(",").map((item) => item.trim()).filter(Boolean),
    pageIndex: parsePositiveInt(params.get("page"), 1) - 1,
    pageSize: Math.min(Math.max(parsePositiveInt(params.get("limit"), 20), 1), 100),
  };
}

function serializeState(state: AttendancesListQueryState) {
  return {
    q: state.searchText.trim() || undefined,
    d: state.domain ? serializeDomain(state.domain) : undefined,
    g: state.groupBy.length ? state.groupBy.join(",") : undefined,
    page: state.pageIndex > 0 ? String(state.pageIndex + 1) : undefined,
    limit: state.pageSize === 20 ? undefined : String(state.pageSize),
  };
}

function resolveTypeLabel(type: ApiAttendance["type"]) {
  return ATTENDANCE_TYPE_LABELS[type] ?? type;
}

function resolveStatusLabel(status: ApiAttendance["status"]) {
  return ATTENDANCE_CASE_STATUS_LABELS[status] ?? status;
}

function resolveStatusBadge(status: ApiAttendance["status"]) {
  return status === "ENCERRADO" ? (
    <Badge className="border-transparent bg-emerald-600 text-white">{resolveStatusLabel(status)}</Badge>
  ) : (
    <Badge className="border-transparent bg-blue-600 text-white">{resolveStatusLabel(status)}</Badge>
  );
}

function resolveGroupLabel(field: string, value: unknown) {
  if (field === "status") {
    return resolveStatusLabel(value as ApiAttendance["status"]);
  }
  if (field === "type") {
    return resolveTypeLabel(value as ApiAttendance["type"]);
  }
  const label = String(value ?? "").trim();
  return label || "Sem valor";
}

function resolvePrimaryPersonName(attendance: ApiAttendance) {
  const principal = attendance.people.find((person) => person.role === "ATENDIDO_PRINCIPAL");
  return principal?.person.fullName ?? attendance.people[0]?.person.fullName ?? "Sem pessoa vinculada";
}

function columns(): ColumnDef<ApiAttendance>[] {
  return [
    {
      id: "attendance",
      header: "Atendimento",
      accessorFn: (row) => resolvePrimaryPersonName(row),
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <div className="font-medium">{resolvePrimaryPersonName(row.original)}</div>
          <div className="text-xs text-muted-foreground">{resolveTypeLabel(row.original.type)}</div>
        </div>
      ),
    },
    {
      accessorKey: "scheduledDate",
      header: "Data",
      cell: ({ row }) => formatDateOnlyPtBR(row.original.scheduledDate),
    },
    {
      id: "professional",
      header: "Profissional",
      accessorFn: (row) => row.professional.fullName,
      cell: ({ row }) => row.original.professional.fullName,
    },
    {
      id: "people",
      header: "Pessoas",
      accessorFn: (row) => row.people.length,
      meta: { dataType: "number" },
      cell: ({ row }) => row.original.people.length,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => resolveStatusBadge(row.original.status),
    },
  ];
}

export function AttendancesListModuleClientPage() {
  const { token, isLoading: authLoading } = useAuth();
  const { permissions, isLoading: userLoading } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname) ?? "";
  const dataProvider = React.useMemo(() => createRestDataProvider({ token }), [token]);
  const columnDefs = React.useMemo(() => columns(), []);
  const canRead = hasModulePermission(attendancesListModuleDefinition, "canRead", permissions);
  const canCreate = hasModulePermission(attendancesListModuleDefinition, "canCreate", permissions);

  const [rows, setRows] = React.useState<ApiAttendance[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [state, setState] = useModuleQueryState<AttendancesListQueryState>({
    moduleDefinition: attendancesListModuleDefinition,
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
      .search<ApiAttendance>("attendances.list", {
        searchText: state.searchText,
        all: true,
      })
      .then((result) => setRows(result.data))
      .catch((nextError) => {
        const message =
          nextError && typeof nextError === "object" && "message" in nextError
            ? String((nextError as { message?: string }).message)
            : "Falha ao carregar atendimentos.";
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
          type: row.type,
          status: row.status,
          scheduledDate: row.scheduledDate?.slice(0, 10) ?? null,
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
    (attendance: ApiAttendance) => {
      router.push(withTenantPath(`/attendances/${attendance.id}`, tenantSlug));
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
        searchView: attendancesListModuleDefinition.searchConfig,
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
    return <div className="px-4 py-6 text-sm text-muted-foreground">Você não tem acesso a atendimentos.</div>;
  }

  return (
    <EntityModuleShell
      moduleDefinition={attendancesListModuleDefinition}
      state={state}
      onStateChange={setState}
      queryFacets={queryFacets}
      columns={columnDefs}
      favoriteSnapshot={favoriteSnapshot}
      isLoading={loading}
      totalCount={filteredRows.length}
      canCreate={canCreate}
      onCreate={() => router.push(withTenantPath("/attendances/new", tenantSlug))}
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
        initialColumnPinning={{ left: ["attendance"] }}
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
