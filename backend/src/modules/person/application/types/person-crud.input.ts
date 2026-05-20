export type CreatePersonInput = {
  fullName: string;
  socialName?: string | null;
  birthDate?: string | null;
  sex?: string | null;
  gender?: string | null;
  maritalStatus?: string | null;
  raceColor?: string | null;
  nationality?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  personType?: string | null;
  departureReason?: string | null;
  notes?: string | null;
  tags?: string[] | null;
  profileSummary?: string | null;
  avatarUrl?: string | null;
};

export type UpdatePersonInput = {
  fullName?: string;
  socialName?: string | null;
  birthDate?: string | null;
  sex?: string | null;
  gender?: string | null;
  maritalStatus?: string | null;
  raceColor?: string | null;
  nationality?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  personType?: string | null;
  departureReason?: string | null;
  notes?: string | null;
  tags?: string[] | null;
  profileSummary?: string | null;
  avatarUrl?: string | null;
};

export type ListPersonInput = {
  all?: boolean;
  page?: number;
  limit?: number;
  q?: string;
  filters?: string;
  groupBy?: string;
};