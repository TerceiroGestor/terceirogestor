"use client";

export function toLocalIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayLocalIsoDate() {
  return toLocalIsoDate(new Date());
}

function toDateOnlyIso(value: string | Date | null | undefined) {
  if (!value) return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return toLocalIsoDate(value);
  }

  const text = String(value).trim();
  if (!text) return null;

  // Handles:
  // - "YYYY-MM-DD"
  // - "YYYY-MM-DDTHH:mm:ss..." (ISO coming from the API)
  const iso = text.length >= 10 ? text.slice(0, 10) : text;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  return iso;
}

export function formatDateOnlyPtBR(value: string | Date | null | undefined) {
  const iso = toDateOnlyIso(value);
  if (!iso) return "—";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export function formatDateTimePtBR(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

