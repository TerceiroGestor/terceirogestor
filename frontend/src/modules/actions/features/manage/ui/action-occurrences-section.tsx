"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionCard } from "@/components/section-card";
import { SectionDialog } from "@/components/section-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  bulkCreateActionOccurrences,
  deleteActionOccurrence,
  listActionOccurrences,
  listActionPeopleGroups,
  updateActionOccurrence,
  updateActionOccurrenceBatch,
  type ApiActionOccurrence,
  type ApiActionPeopleGroup,
  type OccurrenceStatus,
  type WeekDay,
} from "@/modules/actions/api";
import {
  OCCURRENCE_STATUS_LABELS,
  OCCURRENCE_STATUS_OPTIONS,
  WEEK_DAY_OPTIONS,
} from "@/modules/actions/shared/domain/actions.constants";
import { CalendarView } from "@/web-client/views/CalendarView";
import { ListView } from "@/web-client/views/ListView";

const NO_GROUP_VALUE = "__none__";

function resolveErrorMessage(err: unknown, fallback: string) {
  return err && typeof err === "object" && "message" in err
    ? String((err as { message?: string }).message)
    : fallback;
}

function formatDateOnly(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", { timeZone: "UTC" });
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
  onDelete: (occurrence: ApiActionOccurrence) => void;
  canUpdate: boolean;
}): ColumnDef<ApiActionOccurrence>[] {
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
      accessorFn: (row) => row.peopleGroup?.name ?? "",
      cell: ({ row }) => row.original.peopleGroup?.name ?? "—",
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
          <span className="line-clamp-1">{row.original.notes}</span>
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
  groups: ApiActionPeopleGroup[];
  onCompleted: () => void;
};

function BulkScheduleOccurrencesDialog({
  open,
  onOpenChange,
  token,
  projectId,
  actionId,
  groups,
  onCompleted,
}: BulkScheduleDialogProps) {
  const { toast } = useToast();
  const [peopleGroupId, setPeopleGroupId] = React.useState(NO_GROUP_VALUE);
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [daysOfWeek, setDaysOfWeek] = React.useState<WeekDay[]>([]);
  const [startTime, setStartTime] = React.useState("");
  const [endTime, setEndTime] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setPeopleGroupId(NO_GROUP_VALUE);
    setStartDate("");
    setEndDate("");
    setDaysOfWeek([]);
    setStartTime("");
    setEndTime("");
    setNotes("");
    setError(null);
  }, [open]);

  const toggleDay = (day: WeekDay) => {
    setDaysOfWeek((previous) =>
      previous.includes(day)
        ? previous.filter((item) => item !== day)
        : [...previous, day],
    );
  };

  const handleSubmit = async () => {
    if (!startDate || !endDate || !startTime || daysOfWeek.length === 0) {
      setError("Preencha o período, os dias da semana e o horário de início.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const result = await bulkCreateActionOccurrences(token, projectId, actionId, {
        peopleGroupId: peopleGroupId === NO_GROUP_VALUE ? null : peopleGroupId,
        startDate,
        endDate,
        daysOfWeek,
        startTime,
        endTime: endTime || null,
        notes: notes.trim() ? notes.trim() : null,
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

  return (
    <SectionDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Agendar encontros"
      description="Gera os encontros de uma vez, a partir de um padrão semanal."
      contentClassName="max-w-[560px]"
    >
      <div className="flex flex-col gap-4">
        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <Label>Grupo</Label>
          <Select value={peopleGroupId} onValueChange={setPeopleGroupId}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_GROUP_VALUE}>Sem grupo específico</SelectItem>
              {groups.map((link) => (
                <SelectItem key={link.id} value={link.peopleGroupId}>
                  {link.peopleGroup.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
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

        <div className="grid grid-cols-2 gap-3">
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
          <Label>Notas (opcional)</Label>
          <Textarea
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" disabled={saving} onClick={() => void handleSubmit()}>
            {saving ? "Agendando..." : "Agendar"}
          </Button>
        </div>
      </div>
    </SectionDialog>
  );
}

type EditOccurrenceDialogProps = {
  occurrence: ApiActionOccurrence | null;
  groups: ApiActionPeopleGroup[];
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
  token,
  projectId,
  actionId,
  canUpdate,
  onOpenChange,
  onSaved,
}: EditOccurrenceDialogProps) {
  const { toast } = useToast();
  const [scheduledDate, setScheduledDate] = React.useState("");
  const [startTime, setStartTime] = React.useState("");
  const [endTime, setEndTime] = React.useState("");
  const [peopleGroupId, setPeopleGroupId] = React.useState(NO_GROUP_VALUE);
  const [status, setStatus] = React.useState<OccurrenceStatus>("SCHEDULED");
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!occurrence) return;
    setScheduledDate(toDateInputValue(occurrence.scheduledDate));
    setStartTime(toTimeInputValue(occurrence.startTime));
    setEndTime(occurrence.endTime ? toTimeInputValue(occurrence.endTime) : "");
    setPeopleGroupId(occurrence.peopleGroupId ?? NO_GROUP_VALUE);
    setStatus(occurrence.status);
    setNotes(occurrence.notes ?? "");
    setError(null);
  }, [occurrence]);

  if (!occurrence) return null;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateActionOccurrence(token, projectId, actionId, occurrence.id, {
        scheduledDate,
        startTime,
        endTime: endTime || null,
        peopleGroupId: peopleGroupId === NO_GROUP_VALUE ? null : peopleGroupId,
        status,
        notes: notes.trim() ? notes.trim() : null,
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

  const handleCancelSeries = async () => {
    if (!occurrence.recurrenceBatchId) return;
    if (
      !window.confirm(
        "Cancelar este e todos os próximos encontros desta série? Os encontros já passados não são afetados.",
      )
    ) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await updateActionOccurrenceBatch(
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
      contentClassName="max-w-[560px]"
    >
      <div className="flex flex-col gap-4">
        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

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
          <Label>Grupo</Label>
          <Select
            value={peopleGroupId}
            onValueChange={setPeopleGroupId}
            disabled={!canUpdate}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_GROUP_VALUE}>Sem grupo específico</SelectItem>
              {groups.map((link) => (
                <SelectItem key={link.id} value={link.peopleGroupId}>
                  {link.peopleGroup.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

        <div className="flex items-center justify-between gap-2">
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
          ) : (
            <span />
          )}
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
  const [occurrences, setOccurrences] = React.useState<ApiActionOccurrence[]>([]);
  const [groups, setGroups] = React.useState<ApiActionPeopleGroup[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [view, setView] = React.useState<"list" | "calendar">("list");
  const [scheduleOpen, setScheduleOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<ApiActionOccurrence | null>(null);

  const loadOccurrences = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listActionOccurrences(token, projectId, actionId, {
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
      const response = await listActionPeopleGroups(token, projectId, actionId, {
        participationKind: "PARTICIPANT",
      });
      setGroups(response);
    } catch {
      setGroups([]);
    }
  }, [token, projectId, actionId]);

  React.useEffect(() => {
    void loadOccurrences();
    void loadGroups();
  }, [loadOccurrences, loadGroups]);

  const handleDelete = React.useCallback(
    async (occurrence: ApiActionOccurrence) => {
      if (!window.confirm("Excluir este encontro?")) return;
      try {
        await deleteActionOccurrence(token, projectId, actionId, occurrence.id);
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
    [token, projectId, actionId, toast, loadOccurrences],
  );

  const columns = React.useMemo(
    () => buildOccurrenceColumns({ onDelete: handleDelete, canUpdate: !readOnly }),
    [handleDelete, readOnly],
  );

  return (
    <SectionCard
      title="Encontros"
      actions={
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border border-border/60 p-0.5">
            <Button
              type="button"
              size="sm"
              variant={view === "list" ? "secondary" : "ghost"}
              className="h-7 px-2 text-xs"
              onClick={() => setView("list")}
            >
              Lista
            </Button>
            <Button
              type="button"
              size="sm"
              variant={view === "calendar" ? "secondary" : "ghost"}
              className="h-7 px-2 text-xs"
              onClick={() => setView("calendar")}
            >
              Calendário
            </Button>
          </div>
          {!readOnly ? (
            <Button type="button" size="sm" onClick={() => setScheduleOpen(true)}>
              Agendar encontros
            </Button>
          ) : null}
        </div>
      }
    >
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-xs text-muted-foreground">Carregando...</p>
      ) : occurrences.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum encontro agendado ainda.
        </p>
      ) : view === "list" ? (
        <ListView<ApiActionOccurrence>
          data={occurrences}
          columns={columns}
          getRowId={(row) => row.id}
          onRowClick={(row) => setEditTarget(row)}
          showColumnVisibilityButton={false}
        />
      ) : (
        <CalendarView<ApiActionOccurrence>
          items={occurrences}
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
                {item.peopleGroup?.name ?? "Sem grupo específico"}
              </span>
            </button>
          )}
        />
      )}

      <BulkScheduleOccurrencesDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        token={token}
        projectId={projectId}
        actionId={actionId}
        groups={groups}
        onCompleted={() => void loadOccurrences()}
      />

      <EditOccurrenceDialog
        occurrence={editTarget}
        groups={groups}
        token={token}
        projectId={projectId}
        actionId={actionId}
        canUpdate={!readOnly}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        onSaved={() => void loadOccurrences()}
      />
    </SectionCard>
  );
}
