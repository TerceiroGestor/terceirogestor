"use client";

import { Separator } from "@/components/ui/separator";
import { useFamilyRelationsContext } from "@/modules/people/features/family-members/context/family-relations-context";
import { formatCurrency } from "@/modules/people/shared/domain/utils";

const formatValue = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
};

export function FamilySummarySheet() {
  const {
    summary,
    summaryLoading,
    summaryError,
    incomeSummary,
    householdProfile,
  } = useFamilyRelationsContext();

  if (summaryLoading) {
    return (
      <div className="rounded-2xl border border-border/60 bg-background px-6 py-5 text-sm text-muted-foreground">
        Carregando resumo familiar...
      </div>
    );
  }

  if (summaryError) {
    return (
      <div className="rounded-2xl border border-border/60 bg-background px-6 py-5 text-sm text-destructive">
        {summaryError}
      </div>
    );
  }

  const relationsSummary = summary?.relations ?? {
    livingCount: 0,
    externalCount: 0,
    guardiansCount: 0,
    providersCount: 0,
    dependentsCount: 0,
    totalRelations: 0,
  };

  const summaryIncome = summary?.incomeSummary ??
    incomeSummary ?? {
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
    summaryIncome.totalIncome > 0 ||
    summaryIncome.benefitsTotal > 0 ||
    summaryIncome.pensionTotal > 0 ||
    summaryIncome.totalExpenses > 0;

  const assetsSummary = summary?.assets ?? {
    sharedCount: 0,
    individualCount: 0,
  };

  const profile = summary?.householdProfile ?? householdProfile;
  const hasHouseholdData = Boolean(
    profile &&
      (profile.type ||
        profile.condition ||
        profile.ownership ||
        profile.areaM2 != null ||
        profile.rooms != null ||
        profile.bathrooms != null ||
        profile.notes),
  );

  return (
    <div className="rounded-2xl border border-border/60 bg-background px-6 py-6 text-sm leading-6 text-foreground">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Resumo da famÃ­lia
        </p>
        <p className="text-sm text-muted-foreground">
          SÃ­ntese dos principais indicadores familiares.
        </p>
      </div>

      <Separator className="my-5" />

      <section className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          NÃºcleo familiar
        </p>
        {relationsSummary.totalRelations + relationsSummary.livingCount === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum vÃ­nculo familiar registrado.
          </p>
        ) : (
          <p>
            Moram juntos: <strong>{relationsSummary.livingCount}</strong>. Fora
            da residÃªncia: <strong>{relationsSummary.externalCount}</strong>.
            ResponsÃ¡veis legais:{" "}
            <strong>{relationsSummary.guardiansCount}</strong>. Provedores:{" "}
            <strong>{relationsSummary.providersCount}</strong>. Dependentes:{" "}
            <strong>{relationsSummary.dependentsCount}</strong>. VÃ­nculos
            totais: <strong>{relationsSummary.totalRelations}</strong>.
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
              Renda total:{" "}
              <strong>{formatCurrency(summaryIncome.totalIncome)}</strong>.
              Renda per capita:{" "}
              <strong>{formatCurrency(summaryIncome.perCapitaIncome)}</strong>.
            </p>
            <p>
              Gastos totais:{" "}
              <strong>{formatCurrency(summaryIncome.totalExpenses)}</strong>.
              Gasto per capita:{" "}
              <strong>
                {formatCurrency(summaryIncome.perCapitaExpenses)}
              </strong>
              .
            </p>
            <p>
              BenefÃ­cios:{" "}
              <strong>{formatCurrency(summaryIncome.benefitsTotal)}</strong>.
              PensÃ£o:{" "}
              <strong>{formatCurrency(summaryIncome.pensionTotal)}</strong>.
              Contribuintes:{" "}
              <strong>{summaryIncome.contributors?.length ?? 0}</strong>.
              Familiares monitorados:{" "}
              <strong>{summaryIncome.householdSize ?? 0}</strong>.
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
          Bens e serviÃ§os
        </p>
        {assetsSummary.sharedCount + assetsSummary.individualCount === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum item cadastrado.
          </p>
        ) : (
          <p>
            Itens compartilhados:{" "}
            <strong>{assetsSummary.sharedCount}</strong>. Itens individuais:{" "}
            <strong>{assetsSummary.individualCount}</strong>.
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
              Tipo: <strong>{formatValue(profile?.type)}</strong>. CondiÃ§Ã£o:{" "}
              <strong>{formatValue(profile?.condition)}</strong>. Propriedade:{" "}
              <strong>{formatValue(profile?.ownership)}</strong>.
            </p>
            <p>
              Ãrea (mÂ²): <strong>{formatValue(profile?.areaM2)}</strong>. CÃ´modos:{" "}
              <strong>{formatValue(profile?.rooms)}</strong>. Banheiros:{" "}
              <strong>{formatValue(profile?.bathrooms)}</strong>.
            </p>
            {profile?.notes ? (
              <p>
                ObservaÃ§Ãµes: <strong>{profile.notes}</strong>.
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhuma informaÃ§Ã£o de moradia cadastrada.
          </p>
        )}
      </section>
    </div>
  );
}


