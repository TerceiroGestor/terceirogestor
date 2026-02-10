"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import { useFamilyRelationsContext } from "@/features/family-members/context/family-relations-context";
import type { Person } from "@/app/[tenant]/(modules)/people/types";
import { printFamilyReport } from "@/features/family-members/utils/family-report";

export function FamilySummary({ person }: { person: Person }) {
  const { token } = useAuth();
  const {
    data,
    isLoading,
    incomeSummary,
    householdProfile,
    householdAssets,
    personAssetsByMember,
  } = useFamilyRelationsContext();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/60 bg-background px-4 py-2 text-xs text-muted-foreground">
        Carregando resumo familiar...
      </div>
    );
  }

  const householdMembers = data?.householdMembers ?? [];
  const relations = data?.relations ?? [];
  const livingCount = householdMembers.length;
  const externalRelations = relations.filter(
    (relation) => !relation.livesTogether,
  );
  const guardiansCount =
    householdMembers.filter((member) => member.isLegalGuardian).length +
    externalRelations.filter((relation) => relation.isLegalGuardian).length;
  const providersCount = householdMembers.filter(
    (member) => member.isProvider,
  ).length;
  const incomeCount = householdMembers.filter(
    (member) => member.isIncomeContributor,
  ).length;
  const dependentsCount = householdMembers.filter(
    (member) => member.isDependent,
  ).length;
  const totalRelations = relations.length;

  if (!totalRelations && !livingCount) {
    return (
      <div className="rounded-2xl border border-border/60 bg-background px-4 py-2 text-xs text-muted-foreground">
        Nenhum vinculo familiar registrado.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-background px-4 py-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="secondary">Moram juntos: {livingCount}</Badge>
          <Badge variant="secondary">
            Fora da residencia: {externalRelations.length}
          </Badge>
          <Badge variant="outline">Responsaveis legais: {guardiansCount}</Badge>
          <Badge variant="outline">Provedores: {providersCount}</Badge>
          <Badge variant="outline">Contribuem renda: {incomeCount}</Badge>
          <Badge variant="outline">Dependentes: {dependentsCount}</Badge>
          <Badge variant="outline">Vinculos totais: {totalRelations}</Badge>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={!token}
          onClick={() => {
            if (!token) return;
            printFamilyReport({
              token,
              person,
              householdMembers,
              relations,
              incomeSummary,
              householdProfile,
              householdAssets,
              personAssetsByMember,
            });
          }}
        >
          Imprimir relatorio
        </Button>
      </div>
    </div>
  );
}

