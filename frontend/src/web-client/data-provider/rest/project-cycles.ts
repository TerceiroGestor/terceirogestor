"use client";

import type { SearchArgs, SearchResult } from "@/web-client/data-provider/types";
import { listAllProjectCycles } from "@/modules/projects/api";
import type { ApiProjectCycle } from "@/modules/projects/api";

export async function searchProjectCycles(
  token: string,
  args: SearchArgs,
): Promise<SearchResult<ApiProjectCycle>> {
  return listAllProjectCycles(token, {
    q: args.searchText?.trim() || undefined,
    page:
      typeof args.pagination?.pageIndex === "number"
        ? args.pagination.pageIndex + 1
        : undefined,
    limit: args.pagination?.pageSize,
    all: args.all,
  });
}
