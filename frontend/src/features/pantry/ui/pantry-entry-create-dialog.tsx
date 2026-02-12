"use client";

import * as React from "react";
import { FormEngine } from "@/components/FormEngine";
import { SectionDialog } from "@/components/section-dialog";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import {
  createPantryEntry,
  listPantryDonors,
  listPantryItems,
  type ApiPantryItem,
} from "@/features/pantry/api";
import { buildPantryEntryFormFields } from "@/features/pantry/config/pantry-entry-form-config";
import type { PantryEntryFormValues } from "@/features/pantry/domain/types";
import { todayLocalIsoDate } from "@/lib/date";

function todayIsoDate() {
  return todayLocalIsoDate();
}

type PantryEntryCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void | Promise<void>;
};

export function PantryEntryCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: PantryEntryCreateDialogProps) {
  const { token } = useAuth();
  const { permissions } = useCurrentUser();

  const canCreate = permissions.includes("pantry.create");

  const [items, setItems] = React.useState<ApiPantryItem[]>([]);
  const [donors, setDonors] = React.useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const itemMap = React.useMemo(() => {
    return new Map(items.map((item) => [item.id, item]));
  }, [items]);

  const loadOptions = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [itemsResponse, donorsResponse] = await Promise.all([
        listPantryItems(token, { all: true }),
        listPantryDonors(token, { all: true }),
      ]);
      setItems(itemsResponse.data);
      setDonors(donorsResponse.data.map((donor) => ({ id: donor.id, name: donor.name })));
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar opções.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    if (!open) return;
    void loadOptions();
  }, [open, loadOptions]);

  const itemOptions = React.useMemo(
    () => items.map((item) => ({ label: item.name, value: item.id })),
    [items],
  );

  const donorOptions = React.useMemo(
    () => donors.map((donor) => ({ label: donor.name, value: donor.id })),
    [donors],
  );

  const fields = React.useMemo(
    () => buildPantryEntryFormFields({ itemOptions, donorOptions }),
    [itemOptions, donorOptions],
  );

  const handleSubmit = React.useCallback(
    async (values: PantryEntryFormValues) => {
      if (!token) return;
      if (!canCreate) {
        const message = "Você não tem permissão para registrar entradas.";
        setError(message);
        throw new Error(message);
      }

      const itemId = values.itemId?.trim() ?? "";
      const sector = values.sector?.trim() ?? "";
      const quantity =
        typeof values.quantity === "number"
          ? values.quantity
          : Number(values.quantity);
      const rawUnit = values.unit?.trim() ?? "";
      const rawEntryDate = values.entryDate?.trim() ?? "";
      const rawExpiryDate = values.expiryDate?.trim() ?? "";
      const rawNotes = values.notes?.trim() ?? "";

      if (!itemId) {
        setError("Selecione um alimento.");
        return;
      }
      if (!sector) {
        setError("Informe o setor (local físico).");
        return;
      }
      if (!Number.isFinite(quantity) || quantity <= 0) {
        setError("Informe uma quantidade válida.");
        return;
      }

      const item = itemMap.get(itemId);
      const unit = rawUnit || item?.unit || "kg";
      const donorId = values.donorId === "none" ? null : (values.donorId || null);

      setSaving(true);
      setError(null);
      try {
        await createPantryEntry(token, {
          itemId,
          donorId,
          sector,
          quantity,
          unit,
          entryDate: rawEntryDate || undefined,
          expiryDate: rawExpiryDate ? rawExpiryDate : null,
          notes: rawNotes ? rawNotes : null,
        });
        await Promise.resolve(onCreated?.());
        onOpenChange(false);
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao registrar entrada.";
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [token, canCreate, itemMap, onCreated, onOpenChange],
  );

  return (
    <SectionDialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) setError(null);
      }}
      title="Nova entrada (lote)"
      description="Registre uma nova entrada por validade (lote) e setor."
      contentClassName="sm:!max-w-[820px]"
    >
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando opções...</p>
      ) : (
        <FormEngine<PantryEntryFormValues>
          fields={fields}
          initialValues={{
            donorId: "none",
            sector: "Geral",
            quantity: "",
            unit: "",
            entryDate: todayIsoDate(),
            expiryDate: "",
            notes: "",
          }}
          disabled={saving}
          onSubmit={handleSubmit}
          actions={{
            submit: {
              label: saving ? "Salvando..." : "Registrar",
              variant: "primary",
            },
            cancel: {
              label: "Cancelar",
              variant: "ghost",
              onClick: () => onOpenChange(false),
            },
          }}
        />
      )}
    </SectionDialog>
  );
}
