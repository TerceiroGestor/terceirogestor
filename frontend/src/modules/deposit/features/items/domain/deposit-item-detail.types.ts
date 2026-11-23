"use client";

export type DepositItemDetailMode = "create" | "edit";

export type ItemDraft = {
  name: string;
  group: string | null;
  defaultSector: string;
  unit: string;
  minStock: number;
};

