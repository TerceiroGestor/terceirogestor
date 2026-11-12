"use client";

import { BarChart3, Table2 } from "lucide-react";
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
  type GraphBuilderState,
  type RecordModuleActionMap,
  type RecordModuleDefinition,
} from "@/web-client/registry/types";
import {
  peopleGroupsDetailLayout,
  type PeopleGroupsDetailLayoutContext,
} from "@/modules/people-groups/config/people-groups-detail-layout-contract";
import {
  peopleGroupsDetailSearchView,
  peopleGroupsSearchView,
} from "@/web-client/registry/searchViews/people-groups";

export type PeopleGroupsListViewId = "table" | "graph";

export type PeopleGroupsListQueryState = {
  view: PeopleGroupsListViewId;
  searchText: string;
  domain: Domain;
  groupBy: string[];
  pageIndex: number;
  pageSize: number;
  graph: GraphBuilderState;
};

export type PeopleGroupsDetailQueryState = {
  view: "detail";
  searchText: string;
  domain: Domain;
  groupBy: string[];
  pageIndex: number;
  pageSize: number;
};

export const PEOPLE_GROUPS_ROUTES = {
  list: "/people-groups",
  detail: "/people-groups",
} as const;

const PEOPLE_GROUPS_PERMISSIONS = {
  canRead: "people.read",
  canCreate: "people.create",
  canEdit: "people.update",
  canDelete: "people.delete",
  canAudit: "people.read",
  canExport: "people.read",
} as const;

const PEOPLE_GROUPS_LIST_ACTIONS: RecordModuleActionMap = {
  view: {
    key: "view",
    label: "Abrir grupo de pessoas",
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

const PEOPLE_GROUPS_DETAIL_ACTIONS: RecordModuleActionMap = {
  view: {
    key: "view",
    label: "Visualizar grupo de pessoas",
    permissionKey: "canRead",
    scope: "detail",
  },
  create: {
    key: "create",
    label: "Novo grupo de pessoas",
    permissionKey: "canCreate",
    scope: "detail",
  },
  edit: {
    key: "edit",
    label: "Salvar alteracoes",
    permissionKey: "canEdit",
    scope: "detail",
  },
  delete: {
    key: "delete",
    label: "Excluir grupo de pessoas",
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

export const peopleGroupsListModuleDefinition =
  defineRecordModule<PeopleGroupsListQueryState>({
    moduleId: "people-groups.list",
    basePath: PEOPLE_GROUPS_ROUTES.list,
    featureFlags: createStandardFeatureFlags({
      detail: false,
      graph: true,
      export: true,
    }),
    actionKey: "people-groups.list.screen",
    favoriteKey: "people-groups.list.favorites",
    permissions: PEOPLE_GROUPS_PERMISSIONS,
    actions: PEOPLE_GROUPS_LIST_ACTIONS,
    queryAdapters: {
      listDataProvider: { model: "people-groups.list" },
      detailDataProvider: { model: "people-groups.detail" },
    },
    domainAdapter: {
      entity: { singular: "Grupo de Pessoas", plural: "Grupos de Pessoas" },
      list: {
        searchPlaceholder: "Pesquisar",
        createActionLabel: "Novo",
        totalLabel: "Total",
        emptyStateLabel: "Nenhum grupo de pessoas encontrado.",
      },
      detail: {
        fallbackTitle: "Grupo de Pessoas",
      },
      fields: {
        name: { label: "Grupo de Pessoas" },
        groupType: { label: "Tipo do grupo" },
        purpose: { label: "Finalidade" },
        category: { label: "Categoria" },
        createdAt: { label: "Cadastro" },
        ageMin: { label: "Idade mínima" },
        ageMax: { label: "Idade máxima" },
        isActive: { label: "Status" },
        description: { label: "Descrição" },
        internalNotes: { label: "Notas" },
      },
    },
    searchConfig: peopleGroupsSearchView,
    views: [
      createStandardListView({
        id: "table",
        title: "Tabela",
        viewType: "table",
        icon: <Table2 className="size-4" />,
        params: {
          searchable: true,
          sortable: true,
          paginated: true,
          sortFields: [
            "name",
            "groupType",
            "purpose",
            "category",
            "createdAt",
            "ageMin",
            "ageMax",
            "isActive",
          ],
        },
      }),
      {
        id: "graph",
        title: "Gráfico",
        viewType: "graph",
        icon: <BarChart3 className="size-4" />,
        params: {
          builder: {
            fields: [
              { field: "groupType", label: "Tipo do grupo", kind: "dimension" },
              { field: "category", label: "Categoria", kind: "dimension" },
              { field: "purpose", label: "Finalidade", kind: "dimension" },
              { field: "isActive", label: "Status", kind: "dimension" },
            ],
            defaultState: {
              groupBy: "groupType",
              metric: { field: null, op: "count" },
              timeField: null,
              timeBucket: null,
              chartType: "bar",
              filters: {},
            },
            maxGroups: 8,
            downloadFileName: "grupos-de-pessoas",
          },
        },
      },
    ],
    defaultQueryState: createStandardListQueryState<PeopleGroupsListQueryState>({
      view: "table",
      graph: {
        groupBy: "groupType",
        metric: { field: null, op: "count" },
        timeField: null,
        timeBucket: null,
        chartType: "bar",
        filters: {},
      },
    }),
    defaultView: "table",
  });

export const peopleGroupsDetailModuleDefinition =
  defineRecordModule<
    PeopleGroupsDetailQueryState,
    PeopleGroupsDetailLayoutContext
  >({
    moduleId: "people-groups.detail",
    basePath: PEOPLE_GROUPS_ROUTES.detail,
    featureFlags: createStandardFeatureFlags({
      list: false,
      detail: true,
      notes: true,
      history: true,
      context: true,
      audit: true,
    }),
    actionKey: "people-groups.detail.screen",
    favoriteKey: "people-groups.detail.favorites",
    permissions: PEOPLE_GROUPS_PERMISSIONS,
    actions: PEOPLE_GROUPS_DETAIL_ACTIONS,
    queryAdapters: {
      listDataProvider: { model: "people-groups.detail" },
      detailDataProvider: { model: "people-groups.detail" },
      auditDataProvider: { model: "audit.logs" },
    },
    domainAdapter: {
      entity: { singular: "Grupo de Pessoas", plural: "Grupos de Pessoas" },
      detail: {
        createTitle: "Novo grupo de pessoas",
        fallbackTitle: "Grupo de Pessoas",
      },
      fields: {
        name: { label: "Grupo de Pessoas" },
        groupType: { label: "Tipo do grupo" },
        purpose: { label: "Finalidade" },
        category: { label: "Categoria" },
        createdAt: { label: "Cadastro" },
        ageMin: { label: "Idade mínima" },
        ageMax: { label: "Idade máxima" },
        isActive: { label: "Status" },
        description: { label: "Descrição" },
        internalNotes: { label: "Notas" },
      },
    },
    searchConfig: peopleGroupsDetailSearchView,
    views: [createStandardDetailView({ icon: <Table2 className="size-4" /> })],
    defaultQueryState: createStandardDetailQueryState<PeopleGroupsDetailQueryState>(),
    defaultView: "detail",
    detailLayout: peopleGroupsDetailLayout,
  });

export type PeopleGroupsModuleDefinition =
  | RecordModuleDefinition<PeopleGroupsListQueryState>
  | RecordModuleDefinition<
    PeopleGroupsDetailQueryState,
    PeopleGroupsDetailLayoutContext
  >;
