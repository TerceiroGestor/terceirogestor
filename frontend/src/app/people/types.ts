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
