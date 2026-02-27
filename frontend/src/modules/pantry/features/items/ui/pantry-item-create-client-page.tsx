"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { FormEngine } from "@/components/FormEngine";
import { SectionCard } from "@/components/section-card";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import {
  createPantryItem,
  createPantrySector,
  listPantrySectors,
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

export function PantryItemCreateClientPage() {
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);

  const canCreate = permissions.includes("pantry.create");

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
    void loadSectors();
  }, [loadSectors]);

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
    push("Geral");
    return list.sort((a, b) => a.label.localeCompare(b.label));
  }, [sectors]);

  const fields = React.useMemo(
    () => buildPantryItemFormFields({ sectorOptions }),
    [sectorOptions],
  );

  const backToList = React.useCallback(() => {
    router.push(withTenantPath("/pantry/items", tenantSlug));
  }, [router, tenantSlug]);

  const handleSubmit = React.useCallback(
    async (values: PantryItemFormValues) => {
      if (!token) return;
      if (!canCreate) {
        toast({
          variant: "destructive",
          title: "Sem permissÃ£o",
          description: "VocÃª nÃ£o tem permissÃ£o para cadastrar alimentos.",
        });
        return;
      }

      const payload = normalizeItemValues(values);
      if (!payload.name || !payload.unit || !payload.defaultSector) {
        toast({
          variant: "destructive",
          title: "Dados invÃ¡lidos",
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
        await createPantryItem(token, payload);
        toast({ variant: "success", title: "Alimento cadastrado" });
        backToList();
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao cadastrar alimento.";
        toast({ variant: "destructive", title: "Falha ao cadastrar", description: message });
      } finally {
        setSaving(false);
      }
    },
    [token, canCreate, toast, backToList],
  );

  return (
    <div className="px-4 py-4">
      <div className="mx-auto w-full max-w-3xl">
        <SectionCard
          title="Novo alimento"
          subtitle="Cadastre o alimento para controlar entradas, saÃ­das e alertas."
          defaultOpen
        >
          <FormEngine<PantryItemFormValues>
            fields={fields}
            initialValues={{ unit: "kg", defaultSector: "Geral", newSector: "", minStock: 0 }}
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
                onClick: backToList,
              },
            }}
          />
        </SectionCard>
      </div>
    </div>
  );
}

