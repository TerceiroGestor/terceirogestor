"use client";

import { ACTION_STATUS_OPTIONS } from "@/modules/actions/shared/domain/actions.constants";
import type { SearchViewDefinition } from "@/web-client/search/types";

export const actionsSearchView: SearchViewDefinition = {
  id: "actions.search",
  model: "actions.list",
  searchPlaceholder: "Pesquisar acoes por titulo ou tipo",
  features: {
    favorites: true,
    presets: false,
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
      options: ACTION_STATUS_OPTIONS,
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
    { field: "status", label: "Status" },
    { field: "tags", label: "Tags" },
    { field: "createdAt", label: "Cadastro" },
    { field: "actionType.name", label: "Tipo" },
    { field: "group.name", label: "Grupo" },
    { field: "cycle.name", label: "Ciclo" },
  ],
};

export const actionsDetailSearchView: SearchViewDefinition = {
  id: "actions.detail.search",
  model: "actions.detail",
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
      options: ACTION_STATUS_OPTIONS,
    },
  ],
};
