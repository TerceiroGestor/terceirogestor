"use client";

import { BarChart3, LayoutGrid, Table2 } from "lucide-react";
import type { Domain } from "@/web-client/domain/types";
import {
  createStandardFeatureFlags,
  createStandardListQueryState,
  createStandardListView,
} from "@/web-client/starter";
import {
  defineRecordModule,
  type GraphBuilderState,
  type RecordModuleActionMap,
} from "@/web-client/registry/types";
import { projectGroupsSearchView } from "@/web-client/registry/searchViews/project-structure";

export type ProjectGroupsListViewId = "table" | "kanban" | "graph";

export type ProjectGroupsListQueryState = {
  view: ProjectGroupsListViewId;
  searchText: string;
  domain: Domain;
  groupBy: string[];
  pageIndex: number;
  pageSize: number;
  graph: GraphBuilderState;
};

export const PROJECT_GROUPS_ROUTES = {
  list: "/group",
} as const;

const PROJECT_GROUPS_PERMISSIONS = {
  canRead: "project-structure.read",
} as const;

const PROJECT_GROUPS_ACTIONS: RecordModuleActionMap = {
  view: {
    key: "view",
    label: "Abrir grupo",
    permissionKey: "canRead",
    scope: "row",
  },
};

export const projectGroupsListModuleDefinition =
  defineRecordModule<ProjectGroupsListQueryState>({
    moduleId: "project-groups.list",
    basePath: PROJECT_GROUPS_ROUTES.list,
    featureFlags: createStandardFeatureFlags({
      detail: false,
      kanban: true,
      graph: true,
      export: true,
    }),
    actionKey: "project-groups.list.screen",
    favoriteKey: "project-groups.list.favorites",
    permissions: PROJECT_GROUPS_PERMISSIONS,
    actions: PROJECT_GROUPS_ACTIONS,
    queryAdapters: {
      listDataProvider: { model: "project-groups.list" },
    },
    domainAdapter: {
      entity: { singular: "Grupo", plural: "Grupos" },
      list: {
        searchPlaceholder: "Pesquisar grupos",
        totalLabel: "Total",
        emptyStateLabel: "Nenhum grupo encontrado.",
      },
      fields: {
        name: { label: "Grupo" },
        description: { label: "Descricao" },
        project: { label: "Projeto" },
        internalNotes: { label: "Notas internas" },
        updatedAt: { label: "Atualizado em", type: "date" },
      },
    },
    searchConfig: projectGroupsSearchView,
    views: [
      createStandardListView({
        id: "table",
        title: "Tabela",
        viewType: "table",
        icon: <Table2 className="size-4" />,
      }),
      {
        id: "kanban",
        title: "Kanban",
        viewType: "kanban",
        icon: <LayoutGrid className="size-4" />,
        params: {
          columnField: "project.name",
          titleField: "name",
          groupByFields: ["project.name"],
          defaultGroupByField: "project.name",
        },
      },
      {
        id: "graph",
        title: "Grafico",
        viewType: "graph",
        icon: <BarChart3 className="size-4" />,
        params: {
          builder: {
            fields: [
              { field: "project.name", label: "Projeto", kind: "dimension" },
              { field: "_count.memberships", label: "Participantes", kind: "metric", allowedOps: ["sum", "avg", "count", "max", "min"] },
              { field: "_count.actions", label: "Acoes", kind: "metric", allowedOps: ["sum", "avg", "count", "max", "min"] },
            ],
            defaultState: {
              groupBy: "project.name",
              metric: { field: "_count.memberships", op: "sum" },
              timeField: null,
              timeBucket: null,
              chartType: "bar",
              filters: {},
            },
            maxGroups: 12,
            downloadFileName: "grupos",
          },
        },
      },
    ],
    defaultQueryState: createStandardListQueryState<ProjectGroupsListQueryState>({
      view: "table",
      graph: {
        groupBy: "project.name",
        metric: { field: "_count.memberships", op: "sum" },
        timeField: null,
        timeBucket: null,
        chartType: "bar",
        filters: {},
      },
    }),
    defaultView: "table",
  });
