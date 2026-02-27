import type { WindowAction } from "@/web-client/registry/types";
import {
  pantryDonorsAction,
  pantryEntriesAction,
  pantryEntriesCreateAction,
  pantryExitSheetAction,
  pantryExitsAction,
  pantryHistoryAction,
  pantryItemsAction,
  pantryItemsCreateAction,
  pantryItemsDetailAction,
  pantryOverviewAction,
  pantryStockAction,
} from "@/web-client/registry/actions/pantry";
import type { SearchViewDefinition } from "@/web-client/search/types";
import {
  pantryDonorsSearchView,
  pantryEntriesSearchView,
  pantryExitsSearchView,
  pantryHistorySearchView,
  pantryItemsSearchView,
  pantryStockSearchView,
} from "@/web-client/registry/searchViews/pantry";

const WINDOW_ACTIONS: WindowAction[] = [
  pantryOverviewAction,
  pantryStockAction,
  pantryItemsAction,
  pantryItemsCreateAction,
  pantryItemsDetailAction,
  pantryEntriesAction,
  pantryEntriesCreateAction,
  pantryExitsAction,
  pantryExitSheetAction,
  pantryDonorsAction,
  pantryHistoryAction,
];
const SEARCH_VIEWS: SearchViewDefinition[] = [
  pantryHistorySearchView,
  pantryEntriesSearchView,
  pantryExitsSearchView,
  pantryItemsSearchView,
  pantryDonorsSearchView,
  pantryStockSearchView,
];

export function getWindowAction(actionId: string): WindowAction | null {
  return WINDOW_ACTIONS.find((action) => action.id === actionId) ?? null;
}

export function getSearchView(searchViewId: string): SearchViewDefinition | null {
  return SEARCH_VIEWS.find((view) => view.id === searchViewId) ?? null;
}
