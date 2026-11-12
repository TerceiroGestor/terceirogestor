"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Person } from "../domain/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  formatCurrency,
  formatDate,
  GENDER_LABELS,
  RACE_COLOR_LABELS,
  SEX_LABELS,
  resolvePersonDisplayNames,
  resolveLabel,
} from "../domain/utils";
import { buildAddressLabel } from "../domain/address";
import {
  Cake,
  GraduationCap,
  HeartPulse,
  Mail,
  MapPin,
  Pill,
  ScrollText,
  Tag as TagIcon,
  Users,
  Wallet,
  XIcon,
} from "lucide-react";
import { PersonIdentityAvatarTrigger } from "@/modules/people/shared/ui/person-identity-card";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import {
  getFamilySummary,
  getPersonEducations,
  getPersonRelations,
  type ApiPersonEducation,
  type ApiPersonRelation,
  type ApiFamilySummary,
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

function FichaSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-border/60 bg-muted/5 p-4">
      <div className="flex items-center gap-2 border-b border-border/50 pb-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </span>
      </div>
      {children}
    </section>
  );
}

function FichaStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2">
      <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
        {value}
      </div>
    </div>
  );
}

type PeopleDetailSidebarProps = {
  person: Person;
  ageLabel: string;
  isTodayBirthday: boolean;
};

function useFichaCompletaData(personId: string, enabled: boolean) {
  const { token } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [educations, setEducations] = React.useState<ApiPersonEducation[] | null>(null);
  const [relations, setRelations] = React.useState<ApiPersonRelation[]>([]);
  const [familySummary, setFamilySummary] = React.useState<ApiFamilySummary | null>(null);

  React.useEffect(() => {
    if (!enabled || !token) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getPersonEducations(token, personId).catch(() => []),
      getPersonRelations(token, personId).catch(() => null),
      getFamilySummary(token, personId).catch(() => null),
    ]).then(([educationData, relationsData, summaryData]) => {
      if (cancelled) return;
      setEducations(educationData);
      setRelations(relationsData?.relations ?? []);
      setFamilySummary(summaryData);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, personId, token]);

  return { loading, educations, relations, familySummary };
}

export function PeopleDetailSidebar({
  person,
  ageLabel,
  isTodayBirthday,
}: PeopleDetailSidebarProps) {
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const { loading, educations, relations, familySummary } = useFichaCompletaData(
    person.id,
    true,
  );
  const displayNames = resolvePersonDisplayNames(person.fullName, person.socialName);

  const currentEducation =
    educations?.find((education) => education.isCurrent) ?? educations?.[0] ?? null;
  const sexLabel = normalizeRowValue(resolveLabel(person.sex, SEX_LABELS));
  const genderLabel = normalizeRowValue(resolveLabel(person.gender, GENDER_LABELS));
  const raceLabel = normalizeRowValue(resolveLabel(person.raceColor, RACE_COLOR_LABELS));

  const addressLabel = buildAddressLabel({
    cep: familySummary?.householdProfile?.cep ?? null,
    street: familySummary?.householdProfile?.street ?? null,
    number: familySummary?.householdProfile?.number ?? null,
    neighborhood: familySummary?.householdProfile?.neighborhood ?? null,
    city: familySummary?.householdProfile?.city ?? null,
    state: familySummary?.householdProfile?.state ?? null,
  });

  const incomeSummary = familySummary?.incomeSummary ?? null;
  const ownContribution = incomeSummary?.contributions?.find(
    (entry) => entry.personId === person.id,
  );

  return (
    <div className="max-h-[85vh] space-y-5 overflow-y-auto rounded-2xl border border-border/60 bg-background p-5 shadow-lg">
      <div className="flex flex-col items-center gap-3 text-center">
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
            avatarClassName="h-28 w-28"
            tooltipLabel={null}
          />
          {person.hasHealthCondition || person.hasMedication || isTodayBirthday ? (
            <div className="flex flex-col items-center gap-2">
              {person.hasMedication ? (
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-blue-200 bg-blue-500 text-white shadow-sm">
                  <Pill className="h-4 w-4" />
                </span>
              ) : null}
              {person.hasHealthCondition ? (
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-rose-200 bg-rose-500 text-white shadow-sm">
                  <HeartPulse className="h-4 w-4" />
                </span>
              ) : null}
              {isTodayBirthday ? (
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-amber-200 bg-amber-500 text-white shadow-sm">
                  <Cake className="h-4 w-4" />
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        <div>
          <p className="text-base font-semibold text-foreground">{displayNames.primary}</p>
          {displayNames.secondary ? (
            <p className="text-xs text-muted-foreground">{displayNames.secondary}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <Badge
            variant="outline"
            className="border-emerald-200 bg-emerald-50 text-emerald-700"
          >
            {ageLabel}
          </Badge>
          {person.status ? <Badge variant="outline">{person.status}</Badge> : null}
          {person.personType ? <Badge variant="outline">{person.personType}</Badge> : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <FichaSection icon={ScrollText} title="Identificação">
          <div className="space-y-2">
            <InfoRow label="Estado civil" value={person.maritalStatus ?? null} />
            <InfoRow label="Sexo" value={sexLabel} />
            <InfoRow label="Gênero" value={genderLabel} />
            <InfoRow label="Raça/Cor" value={raceLabel} />
            <InfoRow label="Nascimento" value={normalizeRowValue(formatDate(person.birthDate))} />
          </div>
        </FichaSection>

        <FichaSection icon={Mail} title="Contato">
          <div className="space-y-2">
            <InfoRow label="Email" value={person.email ?? null} />
            <InfoRow label="Telefone" value={person.phone ?? null} />
          </div>
          {person.tags?.length ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {person.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="gap-1 rounded-full text-[10px]">
                  <TagIcon className="h-3 w-3" />
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}
        </FichaSection>

        <FichaSection icon={MapPin} title="Endereço">
          {loading && !familySummary ? (
            <p className="text-xs text-muted-foreground">Carregando...</p>
          ) : addressLabel ? (
            <p className="text-xs font-medium text-foreground">{addressLabel}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Nenhum endereço cadastrado.</p>
          )}
        </FichaSection>

        <FichaSection icon={GraduationCap} title="Escolaridade">
          {loading && !educations ? (
            <p className="text-xs text-muted-foreground">Carregando...</p>
          ) : currentEducation ? (
            <div className="space-y-2">
              <InfoRow label="Nível" value={currentEducation.level} />
              <InfoRow label="Instituição" value={currentEducation.institution ?? null} />
              <InfoRow label="Série/Ano" value={currentEducation.grade ?? null} />
              <InfoRow label="Situação" value={currentEducation.status ?? null} />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Nenhum registro de escolaridade.</p>
          )}
        </FichaSection>

        <FichaSection icon={Users} title="Família">
          {loading && !relations.length ? (
            <p className="text-xs text-muted-foreground">Carregando...</p>
          ) : relations.length ? (
            <div className="space-y-2">
              {relations.slice(0, 5).map((relation) => (
                <Link
                  key={relation.id}
                  href={withTenantPath(`/people/${relation.relatedPerson.id}`, tenantSlug)}
                  className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1 text-xs transition hover:bg-muted/60"
                >
                  <span className="truncate font-medium text-foreground">
                    {relation.relatedPerson.fullName}
                  </span>
                  <span className="shrink-0 text-muted-foreground">{relation.type}</span>
                </Link>
              ))}
              {relations.length > 5 ? (
                <p className="px-1.5 text-[11px] text-muted-foreground">
                  +{relations.length - 5} vínculo(s) adicional(is)
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Nenhum vínculo familiar registrado.</p>
          )}
        </FichaSection>

        <FichaSection icon={Wallet} title="Financeiro da família">
          {loading && !incomeSummary ? (
            <p className="text-xs text-muted-foreground">Carregando...</p>
          ) : incomeSummary ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <FichaStat label="Renda total" value={formatCurrency(incomeSummary.totalIncome)} />
                <FichaStat label="Despesas" value={formatCurrency(incomeSummary.totalExpenses)} />
                <FichaStat
                  label="Renda per capita"
                  value={formatCurrency(incomeSummary.perCapitaIncome)}
                />
                <FichaStat label="Benefícios" value={formatCurrency(incomeSummary.benefitsTotal)} />
              </div>
              {ownContribution ? (
                <p className="text-[11px] text-muted-foreground">
                  Contribuição desta pessoa:{" "}
                  <span className="font-medium text-foreground">
                    {formatCurrency(ownContribution.amount)}
                  </span>
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Sem dados financeiros registrados.</p>
          )}
        </FichaSection>
      </div>
    </div>
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
        className="max-w-[min(94vw,46rem)] border-none bg-transparent p-0 shadow-none"
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
          {open ? (
            <PeopleDetailSidebar
              person={person}
              ageLabel={ageLabel}
              isTodayBirthday={isTodayBirthday}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
