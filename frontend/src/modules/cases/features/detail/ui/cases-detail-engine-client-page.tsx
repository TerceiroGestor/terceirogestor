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
import type { ApiCase, ApiCasePerson, ApiCaseReport } from "@/modules/cases/api";
import { addCasePerson, getCaseReport, removeCasePerson } from "@/modules/cases/api";
import { CASES_ROUTES, casesDetailModuleDefinition } from "@/modules/cases/config/cases-module-contract";
import {
  type CaseDetailDraft,
  type CasesDetailLayoutContext,
} from "@/modules/cases/config/cases-detail-layout-contract";
import { CASE_USAGE_TEXT } from "@/modules/cases/shared/domain/cases.constants";
import { CasePeoplePickerDialog } from "@/modules/cases/features/detail/ui/case-people-picker-dialog";
import { createRestDataProvider } from "@/web-client/data-provider";
import { DetailShellEngine } from "@/web-client/detail/DetailShellEngine";
import { useDetailAutoSaveController } from "@/web-client/detail/useDetailAutoSaveController";
import {
  canUseModuleAction,
  getModuleDetailEditingConfig,
  hasModulePermission,
} from "@/web-client/registry/module-utils";

function buildDraft(caseItem?: ApiCase | null): CaseDetailDraft {
  return {
    title: caseItem?.title ?? "",
    summary: caseItem?.summary ?? "",
    status: caseItem?.status ?? "ABERTO",
    closingNotes: caseItem?.closingNotes ?? "",
  };
}

function normalizeDraft(draft: CaseDetailDraft): CaseDetailDraft {
  return {
    title: draft.title.trim(),
    summary: draft.summary.trim(),
    status: draft.status,
    closingNotes: draft.closingNotes.trim(),
  };
}

function toPayload(draft: CaseDetailDraft) {
  const normalized = normalizeDraft(draft);
  return {
    title: normalized.title,
    summary: normalized.summary || null,
    status: normalized.status,
    closingNotes: normalized.closingNotes || null,
  };
}

export function CasesDetailEngineClientPage() {
  const params = useParams<{ id?: string }>();
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname) ?? "";

  const id = params?.id ? String(params.id) : "";
  const mode = id === "new" || pathname.endsWith("/cases/new") ? "create" : "edit";
  const isEdit = mode === "edit";

  const canRead = hasModulePermission(casesDetailModuleDefinition, "canRead", permissions);
  const canCreate = canUseModuleAction(casesDetailModuleDefinition, "create", permissions);
  const canEdit = canUseModuleAction(casesDetailModuleDefinition, "edit", permissions);
  const canAudit = canUseModuleAction(casesDetailModuleDefinition, "audit", permissions);

  const canAccessPage = mode === "create" ? canCreate : canRead;
  const dataProvider = React.useMemo(() => createRestDataProvider({ token }), [token]);

  const [caseItem, setCaseItem] = React.useState<ApiCase | null>(null);
  const [draft, setDraft] = React.useState<CaseDetailDraft>(buildDraft(null));
  const [loading, setLoading] = React.useState(isEdit);
  const [busy, setBusy] = React.useState(false);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [report, setReport] = React.useState<ApiCaseReport | null>(null);
  const [reportLoading, setReportLoading] = React.useState(false);
  const [auditVisibleCount, setAuditVisibleCount] = React.useState(24);

  const usageItems = React.useMemo(
    () => buildUsageDocumentationItems("cases-detail", CASE_USAGE_TEXT.detail.sections),
    [],
  );
  useRegisterUsageDocumentation({ title: CASE_USAGE_TEXT.detail.title, items: usageItems });

  const persistDraft = React.useCallback(
    async (nextDraft: CaseDetailDraft) => {
      const updated = await dataProvider.update<ApiCase>(
        casesDetailModuleDefinition.queryAdapters.detailDataProvider?.model ?? "cases.detail",
        id,
        toPayload(nextDraft),
      );
      const savedDraft = buildDraft(updated);
      setCaseItem(updated);
      setDraft(savedDraft);
      return savedDraft;
    },
    [dataProvider, id],
  );

  const autoSave = useDetailAutoSaveController<CaseDetailDraft>({
    draft,
    enabled: isEdit && canEdit,
    config: getModuleDetailEditingConfig(casesDetailModuleDefinition),
    normalizeDraft,
    onSave: persistDraft,
    onError: (error) => {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao salvar caso.";
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
      .read<ApiCase>("cases.detail", id)
      .then((loaded) => {
        const nextDraft = buildDraft(loaded);
        setCaseItem(loaded);
        setDraft(nextDraft);
        replaceSavedDraft(nextDraft);
      })
      .catch((error) => {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Falha ao carregar caso.";
        toast({ variant: "destructive", title: "Falha ao carregar", description: message });
      })
      .finally(() => setLoading(false));
  }, [canAccessPage, dataProvider, id, isEdit, replaceSavedDraft, toast, token]);

  React.useEffect(() => {
    if (!token || !isEdit || !id) {
      setReport(null);
      return;
    }
    setReportLoading(true);
    getCaseReport(token, id)
      .then(setReport)
      .catch(() => setReport(null))
      .finally(() => setReportLoading(false));
  }, [id, isEdit, token, caseItem?.attendances.length, caseItem?.occurrences.length]);

  const handleCreate = React.useCallback(async () => {
    if (!canCreate) return;
    const payload = toPayload(draft);
    if (!payload.title) {
      toast({ variant: "destructive", title: "Dados inválidos", description: "Informe o título do caso." });
      return;
    }
    setBusy(true);
    try {
      const created = await dataProvider.create<ApiCase>("cases.detail", payload);
      toast({ variant: "success", title: "Caso criado" });
      router.replace(withTenantPath(`${CASES_ROUTES.detail}/${created.id}`, tenantSlug));
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao criar caso.";
      toast({ variant: "destructive", title: "Falha ao criar", description: message });
    } finally {
      setBusy(false);
    }
  }, [canCreate, dataProvider, draft, router, tenantSlug, toast]);

  const handlePickPerson = React.useCallback(
    async (person: { id: string; fullName: string }) => {
      if (!token || !id) return;
      try {
        const updated = await addCasePerson(token, id, { personId: person.id });
        setCaseItem(updated);
        toast({ title: "Pessoa vinculada" });
      } catch (error) {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Falha ao vincular pessoa.";
        toast({ variant: "destructive", title: "Falha ao vincular", description: message });
      }
    },
    [id, toast, token],
  );

  const handleRemovePerson = React.useCallback(
    async (link: ApiCasePerson) => {
      if (!token || !id || !canEdit) return;
      const confirmed = await confirm({
        title: "Remover pessoa",
        description: `Remover "${link.person.fullName}" deste caso?`,
        confirmLabel: "Remover",
        cancelLabel: "Cancelar",
        confirmVariant: "destructive",
      });
      if (!confirmed) return;
      try {
        const updated = await removeCasePerson(token, id, link.id);
        setCaseItem(updated);
        toast({ title: "Pessoa removida" });
      } catch (error) {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Falha ao remover pessoa.";
        toast({ variant: "destructive", title: "Falha ao remover", description: message });
      }
    },
    [canEdit, confirm, id, toast, token],
  );

  const context = React.useMemo<CasesDetailLayoutContext>(
    () => ({
      mode,
      readOnly: mode === "create" ? !canCreate : !canEdit,
      canAudit,
      canEdit,
      tenantSlug,
      caseItem,
      draft,
      setDraft,
      onCommitField: (field, nextValue) => void commitField(field, nextValue),
      people: caseItem?.people ?? [],
      onOpenPerson: (personId) => router.push(withTenantPath(`/people/${personId}`, tenantSlug)),
      onAddPerson: () => setPickerOpen(true),
      onRemovePerson: (link) => void handleRemovePerson(link),
      report,
      reportLoading,
      onOpenOccurrence: (occurrenceId) => router.push(withTenantPath(`/occurrences/${occurrenceId}`, tenantSlug)),
      onOpenAttendance: (attendanceId) => router.push(withTenantPath(`/attendances/${attendanceId}`, tenantSlug)),
      auditVisibleCount,
      onAuditVisibleCountChange: setAuditVisibleCount,
    }),
    [
      auditVisibleCount,
      canAudit,
      canCreate,
      canEdit,
      caseItem,
      commitField,
      draft,
      handleRemovePerson,
      mode,
      report,
      reportLoading,
      router,
      tenantSlug,
    ],
  );

  if (!canAccessPage) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Sem permissão.</div>;
  }

  const headerTitle = mode === "create" ? "Novo caso" : caseItem?.title || draft.title || "Caso";

  return (
    <>
      <DetailShellEngine<CasesDetailLayoutContext>
        moduleDefinition={casesDetailModuleDefinition}
        context={context}
        dataProvider={dataProvider}
        auditEnabled={canAudit}
        mode={mode}
        headerTitle={headerTitle}
        saving={saving}
        loading={loading}
        readOnly={context.readOnly}
        onSave={mode === "create" ? handleCreate : undefined}
        onClose={() => router.push(withTenantPath(CASES_ROUTES.list, tenantSlug))}
        breadcrumbTitle={headerTitle}
        breadcrumbItems={[
          { label: "Casos", href: CASES_ROUTES.list },
          ...(mode === "edit" ? [{ label: headerTitle }] : []),
        ]}
      />
      {mode === "edit" && token ? (
        <CasePeoplePickerDialog open={pickerOpen} onOpenChange={setPickerOpen} onPick={handlePickPerson} />
      ) : null}
    </>
  );
}
