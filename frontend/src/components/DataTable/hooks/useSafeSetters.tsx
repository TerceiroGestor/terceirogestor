"use client";

import * as React from "react";
import type {
  ColumnFiltersState,
  ColumnPinningState,
  ExpandedState,
  GroupingState,
  PaginationState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";

type Setters = {
  setSorting: React.Dispatch<React.SetStateAction<SortingState>>;
  setGlobalFilter: React.Dispatch<React.SetStateAction<string>>;
  setColumnFilters: React.Dispatch<React.SetStateAction<ColumnFiltersState>>;
  setGrouping: React.Dispatch<React.SetStateAction<GroupingState>>;
  setExpanded: React.Dispatch<React.SetStateAction<ExpandedState>>;
  setColumnVisibility: React.Dispatch<React.SetStateAction<VisibilityState>>;
  setColumnPinning: React.Dispatch<React.SetStateAction<ColumnPinningState>>;
  setPagination: React.Dispatch<React.SetStateAction<PaginationState>>;
  setRowSelection: React.Dispatch<React.SetStateAction<RowSelectionState>>;
  setAdvancedFilters: React.Dispatch<React.SetStateAction<any[]>>;
  setFiltersOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export function useSafeSetters<TAdvancedFilter>({
  setSorting,
  setGlobalFilter,
  setColumnFilters,
  setGrouping,
  setExpanded,
  setColumnVisibility,
  setColumnPinning,
  setPagination,
  setRowSelection,
  setAdvancedFilters,
  setFiltersOpen,
}: Omit<Setters, "setAdvancedFilters"> & {
  setAdvancedFilters: React.Dispatch<React.SetStateAction<TAdvancedFilter[]>>;
}) {
  const mountedRef = React.useRef(false);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const safe =
    <T,>(setter: React.Dispatch<React.SetStateAction<T>>) =>
    (value: React.SetStateAction<T>) => {
      if (!mountedRef.current) return;
      setter(value);
    };

  return {
    mountedRef,
    safeSetSorting: React.useCallback(safe(setSorting), [setSorting]),
    safeSetGlobalFilter: React.useCallback(safe(setGlobalFilter), [setGlobalFilter]),
    safeSetColumnFilters: React.useCallback(safe(setColumnFilters), [setColumnFilters]),
    safeSetGrouping: React.useCallback(safe(setGrouping), [setGrouping]),
    safeSetExpanded: React.useCallback(safe(setExpanded), [setExpanded]),
    safeSetColumnVisibility: React.useCallback(safe(setColumnVisibility), [setColumnVisibility]),
    safeSetColumnPinning: React.useCallback(safe(setColumnPinning), [setColumnPinning]),
    safeSetPagination: React.useCallback(safe(setPagination), [setPagination]),
    safeSetRowSelection: React.useCallback(safe(setRowSelection), [setRowSelection]),
    safeSetAdvancedFilters: React.useCallback(
      safe(setAdvancedFilters),
      [setAdvancedFilters],
    ),
    safeSetFiltersOpen: React.useCallback(safe(setFiltersOpen), [setFiltersOpen]),
  };
}
