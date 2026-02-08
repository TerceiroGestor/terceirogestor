"use client";

import { FamilyCard } from "@/components/family-card";
import { FamilyMetricField } from "@/features/family-members/ui/family-metrics";
import { useFamilyRelationsContext } from "@/features/family-members/context/family-relations-context";

export function FamilyPatrimonialCard() {
  const { householdAssets, personAssetsByMember } = useFamilyRelationsContext();

  const sharedTotals = householdAssets.reduce<Record<string, number>>(
    (acc, asset) => {
      const key = asset.category || "Outros";
      acc[key] = (acc[key] ?? 0) + (asset.quantity ?? 1);
      return acc;
    },
    {},
  );

  const individualTotals = personAssetsByMember.reduce<Record<string, number>>(
    (acc, group) => {
      group.assets.forEach((asset) => {
        const key = asset.category || "Outros";
        acc[key] = (acc[key] ?? 0) + (asset.quantity ?? 1);
      });
      return acc;
    },
    {},
  );

  const buildSummary = (data: Record<string, number>) =>
    Object.entries(data).map(([label, value]) => ({ label, value }));

  const sharedSummary = buildSummary(sharedTotals);
  const individualSummary = buildSummary(individualTotals);

  return (
    <FamilyCard
      title="Bens patrimoniais"
      subtitle="Itens compartilhados e individuais monitorados"
    >
      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Itens compartilhados
        </p>
        {sharedSummary.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {sharedSummary.map((metric) => (
              <FamilyMetricField
                key={`${metric.label}-shared`}
                label={metric.label}
                value={String(metric.value)}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Nenhum item compartilhado</p>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Itens individuais
        </p>
        {individualSummary.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {individualSummary.map((metric) => (
              <FamilyMetricField
                key={`${metric.label}-individual`}
                label={metric.label}
                value={String(metric.value)}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Nenhum item individual</p>
        )}
      </div>
    </FamilyCard>
  );
}

