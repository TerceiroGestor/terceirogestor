"use client";

import type { SearchViewDefinition } from "@/web-client/search/types";
import {
  ATTENDANCE_CASE_STATUS_OPTIONS,
  ATTENDANCE_TYPE_OPTIONS,
} from "@/modules/attendances/shared/domain/attendances.constants";

export const attendancesSearchView: SearchViewDefinition = {
  id: "attendances.search",
  model: "attendances.list",
  searchPlaceholder: "Pesquisar",
  features: {
    favorites: true,
    presets: true,
    advancedFilters: true,
    groupBy: true,
    clearAll: true,
  },
  fields: [
    {
      name: "type",
      label: "Tipo",
      type: "select",
      operators: ["="],
      options: ATTENDANCE_TYPE_OPTIONS,
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      operators: ["="],
      options: ATTENDANCE_CASE_STATUS_OPTIONS,
    },
    {
      name: "scheduledDate",
      label: "Data",
      type: "date",
      operators: ["between", ">=", "<=", "="],
    },
  ],
  groupBy: [
    { field: "type", label: "Tipo" },
    { field: "status", label: "Status" },
  ],
  presets: [
    {
      id: "open",
      label: "Em aberto",
      domain: { type: "condition", field: "status", operator: "=", value: "ABERTO" },
    },
  ],
};

export const attendancesDetailSearchView: SearchViewDefinition = {
  id: "attendances.detail.search",
  model: "attendances.detail",
  searchPlaceholder: "",
  features: {
    favorites: false,
    presets: false,
    advancedFilters: false,
    groupBy: false,
    clearAll: false,
  },
  fields: [
    {
      name: "status",
      label: "Status",
      type: "select",
      operators: ["="],
      options: ATTENDANCE_CASE_STATUS_OPTIONS,
    },
  ],
};
