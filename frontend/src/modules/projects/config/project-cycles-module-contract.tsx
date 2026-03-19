"use client";

import { BarChart3, CalendarDays, Clock3, Table2 } from "lucide-react";
import type { Domain } from "@/web-client/domain/types";
import {
  createStandardFeatureFlags,
  createStandardListQueryState,
  createStandardListView,
} from "@/web-client/starter";
import {
  defineRecordModule,
  type CalendarMode,
  type GraphBuilderState,
  type RecordModuleActionMap,
  type SortDirection,
} from "@/web-client/registry/types";
import { projectCyclesSearchView } from "@/web-client/registry/searchViews/project-structure";

export type ProjectCyclesListViewId = "table" | "timeline" | "calendar" | "graph";

export type ProjectCyclesListQueryState = {
  view: ProjectCyclesListViewId;
  searchText: string;
  domain: Domain;
  groupBy: string[];
  pageIndex: number;
  pageSize: number;
  timelineField: "startsAt" | "endsAt";
  timelineSortDirection: SortDirection;
  calendarField: "startsAt" | "endsAt";
  calendarMode: CalendarMode;
  graph: GraphBuilderState;
};

export const PROJECT_CYCLES_ROUTES = {
  list: "/project-cycle",
} as const;

const PROJECT_CYCLES_PERMISSIONS = {
  canRead: "project-structure.read",
} as const;

const PROJECT_CYCLES_ACTIONS: RecordModuleActionMap = {
  view: {
    key: "view",
    label: "Abrir vinculo",
    permissionKey: "canRead",
    scope: "row",
  },
};

export const projectCyclesListModuleDefinition =
  defineRecordModule<ProjectCyclesListQueryState>({
    moduleId: "project-cycles.list",
    basePath: PROJECT_CYCLES_ROUTES.list,
    featureFlags: createStandardFeatureFlags({
      detail: false,
      timeline: true,
      calendar: true,
      graph: true,
      export: true,
    }),
    actionKey: "project-cycles.list.screen",
    favoriteKey: "project-cycles.list.favorites",
    permissions: PROJECT_CYCLES_PERMISSIONS,
    actions: PROJECT_CYCLES_ACTIONS,
    queryAdapters: {
      listDataProvider: { model: "project-cycles.list" },
    },
    domainAdapter: {
      entity: { singular: "Segmento do projeto", plural: "Segmentos do projeto" },
      list: {
        searchPlaceholder: "Pesquisar",
        totalLabel: "Total",
        emptyStateLabel: "Nenhum vinculo de segmento encontrado.",
      },
      fields: {
        name: { label: "Vinculo" },
        segment: { label: "Segmento institucional" },
        catalogCycle: { label: "Catalogo legado" },
        project: { label: "Projeto" },
        startsAt: { label: "Inicio", type: "date" },
        endsAt: { label: "Fim", type: "date" },
        internalNotes: { label: "Notas internas" },
        updatedAt: { label: "Atualizado em", type: "date" },
      },
    },
    searchConfig: projectCyclesSearchView,
    views: [
      createStandardListView({
        id: "table",
        title: "Tabela",
        viewType: "table",
        icon: <Table2 className="size-4" />,
      }),
      {
        id: "timeline",
        title: "Timeline",
        viewType: "timeline",
        icon: <Clock3 className="size-4" />,
        params: {
          startDateField: "startsAt",
          endDateField: "endsAt",
          titleField: "name",
          dateFields: ["startsAt", "endsAt"],
          defaultDateField: "startsAt",
          sortDirections: ["desc", "asc"],
          defaultSortDirection: "desc",
        },
      },
      {
        id: "calendar",
        title: "Calendario",
        viewType: "calendar",
        icon: <CalendarDays className="size-4" />,
        params: {
          startDateField: "startsAt",
          endDateField: "endsAt",
          titleField: "name",
          dateFields: ["startsAt", "endsAt"],
          defaultDateField: "startsAt",
          modes: ["month", "week", "day", "year"],
          defaultMode: "month",
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
              { field: "startsAt", label: "Inicio", kind: "date" },
              { field: "endsAt", label: "Fim", kind: "date" },
              { field: "_count.participations", label: "Participantes", kind: "metric", allowedOps: ["sum", "avg", "count", "max", "min"] },
            ],
            defaultState: {
              groupBy: "project.name",
              metric: { field: "_count.participations", op: "sum" },
              timeField: null,
              timeBucket: null,
              chartType: "bar",
              filters: {},
            },
            maxGroups: 12,
            downloadFileName: "segmentos-projeto",
          },
        },
      },
    ],
    defaultQueryState: createStandardListQueryState<ProjectCyclesListQueryState>({
      view: "table",
      timelineField: "startsAt",
      timelineSortDirection: "desc",
      calendarField: "startsAt",
      calendarMode: "month",
      graph: {
        groupBy: "project.name",
        metric: { field: "_count.participations", op: "sum" },
        timeField: null,
        timeBucket: null,
        chartType: "bar",
        filters: {},
      },
    }),
    defaultView: "table",
  });
