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
  listMeetings,
  listMeetingAttendances,
  listProjectActionPeopleParticipations,
  upsertMeetingAttendances,
  updateActivity,
  type ApiMeeting,
  type AttendanceStatus,
  type ApiActivity,
  type MeetingAttendancesListItem,
} from "@/modules/actions/api";
import {
  ACTIONS_ROUTES,
  actionsDetailModuleDefinition,
} from "@/modules/actions/config/actions-module-contract";
import {
  type ActivityDetailDraft,
  type ActionsDetailLayoutContext,
} from "@/modules/actions/config/actions-detail-layout-contract";
import { ACTION_RELATION_TEXT, ACTION_RELATION_VALUES } from "@/modules/actions/features/manage/config/action-relations.constants";
import {
  buildAttendanceGroupOptions,
  filterQualityRows,
  resolveDefaultOccurrenceId,
  type QualityDraft,
  type QualityNotesDialogState,
} from "@/modules/actions/features/manage/ui/action-operational-relations";
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

function buildDraft(action?: ApiActivity | null): ActivityDetailDraft {
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

function normalizeDraft(draft: ActivityDetailDraft): ActivityDetailDraft {
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

async function fetchAllAttendances(params: {
  token: string;
  projectId: string;
  actionId: string;
  occurrenceId: string;
}) {
  const limit = 200;
  let page = 1;
  const all: MeetingAttendancesListItem[] = [];

  while (true) {
    const response = await listMeetingAttendances(
      params.token,
      params.projectId,
      params.actionId,
      params.occurrenceId,
      { page, limit },
    );
    all.push(...(response.data ?? []));
    const pages = response.pagination?.pages ?? page;
    if (page >= pages) break;
    page += 1;
  }

  return all;
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
  const [occurrences, setOccurrences] = React.useState<ApiMeeting[]>([]);
  const [occurrenceId, setOccurrenceId] = React.useState<string | null>(null);
  const selectedOccurrence = React.useMemo(
    () => occurrences.find((item) => item.id === occurrenceId) ?? null,
    [occurrences, occurrenceId],
  );
  const [reportRows, setReportRows] = React.useState<MeetingAttendancesListItem[]>([]);
  const [reportPeopleRows, setReportPeopleRows] = React.useState<
    ActionsDetailLayoutContext["reportPeopleRows"]
  >([]);
  const [reportLoading, setReportLoading] = React.useState(false);
  const [reportError, setReportError] = React.useState<string | null>(null);
  const [attendanceSummaryRows, setAttendanceSummaryRows] = React.useState<
    ActionsDetailLayoutContext["attendanceSummaryRows"]
  >([]);
  const [attendanceSummaryLoading, setAttendanceSummaryLoading] = React.useState(false);
  const [attendanceSummaryError, setAttendanceSummaryError] = React.useState<string | null>(null);
  const [attendanceSummaryFrom, setAttendanceSummaryFrom] = React.useState("");
  const [attendanceSummaryTo, setAttendanceSummaryTo] = React.useState("");
  const attendanceSummaryRequestIdRef = React.useRef(0);
  const [qualityGroupId, setQualityGroupId] = React.useState<string>(
    ACTION_RELATION_VALUES.allGroups,
  );
  const [qualityDrafts, setQualityDrafts] = React.useState<Record<string, QualityDraft>>({});
  const [qualitySaving, setQualitySaving] = React.useState(false);
  const [qualityNotesDialog, setQualityNotesDialog] =
    React.useState<QualityNotesDialogState | null>(null);
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

  const refreshReport = React.useCallback(async () => {
    if (!token || !projectId || !id || !canRead) return;
    setReportLoading(true);
    setReportError(null);
    try {
      const [rows, people] = await Promise.all([
        occurrenceId
          ? fetchAllAttendances({ token, projectId, actionId: id, occurrenceId })
          : Promise.resolve([]),
        listProjectActionPeopleParticipations(token, projectId, id, { page: 1, limit: 200 }),
      ]);
      setReportRows(rows);
      setReportPeopleRows(people.data ?? []);
      if (!occurrenceId) {
        setReportError(
          "Nenhum encontro agendado ainda. Agende um encontro na aba \"Encontros\" para registrar presença.",
        );
      }
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao carregar relatório.";
      setReportRows([]);
      setReportPeopleRows([]);
      setReportError(message);
    } finally {
      setReportLoading(false);
    }
  }, [canRead, id, occurrenceId, projectId, token]);

  const loadOccurrences = React.useCallback(async () => {
    if (!token || !projectId || !id || !canRead) return;
    try {
      const response = await listMeetings(token, projectId, id, { limit: 200 });
      setOccurrences(response.data);
      setOccurrenceId((previous) =>
        previous && response.data.some((item) => item.id === previous)
          ? previous
          : resolveDefaultOccurrenceId(response.data),
      );
    } catch {
      setOccurrences([]);
      setOccurrenceId(null);
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
          from: attendanceSummaryFrom || undefined,
          to: attendanceSummaryTo || undefined,
        });
        all.push(...response.data);
        const pages = response.pagination?.pages ?? page;
        if (page >= pages) break;
        page += 1;
      }
      // Requisicoes de "De"/"Ate" digitadas em sequencia rapida podem
      // resolver fora de ordem - sem esse guard, uma resposta antiga (ex.:
      // "De" sozinho, antes de "Ate" ser preenchido) pode sobrescrever o
      // resultado correto da combinacao final (achado real testando com
      // Playwright: filtro janeiro/2026 mostrava 100% por causa disso).
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
  }, [attendanceSummaryFrom, attendanceSummaryTo, canRead, id, projectId, token]);

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
    setOccurrences([]);
    setOccurrenceId(null);
    setAttendanceSummaryRows([]);
    setAttendanceSummaryError(null);
    setAttendanceSummaryFrom("");
    setAttendanceSummaryTo("");
    setQualityGroupId(ACTION_RELATION_VALUES.allGroups);
    setQualityDrafts({});
    setQualitySaving(false);
    setQualityNotesDialog(null);
  }, [id]);

  React.useEffect(() => {
    void loadOccurrences();
  }, [loadOccurrences]);

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
    void refreshReport();
  }, [action, refreshReport]);

  const handleSaveActionPatch = React.useCallback(
    async (patch: Parameters<typeof updateActivity>[3]) => {
      if (!token || !projectId) return;
      const updated = await updateActivity(token, projectId, id, patch);
      applyLoadedAction(updated);
      toast({ title: "Salvo" });
      await refreshReport();
    },
    [applyLoadedAction, id, projectId, refreshReport, toast, token],
  );

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
        await refreshReport();
      } catch (error) {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Falha ao adicionar pessoa.";
        toast({ variant: "destructive", title: "Falha ao adicionar", description: message });
      }
    },
    [id, projectId, refreshReport, toast, token],
  );

  const handleEndTeamParticipation = React.useCallback(
    async (participationId: string) => {
      if (!token || !projectId) return;
      if (!window.confirm("Encerrar esta participação de equipe?")) return;
      try {
        await endProjectActionPeopleParticipation(token, projectId, id, participationId);
        toast({ title: "Participação encerrada" });
        await refreshReport();
      } catch (error) {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Falha ao encerrar participação.";
        toast({ variant: "destructive", title: "Falha ao encerrar", description: message });
      }
    },
    [id, projectId, refreshReport, toast, token],
  );

  const attendanceGroupOptions = React.useMemo(
    () => buildAttendanceGroupOptions(reportRows),
    [reportRows],
  );

  const occurrenceOptions = React.useMemo(
    () =>
      occurrences.map((occurrence) => ({
        label: new Date(occurrence.scheduledDate).toLocaleDateString("pt-BR", {
          timeZone: "UTC",
        }),
        value: occurrence.id,
      })),
    [occurrences],
  );

  React.useEffect(() => {
    if (!attendanceGroupOptions.some((option) => option.value === qualityGroupId)) {
      setQualityGroupId(ACTION_RELATION_VALUES.allGroups);
    }
  }, [attendanceGroupOptions, qualityGroupId]);

  const qualityRows = React.useMemo(
    () =>
      filterQualityRows(reportRows, {
        groupId: qualityGroupId,
      }),
    [qualityGroupId, reportRows],
  );

  const getQualityEffective = React.useCallback(
    (row: MeetingAttendancesListItem) => {
      const draftEntry = qualityDrafts[row.enrollment.id];
      return {
        qualityScore:
          draftEntry?.qualityScore === undefined
            ? (row.attendance?.qualityScore ?? null)
            : draftEntry.qualityScore,
        qualityNotes:
          draftEntry?.qualityNotes === undefined
            ? (row.attendance?.qualityNotes ?? null)
            : draftEntry.qualityNotes,
        isHighlight:
          draftEntry?.isHighlight === undefined
            ? Boolean(row.attendance?.isHighlight)
            : Boolean(draftEntry.isHighlight),
      };
    },
    [qualityDrafts],
  );

  const setQualityRowDraft = React.useCallback(
    (
      row: MeetingAttendancesListItem,
      patch: QualityDraft,
      prune = false,
    ) => {
      setQualityDrafts((previous) => {
        const next = { ...previous };
        const merged = { ...(previous[row.enrollment.id] ?? {}), ...patch };

        if (prune) {
          const originalScore = row.attendance?.qualityScore ?? null;
          const originalNotes = row.attendance?.qualityNotes ?? null;
          const originalHighlight = Boolean(row.attendance?.isHighlight);
          const scoreMatches =
            merged.qualityScore === undefined || merged.qualityScore === originalScore;
          const notesMatches =
            merged.qualityNotes === undefined || merged.qualityNotes === originalNotes;
          const highlightMatches =
            merged.isHighlight === undefined || merged.isHighlight === originalHighlight;

          if (scoreMatches && notesMatches && highlightMatches) {
            delete next[row.enrollment.id];
            return next;
          }
        }

        next[row.enrollment.id] = merged;
        return next;
      });
    },
    [],
  );

  const saveQualityDrafts = React.useCallback(async () => {
    if (!token || !projectId || !occurrenceId) return;
    const enrollmentIds = Object.keys(qualityDrafts);
    if (!enrollmentIds.length) return;

    const items = enrollmentIds
      .map((enrollmentId) => {
        const row = reportRows.find((item) => item.enrollment.id === enrollmentId);
        if (!row?.attendance) return null;
        const patch = qualityDrafts[enrollmentId] ?? {};
        return {
          enrollmentId,
          status: row.attendance.status,
          ...(patch.qualityScore !== undefined ? { qualityScore: patch.qualityScore } : {}),
          ...(patch.qualityNotes !== undefined ? { qualityNotes: patch.qualityNotes } : {}),
          ...(patch.isHighlight !== undefined ? { isHighlight: patch.isHighlight } : {}),
        };
      })
      .filter(Boolean) as Array<{
      enrollmentId: string;
      status: AttendanceStatus;
      qualityScore?: number | null;
      qualityNotes?: string | null;
      isHighlight?: boolean;
    }>;

    if (!items.length) {
      toast({
        title: ACTION_RELATION_TEXT.quality.saveNothingTitle,
        description: ACTION_RELATION_TEXT.quality.saveNothingDescription,
      });
      return;
    }

    try {
      await upsertMeetingAttendances(token, projectId, id, occurrenceId, items);
      setQualityDrafts({});
      setQualityNotesDialog(null);
      toast({ title: ACTION_RELATION_TEXT.quality.saveOkTitle });
      await refreshReport();
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao salvar qualidade.";
      toast({ variant: "destructive", title: "Falha ao salvar", description: message });
    } finally {
      setQualitySaving(false);
    }
  }, [id, occurrenceId, projectId, qualityDrafts, refreshReport, reportRows, toast, token]);

  const applyQualityNotesDialog = React.useCallback(
    (state: QualityNotesDialogState) => {
      const row = reportRows.find((item) => item.enrollment.id === state.enrollmentId);
      if (!row) {
        setQualityNotesDialog(null);
        return;
      }

      setQualityRowDraft(
        row,
        {
          qualityNotes: state.qualityNotes.trim() ? state.qualityNotes.trim() : null,
        },
        true,
      );
      setQualityNotesDialog(null);
    },
    [reportRows, setQualityRowDraft],
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
    occurrences,
    selectedOccurrence,
    draft,
    setDraft,
    mentionableUsers,
    attachmentUploading,
    reportRows,
    reportPeopleRows,
    reportLoading,
    reportError,
    occurrenceId,
    occurrenceOptions,
    onOccurrenceIdChange: setOccurrenceId,
    attendanceGroupOptions,
    attendanceSummaryRows,
    attendanceSummaryLoading,
    attendanceSummaryError,
    attendanceSummaryFrom,
    attendanceSummaryTo,
    onAttendanceSummaryFromChange: setAttendanceSummaryFrom,
    onAttendanceSummaryToChange: setAttendanceSummaryTo,
    qualityGroupId,
    qualityDrafts,
    qualitySaving,
    qualityNotesDialog,
    qualityRows,
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
    onSaveActionPatch: handleSaveActionPatch,
    onActionLoaded: applyLoadedAction,
    onOpenTeamPicker: () => setTeamPickerOpen(true),
    onEndTeamParticipation: handleEndTeamParticipation,
    onQualityGroupChange: setQualityGroupId,
    getQualityEffective,
    setQualityRowDraft,
    saveQualityDrafts: () => void saveQualityDrafts(),
    onQualityNotesDialogChange: setQualityNotesDialog,
    applyQualityNotesDialog,
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
        saving={
          saving ||
          attachmentUploading ||
          reportLoading ||
          attendanceSummaryLoading ||
          qualitySaving
        }
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
    </>
  );
}
