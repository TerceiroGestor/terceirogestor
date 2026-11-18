"use client";

import type { SearchArgs, SearchResult } from "@/web-client/data-provider/types";
import {
  createOccurrence,
  deleteOccurrence,
  getOccurrence,
  listOccurrences,
  updateOccurrence,
} from "@/modules/occurrences/api";
import type { ApiOccurrence } from "@/modules/occurrences/api";

export async function searchOccurrences(
  token: string,
  args: SearchArgs,
): Promise<SearchResult<ApiOccurrence>> {
  return listOccurrences(token, {
    q: args.searchText?.trim() || undefined,
    page:
      typeof args.pagination?.pageIndex === "number" ? args.pagination.pageIndex + 1 : undefined,
    limit: args.pagination?.pageSize,
    all: args.all,
  });
}

export {
  getOccurrence as readOccurrence,
  createOccurrence as createOccurrenceRecord,
  updateOccurrence as updateOccurrenceRecord,
  deleteOccurrence as deleteOccurrenceRecord,
};
