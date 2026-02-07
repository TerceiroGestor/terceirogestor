"use client";

import { FamilyCard } from "@/features/family-members/ui/family-card";
import { FamilyMetricBadge, FamilyMetricField } from "@/features/family-members/ui/family-metrics";
import { formatCurrency } from "@/app/(modules)/people/utils";
import { useFamilyRelationsContext } from "@/features/family-members/context/family-relations-context";
import type { FamilyIncomeSummary } from "@/app/(modules)/people/types";

export function FamilyIncomeReport() {
  const { incomeSummary } = useFamilyRelationsContext();
  const summary: FamilyIncomeSummary = incomeSummary ?? {
    totalIncome: 0,
    perCapitaIncome: 0,
    benefitsTotal: 0,
    pensionTotal: 0,
    householdSize: 0,
    contributors: [],
  };
  const hasIncome =
    summary.totalIncome > 0 ||
    summary.benefitsTotal > 0 ||
    summary.pensionTotal > 0;

  return (
    <FamilyCard
      title="Renda familiar"
      subtitle="Total, per capita e benefícios registrados"
      footer={
        <div className="flex flex-wrap gap-2">
          <FamilyMetricBadge
            label="Contribuintes"
            value={summary.contributors?.length ?? 0}
            variant="secondary"
          />
          <FamilyMetricBadge
            label="Famílias monitoradas"
            value={summary.householdSize ?? 0}
          />
        </div>
      }
    >
      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
        <FamilyMetricField
          label="Renda total"
          value={formatCurrency(summary.totalIncome)}
        />
        <FamilyMetricField
          label="Per capita"
          value={formatCurrency(summary.perCapitaIncome)}
        />
        {summary.benefitsTotal > 0 && (
          <FamilyMetricField
            label="Benefícios"
            value={formatCurrency(summary.benefitsTotal)}
          />
        )}
        {summary.pensionTotal > 0 && (
          <FamilyMetricField
            label="Pensão"
            value={formatCurrency(summary.pensionTotal)}
          />
        )}
      </div>
      {!hasIncome ? (
        <p className="text-xs text-muted-foreground">Sem rendas cadastradas.</p>
      ) : null}
    </FamilyCard>
  );
}
