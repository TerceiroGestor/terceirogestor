"use client";

import type { SearchViewDefinition } from "@/web-client/search/types";
import {
  REFERRAL_STATUS_OPTIONS,
  REFERRAL_TYPE_OPTIONS,
} from "@/modules/referrals/shared/domain/referrals.constants";

export const referralsSearchView: SearchViewDefinition = {
  id: "referrals.search",
  model: "referrals.list",
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
      options: REFERRAL_TYPE_OPTIONS,
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      operators: ["="],
      options: REFERRAL_STATUS_OPTIONS,
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

export const referralsDetailSearchView: SearchViewDefinition = {
  id: "referrals.detail.search",
  model: "referrals.detail",
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
      options: REFERRAL_STATUS_OPTIONS,
    },
  ],
};
