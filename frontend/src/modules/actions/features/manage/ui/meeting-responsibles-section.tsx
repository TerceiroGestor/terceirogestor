"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useConfirm } from "@/components/confirm/use-confirm";
import { getTenantSlugFromPath } from "@/lib/tenant-path";
import {
  addMeetingTeamParticipations,
  listMeetingTeamParticipations,
  removeMeetingTeamParticipation,
  type ApiMeetingTeamParticipation,
} from "@/modules/actions/api";
import { ACTION_PEOPLE_PARTICIPATION_ROLE_LABELS } from "@/modules/actions/shared/domain/actions.constants";
import { PersonIdentityAvatarTrigger } from "@/modules/people/shared/ui/person-identity-card";
import { ListView } from "@/web-client/views/ListView";
import { MeetingTeamPickerDialog } from "./meeting-team-picker-dialog";

const MEETING_TEAM_MAX = 10;

function buildColumns(params: {
  tenantSlug: string | null;
  canUpdate: boolean;
  onRemove: (participationId: string) => void;
}): ColumnDef<ApiMeetingTeamParticipation>[] {
  return [
    {
      id: "person",
      header: "Responsável",
      accessorFn: (row) => row.person.fullName,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <PersonIdentityAvatarTrigger
            personId={row.original.person.id}
            tenantSlug={params.tenantSlug}
            fullName={row.original.person.fullName}
            birthDate={row.original.person.birthDate ?? null}
            avatarUrl={row.original.person.avatarUrl}
          />
          <span className="font-medium">{row.original.person.fullName}</span>
        </div>
      ),
    },
    {
      id: "role",
      header: "Papel",
      accessorFn: (row) => ACTION_PEOPLE_PARTICIPATION_ROLE_LABELS[row.role],
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {ACTION_PEOPLE_PARTICIPATION_ROLE_LABELS[row.original.role]}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) =>
        params.canUpdate ? (
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 rounded-none border-b border-border/60 px-1"
              onClick={(event) => {
                event.stopPropagation();
                params.onRemove(row.original.id);
              }}
            >
              Remover
            </Button>
          </div>
        ) : null,
    },
  ];
}

export function MeetingResponsiblesSection({
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
  const { confirm } = useConfirm();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);

  const [rows, setRows] = React.useState<ApiMeetingTeamParticipation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [pickerOpen, setPickerOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await listMeetingTeamParticipations(
        token,
        projectId,
        actionId,
        occurrenceId,
      );
      setRows(response);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [token, projectId, actionId, occurrenceId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const handleConfirmAdd = React.useCallback(
    async (personIds: string[], role: Parameters<typeof addMeetingTeamParticipations>[4]["role"]) => {
      try {
        const result = await addMeetingTeamParticipations(token, projectId, actionId, occurrenceId, {
          personIds,
          role,
        });
        const cascadedUp = result.cascaded.filter((item) => item.activity || item.project);
        if (cascadedUp.length > 0) {
          const names = cascadedUp.map((item) => item.fullName).join(", ");
          const scopes = [
            cascadedUp.some((item) => item.activity) ? "a equipe desta Atividade" : null,
            cascadedUp.some((item) => item.project) ? "a equipe do Projeto" : null,
          ].filter(Boolean);
          toast({
            title: "Equipe atualizada",
            description: `${names} ${cascadedUp.length > 1 ? "foram adicionados a" : "foi adicionado a"} ${scopes.join(" e ")}.`,
          });
        }
        await load();
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao adicionar responsável.";
        toast({ variant: "destructive", title: "Erro", description: message });
      }
    },
    [token, projectId, actionId, occurrenceId, toast, load],
  );

  const handleRemove = React.useCallback(
    async (participationId: string) => {
      const confirmed = await confirm({
        title: "Remover responsável",
        description: "Remover este vínculo de responsável deste encontro? Não afeta a equipe da Atividade ou do Projeto.",
        confirmLabel: "Remover",
        confirmVariant: "destructive",
      });
      if (!confirmed) return;
      try {
        await removeMeetingTeamParticipation(token, projectId, actionId, occurrenceId, participationId);
        await load();
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao remover responsável.";
        toast({ variant: "destructive", title: "Erro", description: message });
      }
    },
    [confirm, token, projectId, actionId, occurrenceId, toast, load],
  );

  const columns = React.useMemo(
    () => buildColumns({ tenantSlug, canUpdate, onRemove: (id) => void handleRemove(id) }),
    [tenantSlug, canUpdate, handleRemove],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {rows.length} de {MEETING_TEAM_MAX} responsável(is)
        </span>
        {canUpdate ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={rows.length >= MEETING_TEAM_MAX}
            onClick={() => setPickerOpen(true)}
          >
            Adicionar responsável
          </Button>
        ) : null}
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Carregando...</p>
      ) : rows.length === 0 ? (
        <p className="px-1 py-6 text-sm text-muted-foreground">
          Nenhum responsável registrado para este encontro ainda.
        </p>
      ) : (
        <ListView<ApiMeetingTeamParticipation>
          data={rows}
          columns={columns}
          getRowId={(row) => row.id}
          showColumnVisibilityButton={false}
          bordered={false}
        />
      )}

      <MeetingTeamPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        maxSelectable={Math.max(0, MEETING_TEAM_MAX - rows.length)}
        onConfirm={handleConfirmAdd}
      />
    </div>
  );
}
