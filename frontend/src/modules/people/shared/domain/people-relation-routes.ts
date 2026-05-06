export const PEOPLE_DETAIL_TAB_VALUES = [
  "familia",
  "endereco",
  "contatos",
  "financeiro",
  "saude",
  "medicacoes",
  "escolaridade",
  "reclusao",
] as const;

export type PeopleDetailTabValue = (typeof PEOPLE_DETAIL_TAB_VALUES)[number];

export function isPeopleDetailTabValue(
  value: string | null | undefined,
): value is PeopleDetailTabValue {
  return Boolean(value && PEOPLE_DETAIL_TAB_VALUES.includes(value as PeopleDetailTabValue));
}

export function buildPeopleDetailTabPath(
  personId: string,
  tab: Exclude<PeopleDetailTabValue, "resumo">,
) {
  return tab === "familia" ? `/people/${personId}` : `/people/${personId}?tab=${tab}`;
}

export function buildPeopleHealthConditionPath(
  personId: string,
  conditionId?: string,
) {
  return conditionId
    ? `/people/${personId}/health-conditions/${conditionId}`
    : `/people/${personId}/health-conditions/new`;
}

export function buildPeopleMedicationPath(
  personId: string,
  medicationId?: string,
) {
  return medicationId
    ? `/people/${personId}/medications/${medicationId}`
    : `/people/${personId}/medications/new`;
}

export function buildPeopleEducationPath(
  personId: string,
  educationId?: string,
) {
  return educationId
    ? `/people/${personId}/education/${educationId}`
    : `/people/${personId}/education/new`;
}

export function buildPeopleDetentionPath(
  personId: string,
  detentionId?: string,
) {
  return detentionId
    ? `/people/${personId}/detentions/${detentionId}`
    : `/people/${personId}/detentions/new`;
}

export function buildPeopleFamilyRelationPath(
  personId: string,
  relationId?: string,
) {
  return relationId
    ? `/people/${personId}/family-relations/${relationId}`
    : `/people/${personId}/family-relations/new`;
}

export function buildPeopleFinancialEntryPath(
  personId: string,
  entryId?: string,
) {
  return entryId
    ? `/people/${personId}/financial/${entryId}`
    : `/people/${personId}/financial/new`;
}

export function buildPeopleContactPath(
  personId: string,
  contactId?: string,
) {
  return contactId
    ? `/people/${personId}/contacts/${contactId}`
    : `/people/${personId}/contacts/new`;
}

export function buildPeopleAddressPath(
  personId: string,
  addressId?: string,
) {
  return addressId
    ? `/people/${personId}/address/${addressId}`
    : `/people/${personId}/address/new`;
}
