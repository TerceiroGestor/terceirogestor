"use client";

import {
  OccurrencesDetailEngineClientPage,
  OccurrencesListModuleClientPage,
} from "@/modules/occurrences";
import {
  occurrencesDetailModuleDefinition,
  occurrencesListModuleDefinition,
  OCCURRENCES_ROUTES,
} from "@/modules/occurrences/config/occurrences-module-contract";
import { createModuleWindowAction } from "@/web-client/registry/window-actions";

export const OCCURRENCES_ACTION_IDS = {
  list: "occurrences.list",
  detail: "occurrences.detail",
  create: "occurrences.create",
} as const;

export const occurrencesListAction = createModuleWindowAction({
  id: OCCURRENCES_ACTION_IDS.list,
  moduleDefinition: occurrencesListModuleDefinition,
  modulePermissionKey: "canRead",
  titleVariant: "list",
  breadcrumbs: [{ label: "Ocorrências", href: OCCURRENCES_ROUTES.list }],
  render: () => <OccurrencesListModuleClientPage />,
});

export const occurrencesDetailAction = createModuleWindowAction({
  id: OCCURRENCES_ACTION_IDS.detail,
  moduleDefinition: occurrencesDetailModuleDefinition,
  moduleActionKey: "view",
  titleVariant: "detail",
  breadcrumbs: [{ label: "Ocorrências", href: OCCURRENCES_ROUTES.list }],
  hideBreadcrumb: true,
  render: () => <OccurrencesDetailEngineClientPage />,
});

export const occurrencesCreateAction = createModuleWindowAction({
  id: OCCURRENCES_ACTION_IDS.create,
  moduleDefinition: occurrencesDetailModuleDefinition,
  moduleActionKey: "create",
  titleVariant: "create",
  breadcrumbs: [{ label: "Ocorrências", href: OCCURRENCES_ROUTES.list }],
  hideBreadcrumb: true,
  render: () => <OccurrencesDetailEngineClientPage />,
});
