"use client";

import * as React from "react";
import type {
  FamilyIncomeSummary,
  HouseholdProfile,
  HouseholdAsset,
  PersonAssetsGroup,
  PersonRelationInput,
  PersonRelationsResponse,
  PersonSummary,
} from "@/app/[tenant]/(modules)/people/types";
import { useFamilyRelations } from "@/features/family-members/data/use-family-relations";

type AssetInput = {
  category: string;
  item: string;
  quantity?: number | null;
  condition?: string | null;
  notes?: string | null;
};

type FamilyRelationsContextValue = {
  data: PersonRelationsResponse | null;
  isLoading: boolean;
  error: string | null;
  peopleOptions: PersonSummary[];
  incomeSummary: FamilyIncomeSummary | null;
  householdProfile: HouseholdProfile | null;
  householdAssets: HouseholdAsset[];
  personAssetsByMember: PersonAssetsGroup[];
  refresh: () => Promise<void>;
  create: (payload: PersonRelationInput) => Promise<void>;
  update: (
    relationId: string,
    payload: Partial<PersonRelationInput>,
  ) => Promise<void>;
  remove: (relationId: string) => Promise<void>;
  upsertHouseholdProfile: (payload: Partial<HouseholdProfile>) => Promise<void>;
  createHouseholdAsset: (payload: AssetInput) => Promise<void>;
  updateHouseholdAsset: (
    assetId: string,
    payload: Partial<AssetInput>,
  ) => Promise<void>;
  removeHouseholdAsset: (assetId: string) => Promise<void>;
  createPersonAsset: (personId: string, payload: AssetInput) => Promise<void>;
  updatePersonAsset: (
    personId: string,
    assetId: string,
    payload: Partial<AssetInput>,
  ) => Promise<void>;
  removePersonAsset: (personId: string, assetId: string) => Promise<void>;
};

const FamilyRelationsContext =
  React.createContext<FamilyRelationsContextValue | null>(null);

export function FamilyRelationsProvider({
  personId,
  children,
}: {
  personId: string;
  children: React.ReactNode;
}) {
  const value = useFamilyRelations(personId);
  return (
    <FamilyRelationsContext.Provider value={value}>
      {children}
    </FamilyRelationsContext.Provider>
  );
}

export function useFamilyRelationsContext() {
  const context = React.useContext(FamilyRelationsContext);
  if (!context) {
    throw new Error(
      "useFamilyRelationsContext deve ser usado dentro de FamilyRelationsProvider",
    );
  }
  return context;
}

