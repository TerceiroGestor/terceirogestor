export type ApiPerson = {
  id: string;
  tenantId: string;
  fullName: string;
  socialName: string | null;
  birthDate: string | null;
  sex: string | null;
  gender: string | null;
  raceColor: string | null;
  maritalStatus: string | null;
  nationality: string | null;
  email: string | null;
  phone: string | null;
  document: string | null;
  rg: string | null;
  nis: string | null;
  status: string | null;
  personType: string | null;
  departureReason: string | null;
  notes: string | null;
  tags: string[] | null;
  hasHealthCondition: boolean | null;
  hasMedication: boolean | null;
  hasHealthIssue?: boolean | null;
  profileSummary: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PeopleListResponse = {
  data: ApiPerson[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export type PersonInput = {
  fullName?: string;
  birthDate?: string | null;
  sex?: string | null;
  socialName?: string | null;
  gender?: string | null;
  raceColor?: string | null;
  maritalStatus?: string | null;
  nationality?: string | null;
  email?: string | null;
  phone?: string | null;
  document?: string | null;
  rg?: string | null;
  nis?: string | null;
  status?: string | null;
  personType?: string | null;
  departureReason?: string | null;
  notes?: string | null;
  tags?: string[] | null;
  profileSummary?: string | null;
  avatarUrl?: string | null;
};

export type ApiPersonSummary = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  birthDate: string | null;
  sex: string | null;
  gender: string | null;
  raceColor: string | null;
  status: string | null;
  personType?: string | null;
  hasHealthCondition?: boolean | null;
  hasMedication?: boolean | null;
};

export type ApiPersonIdentityMember = {
  id: string;
  fullName: string;
  socialName: string | null;
  birthDate: string | null;
  avatarUrl: string | null;
  role: string;
  hasHealthCondition: boolean;
  hasMedication: boolean;
};

export type ApiPersonIdentityResponse = {
  person: {
    id: string;
    fullName: string;
    socialName: string | null;
    birthDate: string | null;
    avatarUrl: string | null;
    hasHealthCondition: boolean;
    hasMedication: boolean;
  };
  family: {
    livingTogether: ApiPersonIdentityMember[];
    notLivingTogether: ApiPersonIdentityMember[];
  };
};
