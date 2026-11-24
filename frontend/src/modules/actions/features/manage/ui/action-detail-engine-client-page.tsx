"use client";

import * as React from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { useMentionableUsers } from "@/features/auth/use-mentionable-users";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { useAuth } from "@/features/auth/auth-context";
import { uploadActionAttachment } from "@/features/uploads/api";
import {
  addProjectActionAttachment,
  createProjectActionPeopleParticipation,
  deleteProjectActionAttachment,
  endProjectActionPeopleParticipation,
  getActivity,
  listActionAttendanceSummary,
  listProjectActionPeopleParticipations,
  updateActivity,
  type ApiActivity,
} from "@/modules/actions/api";
import {
  ACTIONS_ROUTES,
  actionsDetailModuleDefinition,
} from "@/modules/actions/config/actions-module-contract";
import {
  type ActivityDetailDraft,
  type ActionsDetailLayoutContext,
} from "@/modules/actions/config/actions-detail-layout-contract";
import { ActionPeopleParticipationPickerDialog } from "@/modules/actions/features/manage/ui/action-people-participation-picker-dialog";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { createRestDataProvider } from "@/web-client/data-provider";
import { DetailShellEngine } from "@/web-client/detail/DetailShellEngine";
import {
  resumeDetailAutoSave,
  suspendDetailAutoSave,
} from "@/web-client/detail/detail-media-autosave-guard";
import { useDetailAutoSaveController } from "@/web-client/detail/useDetailAutoSaveController";
import {
  canUseModuleAction,
  getModuleDetailEditingConfig,
  hasModulePermission,
} from "@/web-client/registry/module-utils";

export function buildDraft(action?: ApiActivity | null): ActivityDetailDraft {
  return {
    actionTypeId: action?.actionTypeId ?? "",
    title: action?.title ?? "",
    status: action?.status ?? "PLANNED",
    peopleGroupIds: action?.peopleGroupIds ?? [],
    goalId: action?.goalId ?? "",
    description: action?.description ?? "",
    plannedStartAt: action?.plannedStartAt?.slice(0, 10) ?? "",
    plannedEndAt: action?.plannedEndAt?.slice(0, 10) ?? "",
    pedagogicalPlanHtml: action?.pedagogicalPlanHtml ?? "",
    tags: action?.tags ?? [],
    internalNotes: action?.internalNotes ?? null,
  };
}

export function normalizeDraft(draft: ActivityDetailDraft): ActivityDetailDraft {
  return {
    actionTypeId: draft.actionTypeId,
    title: draft.title.trim(),
    status: draft.status,
    peopleGroupIds: draft.peopleGroupIds ?? [],
    goalId: draft.goalId ?? "",
    description: draft.description.trim(),
    plannedStartAt: draft.plannedStartAt ?? "",
    plannedEndAt: draft.plannedEndAt ?? "",
    pedagogicalPlanHtml: draft.pedagogicalPlanHtml ?? "",
    tags: Array.from(new Set((draft.tags ?? []).map((tag) => tag.trim()).filter(Boolean))),
    internalNotes: draft.internalNotes?.trim() ? draft.internalNotes.trim() : null,
  };
}

export function ActionDetailEngineClientPage() {
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const { token, isLoading: authLoading } = useAuth();
  const { permissions, isLoading: userLoading } = useCurrentUser();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname) ?? "";
  const id = params?.id ? String(params.id) : "";
  const projectId = searchParams.get("projectId") ?? "";
  const returnTo = searchParams.get("returnTo");

  const canRead = hasModulePermission(actionsDetailModuleDefinition, "canRead", permissions);
  const canAudit = canUseModuleAction(actionsDetailModuleDefinition, "audit", permissions);
  const canEdit = permissions.includes("actions.update");
  const canReadStructure = permissions.includes("project-structure.read");
  const canReadPeople = permissions.includes("people.read");
  const canReadPeopleIdentity = permissions.includes("people.identity.read");
  const { users: mentionableUsers } = useMentionableUsers("actions.read");
  const dataProvider = React.useMemo(() => createRestDataProvider({ token }), [token]);

  const [action, setAction] = React.useState<ApiActivity | null>(null);
  const [draft, setDraft] = React.useState<ActivityDetailDraft>(buildDraft());
  const [loading, setLoading] = React.useState(true);
  const [attachmentUploading, setAttachmentUploading] = React.useState(false);
  const [auditVisibleCount, setAuditVisibleCount] = React.useState(24);
  const [teamPickerOpen, setTeamPickerOpen] = React.useState(false);
  const [participantPickerOpen, setParticipantPickerOpen] = React.useState(false);
  const [reportPeopleRows, setReportPeopleRows] = React.useState<
    ActionsDetailLayoutContext["reportPeopleRows"]
  >([]);
  const [attendanceSummaryRows, setAttendanceSummaryRows] = React.useState<
    ActionsDetailLayoutContext["attendanceSummaryRows"]
  >([]);
  const [attendanceSummaryLoading, setAttendanceSummaryLoading] = React.useState(false);
  const [attendanceSummaryError, setAttendanceSummaryError] = React.useState<string | null>(null);
  const attendanceSummaryRequestIdRef = React.useRef(0);
  const attachmentInputRef = React.useRef<HTMLInputElement | null>(null);

  const persistDraft = React.useCallback(
    async (nextDraft: ActivityDetailDraft) => {
      if (!token || !projectId) return nextDraft;
      const normalized = normalizeDraft(nextDraft);
      const updated = await updateActivity(token, projectId, id, {
        actionTypeId: normalized.actionTypeId,
        title: normalized.title,
        status: normalized.status,
        peopleGroupIds: normalized.peopleGroupIds,
        goalId: normalized.goalId || null,
        description: normalized.description || null,
        plannedStartAt: normalized.plannedStartAt || null,
        plannedEndAt: normalized.plannedEndAt || null,
        pedagogicalPlanHtml: normalized.pedagogicalPlanHtml || null,
        tags: normalized.tags,
        internalNotes: normalized.internalNotes,
      });
      const savedDraft = buildDraft(updated);
      setAction(updated);
      setDraft(savedDraft);
      return savedDraft;
    },
    [id, projectId, token],
  );

  const autoSave = useDetailAutoSaveController<ActivityDetailDraft>({
    draft,
    enabled: Boolean(token && projectId && canEdit),
    config: getModuleDetailEditingConfig(actionsDetailModuleDefinition),
    normalizeDraft,
    onSave: persistDraft,
    onError: (error) => {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao salvar atividade.";
      toast({ variant: "destructive", title: "Falha ao salvar", description: message });
    },
  });
  const { saving, replaceSavedDraft, commitField } = autoSave;

  // Alimenta so o badge/leitura da aba "Equipe" - a aba Qualidade/
  // Progresso-e-Relatorio que tambem usava isso (via `refreshReport`)
  // foi removida (revisao da estrutura de Projetos, 2026-11-24).
  const loadTeamParticipations = React.useCallback(async () => {
    if (!token || !projectId || !id || !canRead) return;
    try {
      const people = await listProjectActionPeopleParticipations(token, projectId, id, {
        page: 1,
        limit: 200,
      });
      setReportPeopleRows(people.data ?? []);
    } catch {
      setReportPeopleRows([]);
    }
  }, [canRead, id, projectId, token]);

  const loadAttendanceSummary = React.useCallback(async () => {
    if (!token || !projectId || !id || !canRead) return;
    const requestId = ++attendanceSummaryRequestIdRef.current;
    setAttendanceSummaryLoading(true);
    setAttendanceSummaryError(null);
    try {
      const limit = 200;
      let page = 1;
      const all: ActionsDetailLayoutContext["attendanceSummaryRows"] = [];
      while (true) {
        const response = await listActionAttendanceSummary(token, projectId, id, {
          page,
          limit,
        });
        all.push(...response.data);
        const pages = response.pagination?.pages ?? page;
        if (page >= pages) break;
        page += 1;
      }
      if (requestId !== attendanceSummaryRequestIdRef.current) return;
      setAttendanceSummaryRows(all);
    } catch (error) {
      if (requestId !== attendanceSummaryRequestIdRef.current) return;
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao carregar resumo de participação.";
      setAttendanceSummaryRows([]);
      setAttendanceSummaryError(message);
    } finally {
      if (requestId === attendanceSummaryRequestIdRef.current) {
        setAttendanceSummaryLoading(false);
      }
    }
  }, [canRead, id, projectId, token]);

  const applyLoadedAction = React.useCallback(
    (loaded: ApiActivity) => {
      const nextDraft = buildDraft(loaded);
      setAction(loaded);
      setDraft(nextDraft);
      replaceSavedDraft(nextDraft);
    },
    [replaceSavedDraft],
  );

  React.useEffect(() => {
    setAuditVisibleCount(24);
    setAttendanceSummaryRows([]);
    setAttendanceSummaryError(null);
  }, [id]);

  React.useEffect(() => {
    void loadAttendanceSummary();
  }, [loadAttendanceSummary]);

  React.useEffect(() => {
    if (!token || !projectId || !canRead) {
      setLoading(false);
      return;
    }

    setLoading(true);
    getActivity(token, projectId, id)
      .then((loaded) => {
        applyLoadedAction(loaded);
      })
      .catch((error) => {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Falha ao carregar atividade.";
        toast({ variant: "destructive", title: "Falha ao carregar", description: message });
      })
      .finally(() => setLoading(false));
  }, [applyLoadedAction, canRead, id, projectId, toast, token]);

  React.useEffect(() => {
    if (!action) return;
    void loadTeamParticipations();
  }, [action, loadTeamParticipations]);

  const handleSelectAttachment = React.useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !token || !projectId) {
      resumeDetailAutoSave();
      return;
    }

    setAttachmentUploading(true);
    try {
      const uploaded = await uploadActionAttachment(token, file);
      const updated = await addProjectActionAttachment(token, projectId, id, {
        label: uploaded.originalName?.trim() || file.name.trim() || "Anexo",
        filePath: uploaded.path,
        mimeType: uploaded.mimeType ?? file.type ?? null,
        fileSizeBytes: uploaded.size ?? file.size,
      });
      applyLoadedAction(updated);
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao enviar anexo.";
      toast({ variant: "destructive", title: "Falha ao enviar", description: message });
    } finally {
      setAttachmentUploading(false);
      resumeDetailAutoSave();
    }
  }, [applyLoadedAction, id, projectId, toast, token]);

  const handleDeleteAttachment = React.useCallback(async (attachmentId: string) => {
    if (!token || !projectId) return;
    if (!window.confirm("Excluir este anexo?")) return;
    setAttachmentUploading(true);
    try {
      const updated = await deleteProjectActionAttachment(token, projectId, id, attachmentId);
      applyLoadedAction(updated);
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao excluir anexo.";
      toast({ variant: "destructive", title: "Falha ao excluir", description: message });
    } finally {
      setAttachmentUploading(false);
    }
  }, [applyLoadedAction, id, projectId, toast, token]);

  const handleAddTeamParticipation = React.useCallback(
    async (params: {
      enrollment: import("@/modules/projects/api").ApiProjectEnrollment;
      role: import("@/modules/actions/api").ActionPeopleParticipationRole;
    }) => {
      if (!token || !projectId) return;
      try {
        await createProjectActionPeopleParticipation(token, projectId, id, {
          personId: params.enrollment.person.id,
          enrollmentId: params.enrollment.id,
          role: params.role,
        });
        toast({ title: "Pessoa adicionada" });
        await loadTeamParticipations();
      } catch (error) {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Falha ao adicionar pessoa.";
        toast({ variant: "destructive", title: "Falha ao adicionar", description: message });
      }
    },
    [id, loadTeamParticipations, projectId, toast, token],
  );

  const handleEndTeamParticipation = React.useCallback(
    async (participationId: string) => {
      if (!token || !projectId) return;
      if (!window.confirm("Encerrar esta participação de equipe?")) return;
      try {
        await endProjectActionPeopleParticipation(token, projectId, id, participationId);
        toast({ title: "Participação encerrada" });
        await loadTeamParticipations();
      } catch (error) {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Falha ao encerrar participação.";
        toast({ variant: "destructive", title: "Falha ao encerrar", description: message });
      }
    },
    [id, loadTeamParticipations, projectId, toast, token],
  );

  const handleAddParticipant = React.useCallback(
    async (params: {
      enrollment: import("@/modules/projects/api").ApiProjectEnrollment;
      role: import("@/modules/actions/api").ActionPeopleParticipationRole;
    }) => {
      if (!token || !projectId) return;
      try {
        await createProjectActionPeopleParticipation(token, projectId, id, {
          personId: params.enrollment.person.id,
          enrollmentId: params.enrollment.id,
          participationKind: "PARTICIPANT",
          role: "PARTICIPANTE",
        });
        toast({ title: "Participante adicionado" });
        await loadAttendanceSummary();
      } catch (error) {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Falha ao adicionar participante.";
        toast({ variant: "destructive", title: "Falha ao adicionar", description: message });
      }
    },
    [id, loadAttendanceSummary, projectId, toast, token],
  );

  const handleRemoveParticipant = React.useCallback(
    async (participationId: string) => {
      if (!token || !projectId) return;
      if (!window.confirm("Remover este participante da atividade?")) return;
      try {
        await endProjectActionPeopleParticipation(token, projectId, id, participationId);
        toast({ title: "Participante removido" });
        await loadAttendanceSummary();
      } catch (error) {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Falha ao remover participante.";
        toast({ variant: "destructive", title: "Falha ao remover", description: message });
      }
    },
    [id, loadAttendanceSummary, projectId, toast, token],
  );

  if (!authLoading && !userLoading && !token) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Redirecionando...</div>;
  }

  if (!authLoading && !userLoading && !canRead) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Você não tem acesso a Atividades.</div>;
  }

  const closeHref = returnTo
    ? returnTo
    : withTenantPath(ACTIONS_ROUTES.list, tenantSlug);

  const context = {
    mode: "edit" as const,
    readOnly: !canEdit,
    canAudit,
    canUpdate: canEdit,
    canReadStructure,
    canReadPeople,
    canReadPeopleIdentity,
    tenantSlug,
    token: token ?? "",
    projectId,
    action,
    draft,
    setDraft,
    mentionableUsers,
    attachmentUploading,
    reportPeopleRows,
    attendanceSummaryRows,
    attendanceSummaryLoading,
    attendanceSummaryError,
    onCommitField: (field: keyof ActivityDetailDraft, nextValue?: ActivityDetailDraft[keyof ActivityDetailDraft]) =>
      void commitField(field, nextValue),
    onUploadAttachment: () => {
      if (!canEdit) return;
      if (attachmentInputRef.current) {
        attachmentInputRef.current.oncancel = () => resumeDetailAutoSave();
      }
      suspendDetailAutoSave();
      attachmentInputRef.current?.click();
    },
    onDeleteAttachment: handleDeleteAttachment,
    onActionLoaded: applyLoadedAction,
    onOpenTeamPicker: () => setTeamPickerOpen(true),
    onEndTeamParticipation: handleEndTeamParticipation,
    onOpenParticipantPicker: () => setParticipantPickerOpen(true),
    onRemoveParticipant: handleRemoveParticipant,
    auditVisibleCount,
    onAuditVisibleCountChange: setAuditVisibleCount,
  } satisfies ActionsDetailLayoutContext;

  return (
    <>
      <input
        ref={attachmentInputRef}
        type="file"
        className="hidden"
        onChange={handleSelectAttachment}
      />
      <DetailShellEngine<ActionsDetailLayoutContext>
        moduleDefinition={actionsDetailModuleDefinition}
        context={context}
        dataProvider={dataProvider}
        auditEnabled={canAudit}
        mode="edit"
        headerTitle={action?.title ?? "Atividade"}
        breadcrumbTitle={action?.title ?? "Atividade"}
        breadcrumbItems={[
          { label: "Atividades", href: withTenantPath(ACTIONS_ROUTES.list, tenantSlug) },
          { label: action?.title || id || "Atividade" },
        ]}
        saving={saving || attachmentUploading || attendanceSummaryLoading}
        loading={loading || authLoading || userLoading}
        readOnly={!canEdit}
        onClose={() => router.push(closeHref)}
      />
      <ActionPeopleParticipationPickerDialog
        open={teamPickerOpen}
        onOpenChange={setTeamPickerOpen}
        token={token ?? ""}
        projectId={projectId}
        actionId={id}
        onPick={(params) => void handleAddTeamParticipation(params)}
      />
      <ActionPeopleParticipationPickerDialog
        open={participantPickerOpen}
        onOpenChange={setParticipantPickerOpen}
        token={token ?? ""}
        projectId={projectId}
        actionId={id}
        participationKind="PARTICIPANT"
        title="Adicionar participante"
        onPick={(params) => void handleAddParticipant(params)}
      />
    </>
  );
}
