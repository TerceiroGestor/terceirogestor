"use client";

import { Table2 } from "lucide-react";
import type { Domain } from "@/web-client/domain/types";
import {
  createStandardDetailQueryState,
  createStandardDetailView,
  createStandardFeatureFlags,
} from "@/web-client/starter";
import {
  defineRecordModule,
  type RecordModuleActionMap,
  type RecordModuleDefinition,
} from "@/web-client/registry/types";
import {
  meetingDetailLayout,
  type MeetingDetailLayoutContext,
} from "@/modules/actions/features/meetings/config/meeting-detail-layout-contract";
import { meetingsDetailSearchView } from "@/web-client/registry/searchViews/meetings";

/**
 * Detail do Encontro (revisão da hierarquia de equipe + convenção
 * "criar sempre abre o Detail", 2026-11-21). Só a metade "detail" do
 * motor genérico - Encontro não tem lista/nav própria, continua só
 * acessível a partir da aba "Encontros" da Atividade. Segue o mesmo
 * padrão da Atividade (nested: projectId/actionId vêm da query string,
 * não de `queryAdapters` - o motor genérico não sabe resolver uma
 * entidade aninhada por conta própria, a página gerencia isso).
 */
export type MeetingsDetailQueryState = {
  view: "detail";
  searchText: string;
  domain: Domain;
  groupBy: string[];
  pageIndex: number;
  pageSize: number;
};

export const MEETINGS_ROUTES = {
  detail: "/meetings",
} as const;

const MEETINGS_PERMISSIONS = {
  canRead: "actions.read",
  canCreate: "actions.create",
  canEdit: "actions.update",
  canDelete: "actions.delete",
} as const;

const MEETINGS_DETAIL_ACTIONS: RecordModuleActionMap = {
  view: {
    key: "view",
    label: "Visualizar encontro",
    permissionKey: "canRead",
    scope: "detail",
  },
  create: {
    key: "create",
    label: "Novo encontro",
    permissionKey: "canCreate",
    scope: "detail",
  },
};

export const meetingsDetailModuleDefinition = defineRecordModule<
  MeetingsDetailQueryState,
  MeetingDetailLayoutContext
>({
  moduleId: "meetings.detail",
  basePath: MEETINGS_ROUTES.detail,
  featureFlags: createStandardFeatureFlags({
    list: false,
    detail: true,
  }),
  actionKey: "meetings.detail.screen",
  favoriteKey: "meetings.detail.favorites",
  permissions: MEETINGS_PERMISSIONS,
  actions: MEETINGS_DETAIL_ACTIONS,
  queryAdapters: {
    listDataProvider: { model: "actions.list" },
  },
  domainAdapter: {
    entity: { singular: "Encontro", plural: "Encontros" },
    detail: {
      fallbackTitle: "Encontro",
    },
    fields: {
      scheduledDate: { label: "Data", type: "date" },
      status: { label: "Status" },
      notes: { label: "Notas" },
    },
  },
  searchConfig: meetingsDetailSearchView,
  views: [createStandardDetailView({ icon: <Table2 className="size-4" /> })],
  defaultQueryState: createStandardDetailQueryState<MeetingsDetailQueryState>(),
  defaultView: "detail",
  detailLayout: meetingDetailLayout,
});

export type MeetingsModuleDefinition = RecordModuleDefinition<
  MeetingsDetailQueryState,
  MeetingDetailLayoutContext
>;
