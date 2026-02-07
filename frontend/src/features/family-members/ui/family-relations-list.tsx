"use client";

import * as React from "react";
import type {
  FamilyIncomeSummary,
  HouseholdAsset,
  HouseholdMember,
  HouseholdProfile,
  Person,
  PersonAssetsGroup,
  PersonRelation,
  PersonRelationInput,
  PersonSummary,
} from "@/app/(modules)/people/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Download,
  FileText,
  Menu,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
} from "lucide-react";
import { resolveMediaUrl } from "@/lib/api";
import Link from "next/link";
import { useAuth } from "@/features/auth/auth-context";
import {
  downloadFamilyCsv,
  exportFamilyPdf,
} from "@/features/family-members/utils/family-export-actions";
import { formatCurrency } from "@/app/(modules)/people/utils";

type FamilyRelationsListProps = {
  peopleOptions: PersonSummary[];
  relations: PersonRelation[];
  householdMembers: HouseholdMember[];
  incomeContributorIds: string[];
  isLoading: boolean;
  error?: string | null;
  currentPerson: Person;
  onRefresh: () => void;
  onCreate: (payload: PersonRelationInput) => Promise<void>;
  onUpdate: (
    relationId: string,
    payload: Partial<PersonRelationInput>,
  ) => Promise<void>;
  onDelete: (relationId: string) => Promise<void>;
  incomeSummary: FamilyIncomeSummary | null;
  householdProfile: HouseholdProfile | null;
  householdAssets: HouseholdAsset[];
  personAssetsByMember: PersonAssetsGroup[];
};

type RelationFormState = PersonRelationInput & {
  relationId?: string;
};

const RELATION_TYPE_OPTIONS = [
  "Pai",
  "Mae",
  "Filho(a)",
  "Irmao(ã)",
  "Conjuge",
  "Responsavel",
  "Dependente",
  "Avo(ó)",
  "Tio(a)",
  "Primo(a)",
  "Sobrinho(a)",
  "Neto(a)",
  "Outro",
];

const HOUSEHOLD_ROLE_OPTIONS = [
  "Morador",
  "Responsavel",
  "Dependente",
  "Provedor",
  "Outro",
];

const buildInitialForm = (
  peopleOptions: PersonSummary[],
  relation?: PersonRelation,
  householdMember?: HouseholdMember,
): RelationFormState => {
  const relatedPersonId =
    relation?.relatedPersonId ??
    householdMember?.personId ??
    peopleOptions[0]?.id ??
    "";
  return {
    relationId: relation?.id,
    relatedPersonId,
    type: relation?.type ?? "Pai",
    livesTogether: relation?.livesTogether ?? Boolean(householdMember),
    isLegalGuardian:
      relation?.isLegalGuardian ?? householdMember?.isLegalGuardian ?? false,
    notes: relation?.notes ?? "",
    householdRole: householdMember?.role ?? "",
    isIncomeContributor: householdMember?.isIncomeContributor ?? false,
    isProvider: householdMember?.isProvider ?? false,
    isDependent: householdMember?.isDependent ?? false,
  };
};

const RelationBadge = ({ label }: { label: string }) => (
  <Badge variant="secondary" className="text-[11px]">
    {label}
  </Badge>
);

const SummaryMetric = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-border/60 bg-background px-3 py-2">
    <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
      {label}
    </p>
    <p className="text-sm font-semibold text-foreground">{value}</p>
  </div>
);

const SummaryBadge = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center gap-2 rounded-full border border-border/40 bg-background/60 px-3 py-1 text-[11px] text-muted-foreground">
    <span className="w-2.5 rounded-full bg-muted-foreground/80" />
    <span className="font-medium text-foreground">
      {label}: {value}
    </span>
  </div>
);

const FamilyRow = ({
  person,
  relationType,
  badges,
  onEdit,
  onDelete,
}: {
  person: PersonSummary;
  relationType?: string;
  badges: string[];
  onEdit?: () => void;
  onDelete?: () => void;
}) => (
  <div className="group relative flex flex-col gap-2 border-b border-border/30 py-2 pr-2 lg:flex-row lg:items-center">
    <Avatar className="h-10 w-10">
      <AvatarImage src={resolveMediaUrl(person.avatarUrl ?? "/avatar.jpg")} />
      <AvatarFallback>
        {person.fullName.slice(0, 1).toUpperCase()}
      </AvatarFallback>
    </Avatar>
    <div className="flex flex-1 flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
        <Link
          href={`/people/${person.id}`}
          className="hover:text-foreground/80"
        >
          {person.fullName}
        </Link>
        {relationType ? <RelationBadge label={relationType} /> : null}
      </div>
      <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
        {badges.map((badge) => (
          <span
            key={badge}
            className="flex items-center gap-1 rounded-full border border-border/50 px-2 py-0.5 text-[11px]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/70" />
            {badge}
          </span>
        ))}
      </div>
    </div>
    <div className="absolute right-0 top-1 hidden items-center gap-1 text-muted-foreground group-hover:flex">
      {onEdit ? (
        <Button
          size="icon"
          variant="ghost"
          className="size-7 text-muted-foreground hover:text-foreground"
          onClick={onEdit}
        >
          <Pencil className="size-3" />
        </Button>
      ) : null}
      {onDelete ? (
        <Button
          size="icon"
          variant="ghost"
          className="size-7 text-destructive hover:text-destructive/80"
          onClick={onDelete}
        >
          <Trash2 className="size-3" />
        </Button>
      ) : null}
    </div>
  </div>
);

const RelationDialog = ({
  title,
  description,
  peopleOptions,
  initial,
  disabledRelated,
  onSubmit,
  open,
  onOpenChange,
  triggerLabel,
}: {
  title: string;
  description: string;
  peopleOptions: PersonSummary[];
  initial: RelationFormState;
  disabledRelated?: boolean;
  onSubmit: (payload: RelationFormState) => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerLabel?: string;
}) => {
  const [form, setForm] = React.useState<RelationFormState>(initial);

  React.useEffect(() => {
    setForm(initial);
  }, [initial]);

  const canSubmit = Boolean(form.relatedPersonId) && Boolean(form.type?.trim());

  const handleSave = async () => {
    if (!canSubmit) return;
    await onSubmit(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {triggerLabel ? (
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className="gap-2">
            <Plus className="size-4" />
            {triggerLabel}
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Pessoa relacionada</Label>
            <Select
              value={form.relatedPersonId}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, relatedPersonId: value }))
              }
              disabled={disabledRelated}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma pessoa" />
              </SelectTrigger>
              <SelectContent>
                {peopleOptions.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Tipo de vinculo</Label>
            <Select
              value={form.type}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {RELATION_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 rounded-lg border border-border/60 p-3">
            <div className="flex items-center justify-between">
              <Label>Mora junto</Label>
              <Switch
                checked={Boolean(form.livesTogether)}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, livesTogether: checked }))
                }
              />
            </div>
            {form.livesTogether ? (
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label>Papel no domicilio</Label>
                  <Select
                    value={form.householdRole ?? ""}
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, householdRole: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um papel" />
                    </SelectTrigger>
                    <SelectContent>
                      {HOUSEHOLD_ROLE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label>Responsavel legal</Label>
                    <Switch
                      checked={Boolean(form.isLegalGuardian)}
                      onCheckedChange={(checked) =>
                        setForm((prev) => ({
                          ...prev,
                          isLegalGuardian: checked,
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Contribui com renda</Label>
                    <Switch
                      checked={Boolean(form.isIncomeContributor)}
                      onCheckedChange={(checked) =>
                        setForm((prev) => ({
                          ...prev,
                          isIncomeContributor: checked,
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Provedor</Label>
                    <Switch
                      checked={Boolean(form.isProvider)}
                      onCheckedChange={(checked) =>
                        setForm((prev) => ({ ...prev, isProvider: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Dependente</Label>
                    <Switch
                      checked={Boolean(form.isDependent)}
                      onCheckedChange={(checked) =>
                        setForm((prev) => ({ ...prev, isDependent: checked }))
                      }
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label>Observacoes</Label>
            <Textarea
              value={form.notes ?? ""}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, notes: event.target.value }))
              }
              rows={3}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!canSubmit}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export function FamilyRelationsList({
  peopleOptions,
  relations,
  householdMembers,
  incomeContributorIds,
  isLoading,
  error,
  currentPerson,
  onRefresh,
  onCreate,
  onUpdate,
  onDelete,
  incomeSummary,
  householdProfile,
  householdAssets,
  personAssetsByMember,
}: FamilyRelationsListProps) {
  const { token } = useAuth();
  const relationByPerson = React.useMemo(() => {
    const map = new Map<string, PersonRelation>();
    relations.forEach((relation) => {
      map.set(relation.relatedPersonId, relation);
    });
    return map;
  }, [relations]);

  const livingMembers = householdMembers.map((member) => ({
    member,
    relation: relationByPerson.get(member.personId),
  }));

  const externalRelations = relations.filter(
    (relation) => !relation.livesTogether,
  );

  const [editing, setEditing] = React.useState<{
    relation?: PersonRelation;
    member?: HouseholdMember;
  } | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);

  const handleCreate = async (payload: RelationFormState) => {
    await onCreate(payload);
    onRefresh();
  };

  const handleEditSave = async (payload: RelationFormState) => {
    if (payload.relationId) {
      await onUpdate(payload.relationId, payload);
    } else {
      await onCreate(payload);
    }
    setEditing(null);
    setEditOpen(false);
    onRefresh();
  };

  const handleDelete = async (relationId: string) => {
    await onDelete(relationId);
    onRefresh();
  };

  const createInitial = React.useMemo(
    () => buildInitialForm(peopleOptions),
    [peopleOptions],
  );
  const sharedAssetCount = householdAssets.length;
  const individualAssetCount = personAssetsByMember.reduce(
    (sum, group) => sum + group.assets.length,
    0,
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-muted-foreground">
          Carregando relações familiares...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-destructive">
          {error}
        </CardContent>
      </Card>
    );
  }

  const livingCount = livingMembers.length;
  const externalCount = externalRelations.length;
  const guardiansCount =
    householdMembers.filter((member) => member.isLegalGuardian).length +
    externalRelations.filter((relation) => relation.isLegalGuardian).length;
  const providersCount = householdMembers.filter(
    (member) => member.isProvider,
  ).length;
  const incomeCount = householdMembers.filter(
    (member) => member.isIncomeContributor,
  ).length;
  const dependentsCount = householdMembers.filter(
    (member) => member.isDependent,
  ).length;
  const totalRelations = relations.length;

  const handleExportPdf = () => {
    exportFamilyPdf({
      token,
      person: currentPerson,
      householdMembers,
      relations,
      incomeSummary,
      householdProfile,
      householdAssets,
      personAssetsByMember,
    });
  };

  const handleDownloadCsv = () => {
    downloadFamilyCsv({
      person: currentPerson,
      householdMembers,
      relations,
      incomeContributorIds,
      incomeSummary,
      householdAssets,
      personAssetsByMember,
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
              >
                <Menu className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onSelect={onRefresh}>
                <RefreshCw className="mr-2 size-4" />
                Atualizar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleExportPdf}>
                <FileText className="mr-2 size-4" />
                Exportar PDF
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleDownloadCsv}>
                <Download className="mr-2 size-4" />
                Exportar CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <RelationDialog
          title="Adicionar vínculo"
          description="Registre um familiar e as informações sociais."
          peopleOptions={peopleOptions}
          initial={createInitial}
          open={createOpen}
          onOpenChange={setCreateOpen}
          triggerLabel="Novo vínculo"
          onSubmit={handleCreate}
        />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                Moram juntos
              </p>
            </div>
            <div className="space-y-1">
              {livingMembers.length ? (
                livingMembers.map(({ member, relation }) => {
                  const contributesIncome =
                    member.isIncomeContributor ||
                    incomeContributorIds.includes(member.personId);
                  const badges = [
                    member.isLegalGuardian ? "Responsável legal" : null,
                    member.isProvider ? "Provedor" : null,
                    contributesIncome ? "Contribui renda" : null,
                    member.isDependent ? "Dependente" : null,
                  ].filter(Boolean) as string[];
                  return (
                    <FamilyRow
                      key={member.id}
                      person={member.person}
                      relationType={relation?.type}
                      badges={badges}
                      onEdit={() => {
                        setEditing({ relation, member });
                        setEditOpen(true);
                      }}
                      onDelete={
                        relation ? () => handleDelete(relation.id) : undefined
                      }
                    />
                  );
                })
              ) : (
                <p className="text-xs text-muted-foreground">
                  Nenhum familiar registrado na residência.
                </p>
              )}
            </div>
          </section>
          <section className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                Não moram juntos
              </p>
            </div>
            <div className="space-y-1">
              {externalRelations.length ? (
                externalRelations.map((relation) => {
                  const badges = [
                    relation.isLegalGuardian ? "Responsável legal" : null,
                    incomeContributorIds.includes(relation.relatedPersonId)
                      ? "Contribui renda"
                      : null,
                  ].filter(Boolean) as string[];
                  return (
                    <FamilyRow
                      key={relation.id}
                      person={relation.relatedPerson}
                      relationType={relation.type}
                      badges={badges}
                      onEdit={() => {
                        setEditing({ relation });
                        setEditOpen(true);
                      }}
                      onDelete={() => handleDelete(relation.id)}
                    />
                  );
                })
              ) : (
                <p className="text-xs text-muted-foreground">
                  Nenhum familiar registrado fora da residência.
                </p>
              )}
            </div>
          </section>
        </div>
      </CardContent>
      <div className="flex flex-wrap items-center gap-2 border-t border-border/60 px-4 py-3 text-xs">
        <Badge variant="secondary">Moram juntos: {livingCount}</Badge>
        <Badge variant="secondary">Fora da residência: {externalCount}</Badge>
        <Badge variant="outline">Responsáveis legais: {guardiansCount}</Badge>
        <Badge variant="outline">Provedores: {providersCount}</Badge>
        <Badge variant="outline">Contribuem renda: {incomeCount}</Badge>
        <Badge variant="outline">Dependentes: {dependentsCount}</Badge>
        <Badge variant="outline">Vínculos totais: {totalRelations}</Badge>
      </div>
      {editing && (
        <RelationDialog
          title="Editar vínculo"
          description="Atualize as informações do familiar."
          peopleOptions={peopleOptions}
          initial={buildInitialForm(
            peopleOptions,
            editing.relation,
            editing.member,
          )}
          disabledRelated={Boolean(editing.member)}
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) setEditing(null);
          }}
          onSubmit={handleEditSave}
        />
      )}
    </Card>
  );
}
