// Fase 4 do seed de homologacao (Encontros) - ver PLAN.md. Ultima fase
// do seed grande pedido pelo usuario (1 Pessoas, 2 Atendimentos/
// Ocorrencias, 3 Programas/Projetos/Atividades, 4 Encontros).
//
// Diferente das fases anteriores, NAO recebe o `PeopleFase1Result` -
// consulta direto o que a Fase 3 ja gravou no banco (Activity,
// ProjectEnrollment, ProjectActionPeopleParticipation), o mesmo dado que
// o app real leria. So gera Encontro (`Meeting`, tabela `ActionOccurrence`)
// pras Atividades que "ja aconteceram" (status EXECUTED, e uma fatia das
// INACTIVE que chegaram a comecar antes de serem descontinuadas) -
// Atividades PLANNED ainda nao tem Encontro, mesmo comportamento do app
// real (Encontro e so criado quando a atividade acontece de verdade).
//
// Frequencia por tipo de Atividade (`ActivityType.name`, catalogo fixo
// da Fase 3): os tipos "regulares" (turma/oficina continua) geram
// Encontros semanais no periodo executado; os tipos "evento" geram 1-3
// Encontros; os tipos ENROLLMENT (visita/acompanhamento individual) e um
// unico Encontro. `MeetingAttendance`: todo Encontro nao cancelado recebe
// presenca pra cada matricula PUBLICO_ATENDIDO do projeto ainda valida
// naquela data (mesmo escopo que `upsertProjectActionAttendances`
// valida - matriculas do projeto, nao so da atividade).
// `MeetingTeamParticipation`: reaproveita a equipe ja escolhida na Fase 3
// pra aquela Atividade (`ProjectActionPeopleParticipation`) - os dois
// vinculos "em cascata" que o service cria ao adicionar equipe a um
// Encontro (`ensurePersonOnActivityTeam`/`ensurePersonOnProjectTeam`) ja
// existem desde a Fase 3, entao so falta o `MeetingTeamParticipation` em
// si.

import type {
  ActionPeopleParticipationRole,
  AttendanceStatus,
  OccurrenceStatus,
  Prisma,
  PrismaClient,
} from '../../src/generated/prisma';
import { chance, faker, newId, pickWeighted } from './faker-helpers';

const NOW = new Date();

const RECURRING_TYPE_NAMES = new Set([
  'Atividade de Projeto',
  'Oficina Tematica',
  'Atendimento em Grupo',
  'Aula/Turma Regular',
]);
const SINGLE_OCCURRENCE_TYPE_NAMES = new Set([
  'Visita Domiciliar',
  'Acompanhamento Individual',
]);
// Os demais tipos do catalogo (Evento Comunitario, Capacitacao de
// Equipe, Reuniao de Rede/Articulacao, Passeio/Excursao) caem no caso
// "poucas edicoes" (1-3) por exclusao - ver `occurrenceKindFor`.

type OccurrenceKind = 'RECURRING' | 'SINGLE' | 'FEW';

function occurrenceKindFor(activityTypeName: string): OccurrenceKind {
  if (RECURRING_TYPE_NAMES.has(activityTypeName)) return 'RECURRING';
  if (SINGLE_OCCURRENCE_TYPE_NAMES.has(activityTypeName)) return 'SINGLE';
  return 'FEW';
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

/** Mesmo formato de `buildDefaultMeetingTitle` em actions.service.ts. */
function defaultMeetingTitle(scheduledDate: Date): string {
  const day = String(scheduledDate.getUTCDate()).padStart(2, '0');
  const month = String(scheduledDate.getUTCMonth() + 1).padStart(2, '0');
  const year = scheduledDate.getUTCFullYear();
  return `Encontro - ${day}/${month}/${year}`;
}

function weeklyDates(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  let current = start;
  // Cap de seguranca (nunca atingido no cenario real: ate 90 dias de
  // janela executada / 7 = ~13 datas) - evita loop infinito se as datas
  // de entrada vierem invertidas por algum motivo.
  while (current.getTime() <= end.getTime() && dates.length < 60) {
    dates.push(current);
    current = addDays(current, 7);
  }
  return dates;
}

function fewDatesBetween(start: Date, end: Date, count: number): Date[] {
  if (end.getTime() <= start.getTime()) return [start];
  const dates = Array.from({ length: count }, () => faker.date.between({ from: start, to: end }));
  dates.sort((a, b) => a.getTime() - b.getTime());
  return dates;
}

/** Mesmo helper duplicado nas fases anteriores - cada arquivo fica independente. */
async function insertInChunks<T>(
  items: T[],
  chunkSize: number,
  insert: (chunk: T[]) => Promise<unknown>,
) {
  for (let i = 0; i < items.length; i += chunkSize) {
    await insert(items.slice(i, i + chunkSize));
  }
}

function pickMeetingStatus(scheduledDate: Date): OccurrenceStatus {
  if (scheduledDate.getTime() > NOW.getTime()) return 'SCHEDULED';
  return pickWeighted([
    { value: 'DONE', weight: 90 },
    { value: 'CANCELED', weight: 10 },
  ]);
}

function pickAttendanceStatus(): AttendanceStatus {
  return pickWeighted([
    { value: 'PRESENT', weight: 80 },
    { value: 'ABSENT', weight: 15 },
    { value: 'EXCUSED', weight: 5 },
  ]);
}

export type MeetingsFase4Result = {
  meetings: number;
  attendances: number;
  teamParticipations: number;
};

export async function seedMeetingsFase4(
  prisma: PrismaClient,
  tenantId: string,
): Promise<MeetingsFase4Result> {
  const activities = await prisma.activity.findMany({
    where: { tenantId, status: { in: ['EXECUTED', 'INACTIVE'] } },
    select: {
      id: true,
      projectId: true,
      status: true,
      executedStartAt: true,
      executedEndAt: true,
      plannedStartAt: true,
      actionType: { select: { name: true } },
    },
  });

  const enrollments = await prisma.projectEnrollment.findMany({
    where: { tenantId, role: 'PUBLICO_ATENDIDO' },
    select: { id: true, projectId: true, startsAt: true, endsAt: true },
  });
  const enrollmentsByProject = new Map<string, typeof enrollments>();
  for (const enrollment of enrollments) {
    const list = enrollmentsByProject.get(enrollment.projectId) ?? [];
    list.push(enrollment);
    enrollmentsByProject.set(enrollment.projectId, list);
  }

  const teamParticipations = await prisma.projectActionPeopleParticipation.findMany({
    where: { tenantId },
    select: { actionId: true, personId: true, role: true },
  });
  const teamByActivity = new Map<string, typeof teamParticipations>();
  for (const participation of teamParticipations) {
    const list = teamByActivity.get(participation.actionId) ?? [];
    list.push(participation);
    teamByActivity.set(participation.actionId, list);
  }

  type MeetingPlan = {
    id: string;
    activityId: string;
    projectId: string;
    scheduledDate: Date;
    status: OccurrenceStatus;
    title: string;
    recurrenceBatchId: string | null;
  };

  const meetingPlans: MeetingPlan[] = [];

  for (const activity of activities) {
    // Janela "real" da atividade: EXECUTED sempre tem executedStartAt/
    // executedEndAt (ver Fase 3); INACTIVE so gera Encontro quando
    // chegou a comecar antes de ser descontinuada (executedStartAt
    // preenchido) - sem isso, nao houve nenhum Encontro de verdade.
    if (activity.status === 'INACTIVE' && !activity.executedStartAt) continue;
    const start = activity.executedStartAt ?? activity.plannedStartAt;
    if (!start) continue;
    // Rede de seguranca: uma atividade "ja aconteceu" nunca deveria ter
    // data no futuro - se acontecer (ex.: dado antigo gerado antes da
    // correcao de 2026-11-24 em pickActivityStatus), pula em vez de gerar
    // um Encontro inconsistente (status aconteceu no passado, data no
    // futuro).
    if (start.getTime() > NOW.getTime()) continue;
    const end = activity.executedEndAt ?? (activity.status === 'INACTIVE' ? start : NOW);
    const cappedEnd = end.getTime() > NOW.getTime() ? NOW : end;

    let dates: Date[];
    let recurrenceBatchId: string | null = null;
    if (activity.status === 'INACTIVE') {
      // Descontinuada logo no inicio - no maximo 1-2 encontros, pouco
      // importa o tipo da atividade.
      dates = fewDatesBetween(start, cappedEnd, faker.number.int({ min: 1, max: 2 }));
    } else {
      const kind = occurrenceKindFor(activity.actionType.name);
      if (kind === 'RECURRING') {
        dates = weeklyDates(start, cappedEnd);
        if (dates.length > 1) recurrenceBatchId = newId();
      } else if (kind === 'SINGLE') {
        dates = [start];
      } else {
        dates = fewDatesBetween(start, cappedEnd, faker.number.int({ min: 1, max: 3 }));
      }
    }

    for (const scheduledDate of dates) {
      const status = pickMeetingStatus(scheduledDate);
      meetingPlans.push({
        id: newId(),
        activityId: activity.id,
        projectId: activity.projectId,
        scheduledDate,
        status,
        title: chance(0.85) ? defaultMeetingTitle(scheduledDate) : `Encontro - ${activity.actionType.name}`,
        recurrenceBatchId,
      });
    }
  }

  await insertInChunks(meetingPlans, 500, (chunk) =>
    prisma.meeting.createMany({
      data: chunk.map((m) => ({
        id: m.id,
        tenantId,
        actionId: m.activityId,
        title: m.title,
        scheduledDate: m.scheduledDate,
        startTime: new Date(
          Date.UTC(
            m.scheduledDate.getUTCFullYear(),
            m.scheduledDate.getUTCMonth(),
            m.scheduledDate.getUTCDate(),
            9,
            0,
          ),
        ),
        endTime: new Date(
          Date.UTC(
            m.scheduledDate.getUTCFullYear(),
            m.scheduledDate.getUTCMonth(),
            m.scheduledDate.getUTCDate(),
            11,
            0,
          ),
        ),
        status: m.status,
        notes: null,
        executedHtml: m.status === 'DONE' ? '<p>Encontro realizado conforme planejado.</p>' : null,
        recurrenceBatchId: m.recurrenceBatchId,
      })),
    }),
  );

  // --- MeetingAttendance ---------------------------------------------------
  // So pros Encontros nao cancelados - um Encontro CANCELED nunca teve
  // presenca registrada de verdade.

  const attendanceRows: Prisma.MeetingAttendanceCreateManyInput[] = [];
  for (const meeting of meetingPlans) {
    if (meeting.status !== 'DONE') continue;
    const projectEnrollments = enrollmentsByProject.get(meeting.projectId) ?? [];
    for (const enrollment of projectEnrollments) {
      if (enrollment.startsAt.getTime() > meeting.scheduledDate.getTime()) continue;
      if (enrollment.endsAt && enrollment.endsAt.getTime() < meeting.scheduledDate.getTime()) continue;
      attendanceRows.push({
        id: newId(),
        tenantId,
        actionId: meeting.activityId,
        occurrenceId: meeting.id,
        enrollmentId: enrollment.id,
        status: pickAttendanceStatus(),
        isHighlight: chance(0.03),
      });
    }
  }
  await insertInChunks(attendanceRows, 500, (chunk) =>
    prisma.meetingAttendance.createMany({ data: chunk }),
  );

  // --- MeetingTeamParticipation ---------------------------------------------
  // Reaproveita a equipe ja escolhida na Fase 3 pra essa Atividade - os
  // vinculos em cascata (ProjectActionPeopleParticipation/
  // ProjectTeamParticipation) ja existem, so falta o registro por Encontro.

  const teamRows: Prisma.MeetingTeamParticipationCreateManyInput[] = [];
  for (const meeting of meetingPlans) {
    const pool = teamByActivity.get(meeting.activityId) ?? [];
    if (pool.length === 0) continue;
    const picks = faker.helpers.arrayElements(
      pool,
      Math.min(pool.length, faker.number.int({ min: 1, max: 2 })),
    );
    for (const member of picks) {
      teamRows.push({
        id: newId(),
        tenantId,
        meetingId: meeting.id,
        personId: member.personId,
        role: member.role as ActionPeopleParticipationRole,
      });
    }
  }
  await insertInChunks(teamRows, 500, (chunk) =>
    prisma.meetingTeamParticipation.createMany({ data: chunk }),
  );

  return {
    meetings: meetingPlans.length,
    attendances: attendanceRows.length,
    teamParticipations: teamRows.length,
  };
}
