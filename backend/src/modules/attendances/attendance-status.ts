import { BadRequestException } from '@nestjs/common';
import type { AttendanceCaseStatus } from '../../generated/prisma';

/**
 * Diferente da Ocorrencia (Fase 5), o ciclo do Atendimento (Fase 6) nao e
 * avanco-so: um atendimento encerrado pode ser reaberto se a situacao
 * exigir continuidade - decisao de produto (prontuario tecnico real tem
 * esse fluxo). A unica regra e nao fechar sem parecer de encerramento.
 */
export function assertClosingNotesRequiredForClosing(
  nextStatus: AttendanceCaseStatus,
  closingNotes: string | null | undefined,
): void {
  if (nextStatus === 'ENCERRADO' && !closingNotes?.trim()) {
    throw new BadRequestException(
      'Informe o parecer de encerramento antes de encerrar o atendimento',
    );
  }
}
