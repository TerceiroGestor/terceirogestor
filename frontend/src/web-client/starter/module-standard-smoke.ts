"use client";

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
  tasksDetailModuleDefinition,
  tasksListModuleDefinition,
} from "@/modules/tasks/config/tasks-module-contract";
import type { RecordModuleDefinition } from "@/web-client/registry/types";
import { validateRecordModuleDefinition } from "@/web-client/registry/types";

const MODULE_STANDARD_SMOKE_DEFINITIONS: Array<RecordModuleDefinition<any, any>> = [
  pantryStockModuleDefinition,
  pantryHistoryModuleDefinition,
  pantryDonorsModuleDefinition,
  pantryItemDetailModuleDefinition,
  pantryDonorDetailModuleDefinition,
  pantryEntryDetailModuleDefinition,
  pantryExitDetailModuleDefinition,
  peopleListModuleDefinition,
  peopleDetailModuleDefinition,
  tasksListModuleDefinition,
  tasksDetailModuleDefinition,
];

MODULE_STANDARD_SMOKE_DEFINITIONS.forEach((definition) => {
  validateRecordModuleDefinition(definition);
});

export const MODULE_STANDARD_SMOKE = MODULE_STANDARD_SMOKE_DEFINITIONS.map(
  (definition) => definition.moduleId,
);
