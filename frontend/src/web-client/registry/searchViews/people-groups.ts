"use client";

import type { SearchViewDefinition } from "@/web-client/search/types";
import { PEOPLE_GROUP_TYPE_OPTIONS } from "@/modules/people-groups/shared/domain/people-groups.constants";

export const peopleGroupsSearchView: SearchViewDefinition = {
  id: "people-groups.search",
  model: "people-groups.list",
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
      name: "groupType",
      label: "Tipo do grupo",
      type: "select",
      operators: ["="],
      options: PEOPLE_GROUP_TYPE_OPTIONS,
    },
    {
      name: "purpose",
      label: "Finalidade",
      type: "select",
      operators: ["="],
      options: [
        { value: "PUBLICO", label: "Publico" },
        { value: "EQUIPE", label: "Equipe" },
      ],
    },
    {
      name: "category",
      label: "Categoria",
      type: "text",
      operators: ["contains", "="],
    },
    {
      name: "createdAt",
      label: "Cadastro",
      type: "date",
      operators: ["between", ">=", "<=", "="],
    },
    {
      name: "isActive",
      label: "Status",
      type: "boolean",
      operators: ["="],
    },
  ],
  groupBy: [
    { field: "groupType", label: "Tipo do grupo" },
    { field: "purpose", label: "Finalidade" },
    { field: "category", label: "Categoria" },
    { field: "createdAt", label: "Cadastro" },
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

export const peopleGroupsDetailSearchView: SearchViewDefinition = {
  id: "people-groups.detail.search",
  model: "people-groups.detail",
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
      name: "isActive",
      label: "Status",
      type: "boolean",
      operators: ["="],
    },
  ],
};
