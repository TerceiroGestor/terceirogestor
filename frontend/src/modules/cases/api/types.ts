export type CaseStatus = "ABERTO" | "ENCERRADO";

export type ApiCasePerson = {
  id: string;
  tenantId: string;
  caseId: string;
  personId: string;
  createdAt: string;
  person: { id: string; fullName: string };
};

export type ApiCaseOccurrenceSummary = { id: string; title: string; status: string };
export type ApiCaseAttendanceSummary = {
  id: string;
  type: "SOCIAL" | "PSICOLOGICO";
  status: string;
  scheduledDate: string;
};

export type ApiCase = {
  id: string;
  tenantId: string;
  title: string;
  summary: string | null;
  status: CaseStatus;
  closingNotes: string | null;
  createdAt: string;
  updatedAt: string;
  people: ApiCasePerson[];
  occurrences: ApiCaseOccurrenceSummary[];
  attendances: ApiCaseAttendanceSummary[];
};

export type CaseInput = {
  title: string;
  summary?: string | null;
  status?: CaseStatus;
  closingNotes?: string | null;
};

export type AddCasePersonInput = { personId: string };

export type CasesListResponse = {
  data: ApiCase[];
  pagination: { page: number; limit: number; total: number; pages: number };
};

export type ApiCaseReport = {
  caseId: string;
  title: string;
  status: CaseStatus;
  closingNotes: string | null;
  occurrencesCount: number;
  attendancesCount: number;
  evolutionsCount: number;
  referralsCount: number;
  benefitsCount: number;
};
