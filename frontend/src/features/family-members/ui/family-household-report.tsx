"use client";

import { SectionCard } from "@/components/section-card";
import { FamilyMetricBadge, FamilyMetricField } from "@/features/family-members/ui/family-metrics";
import { useFamilyRelationsContext } from "@/features/family-members/context/family-relations-context";

export function FamilyHouseholdReport() {
  const { householdProfile } = useFamilyRelationsContext();

  return (
    <SectionCard
      title="Relatório de moradia"
      subtitle="Características da residência monitorada"
    >
      <div className="flex flex-wrap items-center gap-2">
        <FamilyMetricBadge
          label="Tipo"
          value={householdProfile?.type ?? "-"}
        />
        <FamilyMetricBadge
          label="Condição"
          value={householdProfile?.condition ?? "-"}
        />
        <FamilyMetricBadge
          label="Propriedade"
          value={householdProfile?.ownership ?? "-"}
        />
      </div>
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
            householdProfile?.rooms != null
              ? String(householdProfile.rooms)
              : "-"
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
      {!householdProfile ? (
        <p className="text-xs text-muted-foreground">
          Nenhuma informação de moradia cadastrada.
        </p>
      ) : null}
    </SectionCard>
  );
}


