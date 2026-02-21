"use client";

import * as React from "react";
import { FormEngine } from "@/components/FormEngine";
import { SectionDialog } from "@/components/section-dialog";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import {
  createPantrySector,
  listPantrySectors,
  updatePantryItem,
  type ApiPantryItem,
} from "@/modules/pantry/api";
import {
  buildPantryItemFormFields,
  PANTRY_NEW_SECTOR_VALUE,
} from "@/modules/pantry/features/items/config/pantry-item-form-config";
import type { PantryItemFormValues } from "@/modules/pantry/shared/domain/types";

function normalizeItemValues(values: PantryItemFormValues) {
  const name = values.name?.trim() ?? "";
  const group = values.group?.trim() || null;
  const rawDefaultSector = values.defaultSector?.trim() ?? "";
  const rawNewSector = values.newSector?.trim() ?? "";
  const defaultSector =
    rawDefaultSector === PANTRY_NEW_SECTOR_VALUE ? rawNewSector : rawDefaultSector;
  const unit = values.unit?.trim() ?? "";
  const minStock =
    typeof values.minStock === "number" ? values.minStock : Number(values.minStock);

  return {
    name,
    group,
    defaultSector,
    unit,
    minStock: Number.isFinite(minStock) ? minStock : 0,
  };
}

type PantryItemEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Pick<
    ApiPantryItem,
    "id" | "name" | "group" | "unit" | "minStock" | "defaultSector"
  > | null;
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
  const { toast } = useToast();
  const canUpdate = permissions.includes("pantry.update");

  const [sectors, setSectors] = React.useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [saving, setSaving] = React.useState(false);

  const loadSectors = React.useCallback(async () => {
    if (!token) return;
    try {
      const sectorsResponse = await listPantrySectors(token);
      setSectors(sectorsResponse.data ?? []);
    } catch {
      setSectors([]);
    }
  }, [token]);

  React.useEffect(() => {
    if (!open) return;
    void loadSectors();
  }, [open, loadSectors]);

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
    if (item?.defaultSector) push(item.defaultSector);
    push("Geral");
    return list.sort((a, b) => a.label.localeCompare(b.label));
  }, [item?.defaultSector, sectors]);

  const fields = React.useMemo(
    () => buildPantryItemFormFields({ sectorOptions }),
    [sectorOptions],
  );

  const initialValues = React.useMemo<Partial<PantryItemFormValues>>(() => {
    if (!item) return { unit: "kg", defaultSector: "Geral", newSector: "", minStock: 0 };
    return {
      name: item.name,
      group: item.group ?? "",
      defaultSector: item.defaultSector ?? "Geral",
      newSector: "",
      unit: item.unit,
      minStock: item.minStock,
    };
  }, [item]);

  const handleSubmit = React.useCallback(
    async (values: PantryItemFormValues) => {
      if (!token || !item) return;
      if (!canUpdate) {
        toast({
          variant: "destructive",
          title: "Sem permissão",
          description: "Você não tem permissão para editar alimentos.",
        });
        return;
      }

      const payload = normalizeItemValues(values);
      if (!payload.name || !payload.unit || !payload.defaultSector) {
        toast({
          variant: "destructive",
          title: "Dados inválidos",
          description: "Preencha nome, setor e unidade.",
        });
        return;
      }

      setSaving(true);
      try {
        if (values.defaultSector?.trim() === PANTRY_NEW_SECTOR_VALUE) {
          try {
            await createPantrySector(token, { name: payload.defaultSector });
          } catch {
            // best-effort
          }
        }
        const updated = await updatePantryItem(token, item.id, payload);
        await Promise.resolve(onSaved?.(updated));
        toast({ variant: "success", title: "Alimento atualizado" });
        onOpenChange(false);
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao salvar alimento.";
        toast({ variant: "destructive", title: "Falha ao salvar", description: message });
      } finally {
        setSaving(false);
      }
    },
    [token, item, canUpdate, onSaved, onOpenChange, toast],
  );

  return (
    <SectionDialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
      }}
      title={item ? `Editar: ${item.name}` : "Editar alimento"}
      description="Atualize nome, grupo, unidade e estoque mínimo."
      contentClassName="sm:!max-w-[720px]"
    >
      <FormEngine<PantryItemFormValues>
        fields={fields}
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
