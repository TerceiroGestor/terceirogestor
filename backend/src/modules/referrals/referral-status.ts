import { BadRequestException } from '@nestjs/common';
import type { ReferralStatus } from '../../generated/prisma';

const REFERRAL_STATUS_ORDER: ReferralStatus[] = [
  'ABERTO',
  'EM_ACOMPANHAMENTO',
  'ENCERRADO',
];

/**
 * Ciclo do Encaminhamento (Fase 7) e avanco-so, igual Ocorrencia (Fase 5):
 * pode pular etapa, nunca regredir. Diferente do Atendimento (Fase 6), nao
 * reabre - encerrar sem solucao abre um segundo Encaminhamento pra mesma
 * situacao (decisao de produto, ver criterio de teste da Fase 7).
 */
export function assertReferralStatusTransition(
  current: ReferralStatus,
  next: ReferralStatus,
): void {
  const currentIndex = REFERRAL_STATUS_ORDER.indexOf(current);
  const nextIndex = REFERRAL_STATUS_ORDER.indexOf(next);
  if (nextIndex < currentIndex) {
    throw new BadRequestException(
      `Nao e possivel voltar o status de "${current}" para "${next}"`,
    );
  }
}

/**
 * "Encerrado" sem desfecho nenhum preenchido nao faz sentido - exige
 * outcomeNotes no momento em que o status fecha.
 */
export function assertOutcomeNotesRequiredForClosing(
  nextStatus: ReferralStatus,
  outcomeNotes: string | null | undefined,
): void {
  if (nextStatus === 'ENCERRADO' && !outcomeNotes?.trim()) {
    throw new BadRequestException(
      'Informe o desfecho antes de encerrar o encaminhamento',
    );
  }
}
