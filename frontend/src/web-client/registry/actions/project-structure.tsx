"use client";

import {
  ProjectActionsManageRouteClientPage,
  ProjectEnrollmentsManageRouteClientPage,
} from "@/modules/projects";
import { projectsListModuleDefinition } from "@/modules/projects/config/projects-module-contract";
import { createModuleWindowAction } from "@/web-client/registry/window-actions";

export const PROJECT_STRUCTURE_ACTION_IDS = {
  enrollmentsManage: "projects.enrollments.manage",
  actionsManage: "projects.actions.manage",
} as const;

export const projectEnrollmentsManageAction = createModuleWindowAction({
  id: PROJECT_STRUCTURE_ACTION_IDS.enrollmentsManage,
  moduleDefinition: projectsListModuleDefinition,
  permissions: { allOf: ["projects.read", "enrollments.read"] },
  title: "Matriculas do projeto",
  breadcrumbs: [{ label: "Projetos", href: "/projects" }],
  hideBreadcrumb: true,
  render: () => <ProjectEnrollmentsManageRouteClientPage />,
});

export const projectActionsManageAction = createModuleWindowAction({
  id: PROJECT_STRUCTURE_ACTION_IDS.actionsManage,
  moduleDefinition: projectsListModuleDefinition,
  permissions: { allOf: ["projects.read", "actions.read"] },
  title: "Acoes do projeto",
  breadcrumbs: [{ label: "Projetos", href: "/projects" }],
  hideBreadcrumb: true,
  render: () => <ProjectActionsManageRouteClientPage />,
});
