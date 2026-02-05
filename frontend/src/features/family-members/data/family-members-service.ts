"use client";

import type {
  FamilyMember,
  FamilyMemberFormData,
  FamilySummary,
} from "@/features/family-members/domain/types";

const store = new Map<string, FamilyMember[]>();

const seed: Record<string, FamilyMember[]> = {
  "p-001": [
    {
      id: "fam-ana-01",
      name: "Lucas Campos",
      relationship: "Responsavel",
      livesTogether: true,
      contributesIncome: true,
      income: 2800,
      notes: "Responsavel principal.",
    },
    {
      id: "fam-ana-02",
      name: "Marina Campos",
      relationship: "Filha",
      livesTogether: true,
      contributesIncome: false,
      notes: "Dependente.",
    },
  ],
  "p-002": [
    {
      id: "fam-bruno-01",
      name: "Marina Ferreira",
      relationship: "Conjuge",
      livesTogether: true,
      contributesIncome: true,
      income: 3200,
    },
  ],
  "p-003": [],
};

const summarySeed: Record<string, FamilySummary> = {
  "p-001": {
    householdMembers: 3,
    dependents: 1,
    dependentAgeRange: { min: 6, max: 12 },
  },
  "p-002": {
    householdMembers: 4,
    dependents: 2,
    dependentAgeRange: { min: 3, max: 14 },
  },
  "p-003": {
    householdMembers: 2,
    dependents: 0,
    dependentAgeRange: { min: "", max: "" },
  },
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
    : `fam-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export async function getFamilyMembersByPersonId(
  personId: string,
): Promise<FamilyMember[]> {
  ensureSeed();
  return store.get(personId) ?? [];
}

export async function getFamilySummaryByPersonId(
  personId: string,
): Promise<FamilySummary> {
  return summarySeed[personId] ?? {
    householdMembers: 0,
    dependents: 0,
    dependentAgeRange: { min: "", max: "" },
  };
}

export async function createFamilyMember(
  personId: string,
  data: FamilyMemberFormData,
): Promise<FamilyMember> {
  ensureSeed();
  const next = { id: createId(), ...data };
  const current = store.get(personId) ?? [];
  store.set(personId, [...current, next]);
  return next;
}

export async function updateFamilyMember(
  personId: string,
  memberId: string,
  data: FamilyMemberFormData,
): Promise<FamilyMember | null> {
  ensureSeed();
  const current = store.get(personId) ?? [];
  let updated: FamilyMember | null = null;
  const next = current.map((item) => {
    if (item.id !== memberId) return item;
    updated = { ...item, ...data };
    return updated;
  });
  store.set(personId, next);
  return updated;
}

export async function deleteFamilyMember(
  personId: string,
  memberId: string,
): Promise<void> {
  ensureSeed();
  const current = store.get(personId) ?? [];
  store.set(
    personId,
    current.filter((item) => item.id !== memberId),
  );
}
