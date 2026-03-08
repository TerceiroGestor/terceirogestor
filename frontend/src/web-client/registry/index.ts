import type { WindowAction } from "@/web-client/registry/types";
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
import { tasksSearchView } from "@/web-client/registry/searchViews/tasks";
export {
  createModuleWindowAction,
  resolveModuleWindowActionTitle,
  resolveWindowActionPermissionRequirement,
} from "@/web-client/registry/window-actions";

const WINDOW_ACTIONS: WindowAction[] = [
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
  tasksListAction,
  tasksDetailAction,
  tasksCreateAction,
];
const SEARCH_VIEWS: SearchViewDefinition[] = [
  pantryDonorsSearchView,
  pantryEntriesSearchView,
  pantryExitsSearchView,
  pantryHistorySearchView,
  pantryStockSearchView,
  peopleSearchView,
  tasksSearchView,
];

export function getWindowAction(actionId: string): WindowAction | null {
  return WINDOW_ACTIONS.find((action) => action.id === actionId) ?? null;
}

export function getSearchView(searchViewId: string): SearchViewDefinition | null {
  return SEARCH_VIEWS.find((view) => view.id === searchViewId) ?? null;
}
