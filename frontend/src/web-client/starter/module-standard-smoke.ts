"use client";

import {
  actionsDetailModuleDefinition,
  actionsListModuleDefinition,
} from "@/modules/actions/config/actions-module-contract";
import {
  adminAuditDetailModuleDefinition,
  adminAuditListModuleDefinition,
  adminInstitutionModuleDefinition,
  adminOverviewModuleDefinition,
  adminPermissionsListModuleDefinition,
  adminRoleDetailModuleDefinition,
  adminRolesListModuleDefinition,
  adminUserDetailModuleDefinition,
  adminUsersListModuleDefinition,
} from "@/modules/core/admin/config/admin-module-contract";
import {
  pantryDonorDetailModuleDefinition,
  pantryDonorsModuleDefinition,
  pantryEntryDetailModuleDefinition,
  pantryExitDetailModuleDefinition,
  pantryHistoryModuleDefinition,
  pantryItemDetailModuleDefinition,
  pantryStockModuleDefinition,
} from "@/modules/pantry/config/pantry-module-contract";
import {
  peopleDetailModuleDefinition,
  peopleListModuleDefinition,
} from "@/modules/people/config/people-module-contract";
import {
  peopleGroupsDetailModuleDefinition,
  peopleGroupsListModuleDefinition,
} from "@/modules/people-groups/config/people-groups-module-contract";
import {
  programsDetailModuleDefinition,
  programsListModuleDefinition,
} from "@/modules/programs/config/programs-module-contract";
import {
  projectsDetailModuleDefinition,
  projectsListModuleDefinition,
} from "@/modules/projects/config/projects-module-contract";
import {
  tasksDetailModuleDefinition,
  tasksListModuleDefinition,
} from "@/modules/tasks/config/tasks-module-contract";
import type { RecordModuleDefinition } from "@/web-client/registry/types";
import { validateRecordModuleDefinition } from "@/web-client/registry/types";

// These definitions intentionally span heterogeneous query/context types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MODULE_STANDARD_SMOKE_DEFINITIONS: Array<RecordModuleDefinition<any, any>> = [
  adminOverviewModuleDefinition,
  adminInstitutionModuleDefinition,
  adminUsersListModuleDefinition,
  adminUserDetailModuleDefinition,
  adminRolesListModuleDefinition,
  adminRoleDetailModuleDefinition,
  adminPermissionsListModuleDefinition,
  adminAuditListModuleDefinition,
  adminAuditDetailModuleDefinition,
  pantryStockModuleDefinition,
  pantryHistoryModuleDefinition,
  pantryDonorsModuleDefinition,
  pantryItemDetailModuleDefinition,
  pantryDonorDetailModuleDefinition,
  pantryEntryDetailModuleDefinition,
  pantryExitDetailModuleDefinition,
  peopleListModuleDefinition,
  peopleDetailModuleDefinition,
  peopleGroupsListModuleDefinition,
  peopleGroupsDetailModuleDefinition,
  programsListModuleDefinition,
  programsDetailModuleDefinition,
  projectsListModuleDefinition,
  projectsDetailModuleDefinition,
  actionsListModuleDefinition,
  actionsDetailModuleDefinition,
  tasksListModuleDefinition,
  tasksDetailModuleDefinition,
];

MODULE_STANDARD_SMOKE_DEFINITIONS.forEach((definition) => {
  validateRecordModuleDefinition(definition);
});

export const MODULE_STANDARD_SMOKE = MODULE_STANDARD_SMOKE_DEFINITIONS.map(
  (definition) => definition.moduleId,
);
