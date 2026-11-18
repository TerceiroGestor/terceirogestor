"use client";

import * as React from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRegisterUsageDocumentation } from "@/components/UsageDocumentation/UsageDocumentationProvider";
import { buildUsageDocumentationItems } from "@/components/UsageDocumentation/usage-documentation.helpers";
import { useConfirm } from "@/components/confirm/use-confirm";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import type { ApiOccurrence, ApiOccurrencePerson } from "@/modules/occurrences/api";
import { addOccurrencePerson, removeOccurrencePerson } from "@/modules/occurrences/api";
import {
  OCCURRENCES_ROUTES,
  occurrencesDetailModuleDefinition,
} from "@/modules/occurrences/config/occurrences-module-contract";
import {
  type OccurrenceDetailDraft,
  type OccurrencesDetailLayoutContext,
} from "@/modules/occurrences/config/occurrences-detail-layout-contract";
import { OCCURRENCE_USAGE_TEXT } from "@/modules/occurrences/shared/domain/occurrences.constants";
import { OccurrencePeoplePickerDialog } from "@/modules/occurrences/features/detail/ui/occurrence-people-picker-dialog";
import { createRestDataProvider } from "@/web-client/data-provider";
import { DetailShellEngine } from "@/web-client/detail/DetailShellEngine";
import { useDetailAutoSaveController } from "@/web-client/detail/useDetailAutoSaveController";
import {
  canUseModuleAction,
  getModuleDetailEditingConfig,
  hasModulePermission,
} from "@/web-client/registry/module-utils";

function buildDraft(occurrence?: ApiOccurrence | null, meetingId?: string | null): OccurrenceDetailDraft {
  return {
    meetingId: occurrence?.meetingId ?? meetingId ?? null,
    title: occurrence?.title ?? "",
    description: occurrence?.description ?? "",
    status: occurrence?.status ?? "REGISTRADA",
    outcomeNotes: occurrence?.outcomeNotes ?? "",
  };
}

function normalizeDraft(draft: OccurrenceDetailDraft): OccurrenceDetailDraft {
  return {
    meetingId: draft.meetingId,
    title: draft.title.trim(),
    description: draft.description.trim(),
    status: draft.status,
    outcomeNotes: draft.outcomeNotes.trim(),
  };
}

function toPayload(draft: OccurrenceDetailDraft) {
  const normalized = normalizeDraft(draft);
  return {
    meetingId: normalized.meetingId,
    title: normalized.title,
    description: normalized.description || null,
    status: normalized.status,
    outcomeNotes: normalized.outcomeNotes || null,
  };
}

export function OccurrencesDetailEngineClientPage() {
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname) ?? "";

  const id = params?.id ? String(params.id) : "";
  const mode = id === "new" || pathname.endsWith("/occurrences/new") ? "create" : "edit";
  const isEdit = mode === "edit";
  const prefillMeetingId = searchParams.get("meetingId");

  const canRead = hasModulePermission(occurrencesDetailModuleDefinition, "canRead", permissions);
  const canCreate = canUseModuleAction(occurrencesDetailModuleDefinition, "create", permissions);
  const canEdit = canUseModuleAction(occurrencesDetailModuleDefinition, "edit", permissions);
  const canAudit = canUseModuleAction(occurrencesDetailModuleDefinition, "audit", permissions);

  const canAccessPage = mode === "create" ? canCreate : canRead;
  const dataProvider = React.useMemo(() => createRestDataProvider({ token }), [token]);

  const [occurrence, setOccurrence] = React.useState<ApiOccurrence | null>(null);
  const [draft, setDraft] = React.useState<OccurrenceDetailDraft>(buildDraft(null, prefillMeetingId));
  const [loading, setLoading] = React.useState(isEdit);
  const [busy, setBusy] = React.useState(false);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [auditVisibleCount, setAuditVisibleCount] = React.useState(24);

  const usageItems = React.useMemo(
    () => buildUsageDocumentationItems("occurrences-detail", OCCURRENCE_USAGE_TEXT.detail.sections),
    [],
  );

  useRegisterUsageDocumentation({
    title: OCCURRENCE_USAGE_TEXT.detail.title,
    items: usageItems,
  });

  const persistDraft = React.useCallback(
    async (nextDraft: OccurrenceDetailDraft) => {
      const updated = await dataProvider.update<ApiOccurrence>(
        occurrencesDetailModuleDefinition.queryAdapters.detailDataProvider?.model ?? "occurrences.detail",
        id,
        toPayload(nextDraft),
      );
      const savedDraft = buildDraft(updated);
      setOccurrence(updated);
      setDraft(savedDraft);
      return savedDraft;
    },
    [dataProvider, id, setOccurrence],
  );

  const autoSave = useDetailAutoSaveController<OccurrenceDetailDraft>({
    draft,
    enabled: isEdit && canEdit,
    config: getModuleDetailEditingConfig(occurrencesDetailModuleDefinition),
    normalizeDraft,
    onSave: persistDraft,
    onError: (error) => {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao salvar ocorrência.";
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
      .read<ApiOccurrence>("occurrences.detail", id)
      .then((loaded) => {
        const nextDraft = buildDraft(loaded);
        setOccurrence(loaded);
        setDraft(nextDraft);
        replaceSavedDraft(nextDraft);
      })
      .catch((error) => {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Falha ao carregar ocorrência.";
        toast({ variant: "destructive", title: "Falha ao carregar", description: message });
      })
      .finally(() => setLoading(false));
  }, [canAccessPage, dataProvider, id, isEdit, replaceSavedDraft, toast, token]);

  const handleCreate = React.useCallback(async () => {
    if (!canCreate) return;
    const payload = toPayload(draft);
    if (!payload.title) {
      toast({ variant: "destructive", title: "Dados inválidos", description: "Informe o título da ocorrência." });
      return;
    }

    setBusy(true);
    try {
      const created = await dataProvider.create<ApiOccurrence>("occurrences.detail", payload);
      toast({ variant: "success", title: "Ocorrência criada" });
      router.replace(withTenantPath(`${OCCURRENCES_ROUTES.detail}/${created.id}`, tenantSlug));
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao criar ocorrência.";
      toast({ variant: "destructive", title: "Falha ao criar", description: message });
    } finally {
      setBusy(false);
    }
  }, [canCreate, dataProvider, draft, router, tenantSlug, toast]);

  const handleAddPerson = React.useCallback(() => {
    setPickerOpen(true);
  }, []);

  const handlePickPerson = React.useCallback(
    async (person: { id: string; fullName: string }, role: "ENVOLVIDO" | "TESTEMUNHA") => {
      if (!token || !id) return;
      try {
        const updated = await addOccurrencePerson(token, id, { personId: person.id, role });
        setOccurrence(updated);
        toast({ title: "Pessoa adicionada" });
      } catch (error) {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Falha ao adicionar pessoa.";
        toast({ variant: "destructive", title: "Falha ao adicionar", description: message });
      }
    },
    [id, toast, token, setOccurrence],
  );

  const handleRemovePerson = React.useCallback(
    async (link: ApiOccurrencePerson) => {
      if (!token || !id || !canEdit) return;
      const confirmed = await confirm({
        title: "Remover pessoa",
        description: `Remover "${link.person.fullName}" desta ocorrência?`,
        confirmLabel: "Remover",
        cancelLabel: "Cancelar",
        confirmVariant: "destructive",
      });
      if (!confirmed) return;
      try {
        const updated = await removeOccurrencePerson(token, id, link.id);
        setOccurrence(updated);
        toast({ title: "Pessoa removida" });
      } catch (error) {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Falha ao remover pessoa.";
        toast({ variant: "destructive", title: "Falha ao remover", description: message });
      }
    },
    [canEdit, confirm, id, toast, token, setOccurrence],
  );

  const context = React.useMemo<OccurrencesDetailLayoutContext>(
    () => ({
      mode,
      readOnly: mode === "create" ? !canCreate : !canEdit,
      canAudit,
      canEdit,
      tenantSlug,
      occurrence,
      draft,
      setDraft,
      people: occurrence?.people ?? [],
      peopleLoading: false,
      onCommitField: (field, nextValue) => void commitField(field, nextValue),
      onOpenPerson: (personId) => router.push(withTenantPath(`/people/${personId}`, tenantSlug)),
      onAddPerson: handleAddPerson,
      onRemovePerson: (link) => void handleRemovePerson(link),
      auditVisibleCount,
      onAuditVisibleCountChange: setAuditVisibleCount,
    }),
    [
      auditVisibleCount,
      canAudit,
      canCreate,
      canEdit,
      commitField,
      draft,
      handleAddPerson,
      handleRemovePerson,
      mode,
      occurrence,
      router,
      tenantSlug,
    ],
  );

  if (!canAccessPage) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Sem permissão.</div>;
  }

  const headerTitle = mode === "create" ? "Nova ocorrência" : occurrence?.title || draft.title || "Ocorrência";

  return (
    <>
      <DetailShellEngine<OccurrencesDetailLayoutContext>
        moduleDefinition={occurrencesDetailModuleDefinition}
        context={context}
        dataProvider={dataProvider}
        auditEnabled={canAudit}
        mode={mode}
        headerTitle={headerTitle}
        saving={saving}
        loading={loading}
        readOnly={context.readOnly}
        onSave={mode === "create" ? handleCreate : undefined}
        onClose={() => router.push(withTenantPath(OCCURRENCES_ROUTES.list, tenantSlug))}
        breadcrumbTitle={headerTitle}
        breadcrumbItems={[
          { label: "Ocorrências", href: OCCURRENCES_ROUTES.list },
          ...(mode === "edit" ? [{ label: headerTitle }] : []),
        ]}
      />
      {mode === "edit" && token ? (
        <OccurrencePeoplePickerDialog open={pickerOpen} onOpenChange={setPickerOpen} onPick={handlePickPerson} />
      ) : null}
    </>
  );
}
