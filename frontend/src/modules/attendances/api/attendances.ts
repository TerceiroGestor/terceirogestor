import { apiRequest, buildQuery } from "@/lib/api";
import type {
  AddAttendancePersonInput,
  ApiAttendance,
  AttendanceBenefitInput,
  AttendanceCaseStatus,
  AttendanceEvolutionInput,
  AttendanceInput,
  AttendanceType,
  AttendancesListResponse,
} from "./types";

export async function listAttendances(
  token: string,
  params?: {
    q?: string;
    type?: AttendanceType;
    status?: AttendanceCaseStatus;
    professionalId?: string;
    occurrenceId?: string;
    page?: number;
    limit?: number;
    all?: boolean;
  },
) {
  const query = buildQuery(params);
  return apiRequest<AttendancesListResponse>(`/attendances${query}`, {}, token);
}

export async function getAttendance(token: string, id: string) {
  return apiRequest<ApiAttendance>(`/attendances/${id}`, {}, token);
}

export async function createAttendance(token: string, payload: AttendanceInput) {
  return apiRequest<ApiAttendance>(
    "/attendances",
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );
}

export async function updateAttendance(
  token: string,
  id: string,
  payload: Partial<AttendanceInput>,
) {
  return apiRequest<ApiAttendance>(
    `/attendances/${id}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token,
  );
}

export async function deleteAttendance(token: string, id: string) {
  return apiRequest<{ success: true }>(`/attendances/${id}`, { method: "DELETE" }, token);
}

export async function addAttendancePerson(
  token: string,
  attendanceId: string,
  payload: AddAttendancePersonInput,
) {
  return apiRequest<ApiAttendance>(
    `/attendances/${attendanceId}/people`,
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );
}

export async function removeAttendancePerson(
  token: string,
  attendanceId: string,
  linkId: string,
) {
  return apiRequest<ApiAttendance>(
    `/attendances/${attendanceId}/people/${linkId}`,
    { method: "DELETE" },
    token,
  );
}

export async function addAttendanceEvolution(
  token: string,
  attendanceId: string,
  payload: AttendanceEvolutionInput,
) {
  return apiRequest<ApiAttendance>(
    `/attendances/${attendanceId}/evolutions`,
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );
}

export async function updateAttendanceEvolution(
  token: string,
  attendanceId: string,
  evolutionId: string,
  payload: Partial<AttendanceEvolutionInput>,
) {
  return apiRequest<ApiAttendance>(
    `/attendances/${attendanceId}/evolutions/${evolutionId}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token,
  );
}

export async function removeAttendanceEvolution(
  token: string,
  attendanceId: string,
  evolutionId: string,
) {
  return apiRequest<ApiAttendance>(
    `/attendances/${attendanceId}/evolutions/${evolutionId}`,
    { method: "DELETE" },
    token,
  );
}

export async function addAttendanceBenefit(
  token: string,
  attendanceId: string,
  payload: AttendanceBenefitInput,
) {
  return apiRequest<ApiAttendance>(
    `/attendances/${attendanceId}/benefits`,
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );
}

export async function updateAttendanceBenefit(
  token: string,
  attendanceId: string,
  benefitId: string,
  payload: Partial<AttendanceBenefitInput>,
) {
  return apiRequest<ApiAttendance>(
    `/attendances/${attendanceId}/benefits/${benefitId}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token,
  );
}

export async function removeAttendanceBenefit(
  token: string,
  attendanceId: string,
  benefitId: string,
) {
  return apiRequest<ApiAttendance>(
    `/attendances/${attendanceId}/benefits/${benefitId}`,
    { method: "DELETE" },
    token,
  );
}
