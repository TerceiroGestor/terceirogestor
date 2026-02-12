"use client";

import * as React from "react";
import { FormEngine } from "@/components/FormEngine";
import { SectionDialog } from "@/components/section-dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import {
  getPantryEntry,
  listPantryDonors,
  reversePantryEntry,
  updatePantryEntry,
  type ApiPantryEntry,
} from "@/features/pantry/api";
import { buildPantryEntryFormFields } from "@/features/pantry/config/pantry-entry-form-config";
import type { PantryEntryFormValues } from "@/features/pantry/domain/types";
import { Undo2 } from "lucide-react";

function toDateOnly(value: string | null | undefined) {
  if (!value) return "";
  return value.length >= 10 ? value.slice(0, 10) : value;
}

type PantryEntryEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entryId: string | null;
  onSaved?: () => void | Promise<void>;
};

export function PantryEntryEditDialog({
  open,
  onOpenChange,
  entryId,
  onSaved,
}: PantryEntryEditDialogProps) {
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const canUpdate = permissions.includes("pantry.update");

  const [entry, setEntry] = React.useState<ApiPantryEntry | null>(null);
  const [donors, setDonors] = React.useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [reversing, setReversing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!token || !entryId) return;
    setLoading(true);
    setError(null);
    try {
      const [entryResponse, donorsResponse] = await Promise.all([
        getPantryEntry(token, entryId),
        listPantryDonors(token, { all: true }),
      ]);
      setEntry(entryResponse);
      setDonors(donorsResponse.data.map((donor) => ({ id: donor.id, name: donor.name })));
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar entrada.";
      setError(message);
      setEntry(null);
    } finally {
      setLoading(false);
    }
  }, [token, entryId]);

  React.useEffect(() => {
    if (!open) return;
    void load();
  }, [open, load]);

  const donorOptions = React.useMemo(
    () => donors.map((donor) => ({ label: donor.name, value: donor.id })),
    [donors],
  );

  const fields = React.useMemo(() => {
    if (!entry) return [];
    const base = buildPantryEntryFormFields({
      itemOptions: [{ label: entry.item.name, value: entry.itemId }],
      donorOptions,
    });

    const isLocked = (entry.allocatedTotal ?? 0) > 0;

    return base.map((field) => {
      if (field.name === "itemId") {
        return { ...field, disabled: true };
      }
      if (isLocked) {
        if (
          field.name === "sector" ||
          field.name === "quantity" ||
          field.name === "unit" ||
          field.name === "entryDate" ||
          field.name === "expiryDate"
        ) {
          return { ...field, disabled: true };
        }
      }
      return field;
    });
  }, [entry, donorOptions]);

  const initialValues = React.useMemo<PantryEntryFormValues | null>(() => {
    if (!entry) return null;
    return {
      itemId: entry.itemId,
      donorId: entry.donorId ?? "none",
      sector: entry.sector,
      quantity: entry.quantity,
      unit: entry.unit,
      entryDate: toDateOnly(entry.entryDate),
      expiryDate: toDateOnly(entry.expiryDate),
      notes: entry.notes ?? "",
    };
  }, [entry]);

  const handleSubmit = React.useCallback(
    async (values: PantryEntryFormValues) => {
      if (!token || !entryId) return;
      if (!canUpdate) {
        const message = "Você não tem permissão para editar entradas.";
        setError(message);
        throw new Error(message);
      }

      const payload = {
        donorId: values.donorId === "none" ? null : (values.donorId || null),
        sector: values.sector?.trim() ?? undefined,
        quantity:
          typeof values.quantity === "number" ? values.quantity : Number(values.quantity),
        unit: values.unit?.trim() ?? undefined,
        entryDate: values.entryDate?.trim() || undefined,
        expiryDate: values.expiryDate?.trim() ? values.expiryDate.trim() : null,
        notes: values.notes?.trim() ? values.notes.trim() : null,
      };

      setSaving(true);
      setError(null);
      try {
        await updatePantryEntry(token, entryId, payload);
        await Promise.resolve(onSaved?.());
        onOpenChange(false);
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao editar entrada.";
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [token, entryId, canUpdate, onSaved, onOpenChange],
  );

  return (
    <SectionDialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          setError(null);
          setEntry(null);
        }
      }}
      title="Editar entrada (lote)"
      description="Ajuste os dados do lote. Se houver saídas vinculadas, alguns campos ficam bloqueados."
      contentClassName="sm:!max-w-[820px]"
      headerSlot={
        entry ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={
              reversing ||
              saving ||
              !canUpdate ||
              (entry.allocatedTotal ?? 0) > 0
            }
            title={
              (entry.allocatedTotal ?? 0) > 0
                ? "Não é possível estornar um lote que já teve saídas."
                : "Estornar entrada"
            }
            onClick={async () => {
              if (!token || !entryId || !entry) return;
              if (!canUpdate) return;

              if ((entry.allocatedTotal ?? 0) > 0) {
                setError(
                  "Não é possível estornar um lote que já teve saídas. Ajuste as saídas primeiro.",
                );
                return;
              }

              const confirmed = window.confirm(
                "Estornar esta entrada vai criar uma SAÍDA de correção consumindo todo o lote. Deseja continuar?",
              );
              if (!confirmed) return;

              setReversing(true);
              setError(null);
              try {
                await reversePantryEntry(token, entryId);
                await Promise.resolve(onSaved?.());
                onOpenChange(false);
              } catch (err) {
                const message =
                  err && typeof err === "object" && "message" in err
                    ? String((err as { message?: string }).message)
                    : "Falha ao estornar entrada.";
                setError(message);
              } finally {
                setReversing(false);
              }
            }}
          >
            <Undo2 className="size-4" />
            Estornar
          </Button>
        ) : null
      }
    >
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {loading || !entry || !initialValues ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <FormEngine<PantryEntryFormValues>
          fields={fields}
          initialValues={initialValues}
          disabled={saving}
          onSubmit={handleSubmit}
          actions={{
            submit: { label: saving ? "Salvando..." : "Salvar", variant: "primary" },
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
