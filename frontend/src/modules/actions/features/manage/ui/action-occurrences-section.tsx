"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { usePathname, useRouter } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichText } from "@/components/ui/richtext/RichText";
import { SectionDialog } from "@/components/section-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useConfirm } from "@/components/confirm/use-confirm";
import { resolveMediaUrl } from "@/lib/api";
import { uploadActionPhoto } from "@/features/uploads/api";
import {
  bulkCreateMeetings,
  deleteMeeting,
  listMeetingAttendances,
  listMeetings,
  listActivityPeopleGroups,
  previewBulkMeetings,
  updateMeeting,
  updateMeetingBatch,
  upsertMeetingAttendances,
  type ApiMeeting,
  type ApiActivityPeopleGroup,
  type AttendanceStatus,
  type MeetingAttendancesListItem,
  type OccurrenceStatus,
  type WeekDay,
} from "@/modules/actions/api";
import {
  ATTENDANCE_STATUS_OPTIONS,
  OCCURRENCE_STATUS_LABELS,
  OCCURRENCE_STATUS_OPTIONS,
  WEEK_DAY_OPTIONS,
} from "@/modules/actions/shared/domain/actions.constants";
import { MultiSelectBadges } from "@/web-client/ui/MultiSelectBadges";
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
        Nenhum grupo de equipe vinculado a esta atividade.
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

function toTimeInputValue(value: string) {
  const date = new Date(value);
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function toDateInputValue(value: string) {
  return value.slice(0, 10);
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

function buildOccurrenceColumns(params: {
  onDelete: (occurrence: ApiMeeting) => void;
  canUpdate: boolean;
}): ColumnDef<ApiMeeting>[] {
  return [
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
      header: "Grupo",
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
      cell: ({ row }) =>
        row.original.notes?.trim() ? (
          <span className="block max-w-[280px] whitespace-normal break-words py-1">
            {row.original.notes}
          </span>
        ) : (
          "—"
        ),
    },
    {
      id: "actions",
      header: "",
      enableHiding: false,
      cell: ({ row }) =>
        params.canUpdate ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => params.onDelete(row.original)}
          >
            Excluir
          </Button>
        ) : null,
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
      const result = await bulkCreateMeetings(token, projectId, actionId, {
        peopleGroupIds: peopleGroupIds.length ? peopleGroupIds : undefined,
        teamPeopleGroupIds: teamPeopleGroupIds.length ? teamPeopleGroupIds : undefined,
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

  const includedCount = previewDates.length - excludedDates.size;

  const errorBanner = error ? (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {error}
    </div>
  ) : null;

  return (
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
                addLabel="Adicionar grupo"
                searchPlaceholder="Pesquisar grupo..."
                noOptionsLabel="Nenhum grupo vinculado a esta atividade."
                emptyLabel="Sem grupo específico."
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
  );
}

type AttendanceDraftRow = {
  status: AttendanceStatus;
  notes: string;
  qualityScore: string;
  qualityNotes: string;
};

/**
 * Presença inline por Encontro (Fase 4, Ciclo 2 de ajustes): uma linha por
 * participante com presença, justificativa (reaproveita MeetingAttendance.notes),
 * observação (reaproveita qualityNotes) e avaliação (qualityScore) - tudo
 * editado junto, salvo com 1 clique. Reaproveita os mesmos 2 endpoints que já
 * existiam pras antigas abas "Participantes"/"Qualidade" da Atividade
 * (listMeetingAttendances/upsertMeetingAttendances), sem mudança de backend.
 */
function MeetingAttendanceInlineTable({
  token,
  projectId,
  actionId,
  occurrenceId,
  canUpdate,
}: {
  token: string;
  projectId: string;
  actionId: string;
  occurrenceId: string;
  canUpdate: boolean;
}) {
  const { toast } = useToast();
  const [rows, setRows] = React.useState<MeetingAttendancesListItem[]>([]);
  const [drafts, setDrafts] = React.useState<Record<string, AttendanceDraftRow>>({});
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await listMeetingAttendances(token, projectId, actionId, occurrenceId, {
        limit: 200,
      });
      setRows(response.data);
      setDrafts({});
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [token, projectId, actionId, occurrenceId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const getEffective = React.useCallback(
    (row: MeetingAttendancesListItem): AttendanceDraftRow =>
      drafts[row.enrollment.id] ?? {
        status: row.attendance?.status ?? "PRESENT",
        notes: row.attendance?.notes ?? "",
        qualityScore:
          row.attendance?.qualityScore != null ? String(row.attendance.qualityScore) : "",
        qualityNotes: row.attendance?.qualityNotes ?? "",
      },
    [drafts],
  );

  const updateDraft = (row: MeetingAttendancesListItem, patch: Partial<AttendanceDraftRow>) => {
    setDrafts((previous) => ({
      ...previous,
      [row.enrollment.id]: { ...getEffective(row), ...patch },
    }));
  };

  const handleSave = async () => {
    const entries = Object.entries(drafts);
    if (!entries.length) return;
    setSaving(true);
    try {
      const items = entries.map(([enrollmentId, draft]) => ({
        enrollmentId,
        status: draft.status,
        notes: draft.notes.trim() ? draft.notes.trim() : null,
        qualityScore: draft.qualityScore.trim() ? Number(draft.qualityScore) : null,
        qualityNotes: draft.qualityNotes.trim() ? draft.qualityNotes.trim() : null,
      }));
      const result = await upsertMeetingAttendances(token, projectId, actionId, occurrenceId, items);
      toast({
        title: "Presença salva",
        description: `${result.created + result.updated} registro(s) atualizado(s).`,
      });
      await load();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: resolveErrorMessage(err, "Falha ao salvar presença."),
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-xs text-muted-foreground">Carregando...</p>;
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum participante elegível pra este Encontro (confira os grupos vinculados).
      </p>
    );
  }

  const changedCount = Object.keys(drafts).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="max-h-[360px] overflow-y-auto rounded-md border border-border/60">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-background">
            <tr className="border-b border-border/60 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2 font-medium">Participante</th>
              <th className="px-3 py-2 font-medium">Presença</th>
              <th className="px-3 py-2 font-medium">Justificativa</th>
              <th className="px-3 py-2 font-medium">Observação</th>
              <th className="px-3 py-2 font-medium">Avaliação</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const effective = getEffective(row);
              const changed = Boolean(drafts[row.enrollment.id]);
              return (
                <tr key={row.enrollment.id} className="border-b border-border/40 last:border-0">
                  <td className="px-3 py-2 align-top">
                    <span className="font-medium text-foreground">
                      {row.enrollment.person.fullName}
                    </span>
                    {changed ? (
                      <span className="ml-1.5 inline-block size-1.5 rounded-full bg-primary align-middle" />
                    ) : null}
                  </td>
                  <td className="px-3 py-2 align-top">
                    <Select
                      value={effective.status}
                      onValueChange={(next) =>
                        updateDraft(row, { status: next as AttendanceStatus })
                      }
                      disabled={!canUpdate || saving}
                    >
                      <SelectTrigger className="h-8 w-[130px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ATTENDANCE_STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <Input
                      value={effective.notes}
                      onChange={(event) => updateDraft(row, { notes: event.target.value })}
                      disabled={!canUpdate || saving}
                      placeholder={
                        effective.status === "PRESENT" ? "—" : "Motivo da falta/justificativa"
                      }
                      className="h-8 text-xs"
                    />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <Input
                      value={effective.qualityNotes}
                      onChange={(event) => updateDraft(row, { qualityNotes: event.target.value })}
                      disabled={!canUpdate || saving}
                      placeholder="Observação"
                      className="h-8 text-xs"
                    />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <Select
                      value={effective.qualityScore || "__none__"}
                      onValueChange={(next) =>
                        updateDraft(row, { qualityScore: next === "__none__" ? "" : next })
                      }
                      disabled={!canUpdate || saving}
                    >
                      <SelectTrigger className="h-8 w-[70px] text-xs">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">—</SelectItem>
                        {[1, 2, 3, 4, 5].map((score) => (
                          <SelectItem key={score} value={String(score)}>
                            {score}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {canUpdate ? (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {changedCount > 0 ? `${changedCount} alteração(ões) não salva(s)` : "Tudo salvo."}
          </span>
          <Button
            type="button"
            size="sm"
            disabled={saving || changedCount === 0}
            onClick={() => void handleSave()}
          >
            {saving ? "Salvando..." : "Salvar presença"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

type EditOccurrenceDialogProps = {
  occurrence: ApiMeeting | null;
  groups: ApiActivityPeopleGroup[];
  teamGroups: ApiActivityPeopleGroup[];
  token: string;
  projectId: string;
  actionId: string;
  canUpdate: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

function EditOccurrenceDialog({
  occurrence,
  groups,
  teamGroups,
  token,
  projectId,
  actionId,
  canUpdate,
  onOpenChange,
  onSaved,
}: EditOccurrenceDialogProps) {
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname) ?? "";
  const [scheduledDate, setScheduledDate] = React.useState("");
  const [startTime, setStartTime] = React.useState("");
  const [endTime, setEndTime] = React.useState("");
  const [peopleGroupIds, setPeopleGroupIds] = React.useState<string[]>([]);
  const [teamPeopleGroupIds, setTeamPeopleGroupIds] = React.useState<string[]>([]);
  const [status, setStatus] = React.useState<OccurrenceStatus>("SCHEDULED");
  const [notes, setNotes] = React.useState("");
  const [planHtml, setPlanHtml] = React.useState("");
  const [executedHtml, setExecutedHtml] = React.useState("");
  const [conclusionHtml, setConclusionHtml] = React.useState("");
  const [photoPaths, setPhotoPaths] = React.useState<string[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [photoUploading, setPhotoUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const photoInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (!occurrence) return;
    setScheduledDate(toDateInputValue(occurrence.scheduledDate));
    setStartTime(toTimeInputValue(occurrence.startTime));
    setEndTime(occurrence.endTime ? toTimeInputValue(occurrence.endTime) : "");
    setPeopleGroupIds(occurrence.peopleGroups.map((link) => link.peopleGroupId));
    setTeamPeopleGroupIds(occurrence.teamPeopleGroups.map((link) => link.peopleGroupId));
    setStatus(occurrence.status);
    setNotes(occurrence.notes ?? "");
    setPlanHtml(occurrence.planHtml ?? "");
    setExecutedHtml(occurrence.executedHtml ?? "");
    setConclusionHtml(occurrence.conclusionHtml ?? "");
    setPhotoPaths(occurrence.photoPaths ?? []);
    setError(null);
  }, [occurrence]);

  if (!occurrence) return null;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateMeeting(token, projectId, actionId, occurrence.id, {
        scheduledDate,
        startTime,
        endTime: endTime || null,
        peopleGroupIds,
        teamPeopleGroupIds,
        status,
        notes: notes.trim() ? notes.trim() : null,
        planHtml: planHtml.trim() || null,
        executedHtml: executedHtml.trim() || null,
        conclusionHtml: conclusionHtml.trim() || null,
        photoPaths,
      });
      toast({ title: "Encontro atualizado" });
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(resolveErrorMessage(err, "Falha ao salvar o encontro."));
    } finally {
      setSaving(false);
    }
  };

  const handleUploadPhoto = async (file: File) => {
    setPhotoUploading(true);
    try {
      const uploaded = await uploadActionPhoto(token, file);
      const nextPaths = [...photoPaths, uploaded.path].slice(0, 5);
      await updateMeeting(token, projectId, actionId, occurrence.id, {
        photoPaths: nextPaths,
      });
      setPhotoPaths(nextPaths);
      onSaved();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Falha ao enviar foto",
        description: resolveErrorMessage(err, "Falha ao enviar foto."),
      });
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleDeletePhoto = async (path: string) => {
    setPhotoUploading(true);
    try {
      const nextPaths = photoPaths.filter((item) => item !== path);
      await updateMeeting(token, projectId, actionId, occurrence.id, {
        photoPaths: nextPaths,
      });
      setPhotoPaths(nextPaths);
      onSaved();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Falha ao remover foto",
        description: resolveErrorMessage(err, "Falha ao remover foto."),
      });
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleCancelSeries = async () => {
    if (!occurrence.recurrenceBatchId) return;
    const confirmed = await confirm({
      title: "Cancelar série",
      description:
        "Cancelar este e todos os próximos encontros desta série? Os encontros já passados não são afetados.",
      confirmLabel: "Cancelar série",
      confirmVariant: "destructive",
    });
    if (!confirmed) return;
    setSaving(true);
    setError(null);
    try {
      const result = await updateMeetingBatch(
        token,
        projectId,
        actionId,
        occurrence.recurrenceBatchId,
        { status: "CANCELED", fromDate: toDateInputValue(occurrence.scheduledDate) },
      );
      toast({
        title: "Série cancelada",
        description: `${result.updated} encontro(s) atualizado(s).`,
      });
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(resolveErrorMessage(err, "Falha ao cancelar a série."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionDialog
      open={Boolean(occurrence)}
      onOpenChange={onOpenChange}
      title="Encontro"
      contentClassName="max-w-[720px]"
      footer={
        <div className="flex flex-col gap-2">
          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {canUpdate ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={saving}
                  onClick={() => {
                    const href = withTenantPath(
                      `/occurrences/new?projectId=${projectId}&actionId=${actionId}&meetingId=${occurrence.id}`,
                      tenantSlug,
                    );
                    onOpenChange(false);
                    router.push(href);
                  }}
                >
                  <TriangleAlert className="mr-2 h-4 w-4" />
                  Registrar ocorrência
                </Button>
              ) : null}
              {canUpdate && occurrence.recurrenceBatchId ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={saving}
                  onClick={() => void handleCancelSeries()}
                >
                  Cancelar esta e as próximas da série
                </Button>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
              {canUpdate ? (
                <Button type="button" disabled={saving} onClick={() => void handleSave()}>
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      }
    >
      <Tabs defaultValue="detalhes" className="flex flex-col gap-4">
        <TabsList>
          <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
          <TabsTrigger value="presenca">Presença</TabsTrigger>
        </TabsList>

        <TabsContent value="detalhes" className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label>Data</Label>
            <Input
              type="date"
              value={scheduledDate}
              onChange={(event) => setScheduledDate(event.target.value)}
              disabled={!canUpdate}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as OccurrenceStatus)}
              disabled={!canUpdate}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OCCURRENCE_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label>Início</Label>
            <Input
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              disabled={!canUpdate}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Término</Label>
            <Input
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              disabled={!canUpdate}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Grupos</Label>
          <MultiSelectBadges
            options={groups.map((link) => ({
              value: link.peopleGroupId,
              label: link.peopleGroup.name,
            }))}
            selectedValues={peopleGroupIds}
            onChange={setPeopleGroupIds}
            disabled={!canUpdate}
            addLabel="Adicionar grupo"
            searchPlaceholder="Pesquisar grupo..."
            noOptionsLabel="Nenhum grupo vinculado a esta atividade."
            emptyLabel="Sem grupo específico — vale para qualquer participante da atividade."
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Educadores/Equipe</Label>
          <TeamPeopleGroupPicker
            groups={teamGroups}
            selectedIds={teamPeopleGroupIds}
            onChange={setTeamPeopleGroupIds}
            disabled={!canUpdate}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Notas</Label>
          <Textarea
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            readOnly={!canUpdate}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Planejamento</Label>
          <RichText value={planHtml} onChange={setPlanHtml} disabled={!canUpdate} />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Relato da execução</Label>
          <RichText value={executedHtml} onChange={setExecutedHtml} disabled={!canUpdate} />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Conclusão</Label>
          <RichText value={conclusionHtml} onChange={setConclusionHtml} disabled={!canUpdate} />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Fotos</Label>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void handleUploadPhoto(file);
            }}
          />
          {canUpdate ? (
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/10 px-3 py-2">
              <span className="text-xs text-muted-foreground">
                {photoPaths.length}/5 fotos
              </span>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => photoInputRef.current?.click()}
                disabled={photoUploading || photoPaths.length >= 5}
              >
                {photoUploading ? "Enviando..." : "Enviar foto"}
              </Button>
            </div>
          ) : null}
          {photoPaths.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma foto adicionada.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {photoPaths.map((path) => (
                <div
                  key={path}
                  className="group relative overflow-hidden rounded-lg border border-border/60 bg-muted/10"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={resolveMediaUrl(path)} alt="Foto do encontro" className="h-32 w-full object-cover" />
                  {canUpdate ? (
                    <div className="absolute inset-0 flex items-end justify-end bg-gradient-to-t from-black/40 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => void handleDeletePhoto(path)}
                        disabled={photoUploading}
                      >
                        Remover
                      </Button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
        </TabsContent>

        <TabsContent value="presenca" className="flex flex-col gap-4">
          <MeetingAttendanceInlineTable
            token={token}
            projectId={projectId}
            actionId={actionId}
            occurrenceId={occurrence.id}
            canUpdate={canUpdate}
          />
        </TabsContent>
      </Tabs>
    </SectionDialog>
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
  const [occurrences, setOccurrences] = React.useState<ApiMeeting[]>([]);
  const [groups, setGroups] = React.useState<ApiActivityPeopleGroup[]>([]);
  const [teamGroups, setTeamGroups] = React.useState<ApiActivityPeopleGroup[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [view, setView] = React.useState<"list" | "calendar">("list");
  const [scheduleOpen, setScheduleOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<ApiMeeting | null>(null);
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

  const handleDelete = React.useCallback(
    async (occurrence: ApiMeeting) => {
      const confirmed = await confirm({
        title: "Excluir encontro",
        description: "Excluir este encontro? Essa ação não pode ser desfeita.",
        confirmLabel: "Excluir",
        confirmVariant: "destructive",
      });
      if (!confirmed) return;
      try {
        await deleteMeeting(token, projectId, actionId, occurrence.id);
        toast({ title: "Encontro excluído" });
        void loadOccurrences();
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: resolveErrorMessage(err, "Falha ao excluir o encontro."),
        });
      }
    },
    [confirm, token, projectId, actionId, toast, loadOccurrences],
  );

  const buildOccurrenceSearchRecord = React.useCallback(
    (item: ApiMeeting) => ({
      status: item.status,
      grupo: item.peopleGroups.map((link) => link.peopleGroupId),
      data: item.scheduledDate,
    }),
    [],
  );

  const filterFields = React.useMemo<SearchFieldDefinition[]>(
    () => [
      { name: "status", label: "Status", type: "select", options: OCCURRENCE_STATUS_OPTIONS },
      {
        name: "grupo",
        label: "Grupo de pessoas",
        type: "select",
        options: groups.map((link) => ({ value: link.peopleGroupId, label: link.peopleGroup.name })),
      },
      { name: "data", label: "Data", type: "date" },
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

  const columns = React.useMemo(
    () => buildOccurrenceColumns({ onDelete: handleDelete, canUpdate: !readOnly }),
    [handleDelete, readOnly],
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
        data={occurrences}
        searchText={searchText}
        onSearchTextChange={setSearchText}
        domain={domain}
        onDomainChange={setDomain}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        groupByOptions={[{ field: "status", label: "Status" }]}
        filterFields={filterFields}
        buildSearchRecord={buildOccurrenceSearchRecord}
        searchActionId="activity.occurrences"
        searchPlaceholder="Pesquisar por data, status, grupo ou notas"
        filteredCount={filteredOccurrences.length}
        addLabel="Agendar encontros"
        onAdd={readOnly ? undefined : () => setScheduleOpen(true)}
        columns={columns}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <RecordBrowserViewSwitcher
            value={view}
            onChange={setView}
            options={viewOptions}
          />
          {!readOnly && selectedRows.length > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Selecionados: <strong>{selectedRows.length}</strong>
              </span>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={bulkDeleting}
                onClick={() => void handleBulkDelete()}
              >
                {bulkDeleting ? "Excluindo..." : "Excluir selecionados"}
              </Button>
            </div>
          ) : null}
        </div>

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
            onRowClick={(row) => setEditTarget(row)}
            showColumnVisibilityButton={false}
            groupByFields={groupBy}
            bordered={false}
          />
        ) : (
          <CalendarView<ApiMeeting>
            items={filteredOccurrences}
            getDate={(item) => new Date(item.scheduledDate)}
            renderItem={(item) => (
              <button
                type="button"
                className="flex w-full flex-col gap-1 rounded-lg border border-border/60 bg-background px-3 py-2 text-left hover:bg-muted/20"
                onClick={() => setEditTarget(item)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">
                    {formatTimeOnly(item.startTime)}
                    {item.endTime ? ` – ${formatTimeOnly(item.endTime)}` : ""}
                  </span>
                  {resolveOccurrenceStatusBadge(item.status)}
                </div>
                <span className="text-xs text-muted-foreground">
                  {item.peopleGroups.length
                    ? item.peopleGroups.map((link) => link.peopleGroup.name).join(", ")
                    : "Sem grupo específico"}
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

      <EditOccurrenceDialog
        occurrence={editTarget}
        groups={groups}
        teamGroups={teamGroups}
        token={token}
        projectId={projectId}
        actionId={actionId}
        canUpdate={!readOnly}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        onSaved={() => void loadOccurrences()}
      />
    </>
  );
}
