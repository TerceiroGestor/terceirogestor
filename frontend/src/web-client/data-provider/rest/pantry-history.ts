"use client";

import { listPantryHistory, type ApiPantryHistoryMovement } from "@/modules/pantry/api";
import type { Domain, DomainCondition } from "@/web-client/domain/types";
import type { SearchArgs, SearchResult } from "@/web-client/data-provider/types";

type PantryHistoryExitType = "ATTENDED" | "DONATION" | "EVENT" | "PARTY" | "CORRECTION";

function collectAndConditions(domain: Domain): DomainCondition[] | null {
  if (!domain) return [];
  if (domain.type === "condition") return [domain];
  if (domain.type === "not") return null;
  if (domain.type === "group") {
    if (domain.combinator !== "and") return null;
    const all: DomainCondition[] = [];
    for (const child of domain.children) {
      const flattened = collectAndConditions(child);
      if (!flattened) return null;
      all.push(...flattened);
    }
    return all;
  }
  return null;
}

function resolveHistoryQuery(domain: Domain) {
  const conditions = collectAndConditions(domain);
  if (!conditions) {
    throw new Error("Este endpoint ainda suporta apenas filtros combinados com AND.");
  }

  const params: {
    kind?: "ALL" | "ENTRY" | "EXIT";
    from?: string;
    to?: string;
    type?: PantryHistoryExitType;
    eventName?: string;
    itemId?: string;
  } = {};

  conditions.forEach((condition) => {
    const value = condition.value;
    switch (condition.field) {
      case "kind":
        if (condition.operator === "=" && (value === "ENTRY" || value === "EXIT")) {
          params.kind = value;
        }
        break;
      case "movementDate":
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
      case "eventName":
        if (
          (condition.operator === "contains" ||
            condition.operator === "ilike" ||
            condition.operator === "=") &&
          typeof value === "string"
        ) {
          params.eventName = value;
        }
        break;
      case "itemId":
        if (condition.operator === "=" && typeof value === "string") {
          params.itemId = value;
        }
        break;
      default:
        break;
    }
  });

  return params;
}

export async function searchPantryHistory(
  token: string,
  args: SearchArgs,
): Promise<SearchResult<ApiPantryHistoryMovement>> {
  const queryParams = resolveHistoryQuery(args.domain ?? null);

  const pageIndex = args.pagination?.pageIndex ?? 0;
  const pageSize = args.pagination?.pageSize ?? 50;
  const shouldFetchAll = Boolean(args.all);

  return listPantryHistory(token, {
    kind: queryParams.kind,
    from: queryParams.from,
    to: queryParams.to,
    type: queryParams.type,
    eventName: queryParams.eventName,
    itemId: queryParams.itemId,
    search: args.searchText?.trim() ? args.searchText.trim() : undefined,
    page: shouldFetchAll ? undefined : pageIndex + 1,
    limit: shouldFetchAll ? undefined : pageSize,
    all: shouldFetchAll ? true : undefined,
  });
}

