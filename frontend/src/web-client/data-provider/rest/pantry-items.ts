"use client";

import type { ApiPantryItem } from "@/modules/pantry/api";
import { listPantryItems } from "@/modules/pantry/api";
import type { Domain, DomainCondition } from "@/web-client/domain/types";
import { collectAndConditions } from "@/web-client/data-provider/rest/domain-utils";
import type { SearchArgs, SearchResult } from "@/web-client/data-provider/types";

function toNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function toDateMs(value: unknown) {
  if (!value) return null;
  const raw = typeof value === "string" ? value : String(value);
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const ms = Date.parse(trimmed);
  if (!Number.isFinite(ms)) return null;
  return ms;
}

function asText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function matchesTextOperator(actualRaw: unknown, operator: string, value: unknown) {
  const actual = asText(actualRaw).toLowerCase();
  const expected = asText(value).toLowerCase();

  if (operator === "is_null") return actualRaw === null || actualRaw === undefined || actual === "";
  if (operator === "not_null") return !(actualRaw === null || actualRaw === undefined || actual === "");

  if (operator === "=") return actual === expected;
  if (operator === "!=") return actual !== expected;
  if (operator === "contains" || operator === "ilike") return actual.includes(expected);
  if (operator === "starts_with") return actual.startsWith(expected);
  if (operator === "ends_with") return actual.endsWith(expected);

  if (operator === "in") {
    if (!Array.isArray(value)) return true;
    return value.map((v) => asText(v).toLowerCase()).includes(actual);
  }
  if (operator === "not_in") {
    if (!Array.isArray(value)) return true;
    return !value.map((v) => asText(v).toLowerCase()).includes(actual);
  }

  return true;
}

function matchesNumberOperator(actualRaw: unknown, operator: string, value: unknown) {
  const actual = toNumber(actualRaw);
  if (operator === "is_null") return actualRaw === null || actualRaw === undefined;
  if (operator === "not_null") return !(actualRaw === null || actualRaw === undefined);
  if (actual === null) return true;

  if (operator === "between" && Array.isArray(value)) {
    const from = toNumber(value[0]);
    const to = toNumber(value[1]);
    if (from !== null && actual < from) return false;
    if (to !== null && actual > to) return false;
    return true;
  }

  const target = toNumber(value);
  if (target === null) return true;
  if (operator === "=") return actual === target;
  if (operator === "!=") return actual !== target;
  if (operator === ">") return actual > target;
  if (operator === ">=") return actual >= target;
  if (operator === "<") return actual < target;
  if (operator === "<=") return actual <= target;
  if (operator === "in") {
    if (!Array.isArray(value)) return true;
    const list = value.map((v) => toNumber(v)).filter((v): v is number => v !== null);
    if (!list.length) return true;
    return list.includes(actual);
  }
  if (operator === "not_in") {
    if (!Array.isArray(value)) return true;
    const list = value.map((v) => toNumber(v)).filter((v): v is number => v !== null);
    if (!list.length) return true;
    return !list.includes(actual);
  }
  return true;
}

function matchesDateOperator(actualRaw: unknown, operator: string, value: unknown) {
  const actual = toDateMs(actualRaw);
  if (operator === "is_null") return actualRaw === null || actualRaw === undefined || actual === null;
  if (operator === "not_null") return !(actualRaw === null || actualRaw === undefined || actual === null);
  if (actual === null) return true;

  if (operator === "between" && Array.isArray(value)) {
    const from = toDateMs(value[0]);
    const to = toDateMs(value[1]);
    if (from !== null && actual < from) return false;
    if (to !== null && actual > to) return false;
    return true;
  }

  const target = toDateMs(value);
  if (target === null) return true;
  if (operator === "=") return actual === target;
  if (operator === "!=") return actual !== target;
  if (operator === ">=") return actual >= target;
  if (operator === "<=") return actual <= target;
  if (operator === ">") return actual > target;
  if (operator === "<") return actual < target;
  return true;
}

function matchesItemCondition(item: ApiPantryItem, cond: DomainCondition) {
  const { field, operator, value } = cond;

  switch (field) {
    case "name":
    case "group":
    case "defaultSector":
    case "unit":
    case "validityStatus":
      return matchesTextOperator((item as Record<string, unknown>)[field], operator, value);
    case "isBelowMin":
      if (operator === "is_null" || operator === "not_null") {
        return matchesTextOperator(item.isBelowMin, operator, value);
      }
      if (operator === "=" || operator === "!=") {
        const expected = toBoolean(value);
        if (expected === null) return true;
        return operator === "=" ? item.isBelowMin === expected : item.isBelowMin !== expected;
      }
      return true;
    case "stock":
    case "minStock":
    case "entriesTotal":
    case "exitsTotal":
    case "daysToExpire":
      return matchesNumberOperator((item as Record<string, unknown>)[field], operator, value);
    case "lastMovementDate":
    case "nextExpiryDate":
    case "createdAt":
    case "updatedAt":
      return matchesDateOperator((item as Record<string, unknown>)[field], operator, value);
    default:
      return true;
  }
}

function resolveItemsConditions(domain: Domain) {
  const conditions = collectAndConditions(domain);
  if (!conditions) {
    throw new Error("Este endpoint ainda suporta apenas filtros combinados com AND.");
  }
  return conditions;
}

function applyLocalSearch(rows: ApiPantryItem[], needle: string) {
  const q = needle.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) => {
    const tokens = [
      row.name,
      row.group ?? "",
      row.defaultSector,
      row.unit,
      row.notes ?? "",
      row.validityStatus,
      row.lastMovementDate ?? "",
      row.nextExpiryDate ?? "",
      String(row.stock),
      String(row.minStock),
      row.isBelowMin ? "abaixo do mínimo" : "ok",
    ];
    return tokens.join(" ").toLowerCase().includes(q);
  });
}

function paginate(rows: ApiPantryItem[], pageIndex: number, pageSize: number) {
  const total = rows.length;
  const pages = pageSize > 0 ? Math.ceil(total / pageSize) : total > 0 ? 1 : 0;
  const start = Math.max(pageIndex, 0) * Math.max(pageSize, 1);
  const data = pageSize > 0 ? rows.slice(start, start + pageSize) : rows;
  return { data, total, pages, page: Math.max(pageIndex, 0) + 1, limit: pageSize };
}

export async function searchPantryItems(
  token: string,
  args: SearchArgs,
): Promise<SearchResult<ApiPantryItem>> {
  const domain = args.domain ?? null;
  const hasDomain = Boolean(domain);
  const wantsAll = Boolean(args.all);

  const pageIndex = args.pagination?.pageIndex ?? 0;
  const pageSize = args.pagination?.pageSize ?? 20;

  const shouldFetchAll = wantsAll || hasDomain;

  const response = await listPantryItems(token, {
    q: args.searchText?.trim() ? args.searchText.trim() : undefined,
    all: shouldFetchAll ? true : undefined,
    page: shouldFetchAll ? undefined : pageIndex + 1,
    limit: shouldFetchAll ? undefined : pageSize,
  });

  // Server-side pagination (fast path)
  if (!shouldFetchAll) return response;

  let rows = response.data.slice();

  // Always apply local search to guarantee "search any column"
  rows = applyLocalSearch(rows, args.searchText ?? "");

  if (hasDomain) {
    const conditions = resolveItemsConditions(domain);
    rows = rows.filter((row) => conditions.every((cond) => matchesItemCondition(row, cond)));
  }

  if (wantsAll) {
    return {
      data: rows,
      pagination: {
        total: rows.length,
        pages: rows.length ? 1 : 0,
        page: rows.length ? 1 : 0,
        limit: rows.length,
      },
    };
  }

  const p = paginate(rows, pageIndex, pageSize);
  return {
    data: p.data,
    pagination: {
      total: p.total,
      pages: p.pages,
      page: p.page,
      limit: p.limit,
    },
  };
}
