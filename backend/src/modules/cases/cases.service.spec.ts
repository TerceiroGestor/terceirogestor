import { buildCaseWhere } from './cases.service';
import { assertClosingNotesRequiredForClosing } from './case-status';
import type { ListCasesQueryDto } from './dto/list-cases-query.dto';

describe('buildCaseWhere', () => {
  it('sempre filtra por tenantId, mesmo sem nenhum outro filtro', () => {
    const query: ListCasesQueryDto = {};
    const where = buildCaseWhere({ tenantId: 'tenant-a', query });

    expect(where.tenantId).toBe('tenant-a');
  });

  it('nunca deixa um tenantId de outro tenant vazar pelo filtro de busca/status', () => {
    const query: ListCasesQueryDto = { status: 'ENCERRADO', q: 'menstruacao' };
    const where = buildCaseWhere({ tenantId: 'tenant-a', query });

    expect(where.tenantId).toBe('tenant-a');
    expect(where.status).toBe('ENCERRADO');
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
        'Situacao resolvida com a rede.',
      ),
    ).not.toThrow();
  });

  it('permite reabrir um caso encerrado (ciclo nao e avanco-so)', () => {
    expect(() =>
      assertClosingNotesRequiredForClosing('ABERTO', 'Parecer anterior'),
    ).not.toThrow();
  });
});
