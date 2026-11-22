export function buildAttendanceEvolutionPath(attendanceId: string, evolutionId: string) {
  return `/attendances/${attendanceId}/evolutions/${evolutionId}`;
}

export function buildAttendanceBenefitPath(attendanceId: string, benefitId: string) {
  return `/attendances/${attendanceId}/benefits/${benefitId}`;
}
