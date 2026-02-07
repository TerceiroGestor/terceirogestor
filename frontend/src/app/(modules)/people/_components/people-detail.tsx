"use client";

import * as React from "react";
import type { Person } from "../types";
import { Tabs } from "@/components/ui/tabs";
import { getAgeFromBirthDate, isBirthdayToday } from "../utils";
import { PeopleDetailTabs } from "./people-detail-tabs";
import { PeopleDetailHeader } from "./people-detail-header";
import { PeopleDetailContent } from "./people-detail-content";
import { PeopleDetailSidebar } from "./people-detail-sidebar";
import { FamilyRelationsProvider } from "@/features/family-members/context/family-relations-context";

type PeopleDetailProps = {
  person: Person;
  tabValue: string;
  onTabChange: (value: string) => void;
  tagSuggestions?: string[];
  onUpdateTags?: (tags: string[]) => Promise<void> | void;
};

export function PeopleDetail({
  person,
  tabValue,
  onTabChange,
  tagSuggestions,
  onUpdateTags,
}: PeopleDetailProps) {
  const ageValue = getAgeFromBirthDate(person.birthDate);
  const ageLabel = ageValue !== null ? `${ageValue} anos` : "-";
  const isTodayBirthday = isBirthdayToday(person.birthDate);
  const phoneDigits = person.phone ? person.phone.replace(/\D/g, "") : "";
  const whatsappUrl = phoneDigits ? `https://wa.me/${phoneDigits}` : null;
  const handleCopy = React.useCallback((value: string) => {
    if (!value) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(value);
    }
  }, []);

  return (
    <FamilyRelationsProvider personId={person.id}>
      <div className="grid gap-4 px-4 pt-4 pb-4 lg:grid-cols-[320px_1fr] lg:items-start lg:h-[calc(100svh-3.5rem)] lg:overflow-hidden">
        <div className="space-y-5 lg:h-full">
          <PeopleDetailSidebar
            person={person}
            ageLabel={ageLabel}
            isTodayBirthday={isTodayBirthday}
            whatsappUrl={whatsappUrl}
            onCopy={handleCopy}
          />
        </div>

        <div className="flex flex-col gap-4 lg:h-full lg:overflow-hidden lg:pr-2">
          <Tabs
            value={tabValue}
            onValueChange={onTabChange}
            className="flex h-full flex-col gap-4"
          >
            <div className="shrink-0">
              <PeopleDetailTabs value={tabValue} onValueChange={onTabChange} />
            </div>

            <PeopleDetailHeader
              tags={person.tags}
              suggestions={tagSuggestions}
              onSave={onUpdateTags}
              disabled={!onUpdateTags}
            />

            <PeopleDetailContent person={person} />
          </Tabs>
        </div>
      </div>
    </FamilyRelationsProvider>
  );
}
