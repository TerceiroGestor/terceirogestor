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
  occurrencesDetailLayout,
  type OccurrencesDetailLayoutContext,
} from "@/modules/occurrences/config/occurrences-detail-layout-contract";
import {
  occurrencesDetailSearchView,
  occurrencesSearchView,
} from "@/web-client/registry/searchViews/occurrences";

export type OccurrencesListQueryState = {
  view: "table";
  searchText: string;
  domain: Domain;
  groupBy: string[];
  pageIndex: number;
  pageSize: number;
};

export type OccurrencesDetailQueryState = {
  view: "detail";
  searchText: string;
  domain: Domain;
  groupBy: string[];
  pageIndex: number;
  pageSize: number;
};

export const OCCURRENCES_ROUTES = {
  list: "/occurrences",
  detail: "/occurrences",
} as const;

const OCCURRENCES_PERMISSIONS = {
  canRead: "occurrences.read",
  canCreate: "occurrences.create",
  canEdit: "occurrences.update",
  canDelete: "occurrences.delete",
  canAudit: "occurrences.read",
  canExport: "occurrences.read",
} as const;

const OCCURRENCES_LIST_ACTIONS: RecordModuleActionMap = {
  view: {
    key: "view",
    label: "Abrir ocorrência",
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

const OCCURRENCES_DETAIL_ACTIONS: RecordModuleActionMap = {
  view: {
    key: "view",
    label: "Visualizar ocorrência",
    permissionKey: "canRead",
    scope: "detail",
  },
  create: {
    key: "create",
    label: "Nova ocorrência",
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
    label: "Excluir ocorrência",
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

export const occurrencesListModuleDefinition = defineRecordModule<OccurrencesListQueryState>({
  moduleId: "occurrences.list",
  basePath: OCCURRENCES_ROUTES.list,
  featureFlags: createStandardFeatureFlags({ detail: false, export: true }),
  actionKey: "occurrences.list.screen",
  favoriteKey: "occurrences.list.favorites",
  permissions: OCCURRENCES_PERMISSIONS,
  actions: OCCURRENCES_LIST_ACTIONS,
  queryAdapters: {
    listDataProvider: { model: "occurrences.list" },
    detailDataProvider: { model: "occurrences.detail" },
  },
  domainAdapter: {
    entity: { singular: "Ocorrência", plural: "Ocorrências" },
    list: {
      searchPlaceholder: "Pesquisar",
      createActionLabel: "Novo",
      totalLabel: "Total",
      emptyStateLabel: "Nenhuma ocorrência encontrada.",
    },
    detail: {
      fallbackTitle: "Ocorrência",
    },
    fields: {
      title: { label: "Ocorrência" },
      status: { label: "Status" },
      createdAt: { label: "Cadastro" },
      description: { label: "Descrição" },
      outcomeNotes: { label: "Desfecho" },
    },
  },
  searchConfig: occurrencesSearchView,
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
        sortFields: ["title", "status", "createdAt"],
      },
    }),
  ],
  defaultQueryState: createStandardListQueryState<OccurrencesListQueryState>({
    view: "table",
  }),
  defaultView: "table",
});

export const occurrencesDetailModuleDefinition = defineRecordModule<
  OccurrencesDetailQueryState,
  OccurrencesDetailLayoutContext
>({
  moduleId: "occurrences.detail",
  basePath: OCCURRENCES_ROUTES.detail,
  featureFlags: createStandardFeatureFlags({
    list: false,
    detail: true,
    history: true,
    audit: true,
  }),
  actionKey: "occurrences.detail.screen",
  favoriteKey: "occurrences.detail.favorites",
  permissions: OCCURRENCES_PERMISSIONS,
  actions: OCCURRENCES_DETAIL_ACTIONS,
  queryAdapters: {
    listDataProvider: { model: "occurrences.detail" },
    detailDataProvider: { model: "occurrences.detail" },
    auditDataProvider: { model: "audit.logs" },
  },
  domainAdapter: {
    entity: { singular: "Ocorrência", plural: "Ocorrências" },
    detail: {
      createTitle: "Nova ocorrência",
      fallbackTitle: "Ocorrência",
    },
    fields: {
      title: { label: "Ocorrência" },
      status: { label: "Status" },
      createdAt: { label: "Cadastro" },
      description: { label: "Descrição" },
      outcomeNotes: { label: "Desfecho" },
    },
  },
  searchConfig: occurrencesDetailSearchView,
  views: [createStandardDetailView({ icon: <Table2 className="size-4" /> })],
  defaultQueryState: createStandardDetailQueryState<OccurrencesDetailQueryState>(),
  defaultView: "detail",
  detailLayout: occurrencesDetailLayout,
});

export type OccurrencesModuleDefinition =
  | RecordModuleDefinition<OccurrencesListQueryState>
  | RecordModuleDefinition<OccurrencesDetailQueryState, OccurrencesDetailLayoutContext>;
