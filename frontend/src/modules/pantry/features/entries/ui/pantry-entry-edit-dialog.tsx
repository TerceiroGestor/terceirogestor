"use client";

import * as React from "react";
import { FormEngine } from "@/components/FormEngine";
import { SectionDialog } from "@/components/section-dialog";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/confirm/use-confirm";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import {
  createPantryDonor,
  createPantrySector,
  getPantryEntry,
  listPantryDonors,
  listPantrySectors,
  reversePantryEntry,
  updatePantryEntry,
  type ApiPantryEntry,
} from "@/modules/pantry/api";
import {
  PANTRY_NEW_DONOR_VALUE,
  buildPantryEntryFormFields,
} from "@/modules/pantry/features/entries/config/pantry-entry-form-config";
import { PANTRY_NEW_SECTOR_VALUE } from "@/modules/pantry/features/items/config/pantry-item-form-config";
import type { PantryEntryFormValues } from "@/modules/pantry/shared/domain/types";
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
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const canUpdate = permissions.includes("pantry.update");

  const [entry, setEntry] = React.useState<ApiPantryEntry | null>(null);
  const [donors, setDonors] = React.useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [sectors, setSectors] = React.useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [reversing, setReversing] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!token || !entryId) return;
    setLoading(true);
    try {
      const [entryResponse, donorsResponse, sectorsResponse] = await Promise.all([
        getPantryEntry(token, entryId),
        listPantryDonors(token, { all: true }),
        listPantrySectors(token),
      ]);
      setEntry(entryResponse);
      setDonors(donorsResponse.data.map((donor) => ({ id: donor.id, name: donor.name })));
      setSectors(sectorsResponse.data ?? []);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar entrada.";
      toast({ variant: "destructive", title: "Falha ao carregar", description: message });
      setEntry(null);
    } finally {
      setLoading(false);
    }
  }, [token, entryId, toast]);

  React.useEffect(() => {
    if (!open) return;
    void load();
  }, [open, load]);

  const donorOptions = React.useMemo(
    () => donors.map((donor) => ({ label: donor.name, value: donor.id })),
    [donors],
  );

  const sectorOptions = React.useMemo(() => {
    const set = new Set<string>();
    const list: Array<{ label: string; value: string }> = [];

    const push = (name: string) => {
      const normalized = name.trim();
      if (!normalized) return;
      if (set.has(normalized)) return;
      set.add(normalized);
      list.push({ label: normalized, value: normalized });
    };

    (sectors ?? []).forEach((sector) => push(sector.name));
    if (entry?.sector) push(entry.sector);
    push("Geral");

    return list.sort((a, b) => a.label.localeCompare(b.label));
  }, [entry?.sector, sectors]);

  const fields = React.useMemo(() => {
    if (!entry) return [];
    const base = buildPantryEntryFormFields({
      itemOptions: [{ label: entry.item.name, value: entry.itemId }],
      donorOptions,
      sectorOptions,
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
  }, [entry, donorOptions, sectorOptions]);

  const initialValues = React.useMemo<PantryEntryFormValues | null>(() => {
    if (!entry) return null;
    return {
      itemId: entry.itemId,
      donorId: entry.donorId ?? "none",
      newDonorName: "",
      newDonorType: "PERSON",
      newDonorContact: "",
      sector: entry.sector,
      newSector: "",
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
        toast({
          variant: "destructive",
          title: "Sem permissão",
          description: "Você não tem permissão para editar entradas.",
        });
        return;
      }

      const rawSector = values.sector?.trim() ?? "";
      const rawNewSector = values.newSector?.trim() ?? "";
      const rawDonorId = values.donorId?.trim() ?? "";
      const rawNewDonorName = values.newDonorName?.trim() ?? "";
      const rawNewDonorType =
        values.newDonorType === "COMPANY" ? "COMPANY" : "PERSON";
      const rawNewDonorContact = values.newDonorContact?.trim() ?? "";
      const sector = rawSector === PANTRY_NEW_SECTOR_VALUE ? rawNewSector : rawSector;

      if (!sector) {
        toast({
          variant: "destructive",
          title: "Dados invÃ¡lidos",
          description: "Informe o setor (local fÃ­sico).",
        });
        return;
      }

      let donorId: string | null =
        rawDonorId && rawDonorId !== "none" ? rawDonorId : null;

      if (rawDonorId === PANTRY_NEW_DONOR_VALUE) {
        if (!rawNewDonorName) {
          toast({
            variant: "destructive",
            title: "Dados invÃ¡lidos",
            description: "Informe o nome do doador.",
          });
          return;
        }
        try {
          const created = await createPantryDonor(token, {
            name: rawNewDonorName,
            type: rawNewDonorType,
            contact: rawNewDonorContact || null,
          });
          donorId = created.id;
        } catch (err) {
          const message =
            err && typeof err === "object" && "message" in err
              ? String((err as { message?: string }).message)
              : "Falha ao cadastrar doador.";
          toast({
            variant: "destructive",
            title: "Falha ao cadastrar doador",
            description: message,
          });
          return;
        }
      }

      const payload = {
        donorId,
        sector,
        quantity:
          typeof values.quantity === "number" ? values.quantity : Number(values.quantity),
        unit: values.unit?.trim() ?? undefined,
        entryDate: values.entryDate?.trim() || undefined,
        expiryDate: values.expiryDate?.trim() ? values.expiryDate.trim() : null,
        notes: values.notes?.trim() ? values.notes.trim() : null,
      };

      setSaving(true);
      try {
        if (rawSector === PANTRY_NEW_SECTOR_VALUE) {
          try {
            await createPantrySector(token, { name: sector });
          } catch {
            // best-effort
          }
        }
        await updatePantryEntry(token, entryId, payload);
        await Promise.resolve(onSaved?.());
        toast({ variant: "success", title: "Entrada atualizada" });
        onOpenChange(false);
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao editar entrada.";
        toast({ variant: "destructive", title: "Falha ao salvar", description: message });
      } finally {
        setSaving(false);
      }
    },
    [token, entryId, canUpdate, onSaved, onOpenChange, toast],
  );

  return (
    <SectionDialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          setEntry(null);
        }
      }}
      title="Editar entrada (lote)"
      description="Ajuste os dados do lote. Se houver saídas vinculadas, alguns campos ficam bloqueados."
      showBackButton
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
                toast({
                  variant: "destructive",
                  title: "Não é possível estornar",
                  description:
                    "Não é possível estornar um lote que já teve saídas. Ajuste as saídas primeiro.",
                });
                return;
              }

              const confirmed = await confirm({
                title: "Estornar entrada",
                description:
                  "Estornar esta entrada vai criar uma SAÍDA de correção consumindo todo o lote. Deseja continuar?",
                confirmLabel: "Estornar",
                cancelLabel: "Cancelar",
                confirmVariant: "destructive",
              });
              if (!confirmed) return;

              setReversing(true);
              try {
                await reversePantryEntry(token, entryId);
                await Promise.resolve(onSaved?.());
                onOpenChange(false);
                toast({ title: "Entrada estornada", variant: "success" });
              } catch (err) {
                const message =
                    err && typeof err === "object" && "message" in err
                      ? String((err as { message?: string }).message)
                      : "Falha ao estornar entrada.";
                toast({ title: "Falha ao estornar", description: message, variant: "destructive" });
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
      {loading || !entry || !initialValues ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <FormEngine<PantryEntryFormValues>
          fields={fields}
          initialValues={initialValues}
          onFieldChange={({ name, value, nextValues }) => {
            if (name === "sector") {
              const nextSector = String(value ?? "").trim();
              if (nextSector !== PANTRY_NEW_SECTOR_VALUE && nextValues.newSector) {
                return { newSector: "" };
              }
            }
            if (name === "donorId") {
              const nextDonor = String(value ?? "").trim();
              if (nextDonor === PANTRY_NEW_DONOR_VALUE) {
                if (!nextValues.newDonorType) {
                  return { newDonorType: "PERSON" };
                }
              } else if (
                nextValues.newDonorName ||
                nextValues.newDonorContact ||
                nextValues.newDonorType
              ) {
                return {
                  newDonorName: "",
                  newDonorContact: "",
                  newDonorType: "PERSON",
                };
              }
            }
            return undefined;
          }}
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
