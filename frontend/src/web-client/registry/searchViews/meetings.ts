"use client";

import type { SearchViewDefinition } from "@/web-client/search/types";

export const meetingsDetailSearchView: SearchViewDefinition = {
  id: "meetings.detail.search",
  model: "meetings.detail",
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
