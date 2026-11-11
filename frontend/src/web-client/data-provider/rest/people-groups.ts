"use client";

import type { SearchArgs, SearchResult } from "@/web-client/data-provider/types";
import {
  createPeopleGroup,
  deletePeopleGroup,
  getPeopleGroup,
  listPeopleGroups,
  updatePeopleGroup,
} from "@/modules/people-groups/api";
import type { ApiPeopleGroup } from "@/modules/people-groups/api";

export async function searchPeopleGroups(
  token: string,
  args: SearchArgs,
): Promise<SearchResult<ApiPeopleGroup>> {
  return listPeopleGroups(token, {
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
  getPeopleGroup as readPeopleGroup,
  createPeopleGroup as createPeopleGroupRecord,
  updatePeopleGroup as updatePeopleGroupRecord,
  deletePeopleGroup as deletePeopleGroupRecord,
};
