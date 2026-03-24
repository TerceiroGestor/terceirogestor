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
  cyclesDetailLayout,
  type CyclesDetailLayoutContext,
} from "@/modules/cycles/config/cycles-detail-layout-contract";
import {
  cyclesDetailSearchView,
  cyclesSearchView,
} from "@/web-client/registry/searchViews/cycles";

export type CyclesListViewId = "table" | "graph";

export type CyclesListQueryState = {
  view: CyclesListViewId;
  searchText: string;
  domain: Domain;
  groupBy: string[];
  pageIndex: number;
  pageSize: number;
  graph: GraphBuilderState;
};

export type CyclesDetailQueryState = {
  view: "detail";
  searchText: string;
  domain: Domain;
  groupBy: string[];
  pageIndex: number;
  pageSize: number;
};

export const CYCLES_ROUTES = {
  list: "/cycle",
  detail: "/cycle",
} as const;

const CYCLES_PERMISSIONS = {
  canRead: "project-structure.read",
  canCreate: "project-structure.create",
  canEdit: "project-structure.update",
  canDelete: "project-structure.delete",
  canAudit: "project-structure.read",
  canExport: "project-structure.read",
} as const;

const CYCLES_LIST_ACTIONS: RecordModuleActionMap = {
  view: {
    key: "view",
    label: "Abrir ciclo",
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

const CYCLES_DETAIL_ACTIONS: RecordModuleActionMap = {
  view: {
    key: "view",
    label: "Visualizar ciclo",
    permissionKey: "canRead",
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
    label: "Excluir ciclo",
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

export const cyclesListModuleDefinition = defineRecordModule<CyclesListQueryState>({
  moduleId: "cycles.list",
  basePath: CYCLES_ROUTES.list,
  featureFlags: createStandardFeatureFlags({
    detail: false,
    graph: true,
    export: true,
  }),
  actionKey: "cycles.list.screen",
  favoriteKey: "cycles.list.favorites",
  permissions: CYCLES_PERMISSIONS,
  actions: CYCLES_LIST_ACTIONS,
  queryAdapters: {
    listDataProvider: { model: "cycles.list" },
    detailDataProvider: { model: "cycles.detail" },
  },
  domainAdapter: {
    entity: { singular: "Ciclo", plural: "Ciclos" },
    list: {
      searchPlaceholder: "Pesquisar",
      createActionLabel: "Novo",
      totalLabel: "Total",
      emptyStateLabel: "Nenhum ciclo encontrado.",
    },
    detail: {
      fallbackTitle: "Ciclo",
    },
    fields: {
      name: { label: "Ciclo" },
      audienceType: { label: "Publico" },
      ageMin: { label: "Idade minima" },
      ageMax: { label: "Idade maxima" },
      isActive: { label: "Status" },
      tags: { label: "Tags" },
      description: { label: "Descricao" },
      internalNotes: { label: "Notas internas" },
      createdAt: { label: "Criado em", type: "date" },
      updatedAt: { label: "Atualizado em", type: "date" },
    },
  },
  searchConfig: cyclesSearchView,
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
        sortFields: ["name", "audienceType", "ageMin", "ageMax", "isActive"],
      },
    }),
    {
      id: "graph",
      title: "Grafico",
      viewType: "graph",
      icon: <BarChart3 className="size-4" />,
      params: {
        builder: {
          fields: [
            { field: "audienceType", label: "Publico", kind: "dimension" },
            { field: "isActive", label: "Status", kind: "dimension" },
          ],
          defaultState: {
            groupBy: "audienceType",
            metric: { field: null, op: "count" },
            timeField: null,
            timeBucket: null,
            chartType: "bar",
            filters: {},
          },
          maxGroups: 8,
          downloadFileName: "ciclos",
        },
      },
    },
  ],
  defaultQueryState: createStandardListQueryState<CyclesListQueryState>({
    view: "table",
    graph: {
      groupBy: "audienceType",
      metric: { field: null, op: "count" },
      timeField: null,
      timeBucket: null,
      chartType: "bar",
      filters: {},
    },
  }),
  defaultView: "table",
});

export const cyclesDetailModuleDefinition =
  defineRecordModule<CyclesDetailQueryState, CyclesDetailLayoutContext>({
    moduleId: "cycles.detail",
    basePath: CYCLES_ROUTES.detail,
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
    actionKey: "cycles.detail.screen",
    favoriteKey: "cycles.detail.favorites",
    permissions: CYCLES_PERMISSIONS,
    actions: CYCLES_DETAIL_ACTIONS,
    queryAdapters: {
      listDataProvider: { model: "cycles.detail" },
      detailDataProvider: { model: "cycles.detail" },
      auditDataProvider: { model: "audit.logs" },
    },
    domainAdapter: {
      entity: { singular: "Ciclo", plural: "Ciclos" },
      detail: {
        createTitle: "Novo ciclo",
        fallbackTitle: "Ciclo",
      },
      fields: {
        name: { label: "Ciclo" },
        audienceType: { label: "Publico" },
        ageMin: { label: "Idade minima" },
        ageMax: { label: "Idade maxima" },
        isActive: { label: "Status" },
        tags: { label: "Tags" },
        description: { label: "Descricao" },
        internalNotes: { label: "Notas internas" },
        createdAt: { label: "Criado em", type: "date" },
        updatedAt: { label: "Atualizado em", type: "date" },
      },
    },
    searchConfig: cyclesDetailSearchView,
    views: [createStandardDetailView({ icon: <Table2 className="size-4" /> })],
    defaultQueryState: createStandardDetailQueryState<CyclesDetailQueryState>(),
    defaultView: "detail",
    detailLayout: cyclesDetailLayout,
  });

export type CyclesModuleDefinition =
  | RecordModuleDefinition<CyclesListQueryState>
  | RecordModuleDefinition<CyclesDetailQueryState, CyclesDetailLayoutContext>;
