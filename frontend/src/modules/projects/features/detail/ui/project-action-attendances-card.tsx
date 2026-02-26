"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronDown, ListChecks, NotebookPen, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/DataTable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { SectionCard } from "@/components/section-card";
import { SectionDialog } from "@/components/section-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_STATUS_OPTIONS,
  listProjectActionAttendances,
  upsertProjectActionAttendances,
  type AttendanceStatus,
  type ProjectActionAttendancesListItem,
} from "@/modules/actions";
import { listProjectGroups, type ApiProjectGroup } from "@/modules/projects/api";
import {
  GENDER_LABELS,
  RACE_COLOR_LABELS,
  SEX_LABELS,
  getAgeFromBirthDate,
  resolveLabel,
} from "@/modules/people/shared/domain/utils";
import { PersonIdentityAvatarTrigger } from "@/modules/people/shared/ui/person-identity-card";
import { usePathname } from "next/navigation";
import { getTenantSlugFromPath } from "@/lib/tenant-path";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AttendanceDraft = {
  status?: AttendanceStatus;
  notes?: string | null;
};

type NotesDialogState = {
  enrollmentId: string;
  fullName: string;
  status: AttendanceStatus | "";
  notes: string;
};

type ProjectActionAttendancesCardProps = {
  token: string;
  projectId: string;
  actionId: string;
  canUpdate: boolean;
  canReadStructure: boolean;
  canReadPeople: boolean;
  canReadPeopleIdentity: boolean;
};

const ALL_GROUPS_VALUE = "__all__";

function resolveAttendanceBadge(status: AttendanceStatus) {
  const label = ATTENDANCE_STATUS_LABELS[status] ?? status;
  switch (status) {
    case "ABSENT":
      return <Badge variant="outline">{label}</Badge>;
    case "EXCUSED":
      return <Badge variant="secondary">{label}</Badge>;
    case "PRESENT":
    default:
      return (
        <Badge className="border-transparent bg-emerald-600 text-white">
          {label}
        </Badge>
      );
  }
}

export function ProjectActionAttendancesCard({
  token,
  projectId,
  actionId,
  canUpdate,
  canReadStructure,
  canReadPeople,
}: ProjectActionAttendancesCardProps) {
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const { toast } = useToast();

  const [rows, setRows] = React.useState<ProjectActionAttendancesListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [pageCount, setPageCount] = React.useState(0);
  const [totalCount, setTotalCount] = React.useState(0);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 20,
  });
  const [search, setSearch] = React.useState("");
  const [groupId, setGroupId] = React.useState<string>(ALL_GROUPS_VALUE);
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "not_recorded" | AttendanceStatus
  >("all");

  const [groups, setGroups] = React.useState<ApiProjectGroup[]>([]);
  const [draft, setDraft] = React.useState<Record<string, AttendanceDraft>>({});
  const [saving, setSaving] = React.useState(false);

  const [selectionMode, setSelectionMode] = React.useState(false);
  const [selectedRows, setSelectedRows] = React.useState<ProjectActionAttendancesListItem[]>([]);

  const [notesDialog, setNotesDialog] = React.useState<NotesDialogState | null>(null);

  React.useEffect(() => {
    if (!canReadStructure) return;
    listProjectGroups(token, projectId)
      .then((data) => setGroups(data))
      .catch(() => setGroups([]));
  }, [token, projectId, canReadStructure]);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listProjectActionAttendances(token, projectId, actionId, {
        q: search.trim() ? search.trim() : undefined,
        groupId: groupId === ALL_GROUPS_VALUE ? undefined : groupId,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      });

      const total = response.pagination?.total ?? 0;
      setTotalCount(total);
      setPageCount(response.pagination?.pages ?? Math.ceil(total / pagination.pageSize));

      let data = response.data ?? [];
      if (statusFilter === "not_recorded") {
        data = data.filter((row) => row.attendance === null);
      } else if (statusFilter !== "all") {
        data = data.filter((row) => row.attendance?.status === statusFilter);
      }

      setRows(data);
      setDraft({});
      if (selectionMode) setSelectedRows([]);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar presenças.";
      setError(message);
      setRows([]);
      setTotalCount(0);
      setPageCount(0);
      setDraft({});
      if (selectionMode) setSelectedRows([]);
    } finally {
      setLoading(false);
    }
  }, [
    token,
    projectId,
    actionId,
    search,
    groupId,
    statusFilter,
    pagination.pageIndex,
    pagination.pageSize,
    selectionMode,
  ]);

  React.useEffect(() => {
    load();
  }, [load]);

  const draftCount = React.useMemo(() => Object.keys(draft).length, [draft]);

  const getEffective = React.useCallback(
    (row: ProjectActionAttendancesListItem) => {
      const enrollmentId = row.enrollment.id;
      const originalStatus = row.attendance?.status ?? null;
      const originalNotes = row.attendance?.notes ?? null;
      const entry = draft[enrollmentId];
      return {
        status: (entry?.status ?? originalStatus) as AttendanceStatus | null,
        notes:
          entry?.notes !== undefined
            ? entry.notes
            : (originalNotes as string | null),
      };
    },
    [draft],
  );

  const setRowDraft = React.useCallback(
    (
      row: ProjectActionAttendancesListItem,
      patch: AttendanceDraft,
      prune?: boolean,
    ) => {
      const enrollmentId = row.enrollment.id;
      setDraft((prev) => {
        const next = { ...prev };
        const existing = prev[enrollmentId] ?? {};
        const merged: AttendanceDraft = { ...existing, ...patch };

        if (prune) {
          const originalStatus = row.attendance?.status ?? undefined;
          const originalNotes = row.attendance?.notes ?? null;
          const mergedStatus = merged.status ?? undefined;
          const mergedNotes =
            merged.notes !== undefined ? merged.notes : undefined;

          const statusMatches =
            mergedStatus === undefined || mergedStatus === originalStatus;
          const notesMatches =
            mergedNotes === undefined || mergedNotes === originalNotes;
          if (statusMatches && notesMatches) {
            delete next[enrollmentId];
            return next;
          }
        }

        next[enrollmentId] = merged;
        return next;
      });
    },
    [],
  );

  const applyStatusToRows = React.useCallback(
    (items: ProjectActionAttendancesListItem[], status: AttendanceStatus) => {
      items.forEach((row) => setRowDraft(row, { status }, true));
    },
    [setRowDraft],
  );

  const handleSave = async () => {
    if (!canUpdate) return;
    const items = Object.entries(draft).map(([enrollmentId, entry]) => ({
      enrollmentId,
      status: entry.status,
      notes: entry.notes,
    }));

    const missingStatus = items.find((item) => !item.status);
    if (missingStatus) {
      toast({
        title: "Status pendente",
        description:
          "Há participantes com presença sem status definido. Selecione Presente/Ausente/Justificado antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = items.map((item) => ({
        enrollmentId: item.enrollmentId,
        status: item.status as AttendanceStatus,
        ...(item.notes !== undefined ? { notes: item.notes } : {}),
      }));
      const result = await upsertProjectActionAttendances(token, projectId, actionId, payload);
      toast({
        title: "Presenças salvas",
        description: `${result.created} criadas • ${result.updated} atualizadas`,
      });
      await load();
    } catch (err) {
      toast({
        title: "Falha ao salvar",
        description:
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const columns = React.useMemo<ColumnDef<ProjectActionAttendancesListItem>[]>(() => {
    return [
      {
        id: "person",
        header: "Pessoa",
        accessorFn: (row) => row.enrollment.person.fullName,
        cell: ({ row }) => {
          const person = row.original.enrollment.person;
          return (
            <div className="flex items-center gap-3">
              <PersonIdentityAvatarTrigger
                personId={person.id}
                tenantSlug={tenantSlug}
                fullName={person.fullName}
                birthDate={person.birthDate ?? null}
                avatarUrl={person.avatarUrl}
                hasHealthCondition={person.hasHealthCondition}
                hasMedication={person.hasMedication}
                showDetailsLink={canReadPeople}
              />
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{person.fullName}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {row.original.enrollment.groups.map((g) => g.name).join(", ") || "—"}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        id: "age",
        header: "Idade",
        accessorFn: (row) => getAgeFromBirthDate(row.enrollment.person.birthDate),
        cell: ({ row }) => getAgeFromBirthDate(row.original.enrollment.person.birthDate) ?? "—",
      },
      {
        id: "sex",
        header: "Sexo",
        accessorFn: (row) => row.enrollment.person.sex ?? "",
        cell: ({ row }) =>
          resolveLabel(row.original.enrollment.person.sex, SEX_LABELS),
      },
      {
        id: "gender",
        header: "Gênero",
        accessorFn: (row) => row.enrollment.person.gender ?? "",
        cell: ({ row }) =>
          resolveLabel(row.original.enrollment.person.gender, GENDER_LABELS),
      },
      {
        id: "raceColor",
        header: "Raça e cor",
        accessorFn: (row) => row.enrollment.person.raceColor ?? "",
        cell: ({ row }) =>
          resolveLabel(row.original.enrollment.person.raceColor, RACE_COLOR_LABELS),
      },
      {
        id: "cycle",
        header: "Ciclo",
        accessorFn: (row) => row.enrollment.cycle?.name ?? "",
        cell: ({ row }) => row.original.enrollment.cycle?.name ?? "—",
      },
      {
        id: "attendance",
        header: "Presença",
        accessorFn: (row) => row.attendance?.status ?? "",
        cell: ({ row }) => {
          const effective = getEffective(row.original);
          if (!canUpdate) {
            return effective.status ? resolveAttendanceBadge(effective.status) : "—";
          }

          return (
            <div className="flex items-center gap-2">
              <Select
                value={effective.status ?? ""}
                onValueChange={(value) =>
                  setRowDraft(row.original, { status: value as AttendanceStatus }, true)
                }
              >
                <SelectTrigger className="h-8 w-[160px]">
                  <SelectValue placeholder="Não registrado" />
                </SelectTrigger>
                <SelectContent>
                  {ATTENDANCE_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Observação"
                aria-label="Observação"
                onClick={() => {
                  const person = row.original.enrollment.person;
                  setNotesDialog({
                    enrollmentId: row.original.enrollment.id,
                    fullName: person.fullName,
                    status: effective.status ?? "",
                    notes: effective.notes ?? "",
                  });
                }}
              >
                <NotebookPen className="size-4" />
              </Button>
            </div>
          );
        },
      },
      {
        id: "notes",
        header: "Obs.",
        accessorFn: (row) => row.attendance?.notes ?? "",
        cell: ({ row }) => {
          const effective = getEffective(row.original);
          const text = effective.notes?.trim() ?? "";
          if (!text) return "—";
          return <span className="line-clamp-1">{text}</span>;
        },
      },
    ];
  }, [
    canUpdate,
    canReadPeople,
    getEffective,
    setRowDraft,
    tenantSlug,
  ]);

  const groupOptions = React.useMemo(
    () => [
      { label: "Todos os grupos", value: ALL_GROUPS_VALUE },
      ...groups.map((g) => ({ label: g.name, value: g.id })),
    ],
    [groups],
  );

  return (
    <SectionCard
      title="Presenças"
      subtitle="Registre presença rapidamente e salve em lote."
      actions={
        canUpdate ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={selectionMode ? "secondary" : "outline"}
              disabled={saving}
              onClick={() => {
                setSelectionMode((prev) => {
                  const next = !prev;
                  if (!next) setSelectedRows([]);
                  return next;
                });
              }}
              title={selectionMode ? "Desativar seleção" : "Ativar seleção"}
            >
              <ListChecks className="mr-2 size-4" />
              {selectionMode ? "Cancelar seleção" : "Selecionar"}
            </Button>

            {selectionMode ? (
              <>
                <span className="text-xs text-muted-foreground">
                  Selecionados: <strong>{selectedRows.length}</strong>
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={saving || selectedRows.length === 0}
                    >
                      Aplicar status <ChevronDown className="ml-2 size-4 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => applyStatusToRows(selectedRows, "PRESENT")}>
                      Presente
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => applyStatusToRows(selectedRows, "ABSENT")}>
                      Ausente
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => applyStatusToRows(selectedRows, "EXCUSED")}>
                      Justificado
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : null}

            <Button
              type="button"
              onClick={handleSave}
              disabled={saving || draftCount === 0}
            >
              <Save className="mr-2 size-4" />
              {saving ? "Salvando..." : `Salvar (${draftCount})`}
            </Button>
          </div>
        ) : null
      }
    >
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Grupo</Label>
          <Select value={groupId} onValueChange={(value) => setGroupId(value)}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Todos os grupos" />
            </SelectTrigger>
            <SelectContent>
              {groupOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as "all" | "not_recorded" | AttendanceStatus)
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="not_recorded">Não registrado</SelectItem>
              {ATTENDANCE_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Carregando...</p>
      ) : null}

      <DataTable<ProjectActionAttendancesListItem>
        columns={columns}
        data={rows}
        manualPagination
        pageCount={pageCount}
        pagination={pagination}
        onPaginationChange={(next) => setPagination(next)}
        totalCount={totalCount}
        onGlobalFilterChange={setSearch}
        searchPlaceholder="Pesquisar participantes"
        showExportMenu={false}
        enableRowSelection={selectionMode}
        onSelectedRowsChange={setSelectedRows}
        tableClassName="table-auto"
        summaryCards={{
          totalLabel: "Total",
          filteredLabel: "Filtrados",
        }}
      />

      <SectionDialog
        open={notesDialog !== null}
        onOpenChange={(open) => {
          if (!open) setNotesDialog(null);
        }}
        title="Observação"
        description="Opcional. Use para registrar justificativa ou ocorrências rápidas."
        contentClassName="max-w-[720px]"
      >
        {notesDialog ? (
          <div className="flex flex-col gap-4">
            <div className="text-sm">
              Participante: <strong>{notesDialog.fullName}</strong>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>Status</Label>
                <Select
                  value={notesDialog.status}
                  onValueChange={(value) =>
                    setNotesDialog((prev) =>
                      prev ? { ...prev, status: value as AttendanceStatus } : prev,
                    )
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {ATTENDANCE_STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Observação</Label>
              <Textarea
                rows={4}
                value={notesDialog.notes}
                onChange={(event) =>
                  setNotesDialog((prev) =>
                    prev ? { ...prev, notes: event.target.value } : prev,
                  )
                }
                placeholder="Ex.: Chegou atrasado, saiu mais cedo, justificativa..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setNotesDialog(null)}>
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={!canUpdate}
                onClick={() => {
                  const row = rows.find((r) => r.enrollment.id === notesDialog.enrollmentId);
                  if (!row) {
                    setNotesDialog(null);
                    return;
                  }
                  const notes = notesDialog.notes.trim() ? notesDialog.notes.trim() : null;
                  setRowDraft(
                    row,
                    {
                      ...(notesDialog.status ? { status: notesDialog.status as AttendanceStatus } : {}),
                      notes,
                    },
                    true,
                  );
                  setNotesDialog(null);
                }}
              >
                Aplicar
              </Button>
            </div>
          </div>
        ) : null}
      </SectionDialog>
    </SectionCard>
  );
}
