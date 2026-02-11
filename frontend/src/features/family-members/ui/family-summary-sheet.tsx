"use client";

import { Separator } from "@/components/ui/separator";
import { useFamilyRelationsContext } from "@/features/family-members/context/family-relations-context";
import { formatCurrency } from "@/app/[tenant]/(modules)/people/utils";

const formatValue = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
};

export function FamilySummarySheet() {
  const {
    data,
    isLoading,
    error,
    incomeSummary,
    householdProfile,
    householdAssets,
    personAssetsByMember,
  } = useFamilyRelationsContext();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/60 bg-background px-6 py-5 text-sm text-muted-foreground">
        Carregando resumo familiar...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-border/60 bg-background px-6 py-5 text-sm text-destructive">
        {error}
      </div>
    );
  }

  const householdMembers = data?.householdMembers ?? [];
  const relations = data?.relations ?? [];
  const externalRelations = relations.filter(
    (relation) => !relation.livesTogether,
  );
  const livingCount = householdMembers.length;
  const externalCount = externalRelations.length;
  const guardiansCount =
    householdMembers.filter((member) => member.isLegalGuardian).length +
    externalRelations.filter((relation) => relation.isLegalGuardian).length;
  const providersCount = householdMembers.filter(
    (member) => member.isProvider,
  ).length;
  const dependentsCount = householdMembers.filter(
    (member) => member.isDependent,
  ).length;
  const totalRelations = relations.length;

  const summary = incomeSummary ?? {
    totalIncome: 0,
    perCapitaIncome: 0,
    totalExpenses: 0,
    perCapitaExpenses: 0,
    benefitsTotal: 0,
    pensionTotal: 0,
    householdSize: 0,
    contributors: [],
  };
  const hasIncome =
    summary.totalIncome > 0 ||
    summary.benefitsTotal > 0 ||
    summary.pensionTotal > 0 ||
    summary.totalExpenses > 0;

  const sharedCount = householdAssets.reduce(
    (sum, asset) => sum + (asset.quantity ?? 1),
    0,
  );
  const individualCount = personAssetsByMember.reduce((sum, group) => {
    const groupTotal = group.assets.reduce(
      (acc, asset) => acc + (asset.quantity ?? 1),
      0,
    );
    return sum + groupTotal;
  }, 0);

  const hasHouseholdData = Boolean(
    householdProfile &&
      (householdProfile.type ||
        householdProfile.condition ||
        householdProfile.ownership ||
        householdProfile.areaM2 != null ||
        householdProfile.rooms != null ||
        householdProfile.bathrooms != null ||
        householdProfile.notes),
  );

  return (
    <div className="rounded-2xl border border-border/60 bg-background px-6 py-6 text-sm leading-6 text-foreground">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Resumo da família
        </p>
        <p className="text-sm text-muted-foreground">
          Síntese dos principais indicadores familiares.
        </p>
      </div>

      <Separator className="my-5" />

      <section className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          Núcleo familiar
        </p>
        {totalRelations + livingCount === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum vínculo familiar registrado.
          </p>
        ) : (
          <p>
            Moram juntos: <strong>{livingCount}</strong>. Fora da residência:{" "}
            <strong>{externalCount}</strong>. Responsáveis legais:{" "}
            <strong>{guardiansCount}</strong>. Provedores:{" "}
            <strong>{providersCount}</strong>. Dependentes:{" "}
            <strong>{dependentsCount}</strong>. Vínculos totais:{" "}
            <strong>{totalRelations}</strong>.
          </p>
        )}
      </section>

      <Separator className="my-5" />

      <section className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          Renda familiar
        </p>
        {hasIncome ? (
          <>
            <p>
              Renda total: <strong>{formatCurrency(summary.totalIncome)}</strong>
              . Renda per capita:{" "}
              <strong>{formatCurrency(summary.perCapitaIncome)}</strong>.
            </p>
            <p>
              Gastos totais:{" "}
              <strong>{formatCurrency(summary.totalExpenses)}</strong>. Gasto per
              capita:{" "}
              <strong>{formatCurrency(summary.perCapitaExpenses)}</strong>.
            </p>
            <p>
              Benefícios:{" "}
              <strong>{formatCurrency(summary.benefitsTotal)}</strong>. Pensão:{" "}
              <strong>{formatCurrency(summary.pensionTotal)}</strong>.{" "}
              Contribuintes: <strong>{summary.contributors?.length ?? 0}</strong>
              . Familiares monitorados:{" "}
              <strong>{summary.householdSize ?? 0}</strong>.
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Sem rendas cadastradas.
          </p>
        )}
      </section>

      <Separator className="my-5" />

      <section className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          Bens e serviços
        </p>
        {sharedCount + individualCount === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum item cadastrado.
          </p>
        ) : (
          <p>
            Itens compartilhados: <strong>{sharedCount}</strong>. Itens
            individuais: <strong>{individualCount}</strong>.
          </p>
        )}
      </section>

      <Separator className="my-5" />

      <section className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          Moradia
        </p>
        {hasHouseholdData ? (
          <>
            <p>
              Tipo: <strong>{formatValue(householdProfile?.type)}</strong>.
              Condição:{" "}
              <strong>{formatValue(householdProfile?.condition)}</strong>.
              Propriedade:{" "}
              <strong>{formatValue(householdProfile?.ownership)}</strong>.
            </p>
            <p>
              Área (m²):{" "}
              <strong>{formatValue(householdProfile?.areaM2)}</strong>. Cômodos:{" "}
              <strong>{formatValue(householdProfile?.rooms)}</strong>. Banheiros:{" "}
              <strong>{formatValue(householdProfile?.bathrooms)}</strong>.
            </p>
            {householdProfile?.notes ? (
              <p>
                Observações: <strong>{householdProfile.notes}</strong>.
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhuma informação de moradia cadastrada.
          </p>
        )}
      </section>
    </div>
  );
}
