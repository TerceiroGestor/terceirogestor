"use client";

import type { Person } from "../types";
import { TabsContent } from "@/components/ui/tabs";

type PeopleDetailContentProps = {
  person: Person;
};

export function PeopleDetailContent({ person }: PeopleDetailContentProps) {
  return (
    <div className="flex-1 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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
    </div>
  );
}
