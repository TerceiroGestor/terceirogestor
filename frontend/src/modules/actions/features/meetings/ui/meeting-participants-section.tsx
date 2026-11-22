"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { getTenantSlugFromPath } from "@/lib/tenant-path";
import {
  listMeetingAttendances,
  upsertMeetingAttendances,
  type AttendanceStatus,
  type MeetingAttendancesListItem,
} from "@/modules/actions/api";
import { ATTENDANCE_STATUS_OPTIONS } from "@/modules/actions/shared/domain/actions.constants";
import { PersonIdentityAvatarTrigger } from "@/modules/people/shared/ui/person-identity-card";
import { ListView } from "@/web-client/views/ListView";

/**
 * Presença + avaliação de um único Encontro, agora na tela de Detail
 * (ponto 2 da revisão de Projetos, 2026-11-21) - mesmos 2 endpoints de
 * sempre (listMeetingAttendances/upsertMeetingAttendances), só trocando
 * a tabela manual (<table> cru, sem avatar) pelo ListView padrão, igual
 * às abas Participantes/Qualidade da Atividade.
 */
type AttendanceDraftRow = {
  status: AttendanceStatus;
  notes: string;
  qualityScore: string;
  qualityNotes: string;
};

function resolveErrorMessage(err: unknown, fallback: string) {
  return err && typeof err === "object" && "message" in err
    ? String((err as { message?: string }).message)
    : fallback;
}

export function MeetingParticipantsSection({
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
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);

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
        qualityScore: row.attendance?.qualityScore != null ? String(row.attendance.qualityScore) : "",
        qualityNotes: row.attendance?.qualityNotes ?? "",
      },
    [drafts],
  );

  const updateDraft = React.useCallback(
    (row: MeetingAttendancesListItem, patch: Partial<AttendanceDraftRow>) => {
      setDrafts((previous) => ({
        ...previous,
        [row.enrollment.id]: { ...getEffective(row), ...patch },
      }));
    },
    [getEffective],
  );

  const handleSave = React.useCallback(async () => {
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
  }, [drafts, token, projectId, actionId, occurrenceId, toast, load]);

  const columns = React.useMemo<ColumnDef<MeetingAttendancesListItem>[]>(
    () => [
      {
        id: "person",
        header: "Participante",
        accessorFn: (row) => row.enrollment.person.fullName,
        cell: ({ row }) => {
          const changed = Boolean(drafts[row.original.enrollment.id]);
          return (
            <div className="flex items-center gap-3">
              <PersonIdentityAvatarTrigger
                personId={row.original.enrollment.person.id}
                tenantSlug={tenantSlug}
                fullName={row.original.enrollment.person.fullName}
                birthDate={row.original.enrollment.person.birthDate ?? null}
                avatarUrl={row.original.enrollment.person.avatarUrl}
              />
              <span className="font-medium">
                {row.original.enrollment.person.fullName}
              </span>
              {changed ? <span className="size-1.5 rounded-full bg-primary" /> : null}
            </div>
          );
        },
      },
      {
        id: "status",
        header: "Presença",
        accessorFn: (row) => getEffective(row).status,
        cell: ({ row }) => {
          const effective = getEffective(row.original);
          return (
            <Select
              value={effective.status}
              onValueChange={(next) => updateDraft(row.original, { status: next as AttendanceStatus })}
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
          );
        },
      },
      {
        id: "notes",
        header: "Justificativa",
        accessorFn: (row) => getEffective(row).notes,
        cell: ({ row }) => {
          const effective = getEffective(row.original);
          return (
            <Input
              value={effective.notes}
              onChange={(event) => updateDraft(row.original, { notes: event.target.value })}
              disabled={!canUpdate || saving}
              placeholder={effective.status === "PRESENT" ? "—" : "Motivo da falta/justificativa"}
              className="h-8 text-xs"
            />
          );
        },
      },
      {
        id: "qualityNotes",
        header: "Observação",
        accessorFn: (row) => getEffective(row).qualityNotes,
        cell: ({ row }) => {
          const effective = getEffective(row.original);
          return (
            <Input
              value={effective.qualityNotes}
              onChange={(event) => updateDraft(row.original, { qualityNotes: event.target.value })}
              disabled={!canUpdate || saving}
              placeholder="Observação"
              className="h-8 text-xs"
            />
          );
        },
      },
      {
        id: "qualityScore",
        header: "Avaliação",
        accessorFn: (row) => getEffective(row).qualityScore,
        cell: ({ row }) => {
          const effective = getEffective(row.original);
          return (
            <Select
              value={effective.qualityScore || "__none__"}
              onValueChange={(next) =>
                updateDraft(row.original, { qualityScore: next === "__none__" ? "" : next })
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
          );
        },
      },
    ],
    [canUpdate, drafts, getEffective, saving, tenantSlug, updateDraft],
  );

  const changedCount = Object.keys(drafts).length;

  return (
    <div className="flex flex-col gap-3">
      {loading ? (
        <p className="text-xs text-muted-foreground">Carregando...</p>
      ) : rows.length === 0 ? (
        <p className="px-1 py-6 text-sm text-muted-foreground">
          Nenhum participante elegível pra este Encontro (confira os Grupos vinculados).
        </p>
      ) : (
        <ListView<MeetingAttendancesListItem>
          data={rows}
          columns={columns}
          getRowId={(row) => row.enrollment.id}
          showColumnVisibilityButton={false}
          bordered={false}
        />
      )}

      {canUpdate && rows.length > 0 ? (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {changedCount > 0 ? `${changedCount} alteração(ões) não salva(s)` : "Tudo salvo."}
          </span>
          <Button type="button" size="sm" disabled={saving || changedCount === 0} onClick={() => void handleSave()}>
            {saving ? "Salvando..." : "Salvar presença"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
