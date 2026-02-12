"use client";

import * as React from "react";
import { FormEngine } from "@/components/FormEngine";
import { SectionDialog } from "@/components/section-dialog";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { updatePantryItem, type ApiPantryItem } from "@/features/pantry/api";
import { pantryItemFormFields } from "@/features/pantry/config/pantry-item-form-config";
import type { PantryItemFormValues } from "@/features/pantry/domain/types";

function normalizeItemValues(values: PantryItemFormValues) {
  const name = values.name?.trim() ?? "";
  const group = values.group?.trim() || null;
  const unit = values.unit?.trim() ?? "";
  const minStock =
    typeof values.minStock === "number" ? values.minStock : Number(values.minStock);

  return {
    name,
    group,
    unit,
    minStock: Number.isFinite(minStock) ? minStock : 0,
  };
}

type PantryItemEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Pick<ApiPantryItem, "id" | "name" | "group" | "unit" | "minStock"> | null;
  onSaved?: (item: ApiPantryItem) => void | Promise<void>;
};

export function PantryItemEditDialog({
  open,
  onOpenChange,
  item,
  onSaved,
}: PantryItemEditDialogProps) {
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const canUpdate = permissions.includes("pantry.update");

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const initialValues = React.useMemo<Partial<PantryItemFormValues>>(() => {
    if (!item) return { unit: "kg", minStock: 0 };
    return {
      name: item.name,
      group: item.group ?? "",
      unit: item.unit,
      minStock: item.minStock,
    };
  }, [item]);

  const handleSubmit = React.useCallback(
    async (values: PantryItemFormValues) => {
      if (!token || !item) return;
      if (!canUpdate) {
        const message = "Você não tem permissão para editar alimentos.";
        setError(message);
        throw new Error(message);
      }

      const payload = normalizeItemValues(values);
      if (!payload.name || !payload.unit) {
        const message = "Preencha nome e unidade.";
        setError(message);
        throw new Error(message);
      }

      setSaving(true);
      setError(null);
      try {
        const updated = await updatePantryItem(token, item.id, payload);
        await Promise.resolve(onSaved?.(updated));
        onOpenChange(false);
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao salvar alimento.";
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [token, item, canUpdate, onSaved, onOpenChange],
  );

  return (
    <SectionDialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) setError(null);
      }}
      title={item ? `Editar: ${item.name}` : "Editar alimento"}
      description="Atualize nome, grupo, unidade e estoque mínimo."
      contentClassName="sm:!max-w-[720px]"
    >
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <FormEngine<PantryItemFormValues>
        fields={pantryItemFormFields}
        initialValues={initialValues}
        disabled={saving}
        onSubmit={handleSubmit}
        actions={{
          submit: {
            label: saving ? "Salvando..." : "Salvar",
            variant: "primary",
          },
          cancel: {
            label: "Cancelar",
            variant: "ghost",
            onClick: () => onOpenChange(false),
          },
        }}
      />
    </SectionDialog>
  );
}

