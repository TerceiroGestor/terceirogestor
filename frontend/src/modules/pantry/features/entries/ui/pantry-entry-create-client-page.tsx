"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { FormEngine } from "@/components/FormEngine";
import { SectionCard } from "@/components/section-card";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { todayLocalIsoDate } from "@/lib/date";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import {
  createPantryDonor,
  createPantryEntry,
  createPantrySector,
  listPantryDonors,
  listPantryItems,
  listPantrySectors,
  type ApiPantryItem,
} from "@/modules/pantry/api";
import {
  PANTRY_NEW_DONOR_VALUE,
  buildPantryEntryFormFields,
} from "@/modules/pantry/features/entries/config/pantry-entry-form-config";
import { PANTRY_NEW_SECTOR_VALUE } from "@/modules/pantry/features/items/config/pantry-item-form-config";
import type { PantryEntryFormValues } from "@/modules/pantry/shared/domain/types";

function todayIsoDate() {
  return todayLocalIsoDate();
}

export function PantryEntryCreateClientPage() {
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);

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
          : "Falha ao carregar opÃ§Ãµes.";
      toast({ variant: "destructive", title: "Falha ao carregar", description: message });
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  React.useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

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

  const backToList = React.useCallback(() => {
    router.push(withTenantPath("/pantry/entries", tenantSlug));
  }, [router, tenantSlug]);

  const handleSubmit = React.useCallback(
    async (values: PantryEntryFormValues) => {
      if (!token) return;
      if (!canCreate) {
        toast({
          variant: "destructive",
          title: "Sem permissÃ£o",
          description: "VocÃª nÃ£o tem permissÃ£o para registrar entradas.",
        });
        return;
      }

      const itemId = values.itemId?.trim() ?? "";
      const rawSector = values.sector?.trim() ?? "";
      const rawNewSector = values.newSector?.trim() ?? "";
      const rawDonorId = values.donorId?.trim() ?? "";
      const rawNewDonorName = values.newDonorName?.trim() ?? "";
      const rawNewDonorType = values.newDonorType === "COMPANY" ? "COMPANY" : "PERSON";
      const rawNewDonorContact = values.newDonorContact?.trim() ?? "";
      const quantity =
        typeof values.quantity === "number" ? values.quantity : Number(values.quantity);
      const rawUnit = values.unit?.trim() ?? "";
      const rawEntryDate = values.entryDate?.trim() ?? "";
      const rawExpiryDate = values.expiryDate?.trim() ?? "";
      const rawNotes = values.notes?.trim() ?? "";

      if (!itemId) {
        toast({
          variant: "destructive",
          title: "Dados invÃ¡lidos",
          description: "Selecione um alimento.",
        });
        return;
      }

      const sector = rawSector === PANTRY_NEW_SECTOR_VALUE ? rawNewSector : rawSector;
      if (!sector) {
        toast({
          variant: "destructive",
          title: "Dados invÃ¡lidos",
          description: "Informe um setor.",
        });
        return;
      }

      if (!Number.isFinite(quantity) || quantity <= 0) {
        toast({
          variant: "destructive",
          title: "Dados invÃ¡lidos",
          description: "Informe uma quantidade vÃ¡lida.",
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
      let donorId: string | null = rawDonorId && rawDonorId !== "none" ? rawDonorId : null;

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
          setDonors((prev) => {
            const exists = prev.some((donor) => donor.id === created.id);
            if (exists) return prev;
            return [...prev, { id: created.id, name: created.name }].sort((a, b) =>
              a.name.localeCompare(b.name),
            );
          });
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
        toast({ variant: "success", title: "Entrada registrada" });
        backToList();
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
    [token, canCreate, itemMap, toast, backToList],
  );

  return (
    <div className="px-4 py-4">
      <div className="mx-auto w-full max-w-3xl">
        <SectionCard
          title="Nova entrada (lote)"
          subtitle="Registre uma nova entrada por validade (lote) e setor."
          defaultOpen
        >
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando opÃ§Ãµes...</p>
          ) : (
            <FormEngine<PantryEntryFormValues>
              fields={fields}
              initialValues={{
                donorId: "none",
                newDonorName: "",
                newDonorType: "PERSON",
                newDonorContact: "",
                sector: "Geral",
                newSector: "",
                quantity: "",
                unit: "",
                entryDate: todayIsoDate(),
                expiryDate: "",
                notes: "",
              }}
              disabled={saving}
              onSubmit={handleSubmit}
              onFieldChange={({ name, value, nextValues }) => {
                const patch: Partial<PantryEntryFormValues> = {};

                if (name === "donorId") {
                  const nextDonor = String(value ?? "").trim();
                  if (nextDonor === PANTRY_NEW_DONOR_VALUE) {
                    if (!nextValues.newDonorType) {
                      patch.newDonorType = "PERSON";
                    }
                  } else if (
                    nextValues.newDonorName ||
                    nextValues.newDonorContact ||
                    nextValues.newDonorType
                  ) {
                    patch.newDonorName = "";
                    patch.newDonorContact = "";
                    patch.newDonorType = "PERSON";
                  }
                }

                if (name === "itemId") {
                  const nextItemId = String(value ?? "").trim();
                  const item = itemMap.get(nextItemId);
                  if (!item) {
                    patch.sector = "Geral";
                    patch.unit = "";
                    patch.newSector = "";
                  } else {
                    patch.sector = item.defaultSector || "Geral";
                    patch.unit = item.unit || "";
                    patch.newSector = "";
                  }
                }

                return Object.keys(patch).length ? patch : undefined;
              }}
              actions={{
                submit: {
                  label: saving ? "Salvando..." : "Registrar",
                  variant: "primary",
                },
                cancel: {
                  label: "Cancelar",
                  variant: "ghost",
                  onClick: backToList,
                },
              }}
            />
          )}
        </SectionCard>
      </div>
    </div>
  );
}

