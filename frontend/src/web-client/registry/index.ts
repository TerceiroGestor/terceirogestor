import type { WindowAction } from "@/web-client/registry/types";
import { pantryHistoryAction } from "@/web-client/registry/actions/pantry";

const WINDOW_ACTIONS: WindowAction[] = [pantryHistoryAction];

export function getWindowAction(actionId: string): WindowAction | null {
  return WINDOW_ACTIONS.find((action) => action.id === actionId) ?? null;
}

