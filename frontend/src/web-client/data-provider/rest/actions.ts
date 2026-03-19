"use client";

import type { SearchArgs, SearchResult } from "@/web-client/data-provider/types";
import { listProjectActions } from "@/modules/actions/api";
import type { ApiProjectAction } from "@/modules/actions/api";

export async function searchActions(
  token: string,
  args: SearchArgs,
): Promise<SearchResult<ApiProjectAction>> {
  const projectId =
    typeof args.context?.projectId === "string" ? args.context.projectId : "";

  if (!projectId) {
    return {
      data: [],
      pagination: {
        page: 1,
        limit: args.pagination?.pageSize ?? 20,
        total: 0,
        pages: 0,
      },
    };
  }

  return listProjectActions(token, projectId, {
    q: args.searchText?.trim() || undefined,
    mine: typeof args.context?.onlyMine === "boolean" ? args.context.onlyMine : undefined,
    groupId:
      typeof args.context?.groupId === "string" && args.context.groupId.trim()
        ? args.context.groupId
        : undefined,
    cycleId:
      typeof args.context?.cycleId === "string" && args.context.cycleId.trim()
        ? args.context.cycleId
        : undefined,
    page:
      typeof args.pagination?.pageIndex === "number"
        ? args.pagination.pageIndex + 1
        : undefined,
    limit: args.pagination?.pageSize,
  });
}
