export const PEOPLE_DETAIL_TAB_VALUES = [
  "familia",
  "financeiro",
  "saude",
  "medicacoes",
  "escolaridade",
  "reclusao",
  "atendimentos",
] as const;

export type PeopleDetailTabValue = (typeof PEOPLE_DETAIL_TAB_VALUES)[number];

export function isPeopleDetailTabValue(
  value: string | null | undefined,
): value is PeopleDetailTabValue {
  return Boolean(value && PEOPLE_DETAIL_TAB_VALUES.includes(value as PeopleDetailTabValue));
}

export function buildPeopleDetailTabPath(
  personId: string,
  tab: Exclude<PeopleDetailTabValue, "atendimentos" | "resumo">,
) {
  return tab === "familia" ? `/person/${personId}` : `/person/${personId}?tab=${tab}`;
}

export function buildPeopleHealthConditionPath(
  personId: string,
  conditionId?: string,
) {
  return conditionId
    ? `/person/${personId}/health-conditions/${conditionId}`
    : `/person/${personId}/health-conditions/new`;
}

export function buildPeopleMedicationPath(
  personId: string,
  medicationId?: string,
) {
  return medicationId
    ? `/person/${personId}/medications/${medicationId}`
    : `/person/${personId}/medications/new`;
}

export function buildPeopleEducationPath(
  personId: string,
  educationId?: string,
) {
  return educationId
    ? `/person/${personId}/education/${educationId}`
    : `/person/${personId}/education/new`;
}

export function buildPeopleDetentionPath(
  personId: string,
  detentionId?: string,
) {
  return detentionId
    ? `/person/${personId}/detentions/${detentionId}`
    : `/person/${personId}/detentions/new`;
}

export function buildPeopleFamilyRelationPath(
  personId: string,
  relationId?: string,
) {
  return relationId
    ? `/person/${personId}/family-relations/${relationId}`
    : `/person/${personId}/family-relations/new`;
}

export function buildPeopleFinancialEntryPath(
  personId: string,
  entryId?: string,
) {
  return entryId
    ? `/person/${personId}/financial/${entryId}`
    : `/person/${personId}/financial/new`;
}
