export type PersonFormData = {
  avatarUrl?: string | File | null;
  fullName: string;
  socialName?: string | null;
  birthDate?: string | null;
  sex?: string | null;
  gender?: string | null;
  raceColor?: string | null;
  maritalStatus?: string | null;
  nationality?: string | null;
  email?: string | null;
  phone?: string | null;
  document?: string | null;
  rg?: string | null;
  nis?: string | null;
  status?: "Ativo" | "Inativo" | "Em analise" | "Desligado" | null;
  departureReason?: string | null;
  notes?: string | null;
  tags?: string[] | null;
  hasHealthIssue?: boolean | null;
  profileSummary?: string | null;
};

export type Person = Omit<PersonFormData, "avatarUrl"> & {
  id: string;
  avatarUrl?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type PeopleTableItem = {
  id: string;
  fullName: string;
  socialName?: string | null;
  sex?: string | null;
  gender?: string | null;
  raceColor?: string | null;
  maritalStatus?: string | null;
  nationality?: string | null;
  document?: string | null;
  rg?: string | null;
  nis?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: "Ativo" | "Inativo" | "Em analise" | "Desligado" | null;
  departureReason?: string | null;
  notes?: string | null;
  tags?: string[] | null;
  hasHealthIssue?: boolean | null;
  profileSummary?: string | null;
  birthDate?: string | null;
  age?: number | null;
  isBirthdayMonth?: boolean | null;
  isBirthdayToday?: boolean | null;
  avatarUrl?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type PersonSummary = {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  birthDate?: string | null;
  sex?: string | null;
  gender?: string | null;
  raceColor?: string | null;
  status?: string | null;
};

export type HouseholdInfo = {
  id: string;
  name?: string | null;
};

export type HouseholdMember = {
  id: string;
  personId: string;
  role?: string | null;
  isLegalGuardian: boolean;
  isIncomeContributor: boolean;
  isProvider: boolean;
  isDependent: boolean;
  notes?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  person: PersonSummary;
};

export type PersonRelation = {
  id: string;
  personId: string;
  relatedPersonId: string;
  type: string;
  livesTogether: boolean;
  isLegalGuardian: boolean;
  notes?: string | null;
  relatedPerson: PersonSummary;
};

export type PersonRelationsResponse = {
  household?: HouseholdInfo | null;
  householdMembers: HouseholdMember[];
  relations: PersonRelation[];
};

export type PersonRelationInput = {
  relatedPersonId: string;
  type: string;
  livesTogether?: boolean;
  isLegalGuardian?: boolean;
  notes?: string | null;
  householdRole?: string | null;
  isIncomeContributor?: boolean;
  isProvider?: boolean;
  isDependent?: boolean;
};

export type PersonIncome = {
  id: string;
  personId: string;
  type: string;
  amount: number;
  frequency: string;
  isHouseholdContribution: boolean;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type HouseholdProfile = {
  id: string;
  householdId: string;
  type?: string | null;
  condition?: string | null;
  ownership?: string | null;
  areaM2?: number | null;
  rooms?: number | null;
  bathrooms?: number | null;
  notes?: string | null;
};

export type HouseholdAsset = {
  id: string;
  householdId: string;
  category: string;
  item: string;
  quantity?: number | null;
  condition?: string | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type PersonAsset = {
  id: string;
  personId: string;
  category: string;
  item: string;
  quantity?: number | null;
  condition?: string | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type PersonAssetsGroup = {
  person: PersonSummary;
  assets: PersonAsset[];
};

export type FamilyIncomeSummary = {
  totalIncome: number;
  perCapitaIncome: number;
  benefitsTotal: number;
  pensionTotal: number;
  householdSize: number;
  contributors: string[];
};
