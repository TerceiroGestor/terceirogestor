"use client";

import * as React from "react";
import { useAuth } from "@/features/auth/auth-context";
import type {
  FamilyIncomeSummary,
  HouseholdProfile,
  HouseholdAsset,
  PersonAssetsGroup,
  PersonRelationInput,
  PersonRelationsResponse,
  PersonSummary,
} from "@/app/[tenant]/(modules)/people/types";
import {
  createHouseholdAsset,
  createPersonAsset,
  createPersonRelation,
  deleteHouseholdAsset,
  deletePersonAsset,
  deletePersonRelation,
  getHouseholdAssets,
  getPersonRelations,
  getFamilyIncomeSummary,
  getHouseholdProfile,
  getHouseholdPersonAssets,
  listPeople,
  updateHouseholdAsset,
  updatePersonAsset,
  updatePersonRelation,
  type ApiPerson,
} from "@/features/people/api";

type AssetInput = {
  category: string;
  item: string;
  quantity?: number | null;
  condition?: string | null;
  notes?: string | null;
};

type UseFamilyRelationsResult = {
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

const buildPeopleIndex = (people: ApiPerson[]) =>
  people.reduce<Record<string, ApiPerson>>((acc, person) => {
    acc[person.id] = person;
    return acc;
  }, {});

const mergePersonSummary = (
  person: PersonSummary,
  index: Record<string, ApiPerson>,
): PersonSummary => {
  const details = index[person.id];
  if (!details) return person;
  return {
    ...person,
    avatarUrl: person.avatarUrl ?? details.avatarUrl ?? null,
    birthDate: person.birthDate ?? details.birthDate ?? null,
    sex: person.sex ?? details.sex ?? null,
    gender: person.gender ?? details.gender ?? null,
    raceColor: person.raceColor ?? details.raceColor ?? null,
    status: person.status ?? details.status ?? null,
    personType: person.personType ?? details.personType ?? null,
    hasHealthCondition:
      person.hasHealthCondition ?? details.hasHealthCondition ?? null,
    hasMedication: person.hasMedication ?? details.hasMedication ?? null,
  };
};

const mergeRelationsResponse = (
  response: PersonRelationsResponse,
  index: Record<string, ApiPerson>,
): PersonRelationsResponse => ({
  ...response,
  householdMembers: response.householdMembers.map((member) => ({
    ...member,
    person: mergePersonSummary(member.person, index),
  })),
  relations: response.relations.map((relation) => ({
    ...relation,
    relatedPerson: mergePersonSummary(relation.relatedPerson, index),
  })),
});

export function useFamilyRelations(personId: string): UseFamilyRelationsResult {
  const { token } = useAuth();
  const [data, setData] = React.useState<PersonRelationsResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [peopleOptions, setPeopleOptions] = React.useState<PersonSummary[]>([]);
  const [peopleIndex, setPeopleIndex] = React.useState<Record<string, ApiPerson>>({});
  const peopleIndexRef = React.useRef<Record<string, ApiPerson>>({});
  const [incomeSummary, setIncomeSummary] =
    React.useState<FamilyIncomeSummary | null>(null);
  const [householdProfile, setHouseholdProfile] =
    React.useState<HouseholdProfile | null>(null);
  const [householdAssets, setHouseholdAssets] = React.useState<
    HouseholdAsset[]
  >([]);
  const [personAssetsByMember, setPersonAssetsByMember] = React.useState<
    PersonAssetsGroup[]
  >([]);
  const [loaded, setLoaded] = React.useState(false);

  const refresh = React.useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const [
        relationsResponse,
        incomeResponse,
        profileResponse,
        householdAssetsResponse,
        personAssetsResponse,
      ] = await Promise.all([
        getPersonRelations(token, personId),
        getFamilyIncomeSummary(token, personId),
        getHouseholdProfile(token, personId),
        getHouseholdAssets(token, personId),
        getHouseholdPersonAssets(token, personId),
      ]);
      const enriched = mergeRelationsResponse(
        relationsResponse,
        peopleIndexRef.current,
      );
      setData(enriched);
      setIncomeSummary(incomeResponse);
      setHouseholdProfile(profileResponse);
      setHouseholdAssets(householdAssetsResponse);
      setPersonAssetsByMember(personAssetsResponse);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar vinculos familiares.";
      setError(message);
    } finally {
      setIsLoading(false);
      setLoaded(true);
    }
  }, [token, personId]);

  React.useEffect(() => {
    if (!token) return;
    if (loaded || isLoading) return;
    refresh();
  }, [token, loaded, isLoading, refresh]);

  React.useEffect(() => {
    if (!token) return;
    listPeople(token, { all: true })
      .then((response) => {
        const index = buildPeopleIndex(response.data);
        setPeopleIndex(index);
        const options = response.data
          .filter((item) => item.id !== personId)
          .map((item) => ({
            id: item.id,
            fullName: item.fullName,
            avatarUrl: item.avatarUrl,
            birthDate: item.birthDate,
            sex: item.sex,
            gender: item.gender,
            raceColor: item.raceColor,
            status: item.status,
            personType: item.personType ?? null,
            hasHealthCondition: item.hasHealthCondition ?? null,
            hasMedication: item.hasMedication ?? null,
          }));
        setPeopleOptions(options);
        setData((prev) =>
          prev ? mergeRelationsResponse(prev, index) : prev,
        );
      })
      .catch(() => {
        setPeopleOptions([]);
      });
  }, [token, personId]);

  React.useEffect(() => {
    peopleIndexRef.current = peopleIndex;
  }, [peopleIndex]);

  const create = React.useCallback(
    async (payload: PersonRelationInput) => {
      if (!token) return;
      await createPersonRelation(token, personId, payload);
    },
    [token, personId],
  );

  const update = React.useCallback(
    async (relationId: string, payload: Partial<PersonRelationInput>) => {
      if (!token) return;
      await updatePersonRelation(token, personId, relationId, payload);
    },
    [token, personId],
  );

  const remove = React.useCallback(
    async (relationId: string) => {
      if (!token) return;
      await deletePersonRelation(token, personId, relationId);
    },
    [token, personId],
  );

  const createHouseholdAssetHandler = React.useCallback(
    async (payload: AssetInput) => {
      if (!token) return;
      await createHouseholdAsset(token, personId, payload);
      await refresh();
    },
    [token, personId, refresh],
  );

  const updateHouseholdAssetHandler = React.useCallback(
    async (assetId: string, payload: Partial<AssetInput>) => {
      if (!token) return;
      await updateHouseholdAsset(token, personId, assetId, payload);
      await refresh();
    },
    [token, personId, refresh],
  );

  const removeHouseholdAssetHandler = React.useCallback(
    async (assetId: string) => {
      if (!token) return;
      await deleteHouseholdAsset(token, personId, assetId);
      await refresh();
    },
    [token, personId, refresh],
  );

  const createPersonAssetHandler = React.useCallback(
    async (targetPersonId: string, payload: AssetInput) => {
      if (!token) return;
      await createPersonAsset(token, targetPersonId, payload);
      await refresh();
    },
    [token, refresh],
  );

  const updatePersonAssetHandler = React.useCallback(
    async (
      targetPersonId: string,
      assetId: string,
      payload: Partial<AssetInput>,
    ) => {
      if (!token) return;
      await updatePersonAsset(token, targetPersonId, assetId, payload);
      await refresh();
    },
    [token, refresh],
  );

  const removePersonAssetHandler = React.useCallback(
    async (targetPersonId: string, assetId: string) => {
      if (!token) return;
      await deletePersonAsset(token, targetPersonId, assetId);
      await refresh();
    },
    [token, refresh],
  );

  return {
    data,
    isLoading,
    error,
    peopleOptions,
    incomeSummary,
    householdProfile,
    householdAssets,
    personAssetsByMember,
    refresh,
    create,
    update,
    remove,
    createHouseholdAsset: createHouseholdAssetHandler,
    updateHouseholdAsset: updateHouseholdAssetHandler,
    removeHouseholdAsset: removeHouseholdAssetHandler,
    createPersonAsset: createPersonAssetHandler,
    updatePersonAsset: updatePersonAssetHandler,
    removePersonAsset: removePersonAssetHandler,
  };
}

