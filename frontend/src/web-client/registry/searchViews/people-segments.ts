"use client";

import type { SearchViewDefinition } from "@/web-client/search/types";

export const peopleSegmentsSearchView: SearchViewDefinition = {
  id: "people-segments.search",
  model: "people-segments.list",
  searchPlaceholder: "Pesquisar",
  features: {
    favorites: true,
    presets: true,
    advancedFilters: false,
    groupBy: true,
    clearAll: true,
  },
  fields: [],
  groupBy: [
    { field: "category", label: "Categoria" },
    { field: "isActive", label: "Status" },
  ],
  presets: [
    {
      id: "active",
      label: "Ativos",
      domain: { type: "condition", field: "isActive", operator: "=", value: true },
    },
  ],
};

export const peopleSegmentsDetailSearchView: SearchViewDefinition = {
  id: "people-segments.detail.search",
  model: "people-segments.detail",
  searchPlaceholder: "",
  features: {
    favorites: false,
    presets: false,
    advancedFilters: false,
    groupBy: false,
    clearAll: false,
  },
  fields: [],
};
