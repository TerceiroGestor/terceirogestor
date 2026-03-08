"use client";

import * as React from "react";
import { Tabs } from "@/components/ui/tabs";
import { getAgeFromBirthDate, isBirthdayToday, resolvePersonDisplayNames } from "@/modules/people/shared/domain/utils";
import type { Person } from "@/modules/people/shared/domain/types";
import { PeopleDetailContent } from "@/modules/people/shared/ui/people-detail-content";
import { PeopleDetailHeader } from "@/modules/people/shared/ui/people-detail-header";
import { PeopleDetailSidebar } from "@/modules/people/shared/ui/people-detail-sidebar";
import { PeopleDetailTabs } from "@/modules/people/shared/ui/people-detail-tabs";
import { FamilyRelationsProvider } from "@/modules/people/features/family-members/context/family-relations-context";
import type { DetailShellAuditContext } from "@/web-client/detail/DetailShellEngine";
import { DetailAuditFeed } from "@/web-client/detail/DetailAuditFeed";
import { DetailSideTabs } from "@/web-client/detail/DetailSideTabs";
import { buildGroupedAuditFeed } from "@/web-client/detail/audit-feed-utils";
import type { DetailLayoutConfig } from "@/web-client/registry/types";

export type PeopleDetailLayoutContext = DetailShellAuditContext & {
  person: Person;
  readOnly: boolean;
  canAudit: boolean;
  tagSuggestions: string[];
  onUpdateTags?: (tags: string[]) => Promise<void> | void;
  tabValue: string;
  onTabChange: (value: string) => void;
  auditVisibleCount: number;
  onAuditVisibleCountChange: React.Dispatch<React.SetStateAction<number>>;
};

function PeopleDetailMain({
  person,
  tagSuggestions,
  onUpdateTags,
  tabValue,
  onTabChange,
}: {
  person: Person;
  tagSuggestions: string[];
  onUpdateTags?: (tags: string[]) => Promise<void> | void;
  tabValue: string;
  onTabChange: (value: string) => void;
}) {
  return (
    <FamilyRelationsProvider personId={person.id} initialMode="summary">
      <Tabs value={tabValue} onValueChange={onTabChange} className="flex flex-col gap-4">
        <div className="shrink-0">
          <PeopleDetailTabs value={tabValue} onValueChange={onTabChange} person={person} />
        </div>
        <PeopleDetailHeader
          tags={person.tags}
          suggestions={tagSuggestions}
          onSave={onUpdateTags}
          disabled={!onUpdateTags}
        />
        <PeopleDetailContent person={person} />
      </Tabs>
    </FamilyRelationsProvider>
  );
}

function PeopleDetailSide({
  person,
  canAudit,
  detailAudit,
  auditVisibleCount,
  onAuditVisibleCountChange,
}: {
  person: Person;
  canAudit: boolean;
  detailAudit?: DetailShellAuditContext["detailAudit"];
  auditVisibleCount: number;
  onAuditVisibleCountChange: React.Dispatch<React.SetStateAction<number>>;
}) {
  const ageValue = getAgeFromBirthDate(person.birthDate);
  const ageLabel = ageValue !== null ? `${ageValue} anos` : "-";
  const isTodayBirthdayValue = isBirthdayToday(person.birthDate);
  const auditCount = buildGroupedAuditFeed(detailAudit?.logs ?? []).length;

  const handleCopy = React.useCallback((value: string) => {
    if (!value || !navigator?.clipboard?.writeText) return;
    void navigator.clipboard.writeText(value);
  }, []);

  return (
    <FamilyRelationsProvider personId={person.id} initialMode="summary">
      <DetailSideTabs
        tabs={[
          {
            value: "profile",
            label: "Perfil",
            content: (
              <PeopleDetailSidebar
                person={person}
                ageLabel={ageLabel}
                isTodayBirthday={isTodayBirthdayValue}
                onCopy={handleCopy}
              />
            ),
          },
          {
            value: "activity",
            label: "Atividade",
            badge: canAudit && auditCount ? auditCount : undefined,
            content: canAudit ? (
              <DetailAuditFeed
                mode="edit"
                auditState={detailAudit}
                auditVisibleCount={auditVisibleCount}
                onAuditVisibleCountChange={onAuditVisibleCountChange}
              />
            ) : (
              <div className="border border-dashed border-border/60 px-4 py-6 text-center text-sm text-muted-foreground">
                Sem permissao para auditoria.
              </div>
            ),
          },
        ]}
        defaultValue="profile"
      />
    </FamilyRelationsProvider>
  );
}

export const PEOPLE_AUDIT_FIELD_LABELS: Record<string, string> = {
  fullName: "Nome completo",
  socialName: "Nome social",
  birthDate: "Nascimento",
  sex: "Sexo",
  gender: "Genero",
  raceColor: "Raca/Cor",
  maritalStatus: "Estado civil",
  nationality: "Nacionalidade",
  email: "Email",
  phone: "Telefone",
  status: "Status",
  personType: "Tipo",
  departureReason: "Motivo do desligamento",
  notes: "Notas",
  tags: "Tags",
  profileSummary: "Resumo",
  avatarUrl: "Foto",
};

export const peopleDetailLayout: DetailLayoutConfig<PeopleDetailLayoutContext> = {
  header: {
    title: ({ person }) => resolvePersonDisplayNames(person.fullName, person.socialName).primary,
    slot: ({ person }) => (
      <div className="border-y border-border/60 bg-transparent px-0 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Status</div>
            <div className="font-medium text-foreground">{person.status ?? "Sem status"}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Tipo</div>
            <div className="font-medium text-foreground">{person.personType ?? "Sem tipo"}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Nascimento</div>
            <div className="font-medium text-foreground">{person.birthDate ?? "—"}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Cadastro</div>
            <div className="font-medium text-foreground">{person.createdAt ?? "—"}</div>
          </div>
        </div>
      </div>
    ),
  },
  main: ({ person, tagSuggestions, onUpdateTags, tabValue, onTabChange }) => (
    <PeopleDetailMain
      person={person}
      tagSuggestions={tagSuggestions}
      onUpdateTags={onUpdateTags}
      tabValue={tabValue}
      onTabChange={onTabChange}
    />
  ),
  side: ({
    person,
    canAudit,
    detailAudit,
    auditVisibleCount,
    onAuditVisibleCountChange,
  }) => (
    <PeopleDetailSide
      person={person}
      canAudit={canAudit}
      detailAudit={detailAudit}
      auditVisibleCount={auditVisibleCount}
      onAuditVisibleCountChange={onAuditVisibleCountChange}
    />
  ),
  auditSources: {
    primaryEntity: {
      key: "person",
      entity: "Person",
      model: "audit.logs",
      label: "Pessoa",
      fieldLabels: PEOPLE_AUDIT_FIELD_LABELS,
      valueFormatters: {
        avatarUrl: (value) =>
          typeof value === "string" && value.trim() ? "Foto definida" : "Sem foto",
      },
      resolveEntityId: ({ person }) => person.id,
    },
    filters: () => ({ entity: "Person" }),
    sort: [{ field: "createdAt", direction: "desc" }],
    pagination: { limit: 120 },
  },
};
