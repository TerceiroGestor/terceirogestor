import { DataTableClient } from "@/components/DataTable/DataTableClient";
import type { DataTableClientProps } from "@/components/DataTable/DataTableClient";

export type { DataTableClientProps as DataTableProps };

export function DataTable<TData>(props: DataTableClientProps<TData>) {
  return <DataTableClient {...props} />;
}
