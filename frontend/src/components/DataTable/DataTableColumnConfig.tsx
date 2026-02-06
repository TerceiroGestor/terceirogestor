"use client";

import type { ColumnDef } from "@tanstack/react-table";

export type ColumnConfig<TData, TType extends string = string> = {
  id: Extract<keyof TData, string>;
  label: string;
  type: TType;
  meta?: ColumnDef<TData, any>["meta"];
};

export type ColumnRenderer<TData, TType extends string> = (
  config: ColumnConfig<TData, TType>,
) => Partial<ColumnDef<TData>>;

export function createColumns<TData, TType extends string>(
  configs: ColumnConfig<TData, TType>[],
  renderers: Record<TType, ColumnRenderer<TData, TType>>,
): ColumnDef<TData, any>[] {
  return configs.map((config) => {
    const base: ColumnDef<TData> = {
      accessorKey: config.id,
      header: config.label,
      meta: config.meta,
    };
    const renderer = renderers[config.type];
    if (!renderer) return base;
    return { ...base, ...renderer(config) } as ColumnDef<TData, any>;
  });
}
