"use client";

import {
  ProjectCyclesListModuleClientPage,
  ProjectGroupsListModuleClientPage,
} from "@/modules/projects";
import {
  PROJECT_CYCLES_ROUTES,
  projectCyclesListModuleDefinition,
} from "@/modules/projects/config/project-cycles-module-contract";
import {
  PROJECT_GROUPS_ROUTES,
  projectGroupsListModuleDefinition,
} from "@/modules/projects/config/project-groups-module-contract";
import { createModuleWindowAction } from "@/web-client/registry/window-actions";

export const PROJECT_STRUCTURE_ACTION_IDS = {
  groupsList: "project-groups.list",
  cyclesList: "project-cycles.list",
} as const;

export const projectGroupsListAction = createModuleWindowAction({
  id: PROJECT_STRUCTURE_ACTION_IDS.groupsList,
  moduleDefinition: projectGroupsListModuleDefinition,
  modulePermissionKey: "canRead",
  titleVariant: "list",
  breadcrumbs: [{ label: "Grupos", href: PROJECT_GROUPS_ROUTES.list }],
  render: () => <ProjectGroupsListModuleClientPage />,
});

export const projectCyclesListAction = createModuleWindowAction({
  id: PROJECT_STRUCTURE_ACTION_IDS.cyclesList,
  moduleDefinition: projectCyclesListModuleDefinition,
  modulePermissionKey: "canRead",
  titleVariant: "list",
  breadcrumbs: [{ label: "Ciclos", href: PROJECT_CYCLES_ROUTES.list }],
  render: () => <ProjectCyclesListModuleClientPage />,
});
