"use client";

import type { SearchArgs, SearchResult } from "@/web-client/data-provider/types";
import { createCase, deleteCase, getCase, listCases, updateCase } from "@/modules/cases/api";
import type { ApiCase } from "@/modules/cases/api";

export async function searchCases(token: string, args: SearchArgs): Promise<SearchResult<ApiCase>> {
  return listCases(token, {
    q: args.searchText?.trim() || undefined,
    page: typeof args.pagination?.pageIndex === "number" ? args.pagination.pageIndex + 1 : undefined,
    limit: args.pagination?.pageSize,
    all: args.all,
  });
}

export {
  getCase as readCase,
  createCase as createCaseRecord,
  updateCase as updateCaseRecord,
  deleteCase as deleteCaseRecord,
};
