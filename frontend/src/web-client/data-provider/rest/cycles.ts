"use client";

import type { SearchArgs, SearchResult } from "@/web-client/data-provider/types";
import {
  createCycle,
  deleteCycle,
  getCycle,
  listCycles,
  updateCycle,
} from "@/modules/cycles/api";
import type { ApiCycle } from "@/modules/cycles/api";

export async function searchCycles(
  token: string,
  args: SearchArgs,
): Promise<SearchResult<ApiCycle>> {
  return listCycles(token, {
    q: args.searchText?.trim() || undefined,
    page:
      typeof args.pagination?.pageIndex === "number"
        ? args.pagination.pageIndex + 1
        : undefined,
    limit: args.pagination?.pageSize,
    all: args.all,
  });
}

export {
  getCycle as readCycle,
  createCycle as createCycleRecord,
  updateCycle as updateCycleRecord,
  deleteCycle as deleteCycleRecord,
};
