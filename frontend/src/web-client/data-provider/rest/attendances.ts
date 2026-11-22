"use client";

import type { SearchArgs, SearchResult } from "@/web-client/data-provider/types";
import {
  createAttendance,
  deleteAttendance,
  getAttendance,
  listAttendances,
  updateAttendance,
} from "@/modules/attendances/api";
import type { ApiAttendance } from "@/modules/attendances/api";

export async function searchAttendances(
  token: string,
  args: SearchArgs,
): Promise<SearchResult<ApiAttendance>> {
  return listAttendances(token, {
    q: args.searchText?.trim() || undefined,
    page:
      typeof args.pagination?.pageIndex === "number" ? args.pagination.pageIndex + 1 : undefined,
    limit: args.pagination?.pageSize,
    all: args.all,
  });
}

export {
  getAttendance as readAttendance,
  createAttendance as createAttendanceRecord,
  updateAttendance as updateAttendanceRecord,
  deleteAttendance as deleteAttendanceRecord,
};
