export type OccurrenceCaseStatus = "REGISTRADA" | "EM_ANALISE" | "DESFECHO_DEFINIDO";

export type OccurrencePersonRole = "ENVOLVIDO" | "TESTEMUNHA";

export type ApiOccurrencePerson = {
  id: string;
  tenantId: string;
  occurrenceId: string;
  personId: string;
  role: OccurrencePersonRole;
  createdAt: string;
  person: {
    id: string;
    fullName: string;
  };
};

export type ApiOccurrence = {
  id: string;
  tenantId: string;
  meetingId: string | null;
  title: string;
  description: string | null;
  status: OccurrenceCaseStatus;
  outcomeNotes: string | null;
  createdAt: string;
  updatedAt: string;
  meeting: {
    id: string;
    scheduledDate: string;
    action: {
      id: string;
      title: string;
      projectId: string;
    };
  } | null;
  people: ApiOccurrencePerson[];
};

export type OccurrenceInput = {
  meetingId?: string | null;
  title: string;
  description?: string | null;
  status?: OccurrenceCaseStatus;
  outcomeNotes?: string | null;
};

export type AddOccurrencePersonInput = {
  personId: string;
  role?: OccurrencePersonRole;
};

export type OccurrencesListResponse = {
  data: ApiOccurrence[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};
