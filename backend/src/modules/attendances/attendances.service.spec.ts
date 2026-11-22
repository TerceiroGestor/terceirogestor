import { buildAttendanceWhere } from './attendances.service';
import { assertClosingNotesRequiredForClosing } from './attendance-status';
import type { ListAttendancesQueryDto } from './dto/list-attendances-query.dto';

describe('buildAttendanceWhere', () => {
  it('sempre filtra por tenantId, mesmo sem nenhum outro filtro', () => {
    const query: ListAttendancesQueryDto = {};
    const where = buildAttendanceWhere({ tenantId: 'tenant-a', query });

    expect(where.tenantId).toBe('tenant-a');
  });

  it('nunca deixa um tenantId de outro tenant vazar pelo filtro de busca/status', () => {
    const query: ListAttendancesQueryDto = {
      type: 'PSICOLOGICO',
      status: 'ABERTO',
      professionalId: 'person-1',
      occurrenceId: 'occurrence-1',
      q: 'maria',
    };
    const where = buildAttendanceWhere({ tenantId: 'tenant-a', query });

    expect(where.tenantId).toBe('tenant-a');
    expect(where.type).toBe('PSICOLOGICO');
    expect(where.status).toBe('ABERTO');
    expect(where.professionalId).toBe('person-1');
    expect(where.occurrenceId).toBe('occurrence-1');
  });
});

describe('assertClosingNotesRequiredForClosing', () => {
  it('exige closingNotes para encerrar', () => {
    expect(() =>
      assertClosingNotesRequiredForClosing('ENCERRADO', null),
    ).toThrow();
    expect(() =>
      assertClosingNotesRequiredForClosing('ENCERRADO', '   '),
    ).toThrow();
  });

  it('aceita encerrar quando closingNotes esta preenchido', () => {
    expect(() =>
      assertClosingNotesRequiredForClosing(
        'ENCERRADO',
        'Caso resolvido com a rede.',
      ),
    ).not.toThrow();
  });

  it('nao exige closingNotes enquanto o atendimento esta aberto', () => {
    expect(() =>
      assertClosingNotesRequiredForClosing('ABERTO', null),
    ).not.toThrow();
    expect(() =>
      assertClosingNotesRequiredForClosing('ABERTO', undefined),
    ).not.toThrow();
  });

  it('permite reabrir um atendimento encerrado (ciclo nao e avanco-so)', () => {
    expect(() =>
      assertClosingNotesRequiredForClosing('ABERTO', 'Parecer anterior'),
    ).not.toThrow();
  });
});
