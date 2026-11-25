"use client";

import type { SearchArgs, SearchResult } from "@/web-client/data-provider/types";
import {
  createReferral,
  deleteReferral,
  getReferral,
  listReferrals,
  updateReferral,
} from "@/modules/referrals/api";
import type { ApiReferral } from "@/modules/referrals/api";

export async function searchReferrals(
  token: string,
  args: SearchArgs,
): Promise<SearchResult<ApiReferral>> {
  return listReferrals(token, {
    q: args.searchText?.trim() || undefined,
    page:
      typeof args.pagination?.pageIndex === "number" ? args.pagination.pageIndex + 1 : undefined,
    limit: args.pagination?.pageSize,
    all: args.all,
  });
}

export {
  getReferral as readReferral,
  createReferral as createReferralRecord,
  updateReferral as updateReferralRecord,
  deleteReferral as deleteReferralRecord,
};
