"use client";

import * as React from "react";
import type { Person } from "../domain/types";
import { TabsContent } from "@/components/ui/tabs";
import { FamilyRelationsPanel } from "@/modules/people/features/family-members/ui/family-relations-panel";
import { HouseholdAddressListPanel } from "@/modules/people/features/family-members/ui/household-address-list-panel";
import { ContactsPanel } from "@/modules/people/features/contacts/ui/contacts-panel";
import { PeopleFinancialRelationsPanel } from "@/modules/people/features/people-financial/ui/people-financial-relations-panel";
import { HealthConditionsPanel } from "@/modules/people/features/health-conditions/ui/health-conditions-panel";
import { MedicationsPanel } from "@/modules/people/features/medications/ui/medications-panel";
import { EducationPanel } from "@/modules/people/features/education/ui/education-panel";
import { DetentionsPanel } from "@/modules/people/features/detentions/ui/detentions-panel";

type PeopleDetailContentProps = {
  person: Person;
  relationsEnabled?: boolean;
};

function RelationUnavailableNotice() {
  return (
    <div className="rounded-md border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
      Relacoes disponiveis apos salvar o cadastro da pessoa.
    </div>
  );
}

export function PeopleDetailContent({
  person,
  relationsEnabled = true,
}: PeopleDetailContentProps) {
  return (
    <div className="flex-1 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <TabsContent value="familia" className="space-y-6">
        {relationsEnabled ? (
          <FamilyRelationsPanel personId={person.id} />
        ) : (
          <RelationUnavailableNotice />
        )}
      </TabsContent>

      <TabsContent value="endereco" className="space-y-6">
        {relationsEnabled ? (
          <HouseholdAddressListPanel personId={person.id} />
        ) : (
          <RelationUnavailableNotice />
        )}
      </TabsContent>

      <TabsContent value="contatos" className="space-y-6">
        {relationsEnabled ? (
          <ContactsPanel personId={person.id} />
        ) : (
          <RelationUnavailableNotice />
        )}
      </TabsContent>

      <TabsContent value="financeiro" className="space-y-6">
        {relationsEnabled ? (
          <PeopleFinancialRelationsPanel personId={person.id} />
        ) : (
          <RelationUnavailableNotice />
        )}
      </TabsContent>

      <TabsContent value="saude" className="space-y-6">
        {relationsEnabled ? (
          <HealthConditionsPanel personId={person.id} />
        ) : (
          <RelationUnavailableNotice />
        )}
      </TabsContent>

      <TabsContent value="medicacoes" className="space-y-6">
        {relationsEnabled ? (
          <MedicationsPanel personId={person.id} />
        ) : (
          <RelationUnavailableNotice />
        )}
      </TabsContent>

      <TabsContent value="escolaridade" className="space-y-6">
        {relationsEnabled ? (
          <EducationPanel personId={person.id} />
        ) : (
          <RelationUnavailableNotice />
        )}
      </TabsContent>
      <TabsContent value="reclusao" className="space-y-6">
        {relationsEnabled ? (
          <DetentionsPanel personId={person.id} />
        ) : (
          <RelationUnavailableNotice />
        )}
      </TabsContent>
    </div>
  );
}

