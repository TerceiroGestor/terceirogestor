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
  peopleCreateAction,
  peopleDetailAction,
  peopleListAction,
} from "@/web-client/registry/actions/people";
import type { SearchViewDefinition } from "@/web-client/search/types";
import { peopleSearchView } from "@/web-client/registry/searchViews/people";
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
  peopleListAction,
  peopleDetailAction,
  peopleCreateAction,
];
const SEARCH_VIEWS: SearchViewDefinition[] = [
  adminSingletonSearchView,
  adminUsersSearchView,
  adminRolesSearchView,
  adminPermissionsSearchView,
  adminAuditSearchView,
  peopleSearchView,
];

export function getWindowAction(actionId: string): WindowAction | null {
  return WINDOW_ACTIONS.find((action) => action.id === actionId) ?? null;
}

export function getSearchView(searchViewId: string): SearchViewDefinition | null {
  return SEARCH_VIEWS.find((view) => view.id === searchViewId) ?? null;
}
