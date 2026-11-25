"use client";

import {
  ReferralsDetailEngineClientPage,
  ReferralsListModuleClientPage,
} from "@/modules/referrals";
import {
  referralsDetailModuleDefinition,
  referralsListModuleDefinition,
  REFERRALS_ROUTES,
} from "@/modules/referrals/config/referrals-module-contract";
import { createModuleWindowAction } from "@/web-client/registry/window-actions";

export const REFERRALS_ACTION_IDS = {
  list: "referrals.list",
  detail: "referrals.detail",
  create: "referrals.create",
} as const;

export const referralsListAction = createModuleWindowAction({
  id: REFERRALS_ACTION_IDS.list,
  moduleDefinition: referralsListModuleDefinition,
  modulePermissionKey: "canRead",
  titleVariant: "list",
  breadcrumbs: [{ label: "Encaminhamentos", href: REFERRALS_ROUTES.list }],
  render: () => <ReferralsListModuleClientPage />,
});

export const referralsDetailAction = createModuleWindowAction({
  id: REFERRALS_ACTION_IDS.detail,
  moduleDefinition: referralsDetailModuleDefinition,
  moduleActionKey: "view",
  titleVariant: "detail",
  breadcrumbs: [{ label: "Encaminhamentos", href: REFERRALS_ROUTES.list }],
  hideBreadcrumb: true,
  render: () => <ReferralsDetailEngineClientPage />,
});

export const referralsCreateAction = createModuleWindowAction({
  id: REFERRALS_ACTION_IDS.create,
  moduleDefinition: referralsDetailModuleDefinition,
  moduleActionKey: "create",
  titleVariant: "create",
  breadcrumbs: [{ label: "Encaminhamentos", href: REFERRALS_ROUTES.list }],
  hideBreadcrumb: true,
  render: () => <ReferralsDetailEngineClientPage />,
});
