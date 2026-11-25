"use client";

import { BarChart3, CalendarDays, LayoutGrid, Table2 } from "lucide-react";
import type { Domain } from "@/web-client/domain/types";
import {
  createStandardDetailQueryState,
  createStandardDetailView,
  createStandardFeatureFlags,
  createStandardListQueryState,
  createStandardListView,
} from "@/web-client/starter";
import {
  defineRecordModule,
  type CalendarMode,
  type GraphBuilderState,
  type RecordModuleActionMap,
  type RecordModuleDefinition,
} from "@/web-client/registry/types";
import {
  referralsDetailLayout,
  type ReferralsDetailLayoutContext,
} from "@/modules/referrals/config/referrals-detail-layout-contract";
import {
  REFERRAL_STATUS_LABELS,
  REFERRAL_TYPE_LABELS,
} from "@/modules/referrals/shared/domain/referrals.constants";
import {
  referralsDetailSearchView,
  referralsSearchView,
} from "@/web-client/registry/searchViews/referrals";

export type ReferralsListViewId = "table" | "kanban" | "calendar" | "graph";

export type ReferralDateField = "createdAt" | "closedAt";

export type ReferralsListQueryState = {
  view: ReferralsListViewId;
  searchText: string;
  domain: Domain;
  groupBy: string[];
  pageIndex: number;
  pageSize: number;
  calendarField: ReferralDateField;
  calendarMode: CalendarMode;
  rangeFrom: string;
  rangeTo: string;
  graph: GraphBuilderState;
};

export type ReferralsDetailQueryState = {
  view: "detail";
  searchText: string;
  domain: Domain;
  groupBy: string[];
  pageIndex: number;
  pageSize: number;
};

export const REFERRALS_ROUTES = {
  list: "/referrals",
  detail: "/referrals",
} as const;

const REFERRALS_PERMISSIONS = {
  canRead: "referrals.read",
  canCreate: "referrals.create",
  canEdit: "referrals.update",
  canDelete: "referrals.delete",
  canAudit: "referrals.read",
  canExport: "referrals.read",
} as const;

const REFERRALS_LIST_ACTIONS: RecordModuleActionMap = {
  view: {
    key: "view",
    label: "Abrir encaminhamento",
    permissionKey: "canRead",
    scope: "row",
    requiresReturnTo: true,
  },
  create: {
    key: "create",
    label: "Novo",
    permissionKey: "canCreate",
    scope: "list",
  },
  refresh: {
    key: "refresh",
    label: "Atualizar",
    permissionKey: "canRead",
    scope: "list",
  },
};

const REFERRALS_DETAIL_ACTIONS: RecordModuleActionMap = {
  view: {
    key: "view",
    label: "Visualizar encaminhamento",
    permissionKey: "canRead",
    scope: "detail",
  },
  create: {
    key: "create",
    label: "Novo encaminhamento",
    permissionKey: "canCreate",
    scope: "detail",
  },
  edit: {
    key: "edit",
    label: "Salvar alterações",
    permissionKey: "canEdit",
    scope: "detail",
  },
  delete: {
    key: "delete",
    label: "Excluir encaminhamento",
    permissionKey: "canDelete",
    scope: "detail",
  },
  audit: {
    key: "audit",
    label: "Auditoria",
    permissionKey: "canAudit",
    scope: "detail",
  },
};

export const referralsListModuleDefinition = defineRecordModule<ReferralsListQueryState>({
  moduleId: "referrals.list",
  basePath: REFERRALS_ROUTES.list,
  featureFlags: createStandardFeatureFlags({
    detail: false,
    kanban: true,
    calendar: true,
    graph: true,
    export: true,
  }),
  actionKey: "referrals.list.screen",
  favoriteKey: "referrals.list.favorites",
  permissions: REFERRALS_PERMISSIONS,
  actions: REFERRALS_LIST_ACTIONS,
  queryAdapters: {
    listDataProvider: { model: "referrals.list" },
    detailDataProvider: { model: "referrals.detail" },
  },
  domainAdapter: {
    entity: { singular: "Encaminhamento", plural: "Encaminhamentos" },
    list: {
      searchPlaceholder: "Pesquisar",
      createActionLabel: "Novo",
      totalLabel: "Total",
      emptyStateLabel: "Nenhum encaminhamento encontrado.",
    },
    detail: {
      fallbackTitle: "Encaminhamento",
    },
    fields: {
      "destination.name": { label: "Rede de destino" },
      type: { label: "Tipo" },
      status: { label: "Status" },
      createdAt: { label: "Cadastro", type: "date" },
      closedAt: { label: "Encerramento", type: "date" },
    },
  },
  searchConfig: referralsSearchView,
  views: [
    createStandardListView({
      id: "table",
      title: "Tabela",
      viewType: "list",
      icon: <Table2 className="size-4" />,
      params: {
        searchable: true,
        sortable: true,
        paginated: true,
        sortFields: ["type", "status", "createdAt"],
      },
    }),
    {
      id: "kanban",
      title: "Kanban",
      viewType: "kanban",
      icon: <LayoutGrid className="size-4" />,
      params: {
        columnField: "status",
        titleField: "destination.name",
        groupByFields: ["status", "type"],
        defaultGroupByField: "status",
      },
    },
    {
      id: "calendar",
      title: "Calendário",
      viewType: "calendar",
      icon: <CalendarDays className="size-4" />,
      params: {
        startDateField: "createdAt",
        titleField: "destination.name",
        dateFields: ["createdAt", "closedAt"],
        defaultDateField: "createdAt",
        modes: ["day", "week", "month", "year"],
        defaultMode: "month",
      },
    },
    {
      id: "graph",
      title: "Gráfico",
      viewType: "graph",
      icon: <BarChart3 className="size-4" />,
      params: {
        builder: {
          fields: [
            {
              field: "status",
              label: "Status",
              kind: "dimension",
              formatValue: (value) => REFERRAL_STATUS_LABELS[value as string] ?? String(value ?? "Sem valor"),
            },
            {
              field: "type",
              label: "Tipo",
              kind: "dimension",
              formatValue: (value) => REFERRAL_TYPE_LABELS[value as string] ?? String(value ?? "Sem valor"),
            },
            { field: "createdAt", label: "Cadastro", kind: "date" },
            { field: "closedAt", label: "Encerramento", kind: "date" },
          ],
          defaultState: {
            groupBy: "status",
            metric: { field: null, op: "count" },
            timeField: null,
            timeBucket: null,
            chartType: "bar",
            filters: {},
          },
          maxGroups: 8,
          downloadFileName: "encaminhamentos",
        },
      },
    },
  ],
  defaultQueryState: createStandardListQueryState<ReferralsListQueryState>({
    view: "table",
    calendarField: "createdAt",
    calendarMode: "month",
    rangeFrom: "",
    rangeTo: "",
    graph: {
      groupBy: "status",
      metric: { field: null, op: "count" },
      timeField: null,
      timeBucket: null,
      chartType: "bar",
      filters: {},
    },
  }),
  defaultView: "table",
});

export const referralsDetailModuleDefinition = defineRecordModule<
  ReferralsDetailQueryState,
  ReferralsDetailLayoutContext
>({
  moduleId: "referrals.detail",
  basePath: REFERRALS_ROUTES.detail,
  featureFlags: createStandardFeatureFlags({
    list: false,
    detail: true,
    history: true,
    audit: true,
  }),
  actionKey: "referrals.detail.screen",
  favoriteKey: "referrals.detail.favorites",
  permissions: REFERRALS_PERMISSIONS,
  actions: REFERRALS_DETAIL_ACTIONS,
  queryAdapters: {
    listDataProvider: { model: "referrals.detail" },
    detailDataProvider: { model: "referrals.detail" },
    auditDataProvider: { model: "audit.logs" },
  },
  domainAdapter: {
    entity: { singular: "Encaminhamento", plural: "Encaminhamentos" },
    detail: {
      createTitle: "Novo encaminhamento",
      fallbackTitle: "Encaminhamento",
    },
    fields: {
      "destination.name": { label: "Rede de destino" },
      type: { label: "Tipo" },
      status: { label: "Status" },
      createdAt: { label: "Cadastro" },
    },
  },
  searchConfig: referralsDetailSearchView,
  views: [createStandardDetailView({ icon: <Table2 className="size-4" /> })],
  defaultQueryState: createStandardDetailQueryState<ReferralsDetailQueryState>(),
  defaultView: "detail",
  detailLayout: referralsDetailLayout,
});

export type ReferralsModuleDefinition =
  | RecordModuleDefinition<ReferralsListQueryState>
  | RecordModuleDefinition<ReferralsDetailQueryState, ReferralsDetailLayoutContext>;
