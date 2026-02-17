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
  createProjectGroup,
  deleteProjectGroup,
  listProjectGroups,
  updateProjectGroup,
  type ApiProjectGroup,
} from "@/modules/projects/api";

type GroupFormValues = {
  name: string;
  description: string;
};

const groupFields: FormField<GroupFormValues>[] = [
  { name: "name", label: "Nome", type: "text", required: true },
  {
    name: "description",
    label: "Descrição",
    type: "textarea",
    rows: 3,
    helperText: "Opcional. Use para descrever público-alvo e regras do grupo.",
  },
];

type ProjectGroupsCardProps = {
  token: string;
  projectId: string;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  selectedGroupId?: string | null;
  onSelect?: (group: ApiProjectGroup) => void;
  onLoaded?: (groups: ApiProjectGroup[]) => void;
};

export function ProjectGroupsCard({
  token,
  projectId,
  canRead,
  canCreate,
  canUpdate,
  canDelete,
  selectedGroupId,
  onSelect,
  onLoaded,
}: ProjectGroupsCardProps) {
  const { confirm } = useConfirm();
  const { toast } = useToast();

  const [rows, setRows] = React.useState<ApiProjectGroup[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ApiProjectGroup | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!canRead) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listProjectGroups(token, projectId);
      setRows(data);
      onLoaded?.(data);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar grupos.";
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

  const initialValues = React.useMemo<Partial<GroupFormValues>>(() => {
    if (!editing) return { name: "", description: "" };
    return {
      name: editing.name ?? "",
      description: editing.description ?? "",
    };
  }, [editing]);

  const handleSubmit = async (values: GroupFormValues) => {
    if (!canCreate && !editing) return;
    if (!canUpdate && editing) return;
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: values.name.trim(),
        description: values.description.trim()
          ? values.description.trim()
          : null,
      };
      if (editing) {
        await updateProjectGroup(token, projectId, editing.id, payload);
        toast({ title: "Grupo atualizado" });
      } else {
        await createProjectGroup(token, projectId, payload);
        toast({ title: "Grupo criado" });
      }
      setDialogOpen(false);
      setEditing(null);
      load();
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao salvar grupo.";
      setFormError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = React.useCallback(
    async (group: ApiProjectGroup) => {
      if (!canDelete) return;
      const confirmed = await confirm({
        title: "Excluir grupo",
        description: `Excluir o grupo "${group.name}"?`,
        confirmLabel: "Excluir",
        cancelLabel: "Cancelar",
        confirmVariant: "destructive",
      });
      if (!confirmed) return;
      try {
        await deleteProjectGroup(token, projectId, group.id);
        toast({ title: "Grupo excluído" });
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
        title="Grupos"
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
      title="Grupos"
      subtitle="Organize participantes em grupos dentro do projeto."
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
            Novo grupo
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
        <p className="text-xs text-muted-foreground">
          Nenhum grupo cadastrado.
        </p>
      ) : null}

      <SectionList>
        {rows.map((group) => (
          <SectionListItem
            key={group.id}
            title={group.name}
            onClick={onSelect ? () => onSelect(group) : undefined}
            className={selectedGroupId === group.id ? "bg-muted/30" : undefined}
            subtitle={group.description ?? "Sem descrição"}
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
                        setEditing(group);
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
                        handleDelete(group);
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
        title={editing ? "Editar grupo" : "Novo grupo"}
        description={
          editing
            ? "Atualize os dados do grupo."
            : "Crie um grupo dentro do projeto."
        }
        contentClassName="max-w-[780px]"
      >
        {formError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {formError}
          </div>
        ) : null}
        <FormEngine<GroupFormValues>
          fields={groupFields}
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
