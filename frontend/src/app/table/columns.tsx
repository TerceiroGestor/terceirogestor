import * as React from "react";

import type { ColumnConfig } from "@/components/DataTable/DataTableColumnConfig";
import { createColumns } from "@/components/DataTable/DataTableColumnConfig";
import type { Customer } from "./types";
import {
  createDefaultColumnRenderers,
  type DefaultColumnType,
} from "@/components/DataTable/DataTableColumnRenderers";

const columnConfig: ColumnConfig<Customer, DefaultColumnType>[] = [
  { id: "id", label: "ID", type: "id" },
  {
    id: "name",
    label: "Customer",
    type: "user",
    meta: {
      emailAccessor: (row: Customer) => row.email,
      avatarAccessor: (row: Customer) => row.avatar,
    },
  },
  { id: "plan", label: "Plan", type: "badge-outline" },
  { id: "segment", label: "Segment", type: "badge-secondary" },
  { id: "industry", label: "Industry", type: "text" },
  { id: "company", label: "Company", type: "text" },
  { id: "country", label: "Country", type: "text" },
  { id: "region", label: "Region", type: "text" },
  { id: "seats", label: "Seats", type: "number" },
  { id: "status", label: "Status", type: "status" },
  { id: "lastActive", label: "Last active", type: "text" },
  { id: "health", label: "Health", type: "health" },
  { id: "revenue", label: "Revenue", type: "money" },
  { id: "mrr", label: "MRR", type: "money" },
  { id: "arr", label: "ARR", type: "money" },
  { id: "owner", label: "Owner", type: "text" },
  { id: "nps", label: "NPS", type: "number" },
];

export const useCustomerColumns = () =>
  React.useMemo(
    () => createColumns(columnConfig, createDefaultColumnRenderers<Customer>()),
    [],
  );
