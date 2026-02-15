"use client";

import type { Person } from "../domain/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatDate,
  GENDER_LABELS,
  RACE_COLOR_LABELS,
  SEX_LABELS,
  resolvePersonDisplayNames,
  resolveLabel,
} from "../domain/utils";
import { Cake, HeartPulse, MessageCircle, Pill } from "lucide-react";
import { Field } from "./people-detail-field";
import { SectionDivider } from "./people-detail-section-divider";
import { PersonIdentityAvatarTrigger } from "@/modules/people/shared/ui/person-identity-card";
import { usePathname } from "next/navigation";
import { getTenantSlugFromPath } from "@/lib/tenant-path";

type PeopleDetailSidebarProps = {
  person: Person;
  ageLabel: string;
  isTodayBirthday: boolean;
  whatsappUrl: string | null;
  onCopy: (value: string) => void;
};

export function PeopleDetailSidebar({
  person,
  ageLabel,
  isTodayBirthday,
  whatsappUrl,
  onCopy,
}: PeopleDetailSidebarProps) {
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const displayNames = resolvePersonDisplayNames(
    person.fullName,
    person.socialName,
  );
  const typeBadge = person.personType || "Tipo";
  const infoBadges = [
    resolveLabel(person.sex, SEX_LABELS),
    resolveLabel(person.gender, GENDER_LABELS),
    resolveLabel(person.raceColor, RACE_COLOR_LABELS),
    person.maritalStatus || "Estado civil",
  ];

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden">
      <CardHeader className="flex flex-col items-center gap-2 text-center">
        <div className="flex items-center gap-3">
          <PersonIdentityAvatarTrigger
            personId={person.id}
            tenantSlug={tenantSlug}
            fullName={person.fullName}
            socialName={person.socialName}
            birthDate={person.birthDate ?? null}
            ageLabel={ageLabel}
            avatarUrl={person.avatarUrl ?? "/avatar.jpg"}
            hasHealthCondition={person.hasHealthCondition}
            hasMedication={person.hasMedication}
            isBirthdayToday={isTodayBirthday}
            avatarClassName="h-40 w-40"
            tooltipLabel={null}
          />
          {(person.hasHealthCondition ||
            person.hasMedication ||
            isTodayBirthday) ? (
            <div className="flex flex-col items-center gap-2">
              {person.hasMedication ? (
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-blue-200 bg-blue-500 text-white shadow-sm">
                  <Pill className="h-4.5 w-4.5" />
                </span>
              ) : null}
              {person.hasHealthCondition ? (
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-rose-200 bg-rose-500 text-white shadow-sm">
                  <HeartPulse className="h-4.5 w-4.5" />
                </span>
              ) : null}
              {isTodayBirthday ? (
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-amber-200 bg-amber-500 text-white shadow-sm">
                  <Cake className="h-4.5 w-4.5" />
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="text-center">
            <p className="text-sm font-semibold">{displayNames.primary}</p>
            {displayNames.secondary ? (
              <p className="text-xs text-muted-foreground">
                {displayNames.secondary}
              </p>
            ) : null}
          </div>
          <Badge
            variant="outline"
            className="inline-flex items-center gap-1 border-emerald-200 bg-emerald-50 text-emerald-700"
          >
            {ageLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 space-y-2 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Badge variant="outline">{typeBadge}</Badge>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {infoBadges.map((label, index) => (
            <Badge key={`${label}-${index}`} variant="outline">
              {label}
            </Badge>
          ))}
        </div>
        <SectionDivider />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome social" value={person.socialName} />
          <Field label="Nascimento" value={formatDate(person.birthDate)} />
        </div>
        <SectionDivider />
        <div className="space-y-2">
          <CardTitle className="text-xs">Contatos</CardTitle>
          <div className="space-y-2 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-muted-foreground">Email</span>
              {person.email ? (
                <a
                  href={`mailto:${person.email}`}
                  className="text-xs font-medium text-foreground hover:text-foreground/80"
                >
                  {person.email}
                </a>
              ) : (
                <span className="text-xs text-muted-foreground">-</span>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-muted-foreground">
                Telefone
              </span>
              <div className="flex items-center gap-2">
                {person.phone ? (
                  <button
                    type="button"
                    className="text-xs font-medium text-foreground hover:text-foreground/80"
                    onClick={() => onCopy(person.phone ?? "")}
                    title="Copiar telefone"
                  >
                    {person.phone}
                  </button>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
                {whatsappUrl ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    aria-label="Abrir WhatsApp"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        <SectionDivider />
        <div className="space-y-2">
          <CardTitle className="text-xs">Documentos</CardTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="CPF" value={person.document} onCopy={onCopy} />
            <Field label="RG" value={person.rg} onCopy={onCopy} />
            <Field label="NIS" value={person.nis} onCopy={onCopy} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

