"use client";

import * as React from "react";
import { SectionCard } from "@/components/section-card";
import { FamilyMetricBadge, FamilyMetricField } from "@/features/family-members/ui/family-metrics";
import { useFamilyRelationsContext } from "@/features/family-members/context/family-relations-context";
import { Button } from "@/components/ui/button";
import { SectionDialog } from "@/components/section-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type HouseholdProfileForm = {
  type: string;
  condition: string;
  ownership: string;
  areaM2: string;
  rooms: string;
  bathrooms: string;
  notes: string;
};

const getEmptyForm = (): HouseholdProfileForm => ({
  type: "",
  condition: "",
  ownership: "",
  areaM2: "",
  rooms: "",
  bathrooms: "",
  notes: "",
});

const toNumberOrNull = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

type FamilyHouseholdReportProps = {
  mode?: "summary" | "detailed";
};

export function FamilyHouseholdReport({ mode = "detailed" }: FamilyHouseholdReportProps) {
  const { householdProfile, upsertHouseholdProfile } = useFamilyRelationsContext();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<HouseholdProfileForm>(getEmptyForm());
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const showActions = mode === "detailed";

  const hasProfileData = Boolean(
    householdProfile &&
      (householdProfile.type ||
        householdProfile.condition ||
        householdProfile.ownership ||
        householdProfile.areaM2 != null ||
        householdProfile.rooms != null ||
        householdProfile.bathrooms != null ||
        householdProfile.notes),
  );

  React.useEffect(() => {
    if (!open) return;
    setForm({
      type: householdProfile?.type ?? "",
      condition: householdProfile?.condition ?? "",
      ownership: householdProfile?.ownership ?? "",
      areaM2:
        householdProfile?.areaM2 != null
          ? String(householdProfile.areaM2)
          : "",
      rooms:
        householdProfile?.rooms != null ? String(householdProfile.rooms) : "",
      bathrooms:
        householdProfile?.bathrooms != null
          ? String(householdProfile.bathrooms)
          : "",
      notes: householdProfile?.notes ?? "",
    });
  }, [open, householdProfile]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await upsertHouseholdProfile({
      type: form.type.trim() || null,
      condition: form.condition.trim() || null,
      ownership: form.ownership.trim() || null,
      areaM2: toNumberOrNull(form.areaM2),
      rooms: toNumberOrNull(form.rooms),
      bathrooms: toNumberOrNull(form.bathrooms),
      notes: form.notes.trim() || null,
    });
    setIsSubmitting(false);
    setOpen(false);
  };

  const summaryBadges = [
    { label: "Tipo", value: householdProfile?.type },
    { label: "Condição", value: householdProfile?.condition },
    { label: "Propriedade", value: householdProfile?.ownership },
  ].filter((item) => Boolean(item.value));

  return (
    <SectionCard
      title="Relatório de moradia"
      subtitle="Características da residência monitorada"
      collapsible={showActions}
      defaultOpen
      actions={
        showActions ? (
          <SectionDialog
            title="Editar moradia"
            description="Atualize as informações da residência."
            open={open}
            onOpenChange={setOpen}
            trigger={
              <Button size="sm" variant="outline">
                {hasProfileData ? "Editar" : "Adicionar"}
              </Button>
            }
          >
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Tipo</Label>
                <Input
                  value={form.type}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, type: event.target.value }))
                  }
                  placeholder="Casa, apartamento, quarto..."
                />
              </div>
              <div className="grid gap-2">
                <Label>Condição</Label>
                <Input
                  value={form.condition}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      condition: event.target.value,
                    }))
                  }
                  placeholder="Boa, regular, precisa de reforma..."
                />
              </div>
              <div className="grid gap-2">
                <Label>Propriedade</Label>
                <Input
                  value={form.ownership}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      ownership: event.target.value,
                    }))
                  }
                  placeholder="Própria, alugada, cedida..."
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="grid gap-2">
                  <Label>Área (m²)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={form.areaM2}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        areaM2: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Cômodos</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={form.rooms}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        rooms: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Banheiros</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={form.bathrooms}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        bathrooms: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Observações</Label>
                <Textarea
                  value={form.notes}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </SectionDialog>
        ) : undefined
      }
    >
      {summaryBadges.length ? (
        <div className="flex flex-wrap items-center gap-2">
          {summaryBadges.map((item) => (
            <FamilyMetricBadge
              key={item.label}
              label={item.label}
              value={item.value ?? "-"}
            />
          ))}
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <FamilyMetricField
          label="Área (m²)"
          value={
            householdProfile?.areaM2 != null
              ? String(householdProfile.areaM2)
              : "-"
          }
        />
        <FamilyMetricField
          label="Cômodos"
          value={
            householdProfile?.rooms != null ? String(householdProfile.rooms) : "-"
          }
        />
        <FamilyMetricField
          label="Banheiros"
          value={
            householdProfile?.bathrooms != null
              ? String(householdProfile.bathrooms)
              : "-"
          }
        />
      </div>
      {householdProfile?.notes && showActions ? (
        <p className="text-xs text-muted-foreground">
          {householdProfile.notes}
        </p>
      ) : null}
      {!hasProfileData ? (
        <p className="text-xs text-muted-foreground">
          Nenhuma informação de moradia cadastrada.
        </p>
      ) : null}
    </SectionCard>
  );
}
