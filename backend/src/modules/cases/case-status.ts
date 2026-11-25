import { BadRequestException } from '@nestjs/common';
import type { CaseStatus } from '../../generated/prisma';

/**
 * Ciclo do Caso e reabrivel, mesmo principio do Attendance - um parecer
 * de encerramento nao impede a situacao de voltar depois. Unica regra:
 * exige closingNotes no momento em que fecha.
 */
export function assertClosingNotesRequiredForClosing(
  nextStatus: CaseStatus,
  closingNotes: string | null | undefined,
): void {
  if (nextStatus === 'ENCERRADO' && !closingNotes?.trim()) {
    throw new BadRequestException(
      'Informe o parecer de encerramento antes de encerrar o caso',
    );
  }
}
