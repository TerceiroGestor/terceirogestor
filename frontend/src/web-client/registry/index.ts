import type { WindowAction } from "@/web-client/registry/types";
import {
  actionsCreateAction,
  actionsDetailAction,
  actionsListAction,
} from "@/web-client/registry/actions/actions";
import {
  occurrencesCreateAction,
  occurrencesDetailAction,
  occurrencesListAction,
} from "@/web-client/registry/actions/occurrences";
import {
  attendancesCreateAction,
  attendancesDetailAction,
  attendancesListAction,
} from "@/web-client/registry/actions/attendances";
import {
  referralsCreateAction,
  referralsDetailAction,
  referralsListAction,
} from "@/web-client/registry/actions/referrals";
import {
  casesCreateAction,
  casesDetailAction,
  casesListAction,
} from "@/web-client/registry/actions/cases";
import {
  meetingsCreateAction,
  meetingsDetailAction,
} from "@/web-client/registry/actions/meetings";
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
  depositDonorsAction,
  depositDonorsCreateAction,
  depositDonorsDetailAction,
  depositEntriesCreateAction,
  depositEntriesDetailAction,
  depositExitsCreateAction,
  depositExitsDetailAction,
  depositHistoryAction,
  depositItemsCreateAction,
  depositItemsDetailAction,
  depositStockAction,
} from "@/web-client/registry/actions/deposit";
import {
  peopleCreateAction,
  peopleDetailAction,
  peopleListAction,
} from "@/web-client/registry/actions/people";
import {
  peopleGroupsCreateAction,
  peopleGroupsDetailAction,
  peopleGroupsListAction,
} from "@/web-client/registry/actions/people-groups";
import {
  projectsCreateAction,
  projectsDetailAction,
  projectsListAction,
} from "@/web-client/registry/actions/projects";
import {
  projectEnrollmentsManageAction,
  projectActionsManageAction,
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
  actionsDetailSearchView,
  actionsSearchView,
} from "@/web-client/registry/searchViews/actions";
import {
  occurrencesDetailSearchView,
  occurrencesSearchView,
} from "@/web-client/registry/searchViews/occurrences";
import {
  attendancesDetailSearchView,
  attendancesSearchView,
} from "@/web-client/registry/searchViews/attendances";
import {
  referralsDetailSearchView,
  referralsSearchView,
} from "@/web-client/registry/searchViews/referrals";
import {
  casesDetailSearchView,
  casesSearchView,
} from "@/web-client/registry/searchViews/cases";
import {
  pantryDonorsSearchView,
  pantryEntriesSearchView,
  pantryExitsSearchView,
  pantryHistorySearchView,
  pantryStockSearchView,
} from "@/web-client/registry/searchViews/pantry";
import {
  depositDonorsSearchView,
  depositEntriesSearchView,
  depositExitsSearchView,
  depositHistorySearchView,
  depositStockSearchView,
} from "@/web-client/registry/searchViews/deposit";
import { peopleSearchView } from "@/web-client/registry/searchViews/people";
import {
  peopleGroupsDetailSearchView,
  peopleGroupsSearchView,
} from "@/web-client/registry/searchViews/people-groups";
import {
  projectsDetailSearchView,
  projectsSearchView,
} from "@/web-client/registry/searchViews/projects";
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
  actionsListAction,
  actionsDetailAction,
  actionsCreateAction,
  occurrencesListAction,
  occurrencesDetailAction,
  occurrencesCreateAction,
  attendancesListAction,
  attendancesDetailAction,
  attendancesCreateAction,
  referralsListAction,
  referralsDetailAction,
  referralsCreateAction,
  casesListAction,
  casesDetailAction,
  casesCreateAction,
  meetingsDetailAction,
  meetingsCreateAction,
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
  depositStockAction,
  depositItemsCreateAction,
  depositItemsDetailAction,
  depositDonorsAction,
  depositDonorsCreateAction,
  depositDonorsDetailAction,
  depositEntriesCreateAction,
  depositEntriesDetailAction,
  depositExitsCreateAction,
  depositExitsDetailAction,
  depositHistoryAction,
  peopleListAction,
  peopleDetailAction,
  peopleCreateAction,
  peopleGroupsListAction,
  peopleGroupsDetailAction,
  peopleGroupsCreateAction,
  projectsListAction,
  projectsDetailAction,
  projectsCreateAction,
  projectEnrollmentsManageAction,
  projectActionsManageAction,
  programsListAction,
  programsDetailAction,
  programsCreateAction,
  tasksListAction,
  tasksDetailAction,
  tasksCreateAction,
];
const SEARCH_VIEWS: SearchViewDefinition[] = [
  actionsSearchView,
  actionsDetailSearchView,
  occurrencesSearchView,
  occurrencesDetailSearchView,
  attendancesSearchView,
  attendancesDetailSearchView,
  referralsSearchView,
  referralsDetailSearchView,
  casesSearchView,
  casesDetailSearchView,
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
  depositDonorsSearchView,
  depositEntriesSearchView,
  depositExitsSearchView,
  depositHistorySearchView,
  depositStockSearchView,
  peopleSearchView,
  peopleGroupsSearchView,
  peopleGroupsDetailSearchView,
  projectsSearchView,
  projectsDetailSearchView,
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
