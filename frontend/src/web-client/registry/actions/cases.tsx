"use client";

import { CasesDetailEngineClientPage, CasesListModuleClientPage } from "@/modules/cases";
import {
  casesDetailModuleDefinition,
  casesListModuleDefinition,
  CASES_ROUTES,
} from "@/modules/cases/config/cases-module-contract";
import { createModuleWindowAction } from "@/web-client/registry/window-actions";

export const CASES_ACTION_IDS = {
  list: "cases.list",
  detail: "cases.detail",
  create: "cases.create",
} as const;

export const casesListAction = createModuleWindowAction({
  id: CASES_ACTION_IDS.list,
  moduleDefinition: casesListModuleDefinition,
  modulePermissionKey: "canRead",
  titleVariant: "list",
  breadcrumbs: [{ label: "Casos", href: CASES_ROUTES.list }],
  render: () => <CasesListModuleClientPage />,
});

export const casesDetailAction = createModuleWindowAction({
  id: CASES_ACTION_IDS.detail,
  moduleDefinition: casesDetailModuleDefinition,
  moduleActionKey: "view",
  titleVariant: "detail",
  breadcrumbs: [{ label: "Casos", href: CASES_ROUTES.list }],
  hideBreadcrumb: true,
  render: () => <CasesDetailEngineClientPage />,
});

export const casesCreateAction = createModuleWindowAction({
  id: CASES_ACTION_IDS.create,
  moduleDefinition: casesDetailModuleDefinition,
  moduleActionKey: "create",
  titleVariant: "create",
  breadcrumbs: [{ label: "Casos", href: CASES_ROUTES.list }],
  hideBreadcrumb: true,
  render: () => <CasesDetailEngineClientPage />,
});
