"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { resolveMediaUrl } from "@/lib/api";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { useFamilyRelations } from "@/modules/people/features/family-members/data/use-family-relations";
import {
  FamilyRelationForm,
  type FamilyRelationFormValues,
} from "@/modules/people/features/family-members/ui/family-relation-form";
import type { HouseholdMember, PersonRelation } from "@/modules/people/shared/domain/types";
import {
  buildPeopleDetailTabPath,
  buildPeopleFamilyRelationPath,
} from "@/modules/people/shared/domain/people-relation-routes";
import { getInitials } from "@/modules/people/shared/domain/utils";
import { PeopleRelationDetailShell } from "@/modules/people/shared/ui/people-relation-detail-shell";
import { useDetailAutoSaveController } from "@/web-client/detail/useDetailAutoSaveController";
import type { AuditFeedConfig, DetailEditingConfig } from "@/web-client/registry/types";

function initialFormValues(
  relation?: PersonRelation | null,
  householdMember?: HouseholdMember | null,
): FamilyRelationFormValues {
  return {
    relatedPersonId: relation?.relatedPersonId ?? householdMember?.personId ?? "",
    type: relation?.type ?? "",
    livesTogether: relation?.livesTogether ?? Boolean(householdMember),
    isLegalGuardian:
      relation?.isLegalGuardian ?? householdMember?.isLegalGuardian ?? false,
    isHouseholdHead: householdMember?.isHouseholdHead ?? false,
    householdRole: householdMember?.role ?? "",
    isIncomeContributor: householdMember?.isIncomeContributor ?? false,
    isProvider: householdMember?.isProvider ?? false,
    isDependent: householdMember?.isDependent ?? false,
    notes: relation?.notes ?? "",
  };
}

const AUTO_EDITING: DetailEditingConfig = {
  saveMode: "auto",
  autoSave: { trigger: "field-commit" },
};

const FAMILY_RELATION_AUDIT_CONFIG: AuditFeedConfig<{ relationId: string }> = {
  primaryEntity: {
    key: "family-relation",
    entity: "PersonRelation",
    model: "audit.logs",
    label: "Vinculo familiar",
    fieldLabels: {
      type: "Tipo de vinculo",
      livesTogether: "Mora junto",
      isLegalGuardian: "Responsavel legal",
      isHouseholdHead: "Responsavel principal",
      householdRole: "Papel no domicilio",
      isIncomeContributor: "Contribui renda",
      isProvider: "Provedor",
      isDependent: "Dependente",
      notes: "Notas",
    },
    resolveEntityId: ({ relationId }) => relationId,
  },
  filters: { entity: "PersonRelation" },
  sort: [{ field: "createdAt", direction: "desc" }],
  pagination: { limit: 120 },
};

export function FamilyRelationDetailPage({ mode }: { mode: "create" | "edit" }) {
  const params = useParams<{ id?: string; relationId?: string }>();
  const personId = String(params?.id ?? "");
  const relationId = mode === "edit" ? String(params?.relationId ?? "") : "";
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const { data, peopleOptions, detailedLoading, detailedError, create, update } =
    useFamilyRelations(personId, {
      autoLoad: true,
      initialMode: "detailed",
    });

  const current = React.useMemo(
    () => data?.relations.find((item) => item.id === relationId) ?? null,
    [data, relationId],
  );
  const currentMember = React.useMemo(
    () =>
      data?.householdMembers.find(
        (member) => member.personId === current?.relatedPersonId,
      ) ?? null,
    [current, data],
  );
  const createInitialValues = React.useMemo(() => initialFormValues(), []);
  const backHref = withTenantPath(buildPeopleDetailTabPath(personId, "familia"), tenantSlug);

  const [draft, setDraft] = React.useState<FamilyRelationFormValues>(createInitialValues);
  const relationIdRef = React.useRef<string | null>(relationId || null);
  const { saving, replaceSavedDraft, commitDraft } = useDetailAutoSaveController({
    draft,
    enabled: true,
    config: AUTO_EDITING,
    normalizeDraft: (values) => ({
      ...values,
      relatedPersonId: values.relatedPersonId,
      type: values.type.trim(),
      householdRole: values.householdRole.trim(),
      notes: values.notes.trim(),
    }),
    onSave: async (values) => {
      if (!values.relatedPersonId || !values.type.trim()) return values;
      const payload = {
        relatedPersonId: values.relatedPersonId,
        type: values.type.trim(),
        livesTogether: values.livesTogether,
        isLegalGuardian: values.isLegalGuardian,
        isHouseholdHead: values.livesTogether ? values.isHouseholdHead : false,
        householdRole: values.livesTogether ? values.householdRole.trim() || null : null,
        isIncomeContributor: values.livesTogether ? values.isIncomeContributor : false,
        isProvider: values.livesTogether ? values.isProvider : false,
        isDependent: values.livesTogether ? values.isDependent : false,
        notes: values.notes.trim() || null,
      };
      if (!relationIdRef.current) {
        const created = await create(payload);
        if (!created) return values;
        relationIdRef.current = created.id;
        router.replace(
          withTenantPath(buildPeopleFamilyRelationPath(personId, created.id), tenantSlug),
        );
        return initialFormValues(created, null);
      }
      const updated = await update(relationIdRef.current, payload);
      return initialFormValues(updated ?? current, currentMember);
    },
  });

  React.useEffect(() => {
    if (mode !== "edit" || !current) return;
    const nextDraft = initialFormValues(current, currentMember);
    relationIdRef.current = current.id;
    setDraft(nextDraft);
    replaceSavedDraft(nextDraft);
  }, [current, currentMember, mode, replaceSavedDraft]);

  const handleValuesChange = React.useCallback((values: FamilyRelationFormValues) => {
    setDraft(values);
  }, []);

  const handleFieldCommit = React.useCallback(
    (values: FamilyRelationFormValues) => {
      setDraft(values);
      commitDraft(values);
    },
    [commitDraft],
  );

  const relatedPerson = current?.relatedPerson ?? null;
  const relatedPersonHref = relatedPerson
    ? withTenantPath(`/people/${relatedPerson.id}`, tenantSlug)
    : null;
  const headerTitleSlot = relatedPerson ? (
    <Avatar className="size-12 border border-border/60">
      <AvatarImage
        src={resolveMediaUrl(relatedPerson.avatarUrl || "/avatar.jpg")}
        alt={relatedPerson.fullName}
      />
      <AvatarFallback>{getInitials(relatedPerson.fullName)}</AvatarFallback>
    </Avatar>
  ) : null;

  return (
    <PeopleRelationDetailShell
      personId={personId}
      tab="familia"
      title={
        mode === "create"
          ? "Novo vinculo familiar"
          : current?.relatedPerson.fullName ?? "Vinculo familiar"
      }
      subtitle="Gerencie os dados completos do vinculo familiar."
      mode={mode}
      saving={saving}
      headerTitleSlot={headerTitleSlot}
      headerActionsSlot={
        relatedPersonHref ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={relatedPersonHref}>
              Abrir pessoa
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        ) : undefined
      }
      relationId={relationIdRef.current}
      auditConfig={FAMILY_RELATION_AUDIT_CONFIG}
      notes={draft.notes}
    >
      {detailedError ? <div className="text-sm text-destructive">{detailedError}</div> : null}
      {mode === "edit" && detailedLoading && !current ? (
        <div className="text-sm text-muted-foreground">Carregando vinculo...</div>
      ) : null}
      {mode === "edit" && !detailedLoading && !current ? (
        <div className="text-sm text-muted-foreground">Vinculo nao encontrado.</div>
      ) : null}
      {mode === "create" || current ? (
        <FamilyRelationForm
          initialValues={mode === "create" ? createInitialValues : initialFormValues(current, currentMember)}
          peopleOptions={peopleOptions}
          disableRelatedPerson={mode === "edit"}
          onValuesChange={handleValuesChange}
          onFieldCommit={handleFieldCommit}
          onSubmit={() => undefined}
        />
      ) : null}
    </PeopleRelationDetailShell>
  );
}
