import { generateOccurrenceDates } from './action-occurrence-schedule';

function utcDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

describe('generateOccurrenceDates', () => {
  it('gera as datas de uma recorrencia semanal (seg/qua) dentro do periodo', () => {
    const dates = generateOccurrenceDates({
      startDate: utcDate('2026-11-02'), // segunda-feira
      endDate: utcDate('2026-11-15'), // domingo, 2 semanas depois
      daysOfWeek: ['MON', 'WED'],
    });

    expect(dates.map((d) => d.toISOString().slice(0, 10))).toEqual([
      '2026-11-02',
      '2026-11-04',
      '2026-11-09',
      '2026-11-11',
    ]);
  });

  it('gera todas as datas do periodo quando a recorrencia e diaria (todos os dias)', () => {
    const dates = generateOccurrenceDates({
      startDate: utcDate('2026-11-02'),
      endDate: utcDate('2026-11-06'),
      daysOfWeek: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
    });

    expect(dates).toHaveLength(5);
  });

  it('inclui a propria data quando startDate === endDate e bate com o dia da semana', () => {
    const dates = generateOccurrenceDates({
      startDate: utcDate('2026-11-02'), // segunda-feira
      endDate: utcDate('2026-11-02'),
      daysOfWeek: ['MON'],
    });

    expect(dates).toHaveLength(1);
  });

  it('retorna vazio quando nenhum dia da semana do periodo bate com a recorrencia', () => {
    const dates = generateOccurrenceDates({
      startDate: utcDate('2026-11-02'), // segunda
      endDate: utcDate('2026-11-02'),
      daysOfWeek: ['SAT'],
    });

    expect(dates).toEqual([]);
  });

  it('retorna vazio quando startDate e depois de endDate', () => {
    const dates = generateOccurrenceDates({
      startDate: utcDate('2026-11-10'),
      endDate: utcDate('2026-11-02'),
      daysOfWeek: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    });

    expect(dates).toEqual([]);
  });

  it('retorna vazio quando nenhum dia da semana e informado', () => {
    const dates = generateOccurrenceDates({
      startDate: utcDate('2026-11-02'),
      endDate: utcDate('2026-11-15'),
      daysOfWeek: [],
    });

    expect(dates).toEqual([]);
  });
});
