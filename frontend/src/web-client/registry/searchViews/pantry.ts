"use client";

import type { SearchViewDefinition } from "@/web-client/search/types";

export const pantryHistorySearchView: SearchViewDefinition = {
  id: "pantry.history.search",
  model: "pantry.history",
  fields: [
    {
      name: "kind",
      label: "Tipo de movimento",
      type: "enum",
      options: [
        { value: "ENTRY", label: "Entrada" },
        { value: "EXIT", label: "SaÃ­da" },
      ],
      operators: ["="],
    },
    {
      name: "movementDate",
      label: "Data do movimento",
      type: "date",
      operators: ["between", ">=", "<="],
    },
    {
      name: "type",
      label: "Tipo de saÃ­da",
      type: "enum",
      options: [
        { value: "ATTENDED", label: "Atendidos" },
        { value: "DONATION", label: "DoaÃ§Ã£o" },
        { value: "EVENT", label: "Evento" },
        { value: "PARTY", label: "Festa" },
        { value: "CORRECTION", label: "CorreÃ§Ã£o" },
      ],
      operators: ["="],
    },
    {
      name: "eventName",
      label: "Evento",
      type: "text",
      operators: ["ilike", "contains", "="],
    },
    {
      name: "itemId",
      label: "Item (ID)",
      type: "uuid",
      operators: ["="],
    },
  ],
};

