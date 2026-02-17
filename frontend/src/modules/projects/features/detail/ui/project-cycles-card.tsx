"use client";

import * as React from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/section-card";
import { SectionDialog } from "@/components/section-dialog";
import { SectionList, SectionListItem } from "@/components/section-list";
import { FormEngine } from "@/components/FormEngine";
import type { FormField } from "@/components/FormEngine/types";
import { useConfirm } from "@/components/confirm/use-confirm";
import { useToast } from "@/components/ui/use-toast";
import {
  createProjectCycle,
  deleteProjectCycle,
  listProjectCycles,
  updateProjectCycle,
  type ApiProjectCycle,
} from "@/modules/projects/api";
import { formatDateOnlyPtBR } from "@/lib/date";

type CycleFormValues = {
  name: string;
  startsAt: string;
  endsAt: string;
};

const cycleFields: FormField<CycleFormValues>[] = [
  { name: "name", label: "Nome", type: "text", required: true },
  { name: "startsAt", label: "Início (vigência)", type: "date" },
  { name: "endsAt", label: "Término (vigência)", type: "date" },
];

type ProjectCyclesCardProps = {
  token: string;
  projectId: string;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  selectedCycleId?: string | null;
  onSelect?: (cycle: ApiProjectCycle) => void;
  onLoaded?: (cycles: ApiProjectCycle[]) => void;
};

function formatDate(value: string | null) {
  return formatDateOnlyPtBR(value);
}

export function ProjectCyclesCard({
  token,
  projectId,
  canRead,
  canCreate,
  canUpdate,
  canDelete,
  selectedCycleId,
  onSelect,
  onLoaded,
}: ProjectCyclesCardProps) {
  const { confirm } = useConfirm();
  const { toast } = useToast();

  const [rows, setRows] = React.useState<ApiProjectCycle[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ApiProjectCycle | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!canRead) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listProjectCycles(token, projectId);
      setRows(data);
      onLoaded?.(data);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar ciclos.";
      setError(message);
      setRows([]);
      onLoaded?.([]);
    } finally {
      setLoading(false);
    }
  }, [token, projectId, canRead, onLoaded]);

  React.useEffect(() => {
    load();
  }, [load]);

  const initialValues = React.useMemo<Partial<CycleFormValues>>(() => {
    if (!editing) return { name: "", startsAt: "", endsAt: "" };
    return {
      name: editing.name ?? "",
      startsAt: editing.startsAt ? editing.startsAt.slice(0, 10) : "",
      endsAt: editing.endsAt ? editing.endsAt.slice(0, 10) : "",
    };
  }, [editing]);

  const handleSubmit = async (values: CycleFormValues) => {
    if (!canCreate && !editing) return;
    if (!canUpdate && editing) return;
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: values.name.trim(),
        startsAt: values.startsAt.trim() ? values.startsAt.trim() : null,
        endsAt: values.endsAt.trim() ? values.endsAt.trim() : null,
      };
      if (editing) {
        await updateProjectCycle(token, projectId, editing.id, payload);
        toast({ title: "Ciclo atualizado" });
      } else {
        await createProjectCycle(token, projectId, payload);
        toast({ title: "Ciclo criado" });
      }
      setDialogOpen(false);
      setEditing(null);
      load();
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao salvar ciclo.";
      setFormError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = React.useCallback(
    async (cycle: ApiProjectCycle) => {
      if (!canDelete) return;
      const confirmed = await confirm({
        title: "Excluir ciclo",
        description: `Excluir o ciclo "${cycle.name}"?`,
        confirmLabel: "Excluir",
        cancelLabel: "Cancelar",
        confirmVariant: "destructive",
      });
      if (!confirmed) return;
      try {
        await deleteProjectCycle(token, projectId, cycle.id);
        toast({ title: "Ciclo excluído" });
        load();
      } catch (err) {
        toast({
          title: "Falha ao excluir",
          description:
            err && typeof err === "object" && "message" in err
              ? String((err as { message?: string }).message)
              : "Tente novamente.",
          variant: "destructive",
        });
      }
    },
    [token, projectId, canDelete, confirm, toast, load],
  );

  if (!canRead) {
    return (
      <SectionCard
        title="Ciclos"
        subtitle="Você não tem permissão para visualizar a estrutura."
      >
        <p className="text-xs text-muted-foreground">
          Solicite acesso ao administrador do sistema.
        </p>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Ciclos"
      subtitle="Períodos/ciclos do projeto (opcional)."
      actions={
        canCreate ? (
          <Button
            type="button"
            onClick={() => {
              setEditing(null);
              setFormError(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 size-4" />
            Novo ciclo
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
        <p className="text-xs text-muted-foreground">Carregando...</p>
      ) : null}

      {!loading && rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum ciclo cadastrado.</p>
      ) : null}

      <SectionList>
        {rows.map((cycle) => (
          <SectionListItem
            key={cycle.id}
            title={cycle.name}
            onClick={onSelect ? () => onSelect(cycle) : undefined}
            className={selectedCycleId === cycle.id ? "bg-muted/30" : undefined}
            subtitle={
              cycle.startsAt || cycle.endsAt
                ? `${formatDate(cycle.startsAt)} — ${formatDate(cycle.endsAt)}`
                : "Vigência não informada"
            }
            actions={
              canUpdate || canDelete ? (
                <>
                  {canUpdate ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Editar"
                      aria-label="Editar"
                      onClick={(event) => {
                        event.stopPropagation();
                        setEditing(cycle);
                        setFormError(null);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                  ) : null}
                  {canDelete ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Excluir"
                      aria-label="Excluir"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDelete(cycle);
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  ) : null}
                </>
              ) : null
            }
          />
        ))}
      </SectionList>

      <SectionDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        title={editing ? "Editar ciclo" : "Novo ciclo"}
        description={
          editing
            ? "Atualize os dados do ciclo."
            : "Crie um ciclo/período para o projeto."
        }
        contentClassName="max-w-[780px]"
      >
        {formError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {formError}
          </div>
        ) : null}
        <FormEngine<CycleFormValues>
          fields={cycleFields}
          initialValues={initialValues}
          onSubmit={handleSubmit}
          disabled={saving}
          actions={{
            submit: {
              label: saving ? "Salvando..." : editing ? "Salvar" : "Criar",
              variant: "primary",
            },
            cancel: {
              label: "Cancelar",
              variant: "ghost",
              onClick: () => setDialogOpen(false),
            },
          }}
        />
      </SectionDialog>
    </SectionCard>
  );
}
