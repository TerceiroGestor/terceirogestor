"use client";

import { Table2 } from "lucide-react";
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
  type RecordModuleActionMap,
  type RecordModuleDefinition,
} from "@/web-client/registry/types";
import {
  attendancesDetailLayout,
  type AttendancesDetailLayoutContext,
} from "@/modules/attendances/config/attendances-detail-layout-contract";
import {
  attendancesDetailSearchView,
  attendancesSearchView,
} from "@/web-client/registry/searchViews/attendances";

export type AttendancesListQueryState = {
  view: "table";
  searchText: string;
  domain: Domain;
  groupBy: string[];
  pageIndex: number;
  pageSize: number;
};

export type AttendancesDetailQueryState = {
  view: "detail";
  searchText: string;
  domain: Domain;
  groupBy: string[];
  pageIndex: number;
  pageSize: number;
};

export const ATTENDANCES_ROUTES = {
  list: "/attendances",
  detail: "/attendances",
} as const;

const ATTENDANCES_PERMISSIONS = {
  canRead: "attendances.read",
  canCreate: "attendances.create",
  canEdit: "attendances.update",
  canDelete: "attendances.delete",
  canAudit: "attendances.read",
  canExport: "attendances.read",
} as const;

const ATTENDANCES_LIST_ACTIONS: RecordModuleActionMap = {
  view: {
    key: "view",
    label: "Abrir atendimento",
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

const ATTENDANCES_DETAIL_ACTIONS: RecordModuleActionMap = {
  view: {
    key: "view",
    label: "Visualizar atendimento",
    permissionKey: "canRead",
    scope: "detail",
  },
  create: {
    key: "create",
    label: "Novo atendimento",
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
    label: "Excluir atendimento",
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

export const attendancesListModuleDefinition = defineRecordModule<AttendancesListQueryState>({
  moduleId: "attendances.list",
  basePath: ATTENDANCES_ROUTES.list,
  featureFlags: createStandardFeatureFlags({ detail: false, export: true }),
  actionKey: "attendances.list.screen",
  favoriteKey: "attendances.list.favorites",
  permissions: ATTENDANCES_PERMISSIONS,
  actions: ATTENDANCES_LIST_ACTIONS,
  queryAdapters: {
    listDataProvider: { model: "attendances.list" },
    detailDataProvider: { model: "attendances.detail" },
  },
  domainAdapter: {
    entity: { singular: "Atendimento", plural: "Atendimentos" },
    list: {
      searchPlaceholder: "Pesquisar",
      createActionLabel: "Novo",
      totalLabel: "Total",
      emptyStateLabel: "Nenhum atendimento encontrado.",
    },
    detail: {
      fallbackTitle: "Atendimento",
    },
    fields: {
      type: { label: "Tipo" },
      status: { label: "Status" },
      scheduledDate: { label: "Data" },
      createdAt: { label: "Cadastro" },
    },
  },
  searchConfig: attendancesSearchView,
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
        sortFields: ["scheduledDate", "type", "status", "createdAt"],
      },
    }),
  ],
  defaultQueryState: createStandardListQueryState<AttendancesListQueryState>({
    view: "table",
  }),
  defaultView: "table",
});

export const attendancesDetailModuleDefinition = defineRecordModule<
  AttendancesDetailQueryState,
  AttendancesDetailLayoutContext
>({
  moduleId: "attendances.detail",
  basePath: ATTENDANCES_ROUTES.detail,
  featureFlags: createStandardFeatureFlags({
    list: false,
    detail: true,
    history: true,
    audit: true,
  }),
  actionKey: "attendances.detail.screen",
  favoriteKey: "attendances.detail.favorites",
  permissions: ATTENDANCES_PERMISSIONS,
  actions: ATTENDANCES_DETAIL_ACTIONS,
  queryAdapters: {
    listDataProvider: { model: "attendances.detail" },
    detailDataProvider: { model: "attendances.detail" },
    auditDataProvider: { model: "audit.logs" },
  },
  domainAdapter: {
    entity: { singular: "Atendimento", plural: "Atendimentos" },
    detail: {
      createTitle: "Novo atendimento",
      fallbackTitle: "Atendimento",
    },
    fields: {
      type: { label: "Tipo" },
      status: { label: "Status" },
      scheduledDate: { label: "Data" },
      createdAt: { label: "Cadastro" },
    },
  },
  searchConfig: attendancesDetailSearchView,
  views: [createStandardDetailView({ icon: <Table2 className="size-4" /> })],
  defaultQueryState: createStandardDetailQueryState<AttendancesDetailQueryState>(),
  defaultView: "detail",
  detailLayout: attendancesDetailLayout,
});

export type AttendancesModuleDefinition =
  | RecordModuleDefinition<AttendancesListQueryState>
  | RecordModuleDefinition<AttendancesDetailQueryState, AttendancesDetailLayoutContext>;
