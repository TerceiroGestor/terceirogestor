import type { WindowAction } from "@/web-client/registry/types";
import {
  adminAuditDetailAction,
  adminAuditListAction,
  adminInstitutionAction,
  adminOverviewAction,
  adminPermissionsListAction,
  adminRolesCreateAction,
  adminRolesDetailAction,
  adminRolesListAction,
  adminUsersCreateAction,
  adminUsersDetailAction,
  adminUsersListAction,
} from "@/web-client/registry/actions/admin";
import {
  pantryDonorsAction,
  pantryDonorsCreateAction,
  pantryDonorsDetailAction,
  pantryEntriesCreateAction,
  pantryEntriesDetailAction,
  pantryExitsCreateAction,
  pantryExitsDetailAction,
  pantryHistoryAction,
  pantryItemsCreateAction,
  pantryItemsDetailAction,
  pantryStockAction,
} from "@/web-client/registry/actions/pantry";
import {
  peopleCreateAction,
  peopleDetailAction,
  peopleListAction,
} from "@/web-client/registry/actions/people";
import {
  peopleSegmentsCreateAction,
  peopleSegmentsDetailAction,
  peopleSegmentsListAction,
} from "@/web-client/registry/actions/people-segments";
import {
  projectsCreateAction,
  projectsDetailAction,
  projectsListAction,
} from "@/web-client/registry/actions/projects";
import {
  projectCyclesListAction,
  projectGroupsListAction,
} from "@/web-client/registry/actions/project-structure";
import {
  programsCreateAction,
  programsDetailAction,
  programsListAction,
} from "@/web-client/registry/actions/programs";
import {
  tasksCreateAction,
  tasksDetailAction,
  tasksListAction,
} from "@/web-client/registry/actions/tasks";
import type { SearchViewDefinition } from "@/web-client/search/types";
import {
  pantryDonorsSearchView,
  pantryEntriesSearchView,
  pantryExitsSearchView,
  pantryHistorySearchView,
  pantryStockSearchView,
} from "@/web-client/registry/searchViews/pantry";
import { peopleSearchView } from "@/web-client/registry/searchViews/people";
import {
  peopleSegmentsDetailSearchView,
  peopleSegmentsSearchView,
} from "@/web-client/registry/searchViews/people-segments";
import {
  projectsDetailSearchView,
  projectsSearchView,
} from "@/web-client/registry/searchViews/projects";
import {
  projectCyclesSearchView,
  projectGroupsSearchView,
} from "@/web-client/registry/searchViews/project-structure";
import {
  programsDetailSearchView,
  programsSearchView,
} from "@/web-client/registry/searchViews/programs";
import { tasksSearchView } from "@/web-client/registry/searchViews/tasks";
import {
  adminAuditSearchView,
  adminPermissionsSearchView,
  adminRolesSearchView,
  adminSingletonSearchView,
  adminUsersSearchView,
} from "@/web-client/registry/searchViews/admin";
export {
  createModuleWindowAction,
  resolveModuleWindowActionTitle,
  resolveWindowActionPermissionRequirement,
} from "@/web-client/registry/window-actions";

const WINDOW_ACTIONS: WindowAction[] = [
  adminOverviewAction,
  adminInstitutionAction,
  adminUsersListAction,
  adminUsersDetailAction,
  adminUsersCreateAction,
  adminRolesListAction,
  adminRolesDetailAction,
  adminRolesCreateAction,
  adminPermissionsListAction,
  adminAuditListAction,
  adminAuditDetailAction,
  pantryStockAction,
  pantryItemsCreateAction,
  pantryItemsDetailAction,
  pantryDonorsAction,
  pantryDonorsCreateAction,
  pantryDonorsDetailAction,
  pantryEntriesCreateAction,
  pantryEntriesDetailAction,
  pantryExitsCreateAction,
  pantryExitsDetailAction,
  pantryHistoryAction,
  peopleListAction,
  peopleDetailAction,
  peopleCreateAction,
  peopleSegmentsListAction,
  peopleSegmentsDetailAction,
  peopleSegmentsCreateAction,
  projectsListAction,
  projectsDetailAction,
  projectsCreateAction,
  projectGroupsListAction,
  projectCyclesListAction,
  programsListAction,
  programsDetailAction,
  programsCreateAction,
  tasksListAction,
  tasksDetailAction,
  tasksCreateAction,
];
const SEARCH_VIEWS: SearchViewDefinition[] = [
  adminSingletonSearchView,
  adminUsersSearchView,
  adminRolesSearchView,
  adminPermissionsSearchView,
  adminAuditSearchView,
  pantryDonorsSearchView,
  pantryEntriesSearchView,
  pantryExitsSearchView,
  pantryHistorySearchView,
  pantryStockSearchView,
  peopleSearchView,
  peopleSegmentsSearchView,
  peopleSegmentsDetailSearchView,
  projectsSearchView,
  projectsDetailSearchView,
  projectGroupsSearchView,
  projectCyclesSearchView,
  programsSearchView,
  programsDetailSearchView,
  tasksSearchView,
];

export function getWindowAction(actionId: string): WindowAction | null {
  return WINDOW_ACTIONS.find((action) => action.id === actionId) ?? null;
}

export function getSearchView(searchViewId: string): SearchViewDefinition | null {
  return SEARCH_VIEWS.find((view) => view.id === searchViewId) ?? null;
}
