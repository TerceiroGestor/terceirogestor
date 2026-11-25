export type AttendanceType = "SOCIAL" | "PSICOLOGICO";

export type AttendanceCaseStatus = "ABERTO" | "ENCERRADO";

export type AttendancePersonRole =
  | "ATENDIDO_PRINCIPAL"
  | "ATENDIDO_SECUNDARIO"
  | "FAMILIAR";

export type ApiAttendancePerson = {
  id: string;
  tenantId: string;
  attendanceId: string;
  personId: string;
  role: AttendancePersonRole;
  createdAt: string;
  person: {
    id: string;
    fullName: string;
  };
};

export type ApiAttendanceEvolution = {
  id: string;
  tenantId: string;
  attendanceId: string;
  date: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type ApiAttendanceBenefit = {
  id: string;
  tenantId: string;
  attendanceId: string;
  name: string;
  date: string;
  quantity: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiAttendance = {
  id: string;
  tenantId: string;
  occurrenceId: string | null;
  caseId: string | null;
  type: AttendanceType;
  scheduledDate: string;
  professionalId: string;
  status: AttendanceCaseStatus;
  notes: string | null;
  closingNotes: string | null;
  createdAt: string;
  updatedAt: string;
  occurrence: {
    id: string;
    title: string;
  } | null;
  case: {
    id: string;
    title: string;
    status: string;
  } | null;
  professional: {
    id: string;
    fullName: string;
  };
  people: ApiAttendancePerson[];
  evolutions: ApiAttendanceEvolution[];
  benefits: ApiAttendanceBenefit[];
};

export type AttendanceInput = {
  type: AttendanceType;
  scheduledDate: string;
  professionalId: string;
  occurrenceId?: string | null;
  caseId?: string | null;
  status?: AttendanceCaseStatus;
  notes?: string | null;
  closingNotes?: string | null;
};

export type AddAttendancePersonInput = {
  personId: string;
  role?: AttendancePersonRole;
};

export type AttendanceEvolutionInput = {
  date: string;
  notes: string;
};

export type AttendanceBenefitInput = {
  evolutionId: string;
  name: string;
  date: string;
  quantity?: number | null;
  notes?: string | null;
};

export type AttendancesListResponse = {
  data: ApiAttendance[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};
