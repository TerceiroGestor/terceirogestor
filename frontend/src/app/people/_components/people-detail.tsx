"use client";

import type { Person } from "../types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";

import {
  formatDate,
  getAgeFromBirthDate,
  getInitials,
  GENDER_LABELS,
  isBirthdayToday,
  RACE_COLOR_LABELS,
  SEX_LABELS,
  resolveLabel,
} from "../utils";
import { resolveMediaUrl } from "@/lib/api";
import { Cake, HeartPulse } from "lucide-react";

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="space-y-0.5">
    <p className="text-[11px] text-muted-foreground">{label}</p>
    <p className="text-xs font-medium">{value || "-"}</p>
  </div>
);

const TagList = ({ tags }: { tags?: string[] | null }) => (
  <div className="flex flex-wrap gap-2">
    {tags && tags.length ? (
      tags.map((tag) => (
        <Badge key={tag} variant="secondary">
          {tag}
        </Badge>
      ))
    ) : (
      <span className="text-xs text-muted-foreground">Sem tags</span>
    )}
  </div>
);

type PeopleDetailProps = {
  person: Person;
  tabValue: string;
  onTabChange: (value: string) => void;
};

export function PeopleDetail({
  person,
  tabValue,
  onTabChange,
}: PeopleDetailProps) {
  const statusLabel = person.status ?? "Sem status";
  const ageValue = getAgeFromBirthDate(person.birthDate);
  const ageLabel = ageValue !== null ? `${ageValue} anos` : "-";
  const isTodayBirthday = isBirthdayToday(person.birthDate);
  const statusVariant =
    person.status === "Ativo"
      ? "default"
      : person.status === "Desligado"
        ? "destructive"
        : "secondary";
  return (
    <div className="grid gap-4 px-4 pt-4 pb-8 lg:grid-cols-[320px_1fr] lg:items-start lg:h-[calc(100svh-7rem)] lg:overflow-hidden">
      <div className="space-y-4 lg:h-full">
        <Card className="max-h-[calc(100svh-9rem)] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <CardHeader className="flex flex-col items-center gap-2 text-center">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={resolveMediaUrl(person.avatarUrl ?? "/avatar.jpg")}
                />
                <AvatarFallback>{getInitials(person.fullName)}</AvatarFallback>
              </Avatar>
              {person.hasHealthIssue || isTodayBirthday ? (
                <span className="absolute -bottom-1 -right-1 flex items-center gap-1">
                  {person.hasHealthIssue ? (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600 shadow-sm">
                      <HeartPulse className="h-4 w-4" />
                    </span>
                  ) : null}
                  {isTodayBirthday ? (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-600 shadow-sm">
                      <Cake className="h-4 w-4" />
                    </span>
                  ) : null}
                </span>
              ) : null}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">{person.fullName}</p>
              <p className="text-xs text-muted-foreground">{person.email}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusVariant}>{statusLabel}</Badge>
              <Badge variant="outline" className="inline-flex items-center gap-1">
                <span>{ageLabel}</span>
              </Badge>
              {person.hasHealthIssue ? (
                <Badge variant="secondary">Saude: Sim</Badge>
              ) : null}
            </div>
            <div className="grid gap-3">
              <Field label="Telefone" value={person.phone} />
              <Field label="Nascimento" value={formatDate(person.birthDate)} />
              <Field label="CPF" value={person.document} />
            </div>
            <div className="border-t pt-3">
              <CardTitle className="text-xs">Contato principal</CardTitle>
              <div className="mt-2 grid gap-3">
                <Field label="Email" value={person.email} />
                <Field label="Telefone" value={person.phone} />
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4 flex-col items-start gap-2">
            <p className="text-[11px] text-muted-foreground">Tags</p>
            <TagList tags={person.tags} />
          </CardFooter>
        </Card>
      </div>

      <div className="space-y-4 lg:h-full lg:overflow-y-auto lg:pr-2">
        <Tabs value={tabValue} onValueChange={onTabChange}>
          <TabsContent value="geral">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Informacoes gerais</CardTitle>
                  <CardDescription>
                    Dados pessoais, contato e documentos.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={statusVariant}>{statusLabel}</Badge>
                    <Badge variant="outline">
                      {resolveLabel(person.sex, SEX_LABELS)}
                    </Badge>
                    <Badge variant="outline">
                      {resolveLabel(person.gender, GENDER_LABELS)}
                    </Badge>
                    <Badge variant="outline">
                      {resolveLabel(person.raceColor, RACE_COLOR_LABELS)}
                    </Badge>
                    <Badge variant="outline">
                      {person.maritalStatus || "Estado civil"}
                    </Badge>
                    <Badge variant="outline">
                      {person.nationality || "Nacionalidade"}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="inline-flex items-center gap-1"
                    >
                      <span>{ageLabel}</span>
                    </Badge>
                    <Badge
                      variant={person.hasHealthIssue ? "secondary" : "outline"}
                    >
                      Saude: {person.hasHealthIssue ? "Sim" : "Nao"}
                    </Badge>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Nome completo" value={person.fullName} />
                    <Field label="Nome social" value={person.socialName} />
                    <Field
                      label="Nascimento"
                      value={formatDate(person.birthDate)}
                    />
                    <Field label="Idade" value={ageLabel} />
                    {person.status === "Desligado" ? (
                      <Field
                        label="Motivo do desligamento"
                        value={person.departureReason}
                      />
                    ) : null}
                  </div>

                  <div className="border-t pt-4">
                    <CardTitle className="text-xs">
                      Contato e documentos
                    </CardTitle>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <Field label="Email" value={person.email} />
                      <Field label="Telefone" value={person.phone} />
                      <Field label="CPF" value={person.document} />
                      <Field label="RG" value={person.rg} />
                      <Field label="NIS" value={person.nis} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="resumo">
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
        </Tabs>
      </div>
    </div>
  );
}
