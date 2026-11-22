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
import type { ApiAttendance, ApiAttendanceBenefit, ApiAttendanceEvolution, ApiAttendancePerson } from "@/modules/attendances/api";
import {
  addAttendanceBenefit,
  addAttendanceEvolution,
  addAttendancePerson,
  removeAttendanceBenefit,
  removeAttendanceEvolution,
  removeAttendancePerson,
} from "@/modules/attendances/api";
import {
  ATTENDANCES_ROUTES,
  attendancesDetailModuleDefinition,
} from "@/modules/attendances/config/attendances-module-contract";
import {
  type AttendanceDetailDraft,
  type AttendancesDetailLayoutContext,
} from "@/modules/attendances/config/attendances-detail-layout-contract";
import {
  ATTENDANCE_TYPE_LABELS,
  ATTENDANCE_USAGE_TEXT,
} from "@/modules/attendances/shared/domain/attendances.constants";
import {
  buildAttendanceBenefitPath,
  buildAttendanceEvolutionPath,
} from "@/modules/attendances/shared/domain/attendance-relation-routes";
import { AttendancePeoplePickerDialog } from "@/modules/attendances/features/detail/ui/attendance-people-picker-dialog";
import { AttendanceProfessionalPickerDialog } from "@/modules/attendances/features/detail/ui/attendance-professional-picker-dialog";
import { createRestDataProvider } from "@/web-client/data-provider";
import { DetailShellEngine } from "@/web-client/detail/DetailShellEngine";
import { useDetailAutoSaveController } from "@/web-client/detail/useDetailAutoSaveController";
import {
  canUseModuleAction,
  getModuleDetailEditingConfig,
  hasModulePermission,
} from "@/web-client/registry/module-utils";

function buildDraft(attendance?: ApiAttendance | null, occurrenceId?: string | null): AttendanceDetailDraft {
  return {
    type: attendance?.type ?? "SOCIAL",
    scheduledDate: attendance?.scheduledDate ? attendance.scheduledDate.slice(0, 10) : "",
    professionalId: attendance?.professionalId ?? "",
    occurrenceId: attendance?.occurrenceId ?? occurrenceId ?? null,
    status: attendance?.status ?? "ABERTO",
    notes: attendance?.notes ?? "",
    closingNotes: attendance?.closingNotes ?? "",
  };
}

function normalizeDraft(draft: AttendanceDetailDraft): AttendanceDetailDraft {
  return {
    type: draft.type,
    scheduledDate: draft.scheduledDate,
    professionalId: draft.professionalId,
    occurrenceId: draft.occurrenceId,
    status: draft.status,
    notes: draft.notes.trim(),
    closingNotes: draft.closingNotes.trim(),
  };
}

function toPayload(draft: AttendanceDetailDraft) {
  const normalized = normalizeDraft(draft);
  return {
    type: normalized.type,
    scheduledDate: normalized.scheduledDate,
    professionalId: normalized.professionalId,
    occurrenceId: normalized.occurrenceId,
    status: normalized.status,
    notes: normalized.notes || null,
    closingNotes: normalized.closingNotes || null,
  };
}

export function AttendancesDetailEngineClientPage() {
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
  const mode = id === "new" || pathname.endsWith("/attendances/new") ? "create" : "edit";
  const isEdit = mode === "edit";
  const prefillOccurrenceId = searchParams.get("occurrenceId");

  const canRead = hasModulePermission(attendancesDetailModuleDefinition, "canRead", permissions);
  const canCreate = canUseModuleAction(attendancesDetailModuleDefinition, "create", permissions);
  const canEdit = canUseModuleAction(attendancesDetailModuleDefinition, "edit", permissions);
  const canAudit = canUseModuleAction(attendancesDetailModuleDefinition, "audit", permissions);

  const canAccessPage = mode === "create" ? canCreate : canRead;
  const dataProvider = React.useMemo(() => createRestDataProvider({ token }), [token]);

  const [attendance, setAttendance] = React.useState<ApiAttendance | null>(null);
  const [draft, setDraft] = React.useState<AttendanceDetailDraft>(buildDraft(null, prefillOccurrenceId));
  const [professionalName, setProfessionalName] = React.useState("");
  const [loading, setLoading] = React.useState(isEdit);
  const [busy, setBusy] = React.useState(false);
  const [peoplePickerOpen, setPeoplePickerOpen] = React.useState(false);
  const [professionalPickerOpen, setProfessionalPickerOpen] = React.useState(false);
  const [auditVisibleCount, setAuditVisibleCount] = React.useState(24);

  const usageItems = React.useMemo(
    () => buildUsageDocumentationItems("attendances-detail", ATTENDANCE_USAGE_TEXT.detail.sections),
    [],
  );

  useRegisterUsageDocumentation({
    title: ATTENDANCE_USAGE_TEXT.detail.title,
    items: usageItems,
  });

  const persistDraft = React.useCallback(
    async (nextDraft: AttendanceDetailDraft) => {
      const updated = await dataProvider.update<ApiAttendance>(
        attendancesDetailModuleDefinition.queryAdapters.detailDataProvider?.model ?? "attendances.detail",
        id,
        toPayload(nextDraft),
      );
      const savedDraft = buildDraft(updated);
      setAttendance(updated);
      setProfessionalName(updated.professional.fullName);
      setDraft(savedDraft);
      return savedDraft;
    },
    [dataProvider, id, setAttendance],
  );

  const autoSave = useDetailAutoSaveController<AttendanceDetailDraft>({
    draft,
    enabled: isEdit && canEdit,
    config: getModuleDetailEditingConfig(attendancesDetailModuleDefinition),
    normalizeDraft,
    onSave: persistDraft,
    onError: (error) => {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao salvar atendimento.";
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
      .read<ApiAttendance>("attendances.detail", id)
      .then((loaded) => {
        const nextDraft = buildDraft(loaded);
        setAttendance(loaded);
        setProfessionalName(loaded.professional.fullName);
        setDraft(nextDraft);
        replaceSavedDraft(nextDraft);
      })
      .catch((error) => {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Falha ao carregar atendimento.";
        toast({ variant: "destructive", title: "Falha ao carregar", description: message });
      })
      .finally(() => setLoading(false));
  }, [canAccessPage, dataProvider, id, isEdit, replaceSavedDraft, toast, token]);

  const handleCreate = React.useCallback(async () => {
    if (!canCreate) return;
    const payload = toPayload(draft);
    if (!payload.type || !payload.scheduledDate || !payload.professionalId) {
      toast({
        variant: "destructive",
        title: "Dados inválidos",
        description: "Informe tipo, data e profissional responsável.",
      });
      return;
    }

    setBusy(true);
    try {
      const created = await dataProvider.create<ApiAttendance>("attendances.detail", payload);
      toast({ variant: "success", title: "Atendimento criado" });
      router.replace(withTenantPath(`${ATTENDANCES_ROUTES.detail}/${created.id}`, tenantSlug));
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao criar atendimento.";
      toast({ variant: "destructive", title: "Falha ao criar", description: message });
    } finally {
      setBusy(false);
    }
  }, [canCreate, dataProvider, draft, router, tenantSlug, toast]);

  const handlePickProfessional = React.useCallback(
    async (person: { id: string; fullName: string }) => {
      setDraft((previous) => ({ ...previous, professionalId: person.id }));
      setProfessionalName(person.fullName);
      setProfessionalPickerOpen(false);
      if (isEdit) {
        commitField("professionalId", person.id);
      }
    },
    [commitField, isEdit],
  );

  const handleAddPerson = React.useCallback(() => {
    setPeoplePickerOpen(true);
  }, []);

  const handlePickPerson = React.useCallback(
    async (
      person: { id: string; fullName: string },
      role: "ATENDIDO_PRINCIPAL" | "ATENDIDO_SECUNDARIO" | "FAMILIAR",
    ) => {
      if (!token || !id) return;
      try {
        const updated = await addAttendancePerson(token, id, { personId: person.id, role });
        setAttendance(updated);
        toast({ title: "Pessoa adicionada" });
      } catch (error) {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Falha ao adicionar pessoa.";
        toast({ variant: "destructive", title: "Falha ao adicionar", description: message });
      }
    },
    [id, setAttendance, toast, token],
  );

  const handleRemovePerson = React.useCallback(
    async (link: ApiAttendancePerson) => {
      if (!token || !id || !canEdit) return;
      const confirmed = await confirm({
        title: "Remover pessoa",
        description: `Remover "${link.person.fullName}" deste atendimento?`,
        confirmLabel: "Remover",
        cancelLabel: "Cancelar",
        confirmVariant: "destructive",
      });
      if (!confirmed) return;
      try {
        const updated = await removeAttendancePerson(token, id, link.id);
        setAttendance(updated);
        toast({ title: "Pessoa removida" });
      } catch (error) {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Falha ao remover pessoa.";
        toast({ variant: "destructive", title: "Falha ao remover", description: message });
      }
    },
    [canEdit, confirm, id, setAttendance, toast, token],
  );

  const handleAddEvolution = React.useCallback(
    async (payload: { date: string; notes: string }) => {
      if (!token || !id) return;
      const updated = await addAttendanceEvolution(token, id, payload);
      setAttendance(updated);
      toast({ title: "Evolução registrada" });
    },
    [id, setAttendance, toast, token],
  );

  const handleRemoveEvolution = React.useCallback(
    async (evolution: ApiAttendanceEvolution) => {
      if (!token || !id || !canEdit) return;
      const confirmed = await confirm({
        title: "Remover evolução",
        description: "Remover este registro de evolução? Essa ação não pode ser desfeita.",
        confirmLabel: "Remover",
        cancelLabel: "Cancelar",
        confirmVariant: "destructive",
      });
      if (!confirmed) return;
      try {
        const updated = await removeAttendanceEvolution(token, id, evolution.id);
        setAttendance(updated);
        toast({ title: "Evolução removida" });
      } catch (error) {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Falha ao remover evolução.";
        toast({ variant: "destructive", title: "Falha ao remover", description: message });
      }
    },
    [canEdit, confirm, id, setAttendance, toast, token],
  );

  const handleAddBenefit = React.useCallback(
    async (payload: { name: string; date: string; quantity: number | null; notes: string | null }) => {
      if (!token || !id) return;
      const updated = await addAttendanceBenefit(token, id, payload);
      setAttendance(updated);
      toast({ title: "Benefício lançado" });
    },
    [id, setAttendance, toast, token],
  );

  const handleRemoveBenefit = React.useCallback(
    async (benefit: ApiAttendanceBenefit) => {
      if (!token || !id || !canEdit) return;
      const confirmed = await confirm({
        title: "Remover benefício",
        description: `Remover o benefício "${benefit.name}"? Essa ação não pode ser desfeita.`,
        confirmLabel: "Remover",
        cancelLabel: "Cancelar",
        confirmVariant: "destructive",
      });
      if (!confirmed) return;
      try {
        const updated = await removeAttendanceBenefit(token, id, benefit.id);
        setAttendance(updated);
        toast({ title: "Benefício removido" });
      } catch (error) {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Falha ao remover benefício.";
        toast({ variant: "destructive", title: "Falha ao remover", description: message });
      }
    },
    [canEdit, confirm, id, setAttendance, toast, token],
  );

  const context = React.useMemo<AttendancesDetailLayoutContext>(
    () => ({
      mode,
      readOnly: mode === "create" ? !canCreate : !canEdit,
      canAudit,
      canEdit,
      tenantSlug,
      attendance,
      draft,
      setDraft,
      professionalName,
      people: attendance?.people ?? [],
      evolutions: attendance?.evolutions ?? [],
      benefits: attendance?.benefits ?? [],
      onCommitField: (field, nextValue) => void commitField(field, nextValue),
      onOpenPerson: (personId) => router.push(withTenantPath(`/people/${personId}`, tenantSlug)),
      onAddPerson: handleAddPerson,
      onRemovePerson: (link) => void handleRemovePerson(link),
      onPickProfessional: () => setProfessionalPickerOpen(true),
      onAddEvolution: handleAddEvolution,
      onRemoveEvolution: (evolution) => void handleRemoveEvolution(evolution),
      onOpenEvolution: (evolutionId) =>
        router.push(withTenantPath(buildAttendanceEvolutionPath(id, evolutionId), tenantSlug)),
      onAddBenefit: handleAddBenefit,
      onRemoveBenefit: (benefit) => void handleRemoveBenefit(benefit),
      onOpenBenefit: (benefitId) =>
        router.push(withTenantPath(buildAttendanceBenefitPath(id, benefitId), tenantSlug)),
      auditVisibleCount,
      onAuditVisibleCountChange: setAuditVisibleCount,
    }),
    [
      attendance,
      auditVisibleCount,
      canAudit,
      canCreate,
      canEdit,
      commitField,
      draft,
      handleAddBenefit,
      handleAddEvolution,
      handleAddPerson,
      handleRemoveBenefit,
      handleRemoveEvolution,
      handleRemovePerson,
      id,
      mode,
      professionalName,
      router,
      tenantSlug,
    ],
  );

  if (!canAccessPage) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Sem permissão.</div>;
  }

  const headerTitle =
    mode === "create"
      ? "Novo atendimento"
      : ATTENDANCE_TYPE_LABELS[attendance?.type ?? draft.type] || "Atendimento";

  return (
    <>
      <DetailShellEngine<AttendancesDetailLayoutContext>
        moduleDefinition={attendancesDetailModuleDefinition}
        context={context}
        dataProvider={dataProvider}
        auditEnabled={canAudit}
        mode={mode}
        headerTitle={headerTitle}
        saving={saving}
        loading={loading}
        readOnly={context.readOnly}
        onSave={mode === "create" ? handleCreate : undefined}
        onClose={() => router.push(withTenantPath(ATTENDANCES_ROUTES.list, tenantSlug))}
        breadcrumbTitle={headerTitle}
        breadcrumbItems={[
          { label: "Atendimentos", href: ATTENDANCES_ROUTES.list },
          ...(mode === "edit" ? [{ label: headerTitle }] : []),
        ]}
      />
      <AttendancePeoplePickerDialog
        open={peoplePickerOpen}
        onOpenChange={setPeoplePickerOpen}
        onPick={handlePickPerson}
      />
      <AttendanceProfessionalPickerDialog
        open={professionalPickerOpen}
        onOpenChange={setProfessionalPickerOpen}
        onPick={handlePickProfessional}
      />
    </>
  );
}
