import {
  buildPeopleWhere,
  extractBirthdayMonthFilter,
  type AdvancedFilter,
} from './people.filters';

describe('extractBirthdayMonthFilter', () => {
  it('retorna null e os filtros intactos quando nao ha filtro de aniversariante', () => {
    const filters: AdvancedFilter[] = [
      { columnId: 'status', operator: 'equals', value: 'Ativo' },
    ];

    expect(extractBirthdayMonthFilter(filters)).toEqual({
      filters,
      wantsBirthdayMonth: null,
    });
  });

  it('extrai o filtro "true" e remove ele da lista', () => {
    const statusFilter: AdvancedFilter = {
      columnId: 'status',
      operator: 'equals',
      value: 'Ativo',
    };
    const filters: AdvancedFilter[] = [
      statusFilter,
      { columnId: 'isBirthdayMonth', operator: 'equals', value: 'true' },
    ];

    expect(extractBirthdayMonthFilter(filters)).toEqual({
      filters: [statusFilter],
      wantsBirthdayMonth: true,
    });
  });

  it('extrai o filtro "false"', () => {
    const filters: AdvancedFilter[] = [
      { columnId: 'isBirthdayMonth', operator: 'equals', value: 'false' },
    ];

    expect(extractBirthdayMonthFilter(filters)).toEqual({
      filters: [],
      wantsBirthdayMonth: false,
    });
  });

  it('ignora um valor que nao e nem true nem false', () => {
    const filters: AdvancedFilter[] = [
      { columnId: 'isBirthdayMonth', operator: 'equals', value: 'talvez' },
    ];

    expect(extractBirthdayMonthFilter(filters)).toEqual({
      filters: [],
      wantsBirthdayMonth: null,
    });
  });
});

describe('buildPeopleWhere com birthdayMonthPersonIds', () => {
  it('nao adiciona filtro de id quando birthdayMonthPersonIds e null/undefined', () => {
    const where = buildPeopleWhere({ tenantId: 'tenant-1', filters: [] });
    const andClauses = where.AND as Record<string, unknown>[];

    expect(andClauses.some((clause) => 'id' in clause)).toBe(false);
  });

  it('restringe por id quando birthdayMonthPersonIds e fornecido', () => {
    const where = buildPeopleWhere({
      tenantId: 'tenant-1',
      filters: [],
      birthdayMonthPersonIds: ['person-a', 'person-b'],
    });
    const andClauses = where.AND as Record<string, unknown>[];

    expect(andClauses).toContainEqual({ id: { in: ['person-a', 'person-b'] } });
  });

  it('filtra tudo fora (lista vazia) quando ninguem faz aniversario no mes', () => {
    const where = buildPeopleWhere({
      tenantId: 'tenant-1',
      filters: [],
      birthdayMonthPersonIds: [],
    });
    const andClauses = where.AND as Record<string, unknown>[];

    expect(andClauses).toContainEqual({ id: { in: [] } });
  });
});
