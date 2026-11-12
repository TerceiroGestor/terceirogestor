"use client";

import * as React from "react";
import type { Person } from "../domain/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  formatDate,
  GENDER_LABELS,
  RACE_COLOR_LABELS,
  SEX_LABELS,
  resolvePersonDisplayNames,
  resolveLabel,
} from "../domain/utils";
import { Cake, HeartPulse, Pill, ScrollText, XIcon } from "lucide-react";
import { PersonIdentityAvatarTrigger } from "@/modules/people/shared/ui/person-identity-card";
import { usePathname } from "next/navigation";
import { getTenantSlugFromPath } from "@/lib/tenant-path";
import {
  getPersonEducations,
  type ApiPersonEducation,
} from "@/modules/people/api";
import { useAuth } from "@/features/auth/auth-context";

const normalizeRowValue = (value?: string | null) => {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || trimmed === "-") return null;
  return trimmed;
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  const normalized = normalizeRowValue(value);
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      {normalized ? (
        <span className="text-xs font-medium text-foreground">{normalized}</span>
      ) : (
        <span className="text-xs text-muted-foreground">-</span>
      )}
    </div>
  );
}

type PeopleDetailSidebarProps = {
  person: Person;
  ageLabel: string;
  isTodayBirthday: boolean;
};

export function PeopleDetailSidebar({
  person,
  ageLabel,
  isTodayBirthday,
}: PeopleDetailSidebarProps) {
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const { token } = useAuth();
  const [educations, setEducations] = React.useState<ApiPersonEducation[] | null>(
    null,
  );
  const displayNames = resolvePersonDisplayNames(
    person.fullName,
    person.socialName,
  );

  React.useEffect(() => {
    if (!token) return;
    getPersonEducations(token, person.id)
      .then((data) => setEducations(data))
      .catch(() => setEducations(null));
  }, [person.id, token]);

  const currentGrade =
    educations?.find((education) => education.isCurrent)?.grade ?? null;
  const sexLabel = normalizeRowValue(resolveLabel(person.sex, SEX_LABELS));
  const genderLabel = normalizeRowValue(resolveLabel(person.gender, GENDER_LABELS));
  const raceLabel = normalizeRowValue(resolveLabel(person.raceColor, RACE_COLOR_LABELS));

  return (
    <Card className="overflow-hidden">
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
      <CardContent className="space-y-2">
        <div className="space-y-2 text-xs">
          <InfoRow label="Tipo" value={person.personType ?? null} />
          <InfoRow label="Status" value={person.status ?? null} />
          <InfoRow label="Série/Ano" value={currentGrade} />
          <InfoRow label="Estado civil" value={person.maritalStatus ?? null} />
          <InfoRow label="Sexo" value={sexLabel} />
          <InfoRow label="Gênero" value={genderLabel} />
          <InfoRow label="Raça/Cor" value={raceLabel} />
          <InfoRow label="Nome social" value={person.socialName ?? null} />
          <InfoRow label="Nascimento" value={normalizeRowValue(formatDate(person.birthDate))} />
        </div>
      </CardContent>
    </Card>
  );
}

export function PersonFullRecordDialog({
  person,
  ageLabel,
  isTodayBirthday,
}: PeopleDetailSidebarProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="action"
          size="icon-sm"
          aria-label="Ver ficha completa"
          title="Ver ficha completa"
        >
          <ScrollText className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-sm border-none bg-transparent p-0 shadow-none"
        showCloseButton={false}
      >
        <div className="relative">
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-10 h-8 w-8 rounded-full bg-background/80"
              aria-label="Fechar"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </DialogClose>
          <DialogTitle className="sr-only">Ficha completa</DialogTitle>
          <PeopleDetailSidebar
            person={person}
            ageLabel={ageLabel}
            isTodayBirthday={isTodayBirthday}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
