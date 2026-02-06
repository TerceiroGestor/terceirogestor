import * as React from "react";

import type { ColumnConfig } from "@/components/DataTable/DataTableColumnConfig";
import { createColumns } from "@/components/DataTable/DataTableColumnConfig";
import type { Customer } from "./types";
import {
  createDefaultColumnRenderers,
  type DefaultColumnType,
} from "@/components/DataTable/DataTableColumnRenderers";

const columnConfig: ColumnConfig<Customer, DefaultColumnType>[] = [
  { id: "id", label: "ID", type: "id", meta: { dataType: "string" } },
  {
    id: "name",
    label: "Customer",
    type: "user",
    meta: {
      dataType: "string",
      emailAccessor: (row: Customer) => row.email,
      avatarAccessor: (row: Customer) => row.avatar,
    },
  },
  { id: "plan", label: "Plan", type: "badge-outline", meta: { dataType: "string" } },
  {
    id: "segment",
    label: "Segment",
    type: "badge-secondary",
    meta: { dataType: "string" },
  },
  { id: "industry", label: "Industry", type: "text", meta: { dataType: "string" } },
  { id: "company", label: "Company", type: "text", meta: { dataType: "string" } },
  { id: "country", label: "Country", type: "text", meta: { dataType: "string" } },
  { id: "region", label: "Region", type: "text", meta: { dataType: "string" } },
  { id: "seats", label: "Seats", type: "number", meta: { dataType: "number" } },
  { id: "status", label: "Status", type: "status", meta: { dataType: "string" } },
  {
    id: "lastActive",
    label: "Last active",
    type: "text",
    meta: { dataType: "string" },
  },
  { id: "health", label: "Health", type: "health", meta: { dataType: "string" } },
  { id: "revenue", label: "Revenue", type: "money", meta: { dataType: "number" } },
  { id: "mrr", label: "MRR", type: "money", meta: { dataType: "number" } },
  { id: "arr", label: "ARR", type: "money", meta: { dataType: "number" } },
  { id: "owner", label: "Owner", type: "text", meta: { dataType: "string" } },
  { id: "nps", label: "NPS", type: "number", meta: { dataType: "number" } },
];

export const useCustomerColumns = () =>
  React.useMemo(
    () => createColumns(columnConfig, createDefaultColumnRenderers<Customer>()),
    [],
  );
