export const WEEK_DAYS = [
  'SUN',
  'MON',
  'TUE',
  'WED',
  'THU',
  'FRI',
  'SAT',
] as const;

export type WeekDay = (typeof WEEK_DAYS)[number];

const WEEK_DAY_INDEX: Record<WeekDay, number> = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
};

/**
 * Materializa as datas (UTC, meia-noite) de uma recorrencia semanal entre
 * duas datas, inclusive. Nao guarda regra "viva" nenhuma - a geracao em
 * lote de encontros so precisa das datas concretas uma vez, na criacao.
 */
export function generateOccurrenceDates(params: {
  startDate: Date;
  endDate: Date;
  daysOfWeek: WeekDay[];
}): Date[] {
  const { startDate, endDate, daysOfWeek } = params;
  if (startDate.getTime() > endDate.getTime()) return [];
  if (daysOfWeek.length === 0) return [];

  const targetIndexes = new Set(daysOfWeek.map((day) => WEEK_DAY_INDEX[day]));
  const dates: Date[] = [];

  const cursor = new Date(startDate.getTime());
  while (cursor.getTime() <= endDate.getTime()) {
    if (targetIndexes.has(cursor.getUTCDay())) {
      dates.push(new Date(cursor.getTime()));
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}
