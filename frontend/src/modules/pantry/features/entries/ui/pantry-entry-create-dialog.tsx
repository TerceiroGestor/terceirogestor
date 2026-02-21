"use client";

import * as React from "react";
import { FormEngine } from "@/components/FormEngine";
import { SectionDialog } from "@/components/section-dialog";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import {
  createPantryEntry,
  createPantrySector,
  listPantryDonors,
  listPantryItems,
  listPantrySectors,
  type ApiPantryItem,
} from "@/modules/pantry/api";
import { buildPantryEntryFormFields } from "@/modules/pantry/features/entries/config/pantry-entry-form-config";
import { PANTRY_NEW_SECTOR_VALUE } from "@/modules/pantry/features/items/config/pantry-item-form-config";
import type { PantryEntryFormValues } from "@/modules/pantry/shared/domain/types";
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
  const { toast } = useToast();

  const canCreate = permissions.includes("pantry.create");

  const [items, setItems] = React.useState<ApiPantryItem[]>([]);
  const [donors, setDonors] = React.useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [sectors, setSectors] = React.useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const itemMap = React.useMemo(() => {
    return new Map(items.map((item) => [item.id, item]));
  }, [items]);

  const loadOptions = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [itemsResponse, donorsResponse, sectorsResponse] = await Promise.all([
        listPantryItems(token, { all: true }),
        listPantryDonors(token, { all: true }),
        listPantrySectors(token),
      ]);
      setItems(itemsResponse.data);
      setDonors(donorsResponse.data.map((donor) => ({ id: donor.id, name: donor.name })));
      setSectors(sectorsResponse.data ?? []);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar opções.";
      toast({ variant: "destructive", title: "Falha ao carregar", description: message });
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

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
    (items ?? []).forEach((item) => push(item.defaultSector ?? "Geral"));
    push("Geral");

    return list.sort((a, b) => a.label.localeCompare(b.label));
  }, [items, sectors]);

  const fields = React.useMemo(
    () => buildPantryEntryFormFields({ itemOptions, donorOptions, sectorOptions }),
    [itemOptions, donorOptions, sectorOptions],
  );

  const handleSubmit = React.useCallback(
    async (values: PantryEntryFormValues) => {
      if (!token) return;
      if (!canCreate) {
        toast({
          variant: "destructive",
          title: "Sem permissão",
          description: "Você não tem permissão para registrar entradas.",
        });
        return;
      }

      const itemId = values.itemId?.trim() ?? "";
      const rawSector = values.sector?.trim() ?? "";
      const rawNewSector = values.newSector?.trim() ?? "";
      const quantity =
        typeof values.quantity === "number"
          ? values.quantity
          : Number(values.quantity);
      const rawUnit = values.unit?.trim() ?? "";
      const rawEntryDate = values.entryDate?.trim() ?? "";
      const rawExpiryDate = values.expiryDate?.trim() ?? "";
      const rawNotes = values.notes?.trim() ?? "";

      if (!itemId) {
        toast({
          variant: "destructive",
          title: "Dados inválidos",
          description: "Selecione um alimento.",
        });
        return;
      }
      const sector =
        rawSector === PANTRY_NEW_SECTOR_VALUE ? rawNewSector : rawSector;

      if (!sector) {
        toast({
          variant: "destructive",
          title: "Dados inválidos",
          description: "Informe o setor (local físico).",
        });
        return;
      }
      if (!Number.isFinite(quantity) || quantity <= 0) {
        toast({
          variant: "destructive",
          title: "Dados inválidos",
          description: "Informe uma quantidade válida.",
        });
        return;
      }

      if (rawSector === PANTRY_NEW_SECTOR_VALUE) {
        try {
          await createPantrySector(token, { name: sector });
        } catch {
          // best-effort: se falhar, ainda tenta registrar a entrada com o setor informado
        }
      }

      const item = itemMap.get(itemId);
      const unit = rawUnit || item?.unit || "kg";
      const donorId = values.donorId === "none" ? null : (values.donorId || null);

      setSaving(true);
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
        toast({ variant: "success", title: "Entrada registrada" });
        onOpenChange(false);
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao registrar entrada.";
        toast({ variant: "destructive", title: "Falha ao registrar", description: message });
      } finally {
        setSaving(false);
      }
    },
    [token, canCreate, itemMap, onCreated, onOpenChange, toast],
  );

  return (
    <SectionDialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
      }}
      title="Nova entrada (lote)"
      description="Registre uma nova entrada por validade (lote) e setor."
      contentClassName="sm:!max-w-[820px]"
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando opções...</p>
      ) : (
        <FormEngine<PantryEntryFormValues>
          fields={fields}
          initialValues={{
            donorId: "none",
            sector: "Geral",
            newSector: "",
            quantity: "",
            unit: "",
            entryDate: todayIsoDate(),
            expiryDate: "",
            notes: "",
          }}
          onFieldChange={({ name, value }) => {
            if (name !== "itemId") return;
            const itemId = String(value ?? "").trim();
            const item = itemMap.get(itemId);
            if (!item) {
              return { sector: "Geral", unit: "", newSector: "" };
            }
            return {
              sector: item.defaultSector || "Geral",
              unit: item.unit || "",
              newSector: "",
            };
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
