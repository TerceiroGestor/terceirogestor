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
  casesDetailLayout,
  type CasesDetailLayoutContext,
} from "@/modules/cases/config/cases-detail-layout-contract";
import { casesDetailSearchView, casesSearchView } from "@/web-client/registry/searchViews/cases";

export type CasesListQueryState = {
  view: "table";
  searchText: string;
  domain: Domain;
  groupBy: string[];
  pageIndex: number;
  pageSize: number;
};

export type CasesDetailQueryState = {
  view: "detail";
  searchText: string;
  domain: Domain;
  groupBy: string[];
  pageIndex: number;
  pageSize: number;
};

export const CASES_ROUTES = {
  list: "/cases",
  detail: "/cases",
} as const;

const CASES_PERMISSIONS = {
  canRead: "cases.read",
  canCreate: "cases.create",
  canEdit: "cases.update",
  canDelete: "cases.delete",
  canAudit: "cases.read",
  canExport: "cases.read",
} as const;

const CASES_LIST_ACTIONS: RecordModuleActionMap = {
  view: {
    key: "view",
    label: "Abrir caso",
    permissionKey: "canRead",
    scope: "row",
    requiresReturnTo: true,
  },
  create: { key: "create", label: "Novo", permissionKey: "canCreate", scope: "list" },
  refresh: { key: "refresh", label: "Atualizar", permissionKey: "canRead", scope: "list" },
};

const CASES_DETAIL_ACTIONS: RecordModuleActionMap = {
  view: { key: "view", label: "Visualizar caso", permissionKey: "canRead", scope: "detail" },
  create: { key: "create", label: "Novo caso", permissionKey: "canCreate", scope: "detail" },
  edit: { key: "edit", label: "Salvar alterações", permissionKey: "canEdit", scope: "detail" },
  delete: { key: "delete", label: "Excluir caso", permissionKey: "canDelete", scope: "detail" },
  audit: { key: "audit", label: "Auditoria", permissionKey: "canAudit", scope: "detail" },
};

export const casesListModuleDefinition = defineRecordModule<CasesListQueryState>({
  moduleId: "cases.list",
  basePath: CASES_ROUTES.list,
  featureFlags: createStandardFeatureFlags({ detail: false, export: true }),
  actionKey: "cases.list.screen",
  favoriteKey: "cases.list.favorites",
  permissions: CASES_PERMISSIONS,
  actions: CASES_LIST_ACTIONS,
  queryAdapters: {
    listDataProvider: { model: "cases.list" },
    detailDataProvider: { model: "cases.detail" },
  },
  domainAdapter: {
    entity: { singular: "Caso", plural: "Casos" },
    list: {
      searchPlaceholder: "Pesquisar",
      createActionLabel: "Novo",
      totalLabel: "Total",
      emptyStateLabel: "Nenhum caso encontrado.",
    },
    detail: { fallbackTitle: "Caso" },
    fields: {
      title: { label: "Caso" },
      status: { label: "Status" },
      createdAt: { label: "Cadastro", type: "date" },
    },
  },
  searchConfig: casesSearchView,
  views: [
    createStandardListView({
      id: "table",
      title: "Tabela",
      viewType: "list",
      icon: <Table2 className="size-4" />,
      params: { searchable: true, sortable: true, paginated: true, sortFields: ["title", "status", "createdAt"] },
    }),
  ],
  defaultQueryState: createStandardListQueryState<CasesListQueryState>({ view: "table" }),
  defaultView: "table",
});

export const casesDetailModuleDefinition = defineRecordModule<
  CasesDetailQueryState,
  CasesDetailLayoutContext
>({
  moduleId: "cases.detail",
  basePath: CASES_ROUTES.detail,
  featureFlags: createStandardFeatureFlags({ list: false, detail: true, history: true, audit: true }),
  actionKey: "cases.detail.screen",
  favoriteKey: "cases.detail.favorites",
  permissions: CASES_PERMISSIONS,
  actions: CASES_DETAIL_ACTIONS,
  queryAdapters: {
    listDataProvider: { model: "cases.detail" },
    detailDataProvider: { model: "cases.detail" },
    auditDataProvider: { model: "audit.logs" },
  },
  domainAdapter: {
    entity: { singular: "Caso", plural: "Casos" },
    detail: { createTitle: "Novo caso", fallbackTitle: "Caso" },
    fields: {
      title: { label: "Caso" },
      status: { label: "Status" },
      createdAt: { label: "Cadastro" },
    },
  },
  searchConfig: casesDetailSearchView,
  views: [createStandardDetailView({ icon: <Table2 className="size-4" /> })],
  defaultQueryState: createStandardDetailQueryState<CasesDetailQueryState>(),
  defaultView: "detail",
  detailLayout: casesDetailLayout,
});

export type CasesModuleDefinition =
  | RecordModuleDefinition<CasesListQueryState>
  | RecordModuleDefinition<CasesDetailQueryState, CasesDetailLayoutContext>;
