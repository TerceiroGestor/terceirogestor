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
        { value: "EXIT", label: "Saída" },
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
      label: "Tipo de saída",
      type: "enum",
      options: [
        { value: "ATTENDED", label: "Atendidos" },
        { value: "DONATION", label: "Doação" },
        { value: "EVENT", label: "Evento" },
        { value: "PARTY", label: "Festa" },
        { value: "CORRECTION", label: "Correção" },
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
  groupBy: [
    { field: "kind", label: "Tipo (Entrada/Saída)" },
    { field: "sector", label: "Setor" },
    { field: "type", label: "Tipo de saída" },
    { field: "itemId", label: "Alimento" },
  ],
};

export const pantryEntriesSearchView: SearchViewDefinition = {
  id: "pantry.entries.search",
  model: "pantry.entries",
  fields: [
    {
      name: "entryDate",
      label: "Data da entrada",
      type: "date",
      operators: ["between", ">=", "<="],
    },
    {
      name: "itemId",
      label: "Item (ID)",
      type: "uuid",
      operators: ["="],
    },
    {
      name: "donorId",
      label: "Doador (ID)",
      type: "uuid",
      operators: ["="],
    },
  ],
  groupBy: [
    { field: "sector", label: "Setor" },
    { field: "itemId", label: "Alimento" },
    { field: "donorId", label: "Doador" },
    { field: "entryDate", label: "Data da entrada" },
  ],
};

export const pantryExitsSearchView: SearchViewDefinition = {
  id: "pantry.exits.search",
  model: "pantry.exits",
  fields: [
    {
      name: "exitDate",
      label: "Data da saída",
      type: "date",
      operators: ["between", ">=", "<="],
    },
    {
      name: "type",
      label: "Tipo de saída",
      type: "enum",
      options: [
        { value: "ATTENDED", label: "Atendidos" },
        { value: "DONATION", label: "Doação" },
        { value: "EVENT", label: "Evento" },
        { value: "PARTY", label: "Festa" },
        { value: "CORRECTION", label: "Correção" },
      ],
      operators: ["="],
    },
    {
      name: "itemId",
      label: "Item (ID)",
      type: "uuid",
      operators: ["="],
    },
  ],
  groupBy: [
    { field: "sector", label: "Setor" },
    { field: "type", label: "Tipo de saída" },
    { field: "itemId", label: "Alimento" },
    { field: "exitDate", label: "Data da saída" },
  ],
};

export const pantryItemsSearchView: SearchViewDefinition = {
  id: "pantry.items.search",
  model: "pantry.items",
  filterCombinators: ["and"],
  presets: [
    {
      id: "below-min",
      label: "Abaixo do mínimo",
      domain: { type: "condition", field: "isBelowMin", operator: "=", value: "true" },
    },
    {
      id: "expired",
      label: "Vencidos",
      domain: { type: "condition", field: "validityStatus", operator: "=", value: "Vencido" },
    },
    {
      id: "urgent",
      label: "Urgente",
      domain: { type: "condition", field: "validityStatus", operator: "=", value: "Urgente" },
    },
  ],
  fields: [
    { name: "name", label: "Alimento", type: "text" },
    { name: "group", label: "Grupo", type: "text" },
    { name: "defaultSector", label: "Setor", type: "text" },
    { name: "unit", label: "Unidade", type: "text" },
    { name: "notes", label: "Notas internas", type: "text" },
    { name: "stock", label: "Saldo", type: "number" },
    { name: "minStock", label: "Mínimo", type: "number" },
    {
      name: "isBelowMin",
      label: "Abaixo do mínimo",
      type: "enum",
      options: [
        { value: "true", label: "Sim" },
        { value: "false", label: "Não" },
      ],
    },
    {
      name: "validityStatus",
      label: "Validade",
      type: "enum",
      options: [
        { value: "Normal", label: "Normal" },
        { value: "Atencao", label: "Atenção" },
        { value: "Alerta", label: "Alerta" },
        { value: "Urgente", label: "Urgente" },
        { value: "Vencido", label: "Vencido" },
        { value: "Sem validade", label: "Sem validade" },
      ],
    },
    { name: "nextExpiryDate", label: "Próx. validade", type: "date" },
    { name: "lastMovementDate", label: "Último movimento", type: "date" },
    { name: "createdAt", label: "Criado em", type: "date" },
    { name: "updatedAt", label: "Atualizado em", type: "date" },
  ],
  groupBy: [
    { field: "defaultSector", label: "Setor" },
    { field: "group", label: "Grupo" },
    { field: "validityStatus", label: "Validade" },
    { field: "isBelowMin", label: "Abaixo do mínimo" },
  ],
};

export const pantryDonorsSearchView: SearchViewDefinition = {
  id: "pantry.donors.search",
  model: "pantry.donors",
  fields: [],
  groupBy: [{ field: "type", label: "Tipo" }],
};

export const pantryStockSearchView: SearchViewDefinition = {
  id: "pantry.stock.search",
  model: "pantry.stock",
  presets: [
    {
      id: "below-min",
      label: "Abaixo do mínimo",
      domain: { type: "condition", field: "isBelowMin", operator: "=", value: "true" },
    },
    {
      id: "expired",
      label: "Vencidos",
      domain: { type: "condition", field: "validityStatus", operator: "=", value: "Vencido" },
    },
    {
      id: "urgent",
      label: "Urgente",
      domain: { type: "condition", field: "validityStatus", operator: "=", value: "Urgente" },
    },
  ],
  fields: [
    {
      name: "sector",
      label: "Setor",
      type: "text",
    },
    {
      name: "group",
      label: "Grupo",
      type: "text",
    },
    {
      name: "itemId",
      label: "Item (ID)",
      type: "uuid",
    },
    {
      name: "isBelowMin",
      label: "Abaixo do mínimo",
      type: "enum",
      options: [
        { value: "true", label: "Sim" },
        { value: "false", label: "Não" },
      ],

    },
    {
      name: "validityStatus",
      label: "Validade",
      type: "enum",
      options: [
        { value: "Normal", label: "Normal" },
        { value: "Atencao", label: "Atenção" },
        { value: "Alerta", label: "Alerta" },
        { value: "Urgente", label: "Urgente" },
        { value: "Vencido", label: "Vencido" },
        { value: "Sem validade", label: "Sem validade" },
      ],

    },
    {
      name: "nextExpiryDate",
      label: "Próx. validade",
      type: "date",

    },
  ],
  groupBy: [
    { field: "sector", label: "Setor" },
    { field: "group", label: "Grupo" },
    { field: "validityStatus", label: "Validade" },
    { field: "isBelowMin", label: "Abaixo do mínimo" },
  ],
};

