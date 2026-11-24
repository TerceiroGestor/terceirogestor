"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { usePathname, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { SectionDialog } from "@/components/section-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useConfirm } from "@/components/confirm/use-confirm";
import {
  bulkCreateMeetings,
  deleteMeeting,
  listMeetings,
  listActivityPeopleGroups,
  previewBulkMeetings,
  type ActionPeopleParticipationRole,
  type ApiMeeting,
  type ApiActivityPeopleGroup,
  type MeetingTeamParticipantInput,
  type OccurrenceStatus,
  type WeekDay,
} from "@/modules/actions/api";
import { getPerson } from "@/modules/people/api";
import {
  ACTION_PEOPLE_PARTICIPATION_ROLE_LABELS,
  OCCURRENCE_STATUS_LABELS,
  OCCURRENCE_STATUS_OPTIONS,
  WEEK_DAY_OPTIONS,
} from "@/modules/actions/shared/domain/actions.constants";
import { MeetingTeamPickerDialog } from "@/modules/actions/features/manage/ui/meeting-team-picker-dialog";
import { MultiSelectBadges } from "@/web-client/ui/MultiSelectBadges";
import { TruncatedTextCell } from "@/web-client/ui/TruncatedTextCell";
import { CalendarView } from "@/web-client/views/CalendarView";
import { ListView } from "@/web-client/views/ListView";
import { RelationListHost } from "@/web-client/relation/RelationListHost";
import { matchesDomainRecord } from "@/web-client/domain/evaluate";
import type { Domain } from "@/web-client/domain/types";
import type { SearchFieldDefinition } from "@/web-client/search/types";
import {
  RecordBrowserViewSwitcher,
  type RecordBrowserViewOption,
} from "@/components/record-browser/RecordBrowserViewSwitcher";
import { getStandardViewIcon } from "@/web-client/registry/view-icons";

async function runInBatches<T>(
  items: T[],
  batchSize: number,
  run: (item: T) => Promise<void>,
) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.allSettled(batch.map((item) => run(item)));
  }
}

function TeamPeopleGroupPicker({
  groups,
  selectedIds,
  onChange,
  disabled,
}: {
  groups: ApiActivityPeopleGroup[];
  selectedIds: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  if (groups.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Nenhum Grupos de equipe vinculado a esta atividade.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border/60 p-2">
      {groups.map((link) => {
        const checked = selectedIds.includes(link.peopleGroupId);
        return (
          <label
            key={link.id}
            className="flex cursor-pointer items-center gap-2 text-sm"
          >
            <Checkbox
              checked={checked}
              disabled={disabled}
              onCheckedChange={(next) => {
                onChange(
                  next
                    ? [...selectedIds, link.peopleGroupId]
                    : selectedIds.filter((id) => id !== link.peopleGroupId),
                );
              }}
            />
            {link.peopleGroup.name}
          </label>
        );
      })}
    </div>
  );
}

function resolveErrorMessage(err: unknown, fallback: string) {
  return err && typeof err === "object" && "message" in err
    ? String((err as { message?: string }).message)
    : fallback;
}

function formatDateOnly(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function formatDateWithWeekday(value: string) {
  const date = new Date(value);
  const weekday = date.toLocaleDateString("pt-BR", {
    timeZone: "UTC",
    weekday: "short",
  });
  return `${formatDateOnly(value)} (${weekday})`;
}

function formatTimeOnly(value: string) {
  return new Date(value).toLocaleTimeString("pt-BR", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resolveOccurrenceStatusBadge(status: OccurrenceStatus) {
  const label = OCCURRENCE_STATUS_LABELS[status];
  if (status === "DONE") {
    return <Badge className="border-transparent bg-emerald-600 text-white">{label}</Badge>;
  }
  if (status === "CANCELED") {
    return <Badge variant="outline">{label}</Badge>;
  }
  return <Badge variant="secondary">{label}</Badge>;
}

function buildOccurrenceColumns(): ColumnDef<ApiMeeting>[] {
  return [
    {
      id: "title",
      header: "Título",
      accessorFn: (row) => row.title,
      cell: ({ row }) => <TruncatedTextCell text={row.original.title} />,
    },
    {
      id: "scheduledDate",
      header: "Data",
      accessorFn: (row) => row.scheduledDate,
      cell: ({ row }) => formatDateOnly(row.original.scheduledDate),
    },
    {
      id: "time",
      header: "Horário",
      accessorFn: (row) => row.startTime,
      cell: ({ row }) => {
        const start = formatTimeOnly(row.original.startTime);
        const end = row.original.endTime ? formatTimeOnly(row.original.endTime) : null;
        return end ? `${start} – ${end}` : start;
      },
    },
    {
      id: "peopleGroup",
      header: "Grupos",
      accessorFn: (row) => row.peopleGroups.map((link) => link.peopleGroup.name).join(", "),
      cell: ({ row }) =>
        row.original.peopleGroups.length
          ? row.original.peopleGroups.map((link) => link.peopleGroup.name).join(", ")
          : "—",
    },
    {
      id: "status",
      header: "Status",
      accessorFn: (row) => row.status,
      cell: ({ row }) => resolveOccurrenceStatusBadge(row.original.status),
    },
    {
      id: "notes",
      header: "Notas",
      accessorFn: (row) => row.notes ?? "",
      cell: ({ row }) => <TruncatedTextCell text={row.original.notes} />,
    },
  ];
}

type BulkScheduleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  projectId: string;
  actionId: string;
  groups: ApiActivityPeopleGroup[];
  teamGroups: ApiActivityPeopleGroup[];
  onCompleted: () => void;
};

function BulkScheduleOccurrencesDialog({
  open,
  onOpenChange,
  token,
  projectId,
  actionId,
  groups,
  teamGroups,
  onCompleted,
}: BulkScheduleDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = React.useState<"form" | "preview">("form");
  const [peopleGroupIds, setPeopleGroupIds] = React.useState<string[]>([]);
  const [teamPeopleGroupIds, setTeamPeopleGroupIds] = React.useState<string[]>([]);
  const [teamParticipants, setTeamParticipants] = React.useState<
    Array<{ personId: string; role: ActionPeopleParticipationRole; fullName: string }>
  >([]);
  const [teamPickerOpen, setTeamPickerOpen] = React.useState(false);
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [daysOfWeek, setDaysOfWeek] = React.useState<WeekDay[]>([]);
  const [startTime, setStartTime] = React.useState("");
  const [endTime, setEndTime] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [previewDates, setPreviewDates] = React.useState<string[]>([]);
  const [excludedDates, setExcludedDates] = React.useState<Set<string>>(new Set());
  const [loadingPreview, setLoadingPreview] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setStep("form");
    setPeopleGroupIds([]);
    setTeamPeopleGroupIds([]);
    setTeamParticipants([]);
    setStartDate("");
    setEndDate("");
    setDaysOfWeek([]);
    setStartTime("");
    setEndTime("");
    setNotes("");
    setPreviewDates([]);
    setExcludedDates(new Set());
    setError(null);
  }, [open]);

  const toggleDay = (day: WeekDay) => {
    setDaysOfWeek((previous) =>
      previous.includes(day)
        ? previous.filter((item) => item !== day)
        : [...previous, day],
    );
  };

  const toggleExcluded = (date: string) => {
    setExcludedDates((previous) => {
      const next = new Set(previous);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };

  const handlePreview = async () => {
    if (!startDate || !endDate || !startTime || daysOfWeek.length === 0) {
      setError("Preencha o período, os dias da semana e o horário de início.");
      return;
    }

    setLoadingPreview(true);
    setError(null);
    try {
      const result = await previewBulkMeetings(token, projectId, actionId, {
        startDate,
        endDate,
        daysOfWeek,
      });
      setPreviewDates(result.dates);
      setExcludedDates(new Set());
      setStep("preview");
    } catch (err) {
      setError(resolveErrorMessage(err, "Falha ao calcular as datas do agendamento."));
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleConfirm = async () => {
    setSaving(true);
    setError(null);
    try {
      const teamParticipantsPayload: MeetingTeamParticipantInput[] = teamParticipants.map(
        (participant) => ({ personId: participant.personId, role: participant.role }),
      );
      const result = await bulkCreateMeetings(token, projectId, actionId, {
        peopleGroupIds: peopleGroupIds.length ? peopleGroupIds : undefined,
        teamPeopleGroupIds: teamPeopleGroupIds.length ? teamPeopleGroupIds : undefined,
        teamParticipants: teamParticipantsPayload.length ? teamParticipantsPayload : undefined,
        startDate,
        endDate,
        daysOfWeek,
        startTime,
        endTime: endTime || null,
        notes: notes.trim() ? notes.trim() : null,
        excludedDates: excludedDates.size ? [...excludedDates] : undefined,
      });
      toast({
        title: "Encontros agendados",
        description: `${result.created} encontro(s) criado(s).`,
      });
      onCompleted();
      onOpenChange(false);
    } catch (err) {
      setError(resolveErrorMessage(err, "Falha ao agendar os encontros."));
    } finally {
      setSaving(false);
    }
  };

  const handleAddResponsibles = async (
    personIds: string[],
    role: ActionPeopleParticipationRole,
  ) => {
    const people = await Promise.all(personIds.map((personId) => getPerson(token, personId)));
    setTeamParticipants((previous) => {
      const next = [...previous];
      for (const person of people) {
        if (next.some((item) => item.personId === person.id && item.role === role)) continue;
        next.push({ personId: person.id, role, fullName: person.fullName });
      }
      return next;
    });
  };

  const includedCount = previewDates.length - excludedDates.size;

  const errorBanner = error ? (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {error}
    </div>
  ) : null;

  return (
    <>
    <SectionDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Agendar encontros"
      description={
        step === "form"
          ? "Gera os encontros de uma vez, a partir de um padrão semanal."
          : "Revise as datas geradas e desmarque feriados ou pontos facultativos antes de confirmar."
      }
      contentClassName="max-w-[640px]"
      footer={
        step === "form" ? (
          <div className="flex flex-col gap-3">
            {errorBanner}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="button" disabled={loadingPreview} onClick={() => void handlePreview()}>
                {loadingPreview ? "Calculando..." : "Ver datas geradas"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {errorBanner}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setStep("form")}>
                Voltar
              </Button>
              <Button
                type="button"
                disabled={saving || includedCount === 0}
                onClick={() => void handleConfirm()}
              >
                {saving ? "Agendando..." : `Confirmar e agendar (${includedCount})`}
              </Button>
            </div>
          </div>
        )
      }
    >
      {step === "form" ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Grupos</Label>
              <MultiSelectBadges
                options={groups.map((link) => ({
                  value: link.peopleGroupId,
                  label: link.peopleGroup.name,
                }))}
                selectedValues={peopleGroupIds}
                onChange={setPeopleGroupIds}
                addLabel="Adicionar Grupos"
                searchPlaceholder="Pesquisar Grupos..."
                noOptionsLabel="Nenhum Grupos vinculado a esta atividade."
                emptyLabel="Sem Grupos específico."
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Educadores/Equipe</Label>
              <TeamPeopleGroupPicker
                groups={teamGroups}
                selectedIds={teamPeopleGroupIds}
                onChange={setTeamPeopleGroupIds}
              />
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label>Responsáveis</Label>
              <div className="flex flex-wrap items-center gap-2">
                {teamParticipants.map((participant) => (
                  <Badge key={`${participant.personId}:${participant.role}`} variant="secondary" className="gap-1">
                    {participant.fullName} ({ACTION_PEOPLE_PARTICIPATION_ROLE_LABELS[participant.role]})
                    <button
                      type="button"
                      className="ml-1 text-muted-foreground hover:text-foreground"
                      onClick={() =>
                        setTeamParticipants((previous) =>
                          previous.filter((item) => item.personId !== participant.personId),
                        )
                      }
                    >
                      ×
                    </button>
                  </Badge>
                ))}
                <Button type="button" size="sm" variant="outline" onClick={() => setTeamPickerOpen(true)}>
                  Adicionar responsável
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>De</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Até</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Início</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Término (opcional)</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Dias da semana</Label>
            <div className="flex flex-wrap gap-2">
              {WEEK_DAY_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant={daysOfWeek.includes(option.value) ? "default" : "outline"}
                  onClick={() => toggleDay(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Notas (opcional)</Label>
            <Textarea
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            {includedCount} de {previewDates.length} data(s) selecionada(s). Desmarque as
            que não devem gerar encontro (feriados, pontos facultativos etc.).
          </p>

          <div className="flex max-h-[320px] flex-col gap-1 overflow-y-auto rounded-md border border-border/60 p-2">
            {previewDates.map((date) => {
              const checked = !excludedDates.has(date);
              return (
                <label
                  key={date}
                  className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-muted/50"
                >
                  <Checkbox checked={checked} onCheckedChange={() => toggleExcluded(date)} />
                  <span className={checked ? "" : "text-muted-foreground line-through"}>
                    {formatDateWithWeekday(date)}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </SectionDialog>
    <MeetingTeamPickerDialog
      open={teamPickerOpen}
      onOpenChange={setTeamPickerOpen}
      maxSelectable={10}
      onConfirm={handleAddResponsibles}
    />
    </>
  );
}

export type ActionOccurrencesSectionProps = {
  token: string;
  projectId: string;
  actionId: string;
  readOnly: boolean;
};

export function ActionOccurrencesSection({
  token,
  projectId,
  actionId,
  readOnly,
}: ActionOccurrencesSectionProps) {
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname) ?? "";
  const [occurrences, setOccurrences] = React.useState<ApiMeeting[]>([]);
  const [groups, setGroups] = React.useState<ApiActivityPeopleGroup[]>([]);
  const [teamGroups, setTeamGroups] = React.useState<ApiActivityPeopleGroup[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [view, setView] = React.useState<"list" | "calendar">("list");
  const [scheduleOpen, setScheduleOpen] = React.useState(false);
  const [searchText, setSearchText] = React.useState("");
  const [domain, setDomain] = React.useState<Domain>(null);
  const [groupBy, setGroupBy] = React.useState<string[]>([]);
  const [selectedRows, setSelectedRows] = React.useState<ApiMeeting[]>([]);

  // ListView recalcula a selecao (novo array, mesmo conteudo) a cada
  // render e notifica via efeito - sem esse diff, setSelectedRows(novaRef)
  // forca um re-render do pai a cada notificacao, que forca o ListView a
  // renderizar de novo, que notifica de novo: loop infinito ("Maximum
  // update depth exceeded"). O updater funcional devolve a mesma
  // referencia quando o conteudo nao mudou, e o React pula o re-render.
  const handleSelectionChange = React.useCallback((rows: ApiMeeting[]) => {
    setSelectedRows((previous) => {
      if (
        previous.length === rows.length &&
        previous.every((row, index) => row.id === rows[index]?.id)
      ) {
        return previous;
      }
      return rows;
    });
  }, []);
  const [bulkDeleting, setBulkDeleting] = React.useState(false);

  const loadOccurrences = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listMeetings(token, projectId, actionId, {
        limit: 200,
      });
      setOccurrences(response.data);
    } catch (err) {
      setError(resolveErrorMessage(err, "Falha ao carregar os encontros."));
    } finally {
      setLoading(false);
    }
  }, [token, projectId, actionId]);

  const loadGroups = React.useCallback(async () => {
    try {
      const response = await listActivityPeopleGroups(token, projectId, actionId, {
        participationKind: "PARTICIPANT",
      });
      setGroups(response);
    } catch {
      setGroups([]);
    }
  }, [token, projectId, actionId]);

  const loadTeamGroups = React.useCallback(async () => {
    try {
      const response = await listActivityPeopleGroups(token, projectId, actionId, {
        participationKind: "TEAM",
      });
      setTeamGroups(response);
    } catch {
      setTeamGroups([]);
    }
  }, [token, projectId, actionId]);

  React.useEffect(() => {
    void loadOccurrences();
    void loadGroups();
    void loadTeamGroups();
  }, [loadOccurrences, loadGroups, loadTeamGroups]);

  const buildOccurrenceSearchRecord = React.useCallback(
    (item: ApiMeeting) => ({
      status: item.status,
      peopleGroups: item.peopleGroups.map((link) => link.peopleGroupId),
      scheduledDate: item.scheduledDate,
    }),
    [],
  );

  const resolveOccurrenceGroupValue = React.useCallback((field: string, row: ApiMeeting): unknown => {
    switch (field) {
      case "status":
        return row.status;
      case "peopleGroups":
        return row.peopleGroups.map((link) => link.peopleGroup.name);
      case "scheduledDate":
        return row.scheduledDate.slice(0, 10);
      default:
        return undefined;
    }
  }, []);

  const resolveOccurrenceGroupLabel = React.useCallback((field: string, value: unknown): string => {
    if (field === "status") {
      return OCCURRENCE_STATUS_LABELS[value as OccurrenceStatus] ?? "Sem valor";
    }
    if (field === "scheduledDate") {
      return typeof value === "string" && value ? formatDateOnly(value) : "Sem valor";
    }
    const label = String(value ?? "").trim();
    return label ? label : "Sem valor";
  }, []);

  const filterFields = React.useMemo<SearchFieldDefinition[]>(
    () => [
      { name: "status", label: "Status", type: "select", options: OCCURRENCE_STATUS_OPTIONS },
      {
        name: "peopleGroups",
        label: "Grupos",
        type: "select",
        options: groups.map((link) => ({ value: link.peopleGroupId, label: link.peopleGroup.name })),
      },
      { name: "scheduledDate", label: "Data", type: "date" },
    ],
    [groups],
  );

  const filteredOccurrences = React.useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return occurrences.filter((item) => {
      if (!matchesDomainRecord(buildOccurrenceSearchRecord(item), domain, (record, field) => record[field as keyof typeof record])) {
        return false;
      }
      if (!query) return true;
      const haystack = [
        item.title,
        formatDateOnly(item.scheduledDate),
        OCCURRENCE_STATUS_LABELS[item.status],
        item.peopleGroups.map((link) => link.peopleGroup.name).join(" "),
        item.notes ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [occurrences, searchText, domain, buildOccurrenceSearchRecord]);

  const handleBulkDelete = React.useCallback(async () => {
    if (readOnly || selectedRows.length === 0) return;
    const confirmed = await confirm({
      title: "Excluir encontros selecionados",
      description: `Excluir ${selectedRows.length} encontro(s) selecionado(s)? Essa ação não pode ser desfeita.`,
      confirmLabel: "Excluir",
      confirmVariant: "destructive",
    });
    if (!confirmed) return;

    setBulkDeleting(true);
    let removed = 0;
    let failed = 0;
    try {
      await runInBatches(selectedRows, 6, async (item) => {
        try {
          await deleteMeeting(token, projectId, actionId, item.id);
          removed += 1;
        } catch {
          failed += 1;
        }
      });
      toast({
        title: "Exclusão em massa concluída",
        description: `Excluídos: ${removed}${failed ? ` — Falharam: ${failed}` : ""}`,
        variant: failed > 0 ? "destructive" : "default",
      });
      setSelectedRows([]);
      void loadOccurrences();
    } finally {
      setBulkDeleting(false);
    }
  }, [confirm, readOnly, selectedRows, token, projectId, actionId, toast, loadOccurrences]);

  const columns = React.useMemo(() => buildOccurrenceColumns(), []);

  const goToMeeting = React.useCallback(
    (meetingId: string) => {
      router.push(
        withTenantPath(`/meetings/${meetingId}?projectId=${projectId}&actionId=${actionId}`, tenantSlug),
      );
    },
    [router, projectId, actionId, tenantSlug],
  );

  const viewOptions: RecordBrowserViewOption<"list" | "calendar">[] = [
    { value: "list", label: "Lista", icon: getStandardViewIcon("list") },
    { value: "calendar", label: "Calendário", icon: getStandardViewIcon("calendar") },
  ];

  return (
    <>
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <RelationListHost<ApiMeeting>
        flushToolbar
        data={occurrences}
        searchText={searchText}
        onSearchTextChange={setSearchText}
        domain={domain}
        onDomainChange={setDomain}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        groupByOptions={[
          { field: "status", label: "Status" },
          { field: "peopleGroups", label: "Grupos" },
          { field: "scheduledDate", label: "Data" },
        ]}
        filterFields={filterFields}
        buildSearchRecord={buildOccurrenceSearchRecord}
        searchActionId="activity.occurrences"
        searchPlaceholder="Pesquisar"
        filteredCount={filteredOccurrences.length}
        onAdd={readOnly ? undefined : () => setScheduleOpen(true)}
        viewSwitcherSlot={
          <RecordBrowserViewSwitcher
            value={view}
            onChange={setView}
            options={viewOptions}
          />
        }
        columns={columns}
      >
        {loading ? (
          <p className="text-xs text-muted-foreground">Carregando...</p>
        ) : occurrences.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum encontro agendado ainda.
          </p>
        ) : filteredOccurrences.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum encontro encontrado para esse filtro.
          </p>
        ) : view === "list" ? (
          <ListView<ApiMeeting>
            data={filteredOccurrences}
            columns={columns}
            getRowId={(row) => row.id}
            enableRowSelection={!readOnly}
            onSelectionChange={handleSelectionChange}
            bulkActions={() => (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={bulkDeleting}
                onClick={() => void handleBulkDelete()}
              >
                {bulkDeleting ? "Excluindo..." : "Excluir selecionados"}
              </Button>
            )}
            onRowClick={(row) => goToMeeting(row.id)}
            showColumnVisibilityButton={false}
            groupByFields={groupBy}
            resolveGroupValue={resolveOccurrenceGroupValue}
            resolveGroupLabel={resolveOccurrenceGroupLabel}
            bordered={false}
            // Abas (44px) + toolbar da relation (flushToolbar, ~73px com
            // py-4) ja ficam sticky acima, no mesmo contexto de scroll - o
            // proprio ListView soma a altura da barra de seleção por conta
            // (ver `bulkActions`/`BULK_BAR_HEIGHT_PX` em ListView.tsx), não
            // precisa somar aqui. Ajustar se a altura de abas/toolbar mudar.
            stickyHeaderOffsetPx={117}
          />
        ) : (
          <CalendarView<ApiMeeting>
            items={filteredOccurrences}
            getDate={(item) => new Date(item.scheduledDate)}
            renderItem={(item) => (
              <button
                type="button"
                className="flex w-full flex-col gap-1 rounded-lg border border-border/60 bg-background px-3 py-2 text-left hover:bg-muted/20"
                onClick={() => goToMeeting(item.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{item.title}</span>
                  {resolveOccurrenceStatusBadge(item.status)}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatTimeOnly(item.startTime)}
                  {item.endTime ? ` – ${formatTimeOnly(item.endTime)}` : ""}
                </span>
                <span className="text-xs text-muted-foreground">
                  {item.peopleGroups.length
                    ? item.peopleGroups.map((link) => link.peopleGroup.name).join(", ")
                    : "Sem Grupos específico"}
                </span>
              </button>
            )}
          />
        )}
      </RelationListHost>

      <BulkScheduleOccurrencesDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        token={token}
        projectId={projectId}
        actionId={actionId}
        groups={groups}
        teamGroups={teamGroups}
        onCompleted={() => void loadOccurrences()}
      />
    </>
  );
}
