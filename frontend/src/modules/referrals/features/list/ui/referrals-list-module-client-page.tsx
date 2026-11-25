"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { CalendarDays, Layers } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { formatDateOnlyPtBR } from "@/lib/date";
import type { ApiReferral } from "@/modules/referrals/api";
import {
  referralsListModuleDefinition,
  type ReferralDateField,
  type ReferralsListQueryState,
} from "@/modules/referrals/config/referrals-module-contract";
import {
  REFERRAL_STATUS_LABELS,
  REFERRAL_TYPE_LABELS,
} from "@/modules/referrals/shared/domain/referrals.constants";
import { buildQueryFacets } from "@/web-client/control-panel/queryFacets";
import { createRestDataProvider } from "@/web-client/data-provider";
import { removeConditionAtIndex } from "@/web-client/domain/conditions";
import { matchesDomainRecord } from "@/web-client/domain/evaluate";
import { parseDomain, serializeDomain } from "@/web-client/domain/serialize";
import { EntityModuleShell } from "@/web-client/record/RecordListHost";
import {
  getModuleGraphBuilderConfig,
  hasModulePermission,
} from "@/web-client/registry/module-utils";
import { useModuleQueryState } from "@/web-client/screen/useModuleQueryState";
import { PaginationBar } from "@/web-client/ui/PaginationBar";
import { CalendarView } from "@/web-client/views/CalendarView";
import {
  buildGraphViewModel,
  GraphBuilderControls,
  GraphView,
  parseGraphBuilderStateFromParams,
  serializeGraphBuilderStateToParams,
} from "@/web-client/views/GraphView";
import { KanbanView } from "@/web-client/views/KanbanView";
import { ListView } from "@/web-client/views/ListView";

type ReferralsFavoriteState = Pick<
  ReferralsListQueryState,
  "view" | "searchText" | "domain" | "groupBy" | "pageSize" | "calendarField" | "calendarMode" | "rangeFrom" | "rangeTo" | "graph"
>;

const referralsGraphBuilder = getModuleGraphBuilderConfig(referralsListModuleDefinition);
const analysisControlClassName =
  "h-8 rounded-none border-0 border-b border-border/60 bg-transparent px-0 text-xs shadow-none focus-visible:ring-0";
const REFERRAL_CALENDAR_MODE_LABELS: Record<ReferralsListQueryState["calendarMode"], string> = {
  day: "Dia",
  week: "Semana",
  month: "Mes",
  year: "Ano",
};
const REFERRAL_DATE_FIELD_LABELS: Record<ReferralDateField, string> = {
  createdAt: "Cadastro",
  closedAt: "Encerramento",
};

function parseReferralDate(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function parseState(params: URLSearchParams): ReferralsListQueryState {
  const calendarMode = params.get("calendarMode");
  return {
    ...referralsListModuleDefinition.defaultQueryState,
    view: (params.get("view") as ReferralsListQueryState["view"]) ?? "table",
    searchText: params.get("q") ?? "",
    domain: parseDomain(params.get("d")) ?? null,
    groupBy: (params.get("g") ?? "").split(",").map((item) => item.trim()).filter(Boolean),
    pageIndex: parsePositiveInt(params.get("page"), 1) - 1,
    pageSize: Math.min(Math.max(parsePositiveInt(params.get("limit"), 20), 1), 100),
    calendarField: params.get("calendarField") === "closedAt" ? "closedAt" : "createdAt",
    calendarMode:
      calendarMode === "day" || calendarMode === "week" || calendarMode === "year"
        ? (calendarMode as ReferralsListQueryState["calendarMode"])
        : "month",
    rangeFrom: params.get("rangeFrom") ?? "",
    rangeTo: params.get("rangeTo") ?? "",
    graph: referralsGraphBuilder
      ? parseGraphBuilderStateFromParams(params, referralsGraphBuilder)
      : referralsListModuleDefinition.defaultQueryState.graph,
  };
}

function serializeState(state: ReferralsListQueryState) {
  return {
    view: state.view === "table" ? undefined : state.view,
    q: state.searchText.trim() || undefined,
    d: state.domain ? serializeDomain(state.domain) : undefined,
    g: state.groupBy.length ? state.groupBy.join(",") : undefined,
    page: state.pageIndex > 0 ? String(state.pageIndex + 1) : undefined,
    limit: state.pageSize === 20 ? undefined : String(state.pageSize),
    calendarField: state.calendarField === "createdAt" ? undefined : state.calendarField,
    calendarMode: state.calendarMode === "month" ? undefined : state.calendarMode,
    rangeFrom: state.rangeFrom || undefined,
    rangeTo: state.rangeTo || undefined,
    ...(referralsGraphBuilder ? serializeGraphBuilderStateToParams(state.graph, referralsGraphBuilder) : {}),
  };
}

function resolveTypeLabel(type: ApiReferral["type"]) {
  return REFERRAL_TYPE_LABELS[type] ?? type;
}

function resolveStatusLabel(status: ApiReferral["status"]) {
  return REFERRAL_STATUS_LABELS[status] ?? status;
}

function resolveStatusBadge(status: ApiReferral["status"]) {
  if (status === "ENCERRADO") {
    return <Badge className="border-transparent bg-emerald-600 text-white">{resolveStatusLabel(status)}</Badge>;
  }
  if (status === "EM_ACOMPANHAMENTO") {
    return <Badge className="border-transparent bg-amber-600 text-white">{resolveStatusLabel(status)}</Badge>;
  }
  return <Badge className="border-transparent bg-blue-600 text-white">{resolveStatusLabel(status)}</Badge>;
}

function resolveGroupLabel(field: string, value: unknown) {
  if (field === "status") {
    return resolveStatusLabel(value as ApiReferral["status"]);
  }
  if (field === "type") {
    return resolveTypeLabel(value as ApiReferral["type"]);
  }
  const label = String(value ?? "").trim();
  return label || "Sem valor";
}

function columns(): ColumnDef<ApiReferral>[] {
  return [
    {
      id: "referral",
      header: "Encaminhamento",
      accessorFn: (row) => row.destination.name,
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <div className="font-medium">{row.original.destination.name}</div>
          <div className="text-xs text-muted-foreground">{resolveTypeLabel(row.original.type)}</div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => resolveStatusBadge(row.original.status),
    },
    {
      accessorKey: "createdAt",
      header: "Cadastro",
      cell: ({ row }) => formatDateOnlyPtBR(row.original.createdAt),
    },
  ];
}

function ReferralCalendarCard({ referral }: { referral: ApiReferral }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background px-3 py-3">
      <div className="truncate text-sm font-medium text-foreground">{referral.destination.name}</div>
      <div className="mt-2 text-xs text-muted-foreground">{resolveTypeLabel(referral.type)}</div>
    </div>
  );
}

function referralDateGetter(field: ReferralDateField) {
  return (referral: ApiReferral) => parseReferralDate(field === "createdAt" ? referral.createdAt : referral.closedAt);
}

function resolveKanbanColumnValue(referral: ApiReferral, field: string) {
  if (field === "type") return resolveTypeLabel(referral.type);
  return resolveStatusLabel(referral.status);
}

export function ReferralsListModuleClientPage() {
  const { token, isLoading: authLoading } = useAuth();
  const { permissions, isLoading: userLoading } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname) ?? "";
  const dataProvider = React.useMemo(() => createRestDataProvider({ token }), [token]);
  const columnDefs = React.useMemo(() => columns(), []);
  const canRead = hasModulePermission(referralsListModuleDefinition, "canRead", permissions);
  // Encaminhamento sempre nasce de uma Evolução (revisão de 2026-11-25) - sem
  // contexto de origem aqui, não faz sentido oferecer "Novo" genérico na
  // lista. Criação real: botão "Registrar encaminhamento" na tela da Evolução.
  const canCreate = false;

  const [rows, setRows] = React.useState<ApiReferral[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [state, setState] = useModuleQueryState<ReferralsListQueryState>({
    moduleDefinition: referralsListModuleDefinition,
    trackedKeys: [
      "view",
      "q",
      "d",
      "g",
      "page",
      "limit",
      "calendarField",
      "calendarMode",
      "rangeFrom",
      "rangeTo",
      "gg",
      "gmf",
      "gmo",
      "gtf",
      "gtb",
      "gct",
    ],
    parse: parseState,
    serialize: serializeState,
    equals: (left, right) => JSON.stringify(serializeState(left)) === JSON.stringify(serializeState(right)),
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
      .search<ApiReferral>("referrals.list", {
        searchText: state.searchText,
        all: true,
      })
      .then((result) => setRows(result.data))
      .catch((nextError) => {
        const message =
          nextError && typeof nextError === "object" && "message" in nextError
            ? String((nextError as { message?: string }).message)
            : "Falha ao carregar encaminhamentos.";
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
    (referral: ApiReferral) => {
      router.push(withTenantPath(`/referrals/${referral.id}`, tenantSlug));
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
        searchView: referralsListModuleDefinition.searchConfig,
        onClearGroupBy: () => setState((previous) => ({ ...previous, groupBy: [] })),
        onClearDomain: () => setState((previous) => ({ ...previous, domain: null, pageIndex: 0 })),
        onRemoveDomainCondition: removeDomainCondition,
      }),
    [removeDomainCondition, setState, state.domain, state.groupBy],
  );

  const favoriteSnapshot = React.useMemo<ReferralsFavoriteState>(
    () => ({
      view: state.view,
      searchText: state.searchText,
      domain: state.domain,
      groupBy: state.groupBy,
      pageSize: state.pageSize,
      calendarField: state.calendarField,
      calendarMode: state.calendarMode,
      rangeFrom: state.rangeFrom,
      rangeTo: state.rangeTo,
      graph: state.graph,
    }),
    [
      state.calendarField,
      state.calendarMode,
      state.domain,
      state.graph,
      state.groupBy,
      state.pageSize,
      state.rangeFrom,
      state.rangeTo,
      state.searchText,
      state.view,
    ],
  );

  const graphModel = React.useMemo(
    () =>
      referralsGraphBuilder
        ? buildGraphViewModel(filteredRows as Array<Record<string, unknown>>, state.graph, referralsGraphBuilder)
        : null,
    [filteredRows, state.graph],
  );

  const analysisSlot = React.useMemo(() => {
    if (state.view === "calendar") {
      return (
        <div className="flex flex-wrap items-center gap-1.5">
          <Select
            value={state.calendarField}
            onValueChange={(next) =>
              setState((previous) => ({ ...previous, calendarField: next as ReferralDateField }))
            }
          >
            <SelectTrigger className={`${analysisControlClassName} w-[11rem]`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Usar cadastro</SelectItem>
              <SelectItem value="closedAt">Usar encerramento</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={state.calendarMode}
            onValueChange={(next) =>
              setState((previous) => ({
                ...previous,
                calendarMode: next as ReferralsListQueryState["calendarMode"],
              }))
            }
          >
            <SelectTrigger className={`${analysisControlClassName} w-[8rem]`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Dia</SelectItem>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="month">Mes</SelectItem>
              <SelectItem value="year">Ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (state.view === "graph" && referralsGraphBuilder) {
      return (
        <GraphBuilderControls
          moduleDefinition={referralsListModuleDefinition}
          builder={referralsGraphBuilder}
          state={state.graph}
          rows={filteredRows as Array<Record<string, unknown>>}
          searchView={referralsListModuleDefinition.searchConfig}
          hideGroupBy
          layout="grid"
          controlClassName={analysisControlClassName}
          onChange={(updater) => setState((previous) => ({ ...previous, graph: updater(previous.graph) }))}
        />
      );
    }

    return undefined;
  }, [filteredRows, setState, state.calendarField, state.calendarMode, state.graph, state.view]);

  const analysisFacets = React.useMemo(() => {
    const facets = [];

    if (state.groupBy.length) {
      facets.push({
        key: "analysis:groupBy",
        label: `Agrupar: ${state.groupBy.join(", ")}`,
        tone: "analysis" as const,
        analysisKind: "group" as const,
        icon: <Layers className="size-3.5" />,
      });
    }

    if (state.view === "calendar") {
      facets.push({
        key: "analysis:calendarField",
        label: `Calendário: ${REFERRAL_DATE_FIELD_LABELS[state.calendarField]}`,
        tone: "analysis" as const,
        analysisKind: "time" as const,
        icon: <CalendarDays className="size-3.5" />,
      });
      facets.push({
        key: "analysis:calendarMode",
        label: `Modo: ${REFERRAL_CALENDAR_MODE_LABELS[state.calendarMode]}`,
        tone: "analysis" as const,
        analysisKind: "time" as const,
        icon: <CalendarDays className="size-3.5" />,
      });
    }

    return facets;
  }, [state.calendarField, state.calendarMode, state.groupBy, state.view]);

  const hasActiveAnalysis = React.useMemo(() => {
    const defaultState = referralsListModuleDefinition.defaultQueryState;
    if (state.groupBy.length) return true;
    if (state.view === "calendar") {
      return (
        state.calendarField !== defaultState.calendarField ||
        state.calendarMode !== defaultState.calendarMode ||
        Boolean(state.rangeFrom) ||
        Boolean(state.rangeTo)
      );
    }
    if (state.view === "graph") {
      return JSON.stringify(state.graph) !== JSON.stringify(defaultState.graph);
    }
    return false;
  }, [state.calendarField, state.calendarMode, state.graph, state.groupBy, state.rangeFrom, state.rangeTo, state.view]);

  if (!authLoading && !userLoading && !canRead) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Você não tem acesso a encaminhamentos.</div>;
  }

  return (
    <EntityModuleShell<ReferralsListQueryState, ReferralsFavoriteState>
      moduleDefinition={referralsListModuleDefinition}
      state={state}
      onStateChange={setState}
      queryFacets={queryFacets}
      analysisFacets={analysisFacets}
      columns={columnDefs}
      favoriteSnapshot={favoriteSnapshot}
      mapFavoriteToState={(snapshot) => snapshot}
      isLoading={loading}
      totalCount={filteredRows.length}
      canCreate={canCreate}
      onCreate={() => router.push(withTenantPath("/referrals/new", tenantSlug))}
      onRefresh={() => setState((previous) => ({ ...previous }))}
      analysisSlot={analysisSlot}
      hasActiveAnalysis={hasActiveAnalysis}
      onResetAnalysis={() =>
        setState((previous) => ({
          ...previous,
          groupBy: [],
          pageIndex: 0,
          calendarField: referralsListModuleDefinition.defaultQueryState.calendarField,
          calendarMode: referralsListModuleDefinition.defaultQueryState.calendarMode,
          rangeFrom: referralsListModuleDefinition.defaultQueryState.rangeFrom,
          rangeTo: referralsListModuleDefinition.defaultQueryState.rangeTo,
          graph: referralsListModuleDefinition.defaultQueryState.graph,
        }))
      }
    >
      {error ? <div className="px-4 py-3 text-sm text-destructive">{error}</div> : null}
      {state.view === "kanban" ? (
        <KanbanView
          items={filteredRows}
          getColumnKey={(referral) => resolveKanbanColumnValue(referral, state.groupBy[0] ?? "status")}
          getColumnLabel={(value) => value}
          renderCard={(referral) => (
            <button type="button" className="w-full text-left" onClick={() => openDetail(referral)}>
              <ReferralCalendarCard referral={referral} />
            </button>
          )}
        />
      ) : state.view === "calendar" ? (
        <CalendarView
          items={filteredRows}
          getDate={referralDateGetter(state.calendarField)}
          mode={state.calendarMode}
          onModeChange={(calendarMode) => setState((previous) => ({ ...previous, calendarMode }))}
          renderItem={(referral) => (
            <button type="button" className="w-full text-left" onClick={() => openDetail(referral)}>
              <ReferralCalendarCard referral={referral} />
            </button>
          )}
          dateFieldOptions={[
            { value: "createdAt", label: "Cadastro" },
            { value: "closedAt", label: "Encerramento" },
          ]}
          activeDateField={state.calendarField}
          onActiveDateFieldChange={(next) =>
            setState((previous) => ({ ...previous, calendarField: next as ReferralDateField }))
          }
          rangeFrom={state.rangeFrom}
          rangeTo={state.rangeTo}
          onRangeFromChange={(value) => setState((previous) => ({ ...previous, rangeFrom: value }))}
          onRangeToChange={(value) => setState((previous) => ({ ...previous, rangeTo: value }))}
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
          <ListView
            data={pagedRows}
            columns={columnDefs}
            groupByFields={state.groupBy}
            resolveGroupLabel={resolveGroupLabel}
            onRowClick={openDetail}
            getRowId={(row) => row.id}
            initialColumnPinning={{ left: ["referral"] }}
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
