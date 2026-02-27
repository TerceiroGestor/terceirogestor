"use client";

import { listPantryExits, type ApiPantryExit } from "@/modules/pantry/api";
import type { Domain } from "@/web-client/domain/types";
import { collectAndConditions } from "@/web-client/data-provider/rest/domain-utils";
import type { SearchArgs, SearchResult } from "@/web-client/data-provider/types";

type PantryExitType = "ATTENDED" | "DONATION" | "EVENT" | "PARTY" | "CORRECTION";

function resolveExitsQuery(domain: Domain) {
  const conditions = collectAndConditions(domain);
  if (!conditions) {
    throw new Error("Este endpoint ainda suporta apenas filtros combinados com AND.");
  }

  const params: {
    itemId?: string;
    type?: PantryExitType;
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
      case "type":
        if (
          condition.operator === "=" &&
          (value === "ATTENDED" ||
            value === "DONATION" ||
            value === "EVENT" ||
            value === "PARTY" ||
            value === "CORRECTION")
        ) {
          params.type = value;
        }
        break;
      case "exitDate":
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
      case "eventName":
        break;
      default:
        break;
    }
  });

  return params;
}

export async function searchPantryExits(
  token: string,
  args: SearchArgs,
): Promise<SearchResult<ApiPantryExit>> {
  const queryParams = resolveExitsQuery(args.domain ?? null);

  const pageIndex = args.pagination?.pageIndex ?? 0;
  const pageSize = args.pagination?.pageSize ?? 100;

  return listPantryExits(token, {
    itemId: queryParams.itemId,
    type: queryParams.type,
    from: queryParams.from,
    to: queryParams.to,
    search: args.searchText?.trim() ? args.searchText.trim() : undefined,
    page: pageIndex + 1,
    limit: pageSize,
  });
}
