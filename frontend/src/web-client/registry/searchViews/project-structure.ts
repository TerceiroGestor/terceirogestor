"use client";

import type { SearchViewDefinition } from "@/web-client/search/types";

export const projectGroupsSearchView: SearchViewDefinition = {
  id: "project-groups.search",
  model: "project-groups.list",
  searchPlaceholder: "Pesquisar",
  features: {
    favorites: true,
    presets: true,
    advancedFilters: true,
    groupBy: true,
    clearAll: true,
  },
  fields: [
    { name: "project.name", label: "Projeto", type: "text" },
    { name: "createdAt", label: "Cadastro", type: "date" },
    { name: "_count.memberships", label: "Participantes", type: "number" },
    { name: "_count.actions", label: "Acoes", type: "number" },
  ],
  groupBy: [
    { field: "project.name", label: "Projeto" },
    { field: "createdAt", label: "Cadastro" },
  ],
  presets: [],
};

export const projectCyclesSearchView: SearchViewDefinition = {
  id: "project-cycles.search",
  model: "project-cycles.list",
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
    { field: "project.name", label: "Projeto" },
  ],
  presets: [],
};
