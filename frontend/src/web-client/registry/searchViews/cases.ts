"use client";

import type { SearchViewDefinition } from "@/web-client/search/types";
import { CASE_STATUS_OPTIONS } from "@/modules/cases/shared/domain/cases.constants";

export const casesSearchView: SearchViewDefinition = {
  id: "cases.search",
  model: "cases.list",
  searchPlaceholder: "Pesquisar",
  features: { favorites: true, presets: true, advancedFilters: true, groupBy: true, clearAll: true },
  fields: [
    { name: "status", label: "Status", type: "select", operators: ["="], options: CASE_STATUS_OPTIONS },
  ],
  groupBy: [{ field: "status", label: "Status" }],
  presets: [
    { id: "open", label: "Em aberto", domain: { type: "condition", field: "status", operator: "=", value: "ABERTO" } },
  ],
};

export const casesDetailSearchView: SearchViewDefinition = {
  id: "cases.detail.search",
  model: "cases.detail",
  searchPlaceholder: "",
  features: { favorites: false, presets: false, advancedFilters: false, groupBy: false, clearAll: false },
  fields: [{ name: "status", label: "Status", type: "select", operators: ["="], options: CASE_STATUS_OPTIONS }],
};
