import { buildReferralWhere } from './referrals.service';
import {
  assertOutcomeNotesRequiredForClosing,
  assertReferralStatusTransition,
} from './referral-status';
import type { ListReferralsQueryDto } from './dto/list-referrals-query.dto';

describe('buildReferralWhere', () => {
  it('sempre filtra por tenantId, mesmo sem nenhum outro filtro', () => {
    const query: ListReferralsQueryDto = {};
    const where = buildReferralWhere({ tenantId: 'tenant-a', query });

    expect(where.tenantId).toBe('tenant-a');
  });

  it('nunca deixa um tenantId de outro tenant vazar pelo filtro de busca/status', () => {
    const query: ListReferralsQueryDto = {
      status: 'EM_ACOMPANHAMENTO',
      type: 'SAUDE',
      attendanceId: 'attendance-1',
      evolutionId: 'evolution-1',
      destinationId: 'destination-1',
      q: 'hospital',
    };
    const where = buildReferralWhere({ tenantId: 'tenant-a', query });

    expect(where.tenantId).toBe('tenant-a');
    expect(where.status).toBe('EM_ACOMPANHAMENTO');
    expect(where.type).toBe('SAUDE');
    expect(where.attendanceId).toBe('attendance-1');
    expect(where.evolutionId).toBe('evolution-1');
    expect(where.destinationId).toBe('destination-1');
  });

  it('busca livre (q) filtra pelo nome da Rede de destino vinculada, nao mais texto livre no Referral', () => {
    const query: ListReferralsQueryDto = { q: 'hospital' };
    const where = buildReferralWhere({ tenantId: 'tenant-a', query });

    expect(where.destination).toEqual({
      name: { contains: 'hospital', mode: 'insensitive' },
    });
  });
});

describe('assertReferralStatusTransition', () => {
  it('permite avancar uma etapa', () => {
    expect(() =>
      assertReferralStatusTransition('ABERTO', 'EM_ACOMPANHAMENTO'),
    ).not.toThrow();
  });

  it('permite pular etapa (aberto direto para encerrado)', () => {
    expect(() =>
      assertReferralStatusTransition('ABERTO', 'ENCERRADO'),
    ).not.toThrow();
  });

  it('permite manter o mesmo status', () => {
    expect(() =>
      assertReferralStatusTransition('EM_ACOMPANHAMENTO', 'EM_ACOMPANHAMENTO'),
    ).not.toThrow();
  });

  it('rejeita voltar de em acompanhamento para aberto', () => {
    expect(() =>
      assertReferralStatusTransition('EM_ACOMPANHAMENTO', 'ABERTO'),
    ).toThrow();
  });

  it('rejeita voltar de encerrado para qualquer etapa anterior', () => {
    expect(() =>
      assertReferralStatusTransition('ENCERRADO', 'EM_ACOMPANHAMENTO'),
    ).toThrow();
  });
});

describe('assertOutcomeNotesRequiredForClosing', () => {
  it('exige outcomeNotes para encerrar', () => {
    expect(() =>
      assertOutcomeNotesRequiredForClosing('ENCERRADO', null),
    ).toThrow();
    expect(() =>
      assertOutcomeNotesRequiredForClosing('ENCERRADO', '   '),
    ).toThrow();
  });

  it('aceita encerrar quando outcomeNotes esta preenchido', () => {
    expect(() =>
      assertOutcomeNotesRequiredForClosing(
        'ENCERRADO',
        'Encerrado sem solucao - rede nao respondeu.',
      ),
    ).not.toThrow();
  });

  it('nao exige outcomeNotes pras etapas anteriores', () => {
    expect(() =>
      assertOutcomeNotesRequiredForClosing('ABERTO', null),
    ).not.toThrow();
    expect(() =>
      assertOutcomeNotesRequiredForClosing('EM_ACOMPANHAMENTO', undefined),
    ).not.toThrow();
  });
});
