import { buildOccurrenceWhere } from './occurrences.service';
import {
  assertOccurrenceStatusTransition,
  assertOutcomeNotesRequiredForClosing,
} from './occurrence-status';
import type { ListOccurrencesQueryDto } from './dto/list-occurrences-query.dto';

describe('buildOccurrenceWhere', () => {
  it('sempre filtra por tenantId, mesmo sem nenhum outro filtro', () => {
    const query: ListOccurrencesQueryDto = {};
    const where = buildOccurrenceWhere({ tenantId: 'tenant-a', query });

    expect(where.tenantId).toBe('tenant-a');
  });

  it('nunca deixa um tenantId de outro tenant vazar pelo filtro de busca/status', () => {
    const query: ListOccurrencesQueryDto = {
      status: 'EM_ANALISE',
      meetingId: 'meeting-1',
      q: 'briga',
    };
    const where = buildOccurrenceWhere({ tenantId: 'tenant-a', query });

    expect(where.tenantId).toBe('tenant-a');
    expect(where.status).toBe('EM_ANALISE');
    expect(where.meetingId).toBe('meeting-1');
  });
});

describe('assertOccurrenceStatusTransition', () => {
  it('permite avancar uma etapa', () => {
    expect(() =>
      assertOccurrenceStatusTransition('REGISTRADA', 'EM_ANALISE'),
    ).not.toThrow();
  });

  it('permite pular etapa (registrada direto para desfecho definido)', () => {
    expect(() =>
      assertOccurrenceStatusTransition('REGISTRADA', 'DESFECHO_DEFINIDO'),
    ).not.toThrow();
  });

  it('permite manter o mesmo status', () => {
    expect(() =>
      assertOccurrenceStatusTransition('EM_ANALISE', 'EM_ANALISE'),
    ).not.toThrow();
  });

  it('rejeita voltar de em analise para registrada', () => {
    expect(() =>
      assertOccurrenceStatusTransition('EM_ANALISE', 'REGISTRADA'),
    ).toThrow();
  });

  it('rejeita voltar de desfecho definido para qualquer etapa anterior', () => {
    expect(() =>
      assertOccurrenceStatusTransition('DESFECHO_DEFINIDO', 'EM_ANALISE'),
    ).toThrow();
  });
});

describe('assertOutcomeNotesRequiredForClosing', () => {
  it('exige outcomeNotes para fechar como desfecho definido', () => {
    expect(() =>
      assertOutcomeNotesRequiredForClosing('DESFECHO_DEFINIDO', null),
    ).toThrow();
    expect(() =>
      assertOutcomeNotesRequiredForClosing('DESFECHO_DEFINIDO', '   '),
    ).toThrow();
  });

  it('aceita fechar quando outcomeNotes esta preenchido', () => {
    expect(() =>
      assertOutcomeNotesRequiredForClosing(
        'DESFECHO_DEFINIDO',
        'Resolvido com a familia.',
      ),
    ).not.toThrow();
  });

  it('nao exige outcomeNotes pras etapas anteriores', () => {
    expect(() =>
      assertOutcomeNotesRequiredForClosing('REGISTRADA', null),
    ).not.toThrow();
    expect(() =>
      assertOutcomeNotesRequiredForClosing('EM_ANALISE', undefined),
    ).not.toThrow();
  });
});
