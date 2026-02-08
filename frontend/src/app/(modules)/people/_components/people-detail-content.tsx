"use client";

import type { Person } from "../types";
import { TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FamilyRelationsSection } from "@/features/family-members/ui/family-relations-section";
import { FamilyIncomeReport } from "@/features/family-members/ui/family-income-report";
import { FamilyHouseholdReport } from "@/features/family-members/ui/family-household-report";
import { FamilyAssetsReport } from "@/features/family-members/ui/family-assets-report";
import { FamilyPatrimonialCard } from "@/features/family-members/ui/family-patrimonial-card";
import { PeopleFinancialPanel } from "@/features/people-financial/ui/people-financial-panel";
import { HealthConditionsPanel } from "@/features/health-conditions/ui/health-conditions-panel";
import { MedicationsPanel } from "@/features/medications/ui/medications-panel";

type PeopleDetailContentProps = {
  person: Person;
};

export function PeopleDetailContent({ person }: PeopleDetailContentProps) {
  return (
    <div className="flex-1 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <TabsContent value="familia" className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <FamilyPatrimonialCard />
          <FamilyHouseholdReport />
        </div>
        <div>
          <FamilyIncomeReport />
        </div>

        <section className="space-y-3">
          <FamilyRelationsSection personId={person.id} />
        </section>

        <section className="space-y-3">
          <FamilyAssetsReport />
        </section>
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
    </div>
  );
}
