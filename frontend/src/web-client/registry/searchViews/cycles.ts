"use client";

import {
  CYCLE_AUDIENCE_OPTIONS,
  CYCLE_STATUS_OPTIONS,
} from "@/modules/cycles/shared/domain/cycles.constants";
import type { SearchViewDefinition } from "@/web-client/search/types";

export const cyclesSearchView: SearchViewDefinition = {
  id: "cycles.search",
  model: "cycles.list",
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
      name: "audienceType",
      label: "Publico",
      type: "select",
      operators: ["="],
      options: CYCLE_AUDIENCE_OPTIONS,
    },
    {
      name: "isActive",
      label: "Status",
      type: "select",
      operators: ["="],
      options: CYCLE_STATUS_OPTIONS.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    },
    {
      name: "tags",
      label: "Tags",
      type: "text",
      operators: ["contains", "=", "!="],
    },
    {
      name: "createdAt",
      label: "Cadastro",
      type: "date",
      operators: ["=", ">=", "<="],
    },
  ],
  groupBy: [
    { field: "audienceType", label: "Publico" },
    { field: "isActive", label: "Status" },
    { field: "tags", label: "Tags" },
    { field: "createdAt", label: "Cadastro" },
  ],
  presets: [
    {
      id: "active",
      label: "Ativos",
      domain: { type: "condition", field: "isActive", operator: "=", value: true },
    },
  ],
};

export const cyclesDetailSearchView: SearchViewDefinition = {
  id: "cycles.detail.search",
  model: "cycles.detail",
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
      name: "audienceType",
      label: "Publico",
      type: "select",
      operators: ["="],
      options: CYCLE_AUDIENCE_OPTIONS,
    },
    {
      name: "isActive",
      label: "Status",
      type: "select",
      operators: ["="],
      options: CYCLE_STATUS_OPTIONS.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    },
  ],
};
