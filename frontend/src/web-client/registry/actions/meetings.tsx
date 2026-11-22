"use client";

import { MeetingsDetailEngineClientPage } from "@/modules/actions/features/meetings/ui/meetings-detail-engine-client-page";
import {
  meetingsDetailModuleDefinition,
  MEETINGS_ROUTES,
} from "@/modules/actions/features/meetings/config/meetings-module-contract";
import { ACTIONS_ROUTES } from "@/modules/actions/config/actions-module-contract";
import { createModuleWindowAction } from "@/web-client/registry/window-actions";

export const MEETINGS_ACTION_IDS = {
  detail: "meetings.detail",
  create: "meetings.create",
} as const;

export const meetingsDetailAction = createModuleWindowAction({
  id: MEETINGS_ACTION_IDS.detail,
  moduleDefinition: meetingsDetailModuleDefinition,
  moduleActionKey: "view",
  titleVariant: "detail",
  breadcrumbs: [{ label: "Atividades", href: ACTIONS_ROUTES.list }],
  hideBreadcrumb: true,
  render: () => <MeetingsDetailEngineClientPage />,
});

export const meetingsCreateAction = createModuleWindowAction({
  id: MEETINGS_ACTION_IDS.create,
  moduleDefinition: meetingsDetailModuleDefinition,
  moduleActionKey: "create",
  titleVariant: "create",
  breadcrumbs: [{ label: "Atividades", href: ACTIONS_ROUTES.list }],
  hideBreadcrumb: true,
  render: () => <MeetingsDetailEngineClientPage />,
});

export const MEETINGS_DETAIL_ROUTE = MEETINGS_ROUTES.detail;
