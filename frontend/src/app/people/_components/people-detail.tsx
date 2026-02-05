"use client";

import type { Person } from "../types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ContactsList } from "@/features/contacts/ui/ContactsList";
import { AttendancesList } from "@/features/attendances/ui/AttendancesList";
import { DiariesList } from "@/features/diaries/ui/DiariesList";
import { OccurrencesList } from "@/features/occurrences/ui/OccurrencesList";
import { PresencesList } from "@/features/presences/ui/PresencesList";
import { CyclesList } from "@/features/cycles/ui/CyclesList";
import { FormationsList } from "@/features/formations/ui/FormationsList";
import { SchoolHistoriesList } from "@/features/school-histories/ui/SchoolHistoriesList";
import { AddressesList } from "@/features/addresses/ui/AddressesList";
import { IncomesList } from "@/features/incomes/ui/IncomesList";
import { FamilyMembersList } from "@/features/family-members/ui/FamilyMembersList";
import { AssessmentsList } from "@/features/assessments/ui/AssessmentsList";
import { ActivitiesList } from "@/features/activities/ui/ActivitiesList";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";

import { getInitials } from "../utils";

const Field = ({ label, value }: { label: string; value?: string }) => (
  <div className="space-y-0.5">
    <p className="text-[11px] text-muted-foreground">{label}</p>
    <p className="text-xs font-medium">{value || "-"}</p>
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
  const primaryContact = person.contacts?.find((contact) => contact.isPrimary);
  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-col items-center gap-2 text-center">
            <Avatar className="h-24 w-24">
              <AvatarImage src={String(person.avatar ?? "")} />
              <AvatarFallback>{getInitials(person.fullName)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-sm font-semibold">{person.fullName}</p>
              <p className="text-xs text-muted-foreground">{person.email}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={person.status === "Ativo" ? "default" : "secondary"}
              >
                {person.status}
              </Badge>
              <Badge variant="outline">{person.nationality || "N/A"}</Badge>
            </div>
            <div className="grid gap-3">
              <Field label="Telefone" value={person.phone} />
              <Field label="Nascimento" value={person.birthDate} />
              <Field label="CPF" value={person.cpf} />
            </div>
            <div className="border-t pt-3">
              <CardTitle className="text-xs">Contato principal</CardTitle>
              <div className="mt-2 grid gap-3">
                <Field label="Nome" value={primaryContact?.name} />
                <Field label="Relacao" value={primaryContact?.relationship} />
                <Field label="Telefone" value={primaryContact?.phone} />
                <Field label="Email" value={primaryContact?.email} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Tabs value={tabValue} onValueChange={onTabChange}>

          <TabsContent value="geral">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Dados pessoais</CardTitle>
                  <CardDescription>
                    Informacoes basicas e contatos.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  <Field label="Nome social" value={person.socialName} />
                  <Field label="Telefone" value={person.phone} />
                  <Field label="Genero" value={person.gender} />
                  <Field label="Estado civil" value={person.maritalStatus} />
                  <Field label="Nascimento" value={person.birthDate} />
                  <Field label="Nacionalidade" value={person.nationality} />
                  <Field label="Site" value={person.website} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Documentos</CardTitle>
                  <CardDescription>
                    Identificacao e registro civil.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  <Field label="CPF" value={person.cpf} />
                  <Field label="RG" value={person.rg} />
                  <Field label="NIS" value={person.nis} />
                  <Field label="Status" value={person.status} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="endereco">
            <AddressesList peopleId={person.id} />
          </TabsContent>

          <TabsContent value="renda">
            <IncomesList peopleId={person.id} />
          </TabsContent>

          <TabsContent value="familia">
            <FamilyMembersList peopleId={person.id} />
          </TabsContent>

          <TabsContent value="educacao">
            <div className="space-y-4">
              <FormationsList peopleId={person.id} />
              <SchoolHistoriesList peopleId={person.id} />
            </div>
          </TabsContent>

          <TabsContent value="resumo">
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle>Resumo</CardTitle>
                <CardDescription>
                  Observacoes e perfil dinamico.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border bg-muted/30 p-3 text-xs">
                  {person.notes || "Sem observacoes."}
                </div>
                <div
                  className="tiptap rounded-lg border bg-card/70 p-3 text-xs"
                  dangerouslySetInnerHTML={{
                    __html: person.profileSummary || "",
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contatos">
            <ContactsList peopleId={person.id} />
          </TabsContent>

          <TabsContent value="atendimento">
            <AttendancesList peopleId={person.id} />
          </TabsContent>

          <TabsContent value="avaliacao">
            <AssessmentsList peopleId={person.id} />
          </TabsContent>

          <TabsContent value="diario">
            <DiariesList peopleId={person.id} />
          </TabsContent>

          <TabsContent value="ocorrencias">
            <OccurrencesList peopleId={person.id} />
          </TabsContent>

          <TabsContent value="grupo">
            <CyclesList peopleId={person.id} />
          </TabsContent>

          <TabsContent value="presencas">
            <PresencesList peopleId={person.id} />
          </TabsContent>

          <TabsContent value="atividades">
            <ActivitiesList peopleId={person.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
