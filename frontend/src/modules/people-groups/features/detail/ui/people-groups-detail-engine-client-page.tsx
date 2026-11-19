"use client";

import * as React from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useRegisterUsageDocumentation } from "@/components/UsageDocumentation/UsageDocumentationProvider";
import { buildUsageDocumentationItems } from "@/components/UsageDocumentation/usage-documentation.helpers";
import { useConfirm } from "@/components/confirm/use-confirm";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import type {
  ApiPeopleGroup,
  ApiPeopleGroupParticipation,
} from "@/modules/people-groups/api";
import {
  createPeopleGroupParticipation,
  endPeopleGroupParticipation,
  listPeopleGroupParticipations,
} from "@/modules/people-groups/api";
import {
  PEOPLE_GROUPS_ROUTES,
  peopleGroupsDetailModuleDefinition,
} from "@/modules/people-groups/config/people-groups-module-contract";
import { PEOPLE_GROUP_USAGE_TEXT } from "@/modules/people-groups/shared/domain/people-groups.constants";
import {
  type PeopleGroupDetailDraft,
  type PeopleGroupsDetailLayoutContext,
} from "@/modules/people-groups/config/people-groups-detail-layout-contract";
import { PeopleGroupPeoplePickerDialog } from "@/modules/people-groups/features/detail/ui/people-group-people-picker-dialog";
import { createRestDataProvider } from "@/web-client/data-provider";
import { DetailShellEngine } from "@/web-client/detail/DetailShellEngine";
import { useDetailAutoSaveController } from "@/web-client/detail/useDetailAutoSaveController";
import {
  canUseModuleAction,
  getModuleDetailEditingConfig,
  hasModulePermission,
} from "@/web-client/registry/module-utils";

function buildDraft(group?: ApiPeopleGroup | null): PeopleGroupDetailDraft {
  return {
    name: group?.name ?? "",
    groupType: group?.groupType ?? "SEGMENT",
    purpose: group?.purpose ?? "PUBLICO",
    category: group?.category ?? "",
    description: group?.description ?? "",
    ageMin: group?.ageMin != null ? String(group.ageMin) : "",
    ageMax: group?.ageMax != null ? String(group.ageMax) : "",
    isActive: group?.isActive ?? true,
    internalNotes: group?.internalNotes ?? null,
  };
}

function normalizeDraft(draft: PeopleGroupDetailDraft): PeopleGroupDetailDraft {
  return {
    name: draft.name.trim(),
    groupType: draft.groupType,
    purpose: draft.purpose,
    category: draft.category.trim(),
    description: draft.description.trim(),
    ageMin: draft.ageMin.trim(),
    ageMax: draft.ageMax.trim(),
    isActive: draft.isActive,
    internalNotes: draft.internalNotes?.trim() ? draft.internalNotes.trim() : null,
  };
}

function toPayload(draft: PeopleGroupDetailDraft) {
  const normalized = normalizeDraft(draft);
  return {
    name: normalized.name,
    groupType: normalized.groupType,
    purpose: normalized.purpose,
    category: normalized.category || null,
    description: normalized.description || null,
    ageMin: normalized.ageMin ? Number(normalized.ageMin) : null,
    ageMax: normalized.ageMax ? Number(normalized.ageMax) : null,
    isActive: normalized.isActive,
    internalNotes: normalized.internalNotes,
  };
}

export function PeopleGroupsDetailEngineClientPage() {
  const params = useParams<{ id?: string }>();
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname) ?? "";

  const id = params?.id ? String(params.id) : "";
  const mode = id === "new" || pathname.endsWith("/people-groups/new") ? "create" : "edit";
  const isEdit = mode === "edit";

  const canRead = hasModulePermission(peopleGroupsDetailModuleDefinition, "canRead", permissions);
  const canCreate = canUseModuleAction(peopleGroupsDetailModuleDefinition, "create", permissions);
  const canEdit = canUseModuleAction(peopleGroupsDetailModuleDefinition, "edit", permissions);
  const canAudit = canUseModuleAction(peopleGroupsDetailModuleDefinition, "audit", permissions);

  const canAccessPage = mode === "create" ? canCreate : canRead;
  const canManageParticipations = canEdit;
  const dataProvider = React.useMemo(() => createRestDataProvider({ token }), [token]);

  const [group, setGroup] = React.useState<ApiPeopleGroup | null>(null);
  const [draft, setDraft] = React.useState<PeopleGroupDetailDraft>(buildDraft());
  const [participations, setParticipations] = React.useState<ApiPeopleGroupParticipation[]>([]);
  const [historyParticipations, setHistoryParticipations] = React.useState<ApiPeopleGroupParticipation[]>([]);
  const [loading, setLoading] = React.useState(isEdit);
  const [participationsLoading, setParticipationsLoading] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [auditVisibleCount, setAuditVisibleCount] = React.useState(24);

  const usageItems = React.useMemo(
    () => buildUsageDocumentationItems("people-groups-detail", PEOPLE_GROUP_USAGE_TEXT.detail.sections),
    [],
  );

  useRegisterUsageDocumentation({
    title: PEOPLE_GROUP_USAGE_TEXT.detail.title,
    items: usageItems,
  });

  const loadParticipations = React.useCallback(async () => {
    if (!token || !isEdit || !id || !canRead) {
      setParticipations([]);
      setHistoryParticipations([]);
      return;
    }
    setParticipationsLoading(true);
    try {
      const response = await listPeopleGroupParticipations(token, id, {
        page: 1,
        limit: 200,
        all: true,
      });
      const active = response.data.filter((participation) => participation.isActive && !participation.deletedAt);
      const history = response.data.filter((participation) => !participation.isActive || Boolean(participation.deletedAt));
      setParticipations(active);
      setHistoryParticipations(history);
    } catch {
      setParticipations([]);
      setHistoryParticipations([]);
    } finally {
      setParticipationsLoading(false);
    }
  }, [canRead, id, isEdit, token]);

  const persistDraft = React.useCallback(
    async (nextDraft: PeopleGroupDetailDraft) => {
      const updated = await dataProvider.update<ApiPeopleGroup>(
        peopleGroupsDetailModuleDefinition.queryAdapters.detailDataProvider?.model ??
        "people-groups.detail",
        id,
        toPayload(nextDraft),
      );
      const savedDraft = buildDraft(updated);
      setGroup(updated);
      setDraft(savedDraft);
      return savedDraft;
    },
    [dataProvider, id],
  );

  const autoSave = useDetailAutoSaveController<PeopleGroupDetailDraft>({
    draft,
    enabled: isEdit && canEdit,
    config: getModuleDetailEditingConfig(peopleGroupsDetailModuleDefinition),
    normalizeDraft,
    onSave: persistDraft,
    onError: (error) => {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao salvar Grupos.";
      toast({ variant: "destructive", title: "Falha ao salvar", description: message });
    },
  });
  const { saving: autoSaving, replaceSavedDraft, commitField } = autoSave;
  const saving = busy || autoSaving;

  React.useEffect(() => {
    setAuditVisibleCount(24);
  }, [id, mode]);

  React.useEffect(() => {
    if (!token || !canAccessPage || !isEdit || !id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    dataProvider
      .read<ApiPeopleGroup>("people-groups.detail", id)
      .then((loaded) => {
        const nextDraft = buildDraft(loaded);
        setGroup(loaded);
        setDraft(nextDraft);
        replaceSavedDraft(nextDraft);
      })
      .catch((error) => {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Falha ao carregar Grupos.";
        toast({ variant: "destructive", title: "Falha ao carregar", description: message });
      })
      .finally(() => setLoading(false));
  }, [canAccessPage, dataProvider, id, isEdit, replaceSavedDraft, toast, token]);

  React.useEffect(() => {
    void loadParticipations();
  }, [loadParticipations]);

  const handleCreate = React.useCallback(async () => {
    if (!canCreate) return;
    const payload = toPayload(draft);
    if (!payload.name) {
      toast({
        variant: "destructive",
        title: "Dados inválidos",
        description: "Informe o nome do Grupos.",
      });
      return;
    }

    setBusy(true);
    try {
      const created = await dataProvider.create<ApiPeopleGroup>(
        "people-groups.detail",
        payload,
      );
      toast({ variant: "success", title: "Grupos criado" });
      router.replace(withTenantPath(`${PEOPLE_GROUPS_ROUTES.detail}/${created.id}`, tenantSlug));
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao criar Grupos.";
      toast({ variant: "destructive", title: "Falha ao criar", description: message });
    } finally {
      setBusy(false);
    }
  }, [canCreate, dataProvider, draft, router, tenantSlug, toast]);

  const handleCreateParticipation = React.useCallback(() => {
    setPickerOpen(true);
  }, []);

  const handlePickPerson = React.useCallback(
    async (person: { id: string; fullName: string }) => {
      if (!token || !id) return;
      try {
        await createPeopleGroupParticipation(token, id, { personId: person.id });
        toast({ title: "Participante adicionado" });
        await loadParticipations();
      } catch (error) {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Falha ao adicionar participante ao Grupos.";
        toast({ variant: "destructive", title: "Falha ao adicionar", description: message });
      }
    },
    [id, loadParticipations, toast, token],
  );

  const handleBulkPickPeople = React.useCallback(
    async (people: Array<{ id: string; fullName: string }>) => {
      if (!token || !id || people.length === 0) return;

      let added = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const person of people) {
        try {
          await createPeopleGroupParticipation(token, id, { personId: person.id });
          added += 1;
        } catch (error) {
          failed += 1;
          const message =
            error && typeof error === "object" && "message" in error
              ? String((error as { message?: string }).message)
              : "Falha ao adicionar participante ao Grupos.";
          errors.push(`${person.fullName}: ${message}`);
        }
      }

      if (added > 0 || failed === 0) {
        toast({
          title: added === 1 ? "Participante adicionado" : "Participantes adicionados",
          description:
            failed > 0
              ? `${added} adicionados e ${failed} com erro.`
              : `${added} adicionados.`,
          variant: failed > 0 ? "destructive" : "default",
        });
      }

      if (failed > 0 && added === 0) {
        toast({
          variant: "destructive",
          title: "Falha ao adicionar",
          description: errors.slice(0, 3).join(" | "),
        });
      }

      await loadParticipations();
    },
    [id, loadParticipations, toast, token],
  );

  const handleEndParticipation = React.useCallback(
    async (participation: ApiPeopleGroupParticipation) => {
      if (!token || !id || !canManageParticipations) return;
      const confirmed = await confirm({
        title: "Encerrar vínculo",
        description: `Encerrar o vínculo de "${participation.person.fullName}" com este Grupos preservando o histórico?`,
        confirmLabel: "Encerrar",
        cancelLabel: "Cancelar",
        confirmVariant: "destructive",
      });
      if (!confirmed) return;
      try {
        await endPeopleGroupParticipation(token, id, participation.id);
        toast({ title: "Vínculo encerrado" });
        await loadParticipations();
      } catch (error) {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Falha ao encerrar vínculo.";
        toast({ variant: "destructive", title: "Falha ao encerrar", description: message });
      }
    },
    [canManageParticipations, confirm, id, loadParticipations, toast, token],
  );

  const context = React.useMemo<PeopleGroupsDetailLayoutContext>(
    () => ({
      mode,
      readOnly: mode === "create" ? !canCreate : !canEdit,
      canAudit,
      canEdit,
      canManageParticipations,
      tenantSlug,
      group,
      draft,
      setDraft,
      participations,
      historyParticipations,
      participationsLoading,
      onCommitField: (field, nextValue) => void commitField(field, nextValue),
      onNotesChange: (next) => setDraft((previous) => ({ ...previous, internalNotes: next })),
      onNotesBlur: () => void commitField("internalNotes"),
      onOpenPerson: (personId) => router.push(withTenantPath(`/people/${personId}`, tenantSlug)),
      onCreateParticipation: handleCreateParticipation,
      onEndParticipation: handleEndParticipation,
      auditVisibleCount,
      onAuditVisibleCountChange: setAuditVisibleCount,
    }),
    [
      auditVisibleCount,
      canAudit,
      canCreate,
      canEdit,
      canManageParticipations,
      commitField,
      draft,
      handleCreateParticipation,
      handleEndParticipation,
      participations,
      historyParticipations,
      participationsLoading,
      mode,
      router,
      group,
      tenantSlug,
    ],
  );

  if (!canAccessPage) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Sem permissão.</div>;
  }

  const headerTitle =
    mode === "create"
      ? "Novo Grupos"
      : group?.name || draft.name || "Grupos";

  return (
    <>
      <DetailShellEngine<PeopleGroupsDetailLayoutContext>
        moduleDefinition={peopleGroupsDetailModuleDefinition}
        context={context}
        dataProvider={dataProvider}
        auditEnabled={canAudit}
        mode={mode}
        headerTitle={headerTitle}
        saving={saving}
        loading={loading}
        readOnly={context.readOnly}
        onSave={mode === "create" ? handleCreate : undefined}
        onClose={() => router.push(withTenantPath(PEOPLE_GROUPS_ROUTES.list, tenantSlug))}
        breadcrumbTitle={headerTitle}
        breadcrumbItems={[
          { label: "Grupos", href: PEOPLE_GROUPS_ROUTES.list },
          ...(mode === "edit" ? [{ label: headerTitle }] : []),
        ]}
      />
      {mode === "edit" && token ? (
        <PeopleGroupPeoplePickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onPick={handlePickPerson}
          onBulkPick={handleBulkPickPeople}
        />
      ) : null}
    </>
  );
}
