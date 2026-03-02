"use client";

import type { SearchViewDefinition } from "@/web-client/search/types";

export const pantryHistorySearchView: SearchViewDefinition = {
  id: "pantry.history.search",
  model: "pantry.history",
  filterCombinators: ["and", "or"],
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
      name: "sector",
      label: "Setor",
      type: "text",
      operators: ["ilike", "contains", "=", "starts_with", "ends_with"],
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
      name: "donorName",
      label: "Doador",
      type: "text",
      operators: ["ilike", "contains", "=", "starts_with", "ends_with"],
    },
    {
      name: "itemName",
      label: "Alimento",
      type: "text",
      operators: ["ilike", "contains", "=", "starts_with", "ends_with"],
    },
    {
      name: "itemGroup",
      label: "Grupo do alimento",
      type: "text",
      operators: ["ilike", "contains", "=", "starts_with", "ends_with"],
    },
    {
      name: "expiryDate",
      label: "Validade",
      type: "date",
      operators: ["between", ">=", "<=", "=", "!="],
    },
    {
      name: "actor",
      label: "Usuário",
      type: "text",
      operators: ["ilike", "contains", "=", "starts_with", "ends_with"],
    },
    {
      name: "notes",
      label: "Notas",
      type: "text",
      operators: ["ilike", "contains", "=", "starts_with", "ends_with"],
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
    { field: "itemGroup", label: "Grupo" },
    { field: "eventName", label: "Evento" },
    { field: "donorName", label: "Doador" },
    { field: "quantity", label: "Quantidade" },
    { field: "unit", label: "Un." },
    { field: "movementDate", label: "Data" },
    { field: "expiryDate", label: "Validade" },
    { field: "actor", label: "Usuário" },
    { field: "notes", label: "Notas" },
  ],
};

export const pantryDonorsSearchView: SearchViewDefinition = {
  id: "pantry.donors.search",
  model: "pantry.donors",
  filterCombinators: ["and"],
  fields: [
    { name: "name", label: "Nome", type: "text", operators: ["ilike", "contains", "=", "starts_with", "ends_with"] },
    {
      name: "type",
      label: "Tipo",
      type: "enum",
      options: [
        { value: "PERSON", label: "Pessoa" },
        { value: "COMPANY", label: "Empresa" },
      ],
      operators: ["="],
    },
    { name: "contact", label: "Contato", type: "text", operators: ["ilike", "contains", "=", "starts_with", "ends_with"] },
    { name: "createdAt", label: "Criado em", type: "date", operators: ["between", ">=", "<="] },
    { name: "updatedAt", label: "Atualizado em", type: "date", operators: ["between", ">=", "<="] },
  ],
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
    { field: "name", label: "Alimento" },
    { field: "sector", label: "Setor" },
    { field: "group", label: "Grupo" },
    { field: "sectorStock", label: "Saldo (setor)" },
    { field: "itemStock", label: "Saldo (total)" },
    { field: "unit", label: "Un." },
    { field: "minStock", label: "Mínimo" },
    { field: "validityStatus", label: "Validade" },
    { field: "isBelowMin", label: "Abaixo do mínimo" },
    { field: "nextExpiryDate", label: "Próx. validade" },
    { field: "daysToExpire", label: "Dias" },
  ],
};

