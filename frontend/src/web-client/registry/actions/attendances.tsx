"use client";

import {
  AttendancesDetailEngineClientPage,
  AttendancesListModuleClientPage,
} from "@/modules/attendances";
import {
  attendancesDetailModuleDefinition,
  attendancesListModuleDefinition,
  ATTENDANCES_ROUTES,
} from "@/modules/attendances/config/attendances-module-contract";
import { createModuleWindowAction } from "@/web-client/registry/window-actions";

export const ATTENDANCES_ACTION_IDS = {
  list: "attendances.list",
  detail: "attendances.detail",
  create: "attendances.create",
} as const;

export const attendancesListAction = createModuleWindowAction({
  id: ATTENDANCES_ACTION_IDS.list,
  moduleDefinition: attendancesListModuleDefinition,
  modulePermissionKey: "canRead",
  titleVariant: "list",
  breadcrumbs: [{ label: "Atendimentos", href: ATTENDANCES_ROUTES.list }],
  render: () => <AttendancesListModuleClientPage />,
});

export const attendancesDetailAction = createModuleWindowAction({
  id: ATTENDANCES_ACTION_IDS.detail,
  moduleDefinition: attendancesDetailModuleDefinition,
  moduleActionKey: "view",
  titleVariant: "detail",
  breadcrumbs: [{ label: "Atendimentos", href: ATTENDANCES_ROUTES.list }],
  hideBreadcrumb: true,
  render: () => <AttendancesDetailEngineClientPage />,
});

export const attendancesCreateAction = createModuleWindowAction({
  id: ATTENDANCES_ACTION_IDS.create,
  moduleDefinition: attendancesDetailModuleDefinition,
  moduleActionKey: "create",
  titleVariant: "create",
  breadcrumbs: [{ label: "Atendimentos", href: ATTENDANCES_ROUTES.list }],
  hideBreadcrumb: true,
  render: () => <AttendancesDetailEngineClientPage />,
});
