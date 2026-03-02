import type { WindowAction } from "@/web-client/registry/types";
import {
  pantryDonorsAction,
  pantryDonorsCreateAction,
  pantryDonorsDetailAction,
  pantryHistoryAction,
  pantryItemsCreateAction,
  pantryItemsDetailAction,
  pantryStockAction,
} from "@/web-client/registry/actions/pantry";
import type { SearchViewDefinition } from "@/web-client/search/types";
import {
  pantryDonorsSearchView,
  pantryHistorySearchView,
  pantryStockSearchView,
} from "@/web-client/registry/searchViews/pantry";

const WINDOW_ACTIONS: WindowAction[] = [
  pantryStockAction,
  pantryItemsCreateAction,
  pantryItemsDetailAction,
  pantryDonorsAction,
  pantryDonorsCreateAction,
  pantryDonorsDetailAction,
  pantryHistoryAction,
];
const SEARCH_VIEWS: SearchViewDefinition[] = [
  pantryDonorsSearchView,
  pantryHistorySearchView,
  pantryStockSearchView,
];

export function getWindowAction(actionId: string): WindowAction | null {
  return WINDOW_ACTIONS.find((action) => action.id === actionId) ?? null;
}

export function getSearchView(searchViewId: string): SearchViewDefinition | null {
  return SEARCH_VIEWS.find((view) => view.id === searchViewId) ?? null;
}
