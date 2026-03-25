"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Save } from "lucide-react";
import { usePathname } from "next/navigation";
import { DataTable } from "@/components/DataTable";
import { SectionCard } from "@/components/section-card";
import { SectionDialog } from "@/components/section-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { getTenantSlugFromPath } from "@/lib/tenant-path";
import {
  listProjectActionAttendances,
  upsertProjectActionAttendances,
  type AttendanceStatus,
  type ProjectActionAttendancesListItem,
} from "@/modules/actions/api";
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

  const [rows, setRows] = React.useState<ProjectActionAttendancesListItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [drafts, setDrafts] = React.useState<Record<string, QualityDraft>>({});
  const [notesDialog, setNotesDialog] = React.useState<NotesDialogState | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listProjectActionAttendances(token, projectId, actionId, { limit: 200 });
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
  }, [actionId, projectId, token]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const trackedRows = React.useMemo(
    () => rows.filter((row) => row.attendance !== null),
    [rows],
  );

  const hasDrafts = React.useMemo(() => Object.keys(drafts).length > 0, [drafts]);

  const applyDraft = React.useCallback((enrollmentId: string, patch: QualityDraft) => {
    setDrafts((previous) => ({
      ...previous,
      [enrollmentId]: { ...(previous[enrollmentId] ?? {}), ...patch },
    }));
  }, []);

  const columns = React.useMemo<ColumnDef<ProjectActionAttendancesListItem>[]>(() => {
    return [
      {
        id: "person",
        header: "Pessoa",
        accessorFn: (row) => row.enrollment.person?.fullName ?? "",
        cell: ({ row }) => {
          const enrollment = row.original.enrollment;
          const person = enrollment.person;
          if (!person) return <span className="text-muted-foreground">-</span>;
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
                  {enrollment.groups?.map((group) => group.name).join(", ") || "-"}
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
          if (!attendance) return <span className="text-muted-foreground">-</span>;
          const draft = drafts[row.original.enrollment.id] ?? {};
          const value =
            draft.qualityScore === undefined ? (attendance.qualityScore ?? null) : draft.qualityScore;
          const selectValue = value === null || value === undefined ? NONE_VALUE : String(value);
          return (
            <Select
              value={selectValue}
              onValueChange={(next) => {
                const parsed = next === NONE_VALUE ? null : Math.min(5, Math.max(1, Number(next)));
                applyDraft(row.original.enrollment.id, { qualityScore: parsed });
              }}
              disabled={!canUpdate}
            >
              <SelectTrigger className="h-9 w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCORE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
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
          if (!attendance) return <span className="text-muted-foreground">-</span>;
          const draft = drafts[row.original.enrollment.id] ?? {};
          const value = draft.isHighlight === undefined ? attendance.isHighlight : draft.isHighlight;
          return (
            <div className="flex items-center justify-center">
              <Switch
                checked={Boolean(value)}
                onCheckedChange={(checked) =>
                  applyDraft(row.original.enrollment.id, { isHighlight: Boolean(checked) })
                }
                disabled={!canUpdate}
              />
            </div>
          );
        },
      },
      {
        id: "notes",
        header: "Observacoes",
        accessorFn: (row) => row.attendance?.qualityNotes ?? "",
        cell: ({ row }) => {
          const attendance = row.original.attendance;
          if (!attendance) return <span className="text-muted-foreground">-</span>;
          const draft = drafts[row.original.enrollment.id] ?? {};
          const value =
            draft.qualityNotes === undefined ? (attendance.qualityNotes ?? "") : (draft.qualityNotes ?? "");
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
        const row = trackedRows.find((item) => item.enrollment.id === enrollmentId);
        if (!row?.attendance) return null;
        const patch = drafts[enrollmentId] ?? {};
        return {
          enrollmentId,
          status: row.attendance.status,
          ...(patch.qualityScore !== undefined ? { qualityScore: patch.qualityScore } : {}),
          ...(patch.qualityNotes !== undefined ? { qualityNotes: patch.qualityNotes } : {}),
          ...(patch.isHighlight !== undefined ? { isHighlight: patch.isHighlight } : {}),
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
            <Button type="button" onClick={handleSave} disabled={!hasDrafts || saving}>
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

        <div className="mt-2 text-xs text-muted-foreground">{ACTION_QUALITY_TEXT.hint}</div>
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
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {ACTION_QUALITY_TEXT.notesLabel}
              </div>
              <Textarea
                rows={5}
                value={notesDialog.qualityNotes}
                onChange={(event) =>
                  setNotesDialog((previous) =>
                    previous ? { ...previous, qualityNotes: event.target.value } : previous,
                  )
                }
                className="min-h-[140px] rounded-none border-0 border-b border-border/60 bg-transparent px-0 py-3 shadow-none resize-none focus-visible:border-primary focus-visible:ring-0"
                readOnly={!canUpdate || saving}
              />
            </div>
            {canUpdate ? (
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() => {
                    applyDraft(notesDialog.enrollmentId, {
                      qualityNotes: notesDialog.qualityNotes.trim()
                        ? notesDialog.qualityNotes.trim()
                        : null,
                    });
                    setNotesDialog(null);
                  }}
                  disabled={saving}
                >
                  {ACTION_QUALITY_TEXT.save}
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </SectionDialog>
    </>
  );
}
