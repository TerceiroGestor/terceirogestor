"use client";

import type { SearchViewDefinition } from "@/web-client/search/types";
import { OCCURRENCE_CASE_STATUS_OPTIONS } from "@/modules/occurrences/shared/domain/occurrences.constants";

export const occurrencesSearchView: SearchViewDefinition = {
  id: "occurrences.search",
  model: "occurrences.list",
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
      name: "status",
      label: "Status",
      type: "select",
      operators: ["="],
      options: OCCURRENCE_CASE_STATUS_OPTIONS,
    },
    {
      name: "createdAt",
      label: "Cadastro",
      type: "date",
      operators: ["between", ">=", "<=", "="],
    },
  ],
  groupBy: [{ field: "status", label: "Status" }],
  presets: [
    {
      id: "open",
      label: "Em aberto",
      domain: { type: "condition", field: "status", operator: "!=", value: "DESFECHO_DEFINIDO" },
    },
  ],
};

export const occurrencesDetailSearchView: SearchViewDefinition = {
  id: "occurrences.detail.search",
  model: "occurrences.detail",
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
      options: OCCURRENCE_CASE_STATUS_OPTIONS,
    },
  ],
};
