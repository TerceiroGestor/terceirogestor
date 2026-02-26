import type { WindowAction } from "@/web-client/registry/types";
import {
  pantryDonorsAction,
  pantryEntriesAction,
  pantryExitSheetAction,
  pantryExitsAction,
  pantryHistoryAction,
  pantryItemsAction,
  pantryOverviewAction,
} from "@/web-client/registry/actions/pantry";
import type { SearchViewDefinition } from "@/web-client/search/types";
import { pantryHistorySearchView } from "@/web-client/registry/searchViews/pantry";

const WINDOW_ACTIONS: WindowAction[] = [
  pantryOverviewAction,
  pantryItemsAction,
  pantryEntriesAction,
  pantryExitsAction,
  pantryExitSheetAction,
  pantryDonorsAction,
  pantryHistoryAction,
];
const SEARCH_VIEWS: SearchViewDefinition[] = [pantryHistorySearchView];

export function getWindowAction(actionId: string): WindowAction | null {
  return WINDOW_ACTIONS.find((action) => action.id === actionId) ?? null;
}

export function getSearchView(searchViewId: string): SearchViewDefinition | null {
  return SEARCH_VIEWS.find((view) => view.id === searchViewId) ?? null;
}
