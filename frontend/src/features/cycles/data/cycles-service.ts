"use client";

import type { Cycle, CycleFormData } from "@/features/cycles/domain/types";

const store = new Map<string, Cycle[]>();

const seed: Record<string, Cycle[]> = {
  "p-001": [
    {
      id: "cy-ana-2025",
      title: "Ciclo 2",
      status: "Atual",
      startDate: "2025-01-10",
      endDate: "",
    },
    {
      id: "cy-ana-2024",
      title: "Ciclo 1",
      status: "Historico",
      startDate: "2024-02-01",
      endDate: "2024-12-20",
    },
  ],
  "p-002": [
    {
      id: "cy-bruno-2025",
      title: "Ciclo 3",
      status: "Atual",
      startDate: "2025-01-20",
      endDate: "",
    },
    {
      id: "cy-bruno-2024",
      title: "Ciclo 2",
      status: "Historico",
      startDate: "2024-02-01",
      endDate: "2024-12-20",
    },
  ],
  "p-003": [
    {
      id: "cy-carla-2025",
      title: "Ciclo 1",
      status: "Atual",
      startDate: "2025-03-01",
      endDate: "",
    },
  ],
};

const ensureSeed = () => {
  if (store.size > 0) return;
  Object.entries(seed).forEach(([personId, items]) => {
    store.set(personId, items.map((item) => ({ ...item })));
  });
};

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `cy-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export async function getCyclesByPersonId(personId: string): Promise<Cycle[]> {
  ensureSeed();
  return store.get(personId) ?? [];
}

export async function createCycle(
  personId: string,
  data: CycleFormData,
): Promise<Cycle> {
  ensureSeed();
  const next = { id: createId(), ...data };
  const current = store.get(personId) ?? [];
  store.set(personId, [...current, next]);
  return next;
}

export async function updateCycle(
  personId: string,
  cycleId: string,
  data: CycleFormData,
): Promise<Cycle | null> {
  ensureSeed();
  const current = store.get(personId) ?? [];
  let updated: Cycle | null = null;
  const next = current.map((item) => {
    if (item.id !== cycleId) return item;
    updated = { ...item, ...data };
    return updated;
  });
  store.set(personId, next);
  return updated;
}

export async function deleteCycle(
  personId: string,
  cycleId: string,
): Promise<void> {
  ensureSeed();
  const current = store.get(personId) ?? [];
  store.set(
    personId,
    current.filter((item) => item.id !== cycleId),
  );
}
