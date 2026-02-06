"use client";

import type { Person } from "../types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";

import { formatDate, getInitials } from "../utils";
import { resolveMediaUrl } from "@/lib/api";

const Field = ({ label, value }: { label: string; value?: string | null }) => (
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
  const statusLabel = person.status ?? "Sem status";
  const statusVariant = person.status === "Ativo" ? "default" : "secondary";
  return (
    <div className="grid gap-4 px-4 pt-4 pb-8 lg:grid-cols-[320px_1fr] lg:items-start lg:h-[calc(100svh-7rem)] lg:overflow-hidden">
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-col items-center gap-2 text-center">
            <Avatar className="h-24 w-24">
              <AvatarImage
                src={resolveMediaUrl(person.avatarUrl ?? "/avatar.jpg")}
              />
              <AvatarFallback>{getInitials(person.fullName)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-sm font-semibold">{person.fullName}</p>
              <p className="text-xs text-muted-foreground">{person.email}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusVariant}>{statusLabel}</Badge>
              <Badge variant="outline">{person.nationality || "N/A"}</Badge>
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
        </Card>
      </div>

      <div className="space-y-4 lg:h-full lg:overflow-y-auto lg:pr-2">
        <Tabs value={tabValue} onValueChange={onTabChange}>
          <TabsContent value="geral">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Identificacao</CardTitle>
                  <CardDescription>Dados basicos da pessoa.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  <Field label="Nome completo" value={person.fullName} />
                  <Field label="Nome social" value={person.socialName} />
                  <Field label="Genero" value={person.gender} />
                  <Field label="Estado civil" value={person.maritalStatus} />
                  <Field
                    label="Nascimento"
                    value={formatDate(person.birthDate)}
                  />
                  <Field label="Nacionalidade" value={person.nationality} />
                  <Field label="Status" value={person.status} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contato e documentos</CardTitle>
                  <CardDescription>
                    Canais de contato e documentos.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  <Field label="Email" value={person.email} />
                  <Field label="Telefone" value={person.phone} />
                  <Field label="CPF" value={person.document} />
                  <Field label="RG" value={person.rg} />
                  <Field label="NIS" value={person.nis} />
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
