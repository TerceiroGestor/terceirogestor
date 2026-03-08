"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

function shallowEqualRecord(a: Record<string, unknown>, b: Record<string, unknown>) {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

function safeJsonParse(value: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

export function usePersistedUrlState<TState extends Record<string, unknown>>({
  storageKey,
  trackedKeys,
  parse,
  serialize,
  equals = shallowEqualRecord as unknown as (a: TState, b: TState) => boolean,
}: {
  storageKey: string;
  trackedKeys: string[];
  parse: (params: URLSearchParams) => TState;
  serialize: (state: TState) => Record<string, string | undefined>;
  equals?: (a: TState, b: TState) => boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mountedRef = React.useRef(false);
  const equalsRef = React.useRef(equals);
  const trackedKeysKey = trackedKeys.join("\u0000");

  React.useEffect(() => {
    equalsRef.current = equals;
  }, [equals]);

  const isEqual = React.useCallback(
    (left: TState, right: TState) => equalsRef.current(left, right),
    [],
  );

  const parsedFromUrl = React.useMemo(
    () => parse(new URLSearchParams(searchParams.toString())),
    [parse, searchParams],
  );

  const [state, setState] = React.useState<TState>(parsedFromUrl);

  React.useEffect(() => {
    setState((prev) => (isEqual(prev, parsedFromUrl) ? prev : parsedFromUrl));
  }, [isEqual, parsedFromUrl]);

  React.useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    const hasUrlState = trackedKeys.some((key) => searchParams.has(key));
    if (hasUrlState) return;

    const raw = typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
    const parsed = safeJsonParse(raw);
    if (!parsed || typeof parsed !== "object") return;

    const merged = { ...parsedFromUrl, ...(parsed as Record<string, unknown>) } as TState;
    setState((prev) => (isEqual(prev, merged) ? prev : merged));
  }, [isEqual, parsedFromUrl, searchParams, storageKey, trackedKeysKey]);

  React.useEffect(() => {
    if (!mountedRef.current) return;

    const nextParams = new URLSearchParams(searchParams.toString());
    const serialized = serialize(state);
    const trackedKeySet = new Set(trackedKeys);

    trackedKeySet.forEach((key) => {
      const value = serialized[key];
      if (value === undefined || value === null || value === "") {
        nextParams.delete(key);
      }
    });

    Object.entries(serialized).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        nextParams.delete(key);
        return;
      }
      nextParams.set(key, value);
    });

    const nextQuery = nextParams.toString();
    const currentQuery = searchParams.toString();
    if (nextQuery !== currentQuery) {
      const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
      router.replace(nextUrl, { scroll: false });
    }

    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(state));
      } catch {
        // ignore quota errors
      }
    }
  }, [pathname, router, searchParams, serialize, state, storageKey, trackedKeysKey]);

  return [state, setState] as const;
}
