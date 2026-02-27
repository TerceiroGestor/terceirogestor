"use client";

import { listPantryEntries, type ApiPantryEntry } from "@/modules/pantry/api";
import type { Domain } from "@/web-client/domain/types";
import { collectAndConditions } from "@/web-client/data-provider/rest/domain-utils";
import type { SearchArgs, SearchResult } from "@/web-client/data-provider/types";

function resolveEntriesQuery(domain: Domain) {
  const conditions = collectAndConditions(domain);
  if (!conditions) {
    throw new Error("Este endpoint ainda suporta apenas filtros combinados com AND.");
  }

  const params: {
    itemId?: string;
    donorId?: string;
    from?: string;
    to?: string;
  } = {};

  conditions.forEach((condition) => {
    const value = condition.value;
    switch (condition.field) {
      case "itemId":
        if (condition.operator === "=" && typeof value === "string") {
          params.itemId = value;
        }
        break;
      case "donorId":
        if (condition.operator === "=" && typeof value === "string") {
          params.donorId = value;
        }
        break;
      case "entryDate":
        if (condition.operator === "between" && Array.isArray(value)) {
          const [from, to] = value;
          if (typeof from === "string" && from) params.from = from;
          if (typeof to === "string" && to) params.to = to;
        } else if (condition.operator === ">=" && typeof value === "string") {
          params.from = value;
        } else if (condition.operator === "<=" && typeof value === "string") {
          params.to = value;
        } else if (condition.operator === "=" && typeof value === "string") {
          params.from = value;
          params.to = value;
        }
        break;
      default:
        break;
    }
  });

  return params;
}

export async function searchPantryEntries(
  token: string,
  args: SearchArgs,
): Promise<SearchResult<ApiPantryEntry>> {
  const queryParams = resolveEntriesQuery(args.domain ?? null);

  const pageIndex = args.pagination?.pageIndex ?? 0;
  const pageSize = args.pagination?.pageSize ?? 100;
  const shouldFetchAll = Boolean(args.all);

  return listPantryEntries(token, {
    itemId: queryParams.itemId,
    donorId: queryParams.donorId,
    from: queryParams.from,
    to: queryParams.to,
    search: args.searchText?.trim() ? args.searchText.trim() : undefined,
    page: shouldFetchAll ? undefined : pageIndex + 1,
    limit: shouldFetchAll ? undefined : pageSize,
    all: shouldFetchAll ? true : undefined,
  });
}
