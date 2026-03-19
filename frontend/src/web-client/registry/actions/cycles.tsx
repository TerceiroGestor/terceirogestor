"use client";

import { CyclesDetailEngineClientPage, CyclesListModuleClientPage } from "@/modules/cycles";
import {
  cyclesDetailModuleDefinition,
  cyclesListModuleDefinition,
  CYCLES_ROUTES,
} from "@/modules/cycles/config/cycles-module-contract";
import { createModuleWindowAction } from "@/web-client/registry/window-actions";

export const CYCLES_ACTION_IDS = {
  list: "cycles.list",
  detail: "cycles.detail",
  create: "cycles.create",
} as const;

export const cyclesListAction = createModuleWindowAction({
  id: CYCLES_ACTION_IDS.list,
  moduleDefinition: cyclesListModuleDefinition,
  modulePermissionKey: "canRead",
  titleVariant: "list",
  breadcrumbs: [{ label: "Ciclos", href: CYCLES_ROUTES.list }],
  render: () => <CyclesListModuleClientPage />,
});

export const cyclesDetailAction = createModuleWindowAction({
  id: CYCLES_ACTION_IDS.detail,
  moduleDefinition: cyclesDetailModuleDefinition,
  moduleActionKey: "view",
  titleVariant: "detail",
  breadcrumbs: [{ label: "Ciclos", href: CYCLES_ROUTES.list }],
  hideBreadcrumb: true,
  render: () => <CyclesDetailEngineClientPage />,
});

export const cyclesCreateAction = createModuleWindowAction({
  id: CYCLES_ACTION_IDS.create,
  moduleDefinition: cyclesDetailModuleDefinition,
  moduleActionKey: "create",
  titleVariant: "create",
  breadcrumbs: [{ label: "Ciclos", href: CYCLES_ROUTES.list }],
  hideBreadcrumb: true,
  render: () => <CyclesDetailEngineClientPage />,
});
