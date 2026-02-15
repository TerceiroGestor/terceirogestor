"use client";

import * as React from "react";
import { FormEngine } from "@/components/FormEngine";
import { SectionDialog } from "@/components/section-dialog";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { createPantryItem, type ApiPantryItem } from "@/modules/pantry/api";
import { pantryItemFormFields } from "@/modules/pantry/features/items/config/pantry-item-form-config";
import type { PantryItemFormValues } from "@/modules/pantry/shared/domain/types";

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

type PantryItemCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (item: ApiPantryItem) => void | Promise<void>;
};

export function PantryItemCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: PantryItemCreateDialogProps) {
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const canCreate = permissions.includes("pantry.create");

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = React.useCallback(
    async (values: PantryItemFormValues) => {
      if (!token) return;
      if (!canCreate) {
        const message = "Você não tem permissão para cadastrar alimentos.";
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
        const item = await createPantryItem(token, payload);
        await Promise.resolve(onCreated?.(item));
        onOpenChange(false);
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao cadastrar alimento.";
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [token, canCreate, onCreated, onOpenChange],
  );

  return (
    <SectionDialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) setError(null);
      }}
      title="Novo alimento"
      description="Cadastre o alimento para controlar entradas, saídas e alertas."
      contentClassName="sm:!max-w-[720px]"
    >
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <FormEngine<PantryItemFormValues>
        fields={pantryItemFormFields}
        initialValues={{ unit: "kg", minStock: 0 }}
        disabled={saving}
        onSubmit={handleSubmit}
        actions={{
          submit: {
            label: saving ? "Salvando..." : "Cadastrar",
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
