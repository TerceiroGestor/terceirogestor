"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/DataTable";
import { SectionCard } from "@/components/section-card";
import { FormEngine } from "@/components/FormEngine/FormEngine";
import type { FormField } from "@/components/FormEngine/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { SectionDialog } from "@/components/section-dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  listProjectActionAttendances,
  upsertProjectActionAttendances,
  type AttendanceStatus,
  type ProjectActionAttendancesListItem,
} from "@/modules/actions/api";
import { usePathname } from "next/navigation";
import { getTenantSlugFromPath } from "@/lib/tenant-path";
import { PersonIdentityAvatarTrigger } from "@/modules/people/shared/ui/person-identity-card";
import { ACTION_QUALITY_TEXT } from "../config/action-quality.constants";

type QualityDraft = {
  qualityScore?: number | null;
  qualityNotes?: string | null;
  isHighlight?: boolean;
};

type NotesDialogState = {
  enrollmentId: string;
  fullName: string;
  status: AttendanceStatus;
  qualityScore: number | null;
  isHighlight: boolean;
  qualityNotes: string;
};

type NotesFormValues = {
  qualityNotes: string;
};

const NONE_VALUE = "__none__";

const SCORE_OPTIONS = [
  { label: "Sem nota", value: NONE_VALUE },
  { label: "1", value: "1" },
  { label: "2", value: "2" },
  { label: "3", value: "3" },
  { label: "4", value: "4" },
  { label: "5", value: "5" },
];

type ActionQualityCardProps = {
  token: string;
  projectId: string;
  actionId: string;
  canUpdate: boolean;
  canReadPeople: boolean;
};

export function ActionQualityCard({
  token,
  projectId,
  actionId,
  canUpdate,
  canReadPeople,
}: ActionQualityCardProps) {
  const { toast } = useToast();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);

  const [rows, setRows] = React.useState<ProjectActionAttendancesListItem[]>(
    [],
  );
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const [drafts, setDrafts] = React.useState<Record<string, QualityDraft>>({});
  const [notesDialog, setNotesDialog] = React.useState<NotesDialogState | null>(
    null,
  );

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listProjectActionAttendances(
        token,
        projectId,
        actionId,
        {
          limit: 200,
        },
      );
      setRows(response.data ?? []);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar participantes.";
      setError(message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [token, projectId, actionId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const trackedRows = React.useMemo(
    () => rows.filter((row) => row.attendance !== null),
    [rows],
  );

  const hasDrafts = React.useMemo(
    () => Object.keys(drafts).length > 0,
    [drafts],
  );

  const applyDraft = React.useCallback(
    (enrollmentId: string, patch: QualityDraft) => {
      setDrafts((prev) => ({
        ...prev,
        [enrollmentId]: { ...(prev[enrollmentId] ?? {}), ...patch },
      }));
    },
    [],
  );

  const columns = React.useMemo<
    ColumnDef<ProjectActionAttendancesListItem>[]
  >(() => {
    return [
      {
        id: "person",
        header: "Pessoa",
        accessorFn: (row) => row.enrollment.person?.fullName ?? "",
        cell: ({ row }) => {
          const enrollment = row.original.enrollment;
          const person = enrollment.person;
          if (!person) return <span className="text-muted-foreground">—</span>;
          return (
            <div className="flex items-center gap-3">
              <PersonIdentityAvatarTrigger
                personId={person.id}
                tenantSlug={tenantSlug}
                fullName={person.fullName}
                birthDate={person.birthDate ?? null}
                avatarUrl={person.avatarUrl ?? null}
                hasHealthCondition={person.hasHealthCondition}
                hasMedication={person.hasMedication}
                showDetailsLink={canReadPeople}
              />
              <div className="min-w-0">
                <div className="truncate font-medium">{person.fullName}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {enrollment.groups?.map((g) => g.name).join(", ") || "—"}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: "score",
        header: "Nota",
        accessorFn: (row) => row.attendance?.qualityScore ?? "",
        cell: ({ row }) => {
          const attendance = row.original.attendance;
          if (!attendance)
            return <span className="text-muted-foreground">—</span>;
          const draft = drafts[row.original.enrollment.id] ?? {};
          const value =
            draft.qualityScore === undefined
              ? (attendance.qualityScore ?? null)
              : draft.qualityScore;
          const selectValue =
            value === null || value === undefined ? NONE_VALUE : String(value);
          return (
            <Select
              value={selectValue}
              onValueChange={(next) => {
                const parsed =
                  next === NONE_VALUE
                    ? null
                    : Math.min(5, Math.max(1, Number(next)));
                applyDraft(row.original.enrollment.id, {
                  qualityScore: parsed,
                });
              }}
              disabled={!canUpdate}
            >
              <SelectTrigger className="h-9 w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCORE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        },
      },
      {
        id: "highlight",
        header: "Destaque",
        accessorFn: (row) => (row.attendance?.isHighlight ? 1 : 0),
        cell: ({ row }) => {
          const attendance = row.original.attendance;
          if (!attendance)
            return <span className="text-muted-foreground">—</span>;
          const draft = drafts[row.original.enrollment.id] ?? {};
          const value =
            draft.isHighlight === undefined
              ? attendance.isHighlight
              : draft.isHighlight;
          return (
            <div className="flex items-center justify-center">
              <Switch
                checked={Boolean(value)}
                onCheckedChange={(checked) =>
                  applyDraft(row.original.enrollment.id, {
                    isHighlight: Boolean(checked),
                  })
                }
                disabled={!canUpdate}
              />
            </div>
          );
        },
      },
      {
        id: "notes",
        header: "Observações",
        accessorFn: (row) => row.attendance?.qualityNotes ?? "",
        cell: ({ row }) => {
          const attendance = row.original.attendance;
          if (!attendance)
            return <span className="text-muted-foreground">—</span>;
          const draft = drafts[row.original.enrollment.id] ?? {};
          const value =
            draft.qualityNotes === undefined
              ? (attendance.qualityNotes ?? "")
              : (draft.qualityNotes ?? "");
          return (
            <Button
              type="button"
              variant="ghost"
              className="h-8 px-2 text-xs"
              disabled={!canUpdate}
              onClick={() => {
                const person = row.original.enrollment.person;
                if (!person) return;
                setNotesDialog({
                  enrollmentId: row.original.enrollment.id,
                  fullName: person.fullName,
                  status: attendance.status,
                  qualityScore: attendance.qualityScore ?? null,
                  isHighlight: attendance.isHighlight,
                  qualityNotes: value,
                });
              }}
            >
              {value ? "Editar" : "Adicionar"}
            </Button>
          );
        },
      },
    ];
  }, [applyDraft, canReadPeople, canUpdate, drafts, tenantSlug]);

  const handleSave = async () => {
    if (!canUpdate) return;
    const enrollmentIds = Object.keys(drafts);
    if (enrollmentIds.length === 0) return;

    const items = enrollmentIds
      .map((enrollmentId) => {
        const row = trackedRows.find((r) => r.enrollment.id === enrollmentId);
        if (!row?.attendance) return null;
        const patch = drafts[enrollmentId] ?? {};
        return {
          enrollmentId,
          status: row.attendance.status,
          ...(patch.qualityScore !== undefined
            ? { qualityScore: patch.qualityScore }
            : {}),
          ...(patch.qualityNotes !== undefined
            ? { qualityNotes: patch.qualityNotes }
            : {}),
          ...(patch.isHighlight !== undefined
            ? { isHighlight: patch.isHighlight }
            : {}),
        };
      })
      .filter(Boolean) as {
      enrollmentId: string;
      status: AttendanceStatus;
      qualityScore?: number | null;
      qualityNotes?: string | null;
      isHighlight?: boolean;
    }[];

    if (items.length === 0) {
      toast({
        title: ACTION_QUALITY_TEXT.saveNothingTitle,
        description: ACTION_QUALITY_TEXT.saveNothingDescription,
      });
      return;
    }

    setSaving(true);
    try {
      await upsertProjectActionAttendances(token, projectId, actionId, items);
      setDrafts({});
      toast({ title: ACTION_QUALITY_TEXT.saveOk });
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

  return (
    <>
      <SectionCard
        title={ACTION_QUALITY_TEXT.title}
        subtitle={ACTION_QUALITY_TEXT.subtitle}
        actions={
          canUpdate ? (
            <Button
              type="button"
              onClick={handleSave}
              disabled={!hasDrafts || saving}
            >
              <Save className="mr-2 size-4" />
              {ACTION_QUALITY_TEXT.save}
            </Button>
          ) : null
        }
      >
        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-lg border border-border/60 bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
            Carregando...
          </div>
        ) : null}

        <DataTable<ProjectActionAttendancesListItem>
          data={trackedRows}
          columns={columns}
          manualPagination={false}
          showExportMenu={false}
          searchPlaceholder={ACTION_QUALITY_TEXT.searchPlaceholder}
          onGlobalFilterChange={() => {}}
          summaryCards={{
            totalLabel: ACTION_QUALITY_TEXT.summaryTotal,
            filteredLabel: ACTION_QUALITY_TEXT.summaryFiltered,
          }}
        />

        <div className="mt-2 text-xs text-muted-foreground">
          {ACTION_QUALITY_TEXT.hint}
        </div>
      </SectionCard>

      <SectionDialog
        open={Boolean(notesDialog)}
        onOpenChange={(open) => {
          if (!open) setNotesDialog(null);
        }}
        title={ACTION_QUALITY_TEXT.notesTitle}
        description={notesDialog?.fullName ?? ""}
        contentClassName="max-w-[min(96vw,38rem)]"
      >
        {notesDialog ? (
          <FormEngine<NotesFormValues>
            fields={
              [
                {
                  name: "qualityNotes",
                  label: ACTION_QUALITY_TEXT.notesLabel,
                  type: "textarea",
                  rows: 5,
                },
              ] satisfies FormField<NotesFormValues>[]
            }
            initialValues={{ qualityNotes: notesDialog.qualityNotes ?? "" }}
            disabled={!canUpdate || saving}
            onSubmit={(values) => {
              applyDraft(notesDialog.enrollmentId, {
                qualityNotes: values.qualityNotes.trim()
                  ? values.qualityNotes.trim()
                  : null,
              });
              setNotesDialog(null);
            }}
            actions={
              canUpdate
                ? { submit: { label: ACTION_QUALITY_TEXT.save, variant: "primary" } }
                : undefined
            }
          />
        ) : null}
      </SectionDialog>
    </>
  );
}
