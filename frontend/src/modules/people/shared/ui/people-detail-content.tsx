"use client";

import * as React from "react";
import type { Person } from "../domain/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FamilyRelationsSection } from "@/modules/people/features/family-members/ui/family-relations-section";
import { FamilySummarySheet } from "@/modules/people/features/family-members/ui/family-summary-sheet";
import { FamilyIncomeReport } from "@/modules/people/features/family-members/ui/family-income-report";
import { FamilyHouseholdReport } from "@/modules/people/features/family-members/ui/family-household-report";
import { FamilyAssetsReport } from "@/modules/people/features/family-members/ui/family-assets-report";
import { useFamilyRelationsContext } from "@/modules/people/features/family-members/context/family-relations-context";
import { PeopleFinancialPanel } from "@/modules/people/features/people-financial/ui/people-financial-panel";
import { HealthConditionsPanel } from "@/modules/people/features/health-conditions/ui/health-conditions-panel";
import { MedicationsPanel } from "@/modules/people/features/medications/ui/medications-panel";
import { EducationPanel } from "@/modules/people/features/education/ui/education-panel";
import { BenefitsPanel } from "@/modules/people/features/benefits/ui/benefits-panel";
import { DetentionsPanel } from "@/modules/people/features/detentions/ui/detentions-panel";

type PeopleDetailContentProps = {
  person: Person;
};

export function PeopleDetailContent({ person }: PeopleDetailContentProps) {
  const [familyView, setFamilyView] = React.useState<"resumo" | "detalhado">(
    "resumo",
  );
  const { loadDetailed, loadSummary } = useFamilyRelationsContext();

  React.useEffect(() => {
    if (familyView === "detalhado") {
      loadDetailed();
      return;
    }
    loadSummary();
  }, [familyView, loadDetailed, loadSummary]);

  return (
    <div className="flex-1 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <TabsContent value="familia" className="space-y-6">
        <Tabs
          value={familyView}
          onValueChange={(value) =>
            setFamilyView(value as "resumo" | "detalhado")
          }
          className="space-y-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-background px-4 py-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Visualização
            </div>
            <TabsList className="h-9 w-auto rounded-full border border-border/60 bg-muted/40 p-1 shadow-sm">
              <TabsTrigger
                value="resumo"
                className="rounded-full px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-none"
              >
                Resumo
              </TabsTrigger>
              <TabsTrigger
                value="detalhado"
                className="rounded-full px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-none"
              >
                Detalhado
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="resumo" className="mt-0 space-y-6">
            <FamilySummarySheet />
          </TabsContent>

          <TabsContent value="detalhado" className="mt-0 space-y-6">
            <section className="space-y-3">
              <FamilyRelationsSection personId={person.id} />
            </section>
            <div>
              <FamilyIncomeReport />
            </div>
            <section className="space-y-3">
              <FamilyAssetsReport mode="detailed" />
            </section>
            <div>
              <FamilyHouseholdReport mode="detailed" />
            </div>
          </TabsContent>
        </Tabs>
      </TabsContent>

      <TabsContent value="resumo" className="mt-0">
        <div className="rounded-2xl border border-border/60 bg-background px-6 py-8 shadow-sm">
          <div className="mx-auto max-w-3xl">
            <div
              className="tiptap text-base leading-8 text-foreground sm:text-[17px]"
              dangerouslySetInnerHTML={{
                __html: person.profileSummary || "",
              }}
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="financeiro" className="space-y-6">
        <PeopleFinancialPanel personId={person.id} />
      </TabsContent>

      <TabsContent value="saude" className="space-y-6">
        <HealthConditionsPanel personId={person.id} />
      </TabsContent>

      <TabsContent value="medicacoes" className="space-y-6">
        <MedicationsPanel personId={person.id} />
      </TabsContent>

      <TabsContent value="escolaridade" className="space-y-6">
        <EducationPanel personId={person.id} />
      </TabsContent>

      <TabsContent value="beneficios" className="space-y-6">
        <BenefitsPanel personId={person.id} />
      </TabsContent>

      <TabsContent value="reclusao" className="space-y-6">
        <DetentionsPanel personId={person.id} />
      </TabsContent>
    </div>
  );
}

