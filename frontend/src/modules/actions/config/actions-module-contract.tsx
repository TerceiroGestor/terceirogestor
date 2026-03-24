"use client";

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
  actionsDetailSearchView,
  actionsSearchView,
} from "@/web-client/registry/searchViews/actions";
import {
  actionsDetailLayout,
  type ActionsDetailLayoutContext,
} from "@/modules/actions/config/actions-detail-layout-contract";

export type ActionsListQueryState = {
  view: "list";
  searchText: string;
  domain: Domain;
  groupBy: string[];
  pageIndex: number;
  pageSize: number;
  projectId: string;
  onlyMine: boolean;
  groupId: string;
  cycleId: string;
};

export type ActionsDetailQueryState = {
  view: "detail";
  searchText: string;
  domain: Domain;
  groupBy: string[];
  pageIndex: number;
  pageSize: number;
};

export const ACTIONS_ROUTES = {
  list: "/actions",
  detail: "/actions",
} as const;

const ACTIONS_PERMISSIONS = {
  canRead: "actions.read",
  canCreate: "actions.create",
  canEdit: "actions.update",
  canDelete: "actions.delete",
} as const;

const ACTIONS_LIST_ACTIONS: RecordModuleActionMap = {
  view: {
    key: "view",
    label: "Abrir acao",
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

const ACTIONS_DETAIL_ACTIONS: RecordModuleActionMap = {
  view: {
    key: "view",
    label: "Visualizar acao",
    permissionKey: "canRead",
    scope: "detail",
  },
  audit: {
    key: "audit",
    label: "Auditoria",
    permissionKey: "canRead",
    scope: "detail",
  },
};

export const actionsListModuleDefinition = defineRecordModule<ActionsListQueryState>({
  moduleId: "actions.list",
  basePath: ACTIONS_ROUTES.list,
  featureFlags: createStandardFeatureFlags({ detail: false }),
  actionKey: "actions.list.screen",
  favoriteKey: "actions.list.favorites",
  permissions: ACTIONS_PERMISSIONS,
  actions: ACTIONS_LIST_ACTIONS,
  queryAdapters: {
    listDataProvider: { model: "actions.list" },
  },
  domainAdapter: {
    entity: { singular: "Acao", plural: "Acoes" },
    list: {
      searchPlaceholder: "Pesquisar",
      createActionLabel: "Novo",
      totalLabel: "Total",
      emptyStateLabel: "Nenhuma acao encontrada.",
    },
    detail: {
      fallbackTitle: "Acao",
    },
    fields: {
      title: { label: "Acao" },
      tags: { label: "Tags" },
      createdAt: { label: "Cadastro", type: "date" },
      status: { label: "Status" },
      "actionType.name": { label: "Tipo" },
      "group.name": { label: "Grupo" },
      "cycle.segment.name": { label: "Segmento institucional" },
      "cycle.catalogCycle.name": { label: "Catalogo legado" },
      "cycle.name": { label: "Vinculo" },
      plannedStartAt: { label: "Inicio planejado", type: "date" },
      plannedEndAt: { label: "Fim planejado", type: "date" },
    },
  },
  searchConfig: actionsSearchView,
  views: [createStandardListView()],
  defaultQueryState: createStandardListQueryState<ActionsListQueryState>({
    projectId: "",
    onlyMine: false,
    groupId: "",
    cycleId: "",
  }),
  defaultView: "list",
});

export const actionsDetailModuleDefinition =
  defineRecordModule<ActionsDetailQueryState, ActionsDetailLayoutContext>({
    moduleId: "actions.detail",
    basePath: ACTIONS_ROUTES.detail,
    featureFlags: createStandardFeatureFlags({
      list: false,
      detail: true,
      comments: true,
      notes: true,
      tags: true,
      attachments: true,
      audit: true,
      history: true,
      context: true,
    }),
    actionKey: "actions.detail.screen",
    favoriteKey: "actions.detail.favorites",
    permissions: ACTIONS_PERMISSIONS,
    actions: ACTIONS_DETAIL_ACTIONS,
    queryAdapters: {
      listDataProvider: { model: "actions.list" },
      auditDataProvider: { model: "audit.logs" },
    },
    domainAdapter: {
      entity: { singular: "Acao", plural: "Acoes" },
      detail: {
        fallbackTitle: "Acao",
      },
      fields: {
        title: { label: "Acao" },
        tags: { label: "Tags" },
        createdAt: { label: "Cadastro", type: "date" },
        status: { label: "Status" },
        internalNotes: { label: "Notas internas" },
        plannedStartAt: { label: "Inicio planejado", type: "date" },
        plannedEndAt: { label: "Fim planejado", type: "date" },
      },
    },
    searchConfig: actionsDetailSearchView,
    views: [createStandardDetailView()],
    defaultQueryState: createStandardDetailQueryState<ActionsDetailQueryState>(),
    defaultView: "detail",
    detailLayout: actionsDetailLayout,
  });

export type ActionsModuleDefinition =
  | RecordModuleDefinition<ActionsListQueryState>
  | RecordModuleDefinition<ActionsDetailQueryState>;
