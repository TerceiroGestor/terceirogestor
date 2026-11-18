import { BadRequestException } from '@nestjs/common';
import type { OccurrenceCaseStatus } from '../../generated/prisma';

const OCCURRENCE_STATUS_ORDER: OccurrenceCaseStatus[] = [
  'REGISTRADA',
  'EM_ANALISE',
  'DESFECHO_DEFINIDO',
];

/**
 * Ciclo da Ocorrencia (Fase 5) e avanco-so: pode pular etapa (ex.: registrada
 * -> desfecho definido direto), nunca regredir.
 */
export function assertOccurrenceStatusTransition(
  current: OccurrenceCaseStatus,
  next: OccurrenceCaseStatus,
): void {
  const currentIndex = OCCURRENCE_STATUS_ORDER.indexOf(current);
  const nextIndex = OCCURRENCE_STATUS_ORDER.indexOf(next);
  if (nextIndex < currentIndex) {
    throw new BadRequestException(
      `Nao e possivel voltar o status de "${current}" para "${next}"`,
    );
  }
}

/**
 * "Desfecho definido" sem desfecho nenhum preenchido nao faz sentido - exige
 * outcomeNotes no momento em que o status fecha.
 */
export function assertOutcomeNotesRequiredForClosing(
  nextStatus: OccurrenceCaseStatus,
  outcomeNotes: string | null | undefined,
): void {
  if (nextStatus === 'DESFECHO_DEFINIDO' && !outcomeNotes?.trim()) {
    throw new BadRequestException(
      'Informe o desfecho antes de concluir a ocorrencia',
    );
  }
}
