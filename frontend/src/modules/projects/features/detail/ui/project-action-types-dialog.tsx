"use client";

import * as React from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionDialog } from "@/components/section-dialog";
import { SectionList, SectionListItem } from "@/components/section-list";
import { FormEngine } from "@/components/FormEngine";
import type { FormField } from "@/components/FormEngine/types";
import { useConfirm } from "@/components/confirm/use-confirm";
import { useToast } from "@/components/ui/use-toast";
import {
  createActionType,
  deleteActionType,
  listActionTypes,
  updateActionType,
  type ApiActionType,
  ACTION_TARGET_OPTIONS,
} from "@/modules/actions";

type ActionTypeFormValues = {
  name: string;
  description: string;
  target: "PROJECT" | "PROJECT_GROUP" | "PEOPLE_GROUP" | "ENROLLMENT";
  isActive: boolean;
};

const fields: FormField<ActionTypeFormValues>[] = [
  { name: "name", label: "Nome", type: "text", required: true },
  { name: "description", label: "Descrição", type: "textarea", rows: 3 },
  {
    name: "target",
    label: "Vincular em",
    type: "select",
    options: ACTION_TARGET_OPTIONS,
  },
  { name: "isActive", label: "Ativo", type: "boolean" },
];

type ProjectActionTypesDialogProps = {
  token: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged?: () => void;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export function ProjectActionTypesDialog({
  token,
  open,
  onOpenChange,
  onChanged,
  canCreate,
  canUpdate,
  canDelete,
}: ProjectActionTypesDialogProps) {
  const { confirm } = useConfirm();
  const { toast } = useToast();

  const [rows, setRows] = React.useState<ApiActionType[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ApiActionType | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listActionTypes(token);
      setRows(data);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar tipos de ação.";
      setError(message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    if (!open) return;
    load();
  }, [open, load]);

  const initialValues = React.useMemo<Partial<ActionTypeFormValues>>(() => {
    if (!editing) return { name: "", description: "", target: "PROJECT", isActive: true };
    return {
      name: editing.name ?? "",
      description: editing.description ?? "",
      target: editing.target ?? "PROJECT",
      isActive: editing.isActive ?? true,
    };
  }, [editing]);

  const handleSubmit = async (values: ActionTypeFormValues) => {
    if (!editing && !canCreate) return;
    if (editing && !canUpdate) return;
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: values.name.trim(),
        description: values.description.trim() ? values.description.trim() : null,
        target: values.target,
        isActive: values.isActive,
      };
      if (editing) {
        await updateActionType(token, editing.id, payload);
        toast({ title: "Tipo atualizado" });
      } else {
        await createActionType(token, payload);
        toast({ title: "Tipo criado" });
      }
      setFormOpen(false);
      setEditing(null);
      await load();
      onChanged?.();
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao salvar tipo de ação.";
      setFormError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = React.useCallback(
    async (row: ApiActionType) => {
      if (!canDelete) return;
      const confirmed = await confirm({
        title: "Excluir tipo",
        description: `Excluir o tipo "${row.name}"?`,
        confirmLabel: "Excluir",
        cancelLabel: "Cancelar",
        confirmVariant: "destructive",
      });
      if (!confirmed) return;
      try {
        await deleteActionType(token, row.id);
        toast({ title: "Tipo excluído" });
        await load();
        onChanged?.();
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
    [canDelete, confirm, load, onChanged, toast, token],
  );

  return (
    <>
      <SectionDialog
        open={open}
        onOpenChange={onOpenChange}
        title="Tipos de ação"
        description="Cadastre e mantenha os tipos disponíveis para o tenant."
        contentClassName="max-w-[min(96vw,56rem)]"
        headerSlot={
          canCreate ? (
            <Button
              type="button"
              onClick={() => {
                setEditing(null);
                setFormError(null);
                setFormOpen(true);
              }}
            >
              <Plus className="mr-2 size-4" />
              Novo tipo
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
          <p className="text-xs text-muted-foreground">Nenhum tipo cadastrado.</p>
        ) : null}

        <SectionList>
          {rows.map((row) => (
            <SectionListItem
              key={row.id}
              title={
                <div className="flex flex-wrap items-center gap-2">
                  <span>{row.name}</span>
                  {row.isActive ? (
                    <Badge variant="secondary">Ativo</Badge>
                  ) : (
                    <Badge variant="outline">Inativo</Badge>
                  )}
                </div>
              }
              subtitle={row.description ?? "Sem descrição"}
              actions={
                <div className="flex items-center gap-1">
                  {canUpdate ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Editar"
                      aria-label="Editar"
                      onClick={() => {
                        setEditing(row);
                        setFormError(null);
                        setFormOpen(true);
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
                      onClick={() => handleDelete(row)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  ) : null}
                </div>
              }
            />
          ))}
        </SectionList>
      </SectionDialog>

      <SectionDialog
        open={formOpen}
        onOpenChange={(next) => {
          setFormOpen(next);
          if (!next) setEditing(null);
        }}
        title={editing ? "Editar tipo" : "Novo tipo"}
        description={editing ? "Atualize os dados do tipo." : "Crie um tipo de ação."}
        contentClassName="max-w-[760px]"
      >
        {formError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {formError}
          </div>
        ) : null}

        <FormEngine<ActionTypeFormValues>
          fields={fields}
          initialValues={initialValues}
          onSubmit={handleSubmit}
          disabled={saving || (!editing ? !canCreate : !canUpdate)}
          actions={{
            submit: {
              label: saving ? "Salvando..." : editing ? "Salvar" : "Criar",
              variant: "primary",
            },
            cancel: {
              label: "Cancelar",
              variant: "ghost",
              onClick: () => setFormOpen(false),
            },
          }}
        />
      </SectionDialog>
    </>
  );
}
