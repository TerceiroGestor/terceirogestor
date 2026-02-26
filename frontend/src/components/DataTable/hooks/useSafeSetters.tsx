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

type Setters<TAdvancedFilter> = {
  setSorting: React.Dispatch<React.SetStateAction<SortingState>>;
  setGlobalFilter: React.Dispatch<React.SetStateAction<string>>;
  setColumnFilters: React.Dispatch<React.SetStateAction<ColumnFiltersState>>;
  setGrouping: React.Dispatch<React.SetStateAction<GroupingState>>;
  setExpanded: React.Dispatch<React.SetStateAction<ExpandedState>>;
  setColumnVisibility: React.Dispatch<React.SetStateAction<VisibilityState>>;
  setColumnPinning: React.Dispatch<React.SetStateAction<ColumnPinningState>>;
  setPagination: React.Dispatch<React.SetStateAction<PaginationState>>;
  setRowSelection: React.Dispatch<React.SetStateAction<RowSelectionState>>;
  setAdvancedFilters: React.Dispatch<React.SetStateAction<TAdvancedFilter[]>>;
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
}: Setters<TAdvancedFilter>) {
  const mountedRef = React.useRef(false);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const safeSetSorting = React.useCallback(
    (value: React.SetStateAction<SortingState>) => {
      if (!mountedRef.current) return;
      setSorting(value);
    },
    [setSorting],
  );

  const safeSetGlobalFilter = React.useCallback(
    (value: React.SetStateAction<string>) => {
      if (!mountedRef.current) return;
      setGlobalFilter(value);
    },
    [setGlobalFilter],
  );

  const safeSetColumnFilters = React.useCallback(
    (value: React.SetStateAction<ColumnFiltersState>) => {
      if (!mountedRef.current) return;
      setColumnFilters(value);
    },
    [setColumnFilters],
  );

  const safeSetGrouping = React.useCallback(
    (value: React.SetStateAction<GroupingState>) => {
      if (!mountedRef.current) return;
      setGrouping(value);
    },
    [setGrouping],
  );

  const safeSetExpanded = React.useCallback(
    (value: React.SetStateAction<ExpandedState>) => {
      if (!mountedRef.current) return;
      setExpanded(value);
    },
    [setExpanded],
  );

  const safeSetColumnVisibility = React.useCallback(
    (value: React.SetStateAction<VisibilityState>) => {
      if (!mountedRef.current) return;
      setColumnVisibility(value);
    },
    [setColumnVisibility],
  );

  const safeSetColumnPinning = React.useCallback(
    (value: React.SetStateAction<ColumnPinningState>) => {
      if (!mountedRef.current) return;
      setColumnPinning(value);
    },
    [setColumnPinning],
  );

  const safeSetPagination = React.useCallback(
    (value: React.SetStateAction<PaginationState>) => {
      if (!mountedRef.current) return;
      setPagination(value);
    },
    [setPagination],
  );

  const safeSetRowSelection = React.useCallback(
    (value: React.SetStateAction<RowSelectionState>) => {
      if (!mountedRef.current) return;
      setRowSelection(value);
    },
    [setRowSelection],
  );

  const safeSetAdvancedFilters = React.useCallback(
    (value: React.SetStateAction<TAdvancedFilter[]>) => {
      if (!mountedRef.current) return;
      setAdvancedFilters(value);
    },
    [setAdvancedFilters],
  );

  const safeSetFiltersOpen = React.useCallback(
    (value: React.SetStateAction<boolean>) => {
      if (!mountedRef.current) return;
      setFiltersOpen(value);
    },
    [setFiltersOpen],
  );

  return {
    mountedRef,
    safeSetSorting,
    safeSetGlobalFilter,
    safeSetColumnFilters,
    safeSetGrouping,
    safeSetExpanded,
    safeSetColumnVisibility,
    safeSetColumnPinning,
    safeSetPagination,
    safeSetRowSelection,
    safeSetAdvancedFilters,
    safeSetFiltersOpen,
  };
}
