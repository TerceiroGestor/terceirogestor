export type PersonFormData = {
  avatarUrl?: string | File | null;
  fullName: string;
  socialName?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  maritalStatus?: string | null;
  nationality?: string | null;
  email?: string | null;
  phone?: string | null;
  document?: string | null;
  rg?: string | null;
  nis?: string | null;
  status?: "Ativo" | "Inativo" | "Em analise" | null;
  notes?: string | null;
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
  gender?: string | null;
  maritalStatus?: string | null;
  nationality?: string | null;
  document?: string | null;
  rg?: string | null;
  nis?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: "Ativo" | "Inativo" | "Em analise" | null;
  notes?: string | null;
  profileSummary?: string | null;
  birthDate?: string | null;
  avatarUrl?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};
