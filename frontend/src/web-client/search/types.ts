"use client";

import type { Domain, DomainCombinator, DomainOperator } from "@/web-client/domain/types";

export type SearchFieldType = "text" | "number" | "date" | "enum" | "uuid";

export type SearchFieldOption = { value: string; label: string };

export type SearchFieldDefinition = {
  name: string;
  label: string;
  type: SearchFieldType;
  operators?: DomainOperator[];
  options?: SearchFieldOption[];
};

export type SearchViewPreset = {
  id: string;
  label: string;
  domain: Domain;
};

export type SearchViewDefinition = {
  id: string;
  model: string;
  fields: SearchFieldDefinition[];
  presets?: SearchViewPreset[];
  groupBy?: Array<{ field: string; label: string }>;
  filterCombinators?: DomainCombinator[];
};
