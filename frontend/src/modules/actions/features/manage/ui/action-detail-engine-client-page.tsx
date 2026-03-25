"use client";

import * as React from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { useMentionableUsers } from "@/features/auth/use-mentionable-users";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { useAuth } from "@/features/auth/auth-context";
import { uploadActionAttachment, uploadActionPhoto } from "@/features/uploads/api";
import {
  addProjectActionAttachment,
  addProjectActionComment,
  createProjectActionPeopleParticipation,
  deleteProjectActionAttachment,
  deleteProjectActionComment,
  endProjectActionPeopleParticipation,
  getProjectAction,
  listProjectActionAttendances,
  listProjectActionPeopleParticipations,
  updateProjectAction,
  type ApiProjectAction,
  type ProjectActionAttendancesListItem,
} from "@/modules/actions/api";
import {
  ACTIONS_ROUTES,
  actionsDetailModuleDefinition,
} from "@/modules/actions/config/actions-module-contract";
import {
  type ActionMetadataDraft,
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

function buildDraft(action?: ApiProjectAction | null): ActionMetadataDraft {
  return {
    tags: action?.tags ?? [],
    internalNotes: action?.internalNotes ?? null,
  };
}

const EMPTY_COMMENT_DRAFT = {
  body: "",
  mentionUserIds: [] as string[],
};

function normalizeDraft(draft: ActionMetadataDraft): ActionMetadataDraft {
  return {
    tags: Array.from(new Set((draft.tags ?? []).map((tag) => tag.trim()).filter(Boolean))),
    internalNotes: draft.internalNotes?.trim() ? draft.internalNotes.trim() : null,
  };
}

async function fetchAllAttendances(params: {
  token: string;
  projectId: string;
  actionId: string;
}) {
  const limit = 200;
  let page = 1;
  const all: ProjectActionAttendancesListItem[] = [];

  while (true) {
    const response = await listProjectActionAttendances(
      params.token,
      params.projectId,
      params.actionId,
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
  const tenantSlug = getTenantSlugFromPath(pathname);
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

  const [action, setAction] = React.useState<ApiProjectAction | null>(null);
  const [draft, setDraft] = React.useState<ActionMetadataDraft>(buildDraft());
  const [loading, setLoading] = React.useState(true);
  const [commentDraft, setCommentDraft] = React.useState(EMPTY_COMMENT_DRAFT);
  const [commentSubmitting, setCommentSubmitting] = React.useState(false);
  const [attachmentUploading, setAttachmentUploading] = React.useState(false);
  const [photoUploading, setPhotoUploading] = React.useState(false);
  const [auditVisibleCount, setAuditVisibleCount] = React.useState(24);
  const [teamPickerOpen, setTeamPickerOpen] = React.useState(false);
  const [reportRows, setReportRows] = React.useState<ProjectActionAttendancesListItem[]>([]);
  const [reportPeopleRows, setReportPeopleRows] = React.useState<
    ActionsDetailLayoutContext["reportPeopleRows"]
  >([]);
  const [reportLoading, setReportLoading] = React.useState(false);
  const [reportError, setReportError] = React.useState<string | null>(null);
  const attachmentInputRef = React.useRef<HTMLInputElement | null>(null);

  const persistDraft = React.useCallback(
    async (nextDraft: ActionMetadataDraft) => {
      if (!token || !projectId) return nextDraft;
      const normalized = normalizeDraft(nextDraft);
      const updated = await updateProjectAction(token, projectId, id, normalized);
      const savedDraft = buildDraft(updated);
      setAction(updated);
      setDraft(savedDraft);
      return savedDraft;
    },
    [id, projectId, token],
  );

  const autoSave = useDetailAutoSaveController<ActionMetadataDraft>({
    draft,
    enabled: Boolean(token && projectId && canEdit),
    config: getModuleDetailEditingConfig(actionsDetailModuleDefinition),
    normalizeDraft,
    onSave: persistDraft,
    onError: (error) => {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao salvar ação.";
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
        fetchAllAttendances({ token, projectId, actionId: id }),
        listProjectActionPeopleParticipations(token, projectId, id, { page: 1, limit: 200 }),
      ]);
      setReportRows(rows);
      setReportPeopleRows(people.data ?? []);
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
  }, [canRead, id, projectId, token]);

  const applyLoadedAction = React.useCallback(
    (loaded: ApiProjectAction) => {
      const nextDraft = buildDraft(loaded);
      setAction(loaded);
      setDraft(nextDraft);
      replaceSavedDraft(nextDraft);
    },
    [replaceSavedDraft],
  );

  React.useEffect(() => {
    setAuditVisibleCount(24);
    setCommentDraft(EMPTY_COMMENT_DRAFT);
  }, [id]);

  React.useEffect(() => {
    if (!token || !projectId || !canRead) {
      setLoading(false);
      return;
    }

    setLoading(true);
    getProjectAction(token, projectId, id)
      .then((loaded) => {
        applyLoadedAction(loaded);
      })
      .catch((error) => {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Falha ao carregar ação.";
        toast({ variant: "destructive", title: "Falha ao carregar", description: message });
      })
      .finally(() => setLoading(false));
  }, [applyLoadedAction, canRead, id, projectId, toast, token]);

  React.useEffect(() => {
    if (!action) return;
    void refreshReport();
  }, [action, refreshReport]);

  const handleSaveActionPatch = React.useCallback(
    async (patch: Parameters<typeof updateProjectAction>[3]) => {
      if (!token || !projectId) return;
      const updated = await updateProjectAction(token, projectId, id, patch);
      applyLoadedAction(updated);
      toast({ title: "Salvo" });
      await refreshReport();
    },
    [applyLoadedAction, id, projectId, refreshReport, toast, token],
  );

  const handleSubmitComment = React.useCallback(async () => {
    if (!token || !projectId || !commentDraft.body.trim()) return;
    setCommentSubmitting(true);
    try {
      const updated = await addProjectActionComment(token, projectId, id, commentDraft);
      applyLoadedAction(updated);
      setCommentDraft(EMPTY_COMMENT_DRAFT);
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao comentar na ação.";
      toast({ variant: "destructive", title: "Falha ao comentar", description: message });
    } finally {
      setCommentSubmitting(false);
    }
  }, [applyLoadedAction, commentDraft, id, projectId, toast, token]);

  const handleDeleteComment = React.useCallback(async (commentId: string) => {
    if (!token || !projectId) return;
    if (!window.confirm("Excluir este comentário?")) return;
    setCommentSubmitting(true);
    try {
      const updated = await deleteProjectActionComment(token, projectId, id, commentId);
      applyLoadedAction(updated);
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao excluir comentário.";
      toast({ variant: "destructive", title: "Falha ao excluir", description: message });
    } finally {
      setCommentSubmitting(false);
    }
  }, [applyLoadedAction, id, projectId, toast, token]);

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

  const handleUploadPhoto = React.useCallback(async (file: File) => {
    if (!token || !projectId || !action) return;
    setPhotoUploading(true);
    try {
      const uploaded = await uploadActionPhoto(token, file);
      const nextPaths = [...(action.photoPaths ?? []), uploaded.path].slice(0, 5);
      const updated = await updateProjectAction(token, projectId, id, { photoPaths: nextPaths });
      applyLoadedAction(updated);
      await refreshReport();
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao enviar foto.";
      toast({ variant: "destructive", title: "Falha ao enviar", description: message });
    } finally {
      setPhotoUploading(false);
    }
  }, [action, applyLoadedAction, id, projectId, refreshReport, toast, token]);

  const handleDeletePhoto = React.useCallback(async (path: string) => {
    if (!token || !projectId || !action) return;
    setPhotoUploading(true);
    try {
      const nextPaths = (action.photoPaths ?? []).filter((item) => item !== path);
      const updated = await updateProjectAction(token, projectId, id, { photoPaths: nextPaths });
      applyLoadedAction(updated);
      await refreshReport();
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao remover foto.";
      toast({ variant: "destructive", title: "Falha ao remover", description: message });
    } finally {
      setPhotoUploading(false);
    }
  }, [action, applyLoadedAction, id, projectId, refreshReport, toast, token]);

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

  if (!authLoading && !userLoading && !token) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Redirecionando...</div>;
  }

  if (!authLoading && !userLoading && !canRead) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Você não tem acesso a Ações.</div>;
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
    token: token ?? "",
    projectId,
    action,
    draft,
    setDraft,
    mentionableUsers,
    commentDraft,
    commentSubmitting,
    attachmentUploading,
    photoUploading,
    reportRows,
    reportPeopleRows,
    reportLoading,
    reportError,
    onCommitField: (field: keyof ActionMetadataDraft, nextValue?: ActionMetadataDraft[keyof ActionMetadataDraft]) =>
      void commitField(field, nextValue),
    onCommentDraftChange: setCommentDraft,
    onSubmitComment: handleSubmitComment,
    onDeleteComment: handleDeleteComment,
    onUploadAttachment: () => {
      if (!canEdit) return;
      suspendDetailAutoSave();
      attachmentInputRef.current?.click();
    },
    onDeleteAttachment: handleDeleteAttachment,
    onNotesChange: (next: string | null) =>
      setDraft((previous) => ({ ...previous, internalNotes: next })),
    onNotesBlur: () => void commitField("internalNotes"),
    onSaveActionPatch: handleSaveActionPatch,
    onActionLoaded: applyLoadedAction,
    onUploadPhoto: handleUploadPhoto,
    onDeletePhoto: handleDeletePhoto,
    onOpenTeamPicker: () => setTeamPickerOpen(true),
    onEndTeamParticipation: handleEndTeamParticipation,
    auditVisibleCount,
    onAuditVisibleCountChange: setAuditVisibleCount,
  } satisfies ActionsDetailLayoutContext & { token: string };

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
        headerTitle={action?.title ?? "Ação"}
        breadcrumbTitle={action?.title ?? "Ação"}
        breadcrumbItems={[
          { label: "Ações", href: withTenantPath(ACTIONS_ROUTES.list, tenantSlug) },
          { label: action?.title || id || "Ação" },
        ]}
        saving={saving || commentSubmitting || attachmentUploading || photoUploading || reportLoading}
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
