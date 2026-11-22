"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useConfirm } from "@/components/confirm/use-confirm";
import { useAuth } from "@/features/auth/auth-context";
import { getTenantSlugFromPath } from "@/lib/tenant-path";
import {
  createProjectTeamParticipation,
  endProjectTeamParticipation,
  listProjectTeamParticipations,
  type ApiProjectTeamParticipation,
} from "@/modules/projects/api";
import { ACTION_PEOPLE_PARTICIPATION_ROLE_LABELS } from "@/modules/actions/shared/domain/actions.constants";
import { PersonIdentityAvatarTrigger } from "@/modules/people/shared/ui/person-identity-card";
import { ListView } from "@/web-client/views/ListView";
import { ProjectTeamPickerDialog } from "./project-team-picker-dialog";

/**
 * Equipe individual do Projeto (revisão da hierarquia de equipe,
 * 2026-11-21) - mesmo padrão autocontido de ProjectGoalsSection/
 * ProjectFundingSourcesSection (fetch próprio via useAuth, sem acoplar ao
 * engine de abas). Convive com "Grupos de Equipe" (ProjectPeopleGroup),
 * que continua sendo um mecanismo paralelo de cadastro em lote.
 */
function buildColumns(params: {
  tenantSlug: string | null;
  readOnly: boolean;
  onEnd: (participationId: string) => void;
}): ColumnDef<ApiProjectTeamParticipation>[] {
  return [
    {
      id: "person",
      header: "Pessoa",
      accessorFn: (row) => row.person.fullName,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <PersonIdentityAvatarTrigger
            personId={row.original.person.id}
            tenantSlug={params.tenantSlug}
            fullName={row.original.person.fullName}
            avatarUrl={row.original.person.avatarUrl}
          />
          <div className="space-y-0.5">
            <div className="font-medium text-foreground">{row.original.person.fullName}</div>
            <div className="text-xs text-muted-foreground">{row.original.person.status ?? "-"}</div>
          </div>
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
        !params.readOnly ? (
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 rounded-none border-b border-border/60 px-1"
              onClick={(event) => {
                event.stopPropagation();
                params.onEnd(row.original.id);
              }}
            >
              Encerrar
            </Button>
          </div>
        ) : null,
    },
  ];
}

export function ProjectTeamSection({
  projectId,
  readOnly = false,
}: {
  projectId: string;
  readOnly?: boolean;
}) {
  const { token } = useAuth();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);

  const [rows, setRows] = React.useState<ApiProjectTeamParticipation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [pickerOpen, setPickerOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await listProjectTeamParticipations(token, projectId);
      setRows(response);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [token, projectId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const handleConfirmAdd = React.useCallback(
    async (personIds: string[], role: Parameters<typeof createProjectTeamParticipation>[2]["role"]) => {
      if (!token) return;
      let created = 0;
      let skipped = 0;
      for (const personId of personIds) {
        try {
          await createProjectTeamParticipation(token, projectId, { personId, role });
          created += 1;
        } catch {
          skipped += 1;
        }
      }
      toast({
        title: "Equipe atualizada",
        description: `${created} pessoa(s) adicionada(s)${skipped ? `, ${skipped} já estava(m) vinculada(s)` : ""}.`,
      });
      await load();
    },
    [token, projectId, toast, load],
  );

  const handleEnd = React.useCallback(
    async (participationId: string) => {
      if (!token) return;
      const confirmed = await confirm({
        title: "Encerrar participação na equipe",
        description: "Encerrar a participação desta pessoa na equipe do projeto?",
        confirmLabel: "Encerrar",
        confirmVariant: "destructive",
      });
      if (!confirmed) return;
      try {
        await endProjectTeamParticipation(token, projectId, participationId);
        await load();
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao encerrar participação.";
        toast({ variant: "destructive", title: "Erro", description: message });
      }
    },
    [confirm, token, projectId, toast, load],
  );

  const columns = React.useMemo(
    () => buildColumns({ tenantSlug, readOnly, onEnd: (id) => void handleEnd(id) }),
    [tenantSlug, readOnly, handleEnd],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Equipe deste projeto. Também ganha gente automaticamente quando
          alguém é marcado como responsável numa Atividade ou Encontro.
        </p>
        {!readOnly ? (
          <Button size="sm" onClick={() => setPickerOpen(true)}>
            Adicionar pessoa
          </Button>
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma pessoa na equipe deste projeto ainda.</p>
      ) : (
        <ListView<ApiProjectTeamParticipation>
          data={rows}
          columns={columns}
          getRowId={(row) => row.id}
          showColumnVisibilityButton={false}
          bordered={false}
        />
      )}

      <ProjectTeamPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onConfirm={handleConfirmAdd}
      />
    </div>
  );
}
