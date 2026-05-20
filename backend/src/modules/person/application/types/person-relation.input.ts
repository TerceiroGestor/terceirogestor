export type CreatePersonRelationInput = {
  relatedPersonId: string;
  type: string;
  livesTogether?: boolean;
  isLegalGuardian?: boolean;
  isHouseholdHead?: boolean;
  notes?: string;
  householdRole?: string;
  isIncomeContributor?: boolean;
  isProvider?: boolean;
  isDependent?: boolean;
};

export type UpdatePersonRelationInput = {
  type?: string;
  livesTogether?: boolean;
  isLegalGuardian?: boolean;
  isHouseholdHead?: boolean;
  notes?: string;
  householdRole?: string;
  isIncomeContributor?: boolean;
  isProvider?: boolean;
  isDependent?: boolean;
};