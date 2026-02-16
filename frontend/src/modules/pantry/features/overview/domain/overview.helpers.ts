"use client";

import { formatDateOnlyPtBR, toLocalIsoDate } from "@/lib/date";

export function startMonthValue(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
}

export function monthStartIso(monthValue: string) {
  return `${monthValue}-01`;
}

export function monthEndIso(monthValue: string) {
  const [yearRaw, monthRaw] = monthValue.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  if (!year || !month) return undefined;
  const lastDay = new Date(year, month, 0);
  return toLocalIsoDate(lastDay);
}

export function formatDate(value: string | null) {
  return formatDateOnlyPtBR(value);
}

export function exitTypeLabel(type: string) {
  switch (type) {
    case "ATTENDED":
      return "Atendidos";
    case "DONATION":
      return "Doações";
    case "EVENT":
      return "Eventos";
    case "PARTY":
      return "Festas";
    case "CORRECTION":
      return "Correção";
    default:
      return type;
  }
}
