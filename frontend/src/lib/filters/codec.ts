import type { FilterSchema } from "./types";

export function parseFiltersFromSearchParams<TValues extends Record<string, any>>(
  schema: FilterSchema<TValues>,
  searchParams: URLSearchParams,
  defaults: TValues,
) {
  const next = { ...defaults };
  schema.forEach((field) => {
    const apiKey = field.apiKey ?? field.key;
    const raw = searchParams.get(apiKey);
    if (raw == null) return;

    if (field.type === "select") {
      const option = field.options.find((o) => o.value === raw);
      (next as any)[field.key] = option ? option.value : raw;
      return;
    }

    (next as any)[field.key] = raw;
  });
  return next;
}

export function buildSearchParamsFromFilters<TValues extends Record<string, any>>(
  schema: FilterSchema<TValues>,
  values: TValues,
  defaults: TValues,
) {
  const params = new URLSearchParams();
  schema.forEach((field) => {
    const value = (values as any)[field.key];
    const apiKey = field.apiKey ?? field.key;
    const omit =
      value == null ||
      value === "" ||
      value === (defaults as any)[field.key] ||
      (field.omitWhen ? field.omitWhen(value, values) : false);
    if (omit) return;
    params.set(apiKey, String(value));
  });
  return params;
}

export function areFilterValuesEqual<TValues extends Record<string, any>>(
  a: TValues,
  b: TValues,
) {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) => String((a as any)[key] ?? "") === String((b as any)[key] ?? ""));
}

