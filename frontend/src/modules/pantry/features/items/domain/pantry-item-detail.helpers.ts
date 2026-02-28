"use client";

import type { ApiPantryAuditLog, ApiPantryExit } from "@/modules/pantry/api";
import {
  PANTRY_AUDIT_FIELD_LABELS,
  PANTRY_DEFAULT_SECTOR,
  PANTRY_EXIT_TYPE_LABELS,
} from "@/modules/pantry/shared/domain/pantry.constants";

export function toInt(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function toNumber(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function localIsoDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function normalizeStringOrNull(value: string | null | undefined) {
  const trimmed = String(value ?? "").trim();
  return trimmed ? trimmed : null;
}

export function normalizeSector(value: string | null | undefined) {
  return String(value ?? "").trim() || PANTRY_DEFAULT_SECTOR;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function resolveExitTypeLabel(type: ApiPantryExit["type"] | string | null | undefined) {
  if (!type) return "Saída";
  if (type in PANTRY_EXIT_TYPE_LABELS) {
    return PANTRY_EXIT_TYPE_LABELS[type as keyof typeof PANTRY_EXIT_TYPE_LABELS];
  }
  return String(type);
}

export function resolveAuditActionLabel(action: ApiPantryAuditLog["action"]) {
  switch (action) {
    case "CREATE":
      return "Criado";
    case "UPDATE":
      return "Atualizado";
    case "DELETE":
      return "Removido";
    default:
      return action;
  }
}

export function formatAuditValue(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value.trim() ? value : "—";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

export function diffAuditFields(log: ApiPantryAuditLog) {
  const before = isRecord(log.before) ? log.before : {};
  const after = isRecord(log.after) ? log.after : {};
  const keys = Object.keys({ ...before, ...after }).filter((k) => k in PANTRY_AUDIT_FIELD_LABELS);

  return keys
    .map((key) => ({
      key,
      label: PANTRY_AUDIT_FIELD_LABELS[key] ?? key,
      before: before[key],
      after: after[key],
    }))
    .filter((row) => JSON.stringify(row.before) !== JSON.stringify(row.after));
}

export function initialsFromLabel(label: string) {
  const cleaned = label.replace(/\s+/g, " ").trim().slice(0, 64);
  if (!cleaned) return "?";
  const parts = cleaned.split(" ").filter(Boolean);
  const a = parts[0]?.[0] ?? "?";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return `${a}${b}`.toUpperCase();
}

const AVATAR_PALETTE = [
  { bg: "bg-sky-500/15", text: "text-sky-700 dark:text-sky-200" },
  { bg: "bg-violet-500/15", text: "text-violet-700 dark:text-violet-200" },
  { bg: "bg-emerald-500/15", text: "text-emerald-700 dark:text-emerald-200" },
  { bg: "bg-amber-500/15", text: "text-amber-800 dark:text-amber-200" },
  { bg: "bg-rose-500/15", text: "text-rose-700 dark:text-rose-200" },
  { bg: "bg-teal-500/15", text: "text-teal-700 dark:text-teal-200" },
] as const;

export function pickAvatarPalette(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[idx]!;
}

