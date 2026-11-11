"use client";

import {
  PeopleGroupsDetailEngineClientPage,
  PeopleGroupsListModuleClientPage,
} from "@/modules/people-groups";
import {
  peopleGroupsDetailModuleDefinition,
  peopleGroupsListModuleDefinition,
  PEOPLE_GROUPS_ROUTES,
} from "@/modules/people-groups/config/people-groups-module-contract";
import { createModuleWindowAction } from "@/web-client/registry/window-actions";

export const PEOPLE_GROUPS_ACTION_IDS = {
  list: "people-groups.list",
  detail: "people-groups.detail",
  create: "people-groups.create",
} as const;

export const peopleGroupsListAction = createModuleWindowAction({
  id: PEOPLE_GROUPS_ACTION_IDS.list,
  moduleDefinition: peopleGroupsListModuleDefinition,
  modulePermissionKey: "canRead",
  titleVariant: "list",
  breadcrumbs: [{ label: "Grupos de Pessoas", href: PEOPLE_GROUPS_ROUTES.list }],
  render: () => <PeopleGroupsListModuleClientPage />,
});

export const peopleGroupsDetailAction = createModuleWindowAction({
  id: PEOPLE_GROUPS_ACTION_IDS.detail,
  moduleDefinition: peopleGroupsDetailModuleDefinition,
  moduleActionKey: "view",
  titleVariant: "detail",
  breadcrumbs: [{ label: "Grupos de Pessoas", href: PEOPLE_GROUPS_ROUTES.list }],
  hideBreadcrumb: true,
  render: () => <PeopleGroupsDetailEngineClientPage />,
});

export const peopleGroupsCreateAction = createModuleWindowAction({
  id: PEOPLE_GROUPS_ACTION_IDS.create,
  moduleDefinition: peopleGroupsDetailModuleDefinition,
  moduleActionKey: "create",
  titleVariant: "create",
  breadcrumbs: [{ label: "Grupos de Pessoas", href: PEOPLE_GROUPS_ROUTES.list }],
  hideBreadcrumb: true,
  render: () => <PeopleGroupsDetailEngineClientPage />,
});
