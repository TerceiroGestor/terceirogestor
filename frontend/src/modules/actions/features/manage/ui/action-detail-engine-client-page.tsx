"use client";

import * as React from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { useMentionableUsers } from "@/features/auth/use-mentionable-users";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { uploadActionAttachment } from "@/features/uploads/api";
import {
  addProjectActionAttachment,
  addProjectActionComment,
  deleteProjectActionAttachment,
  deleteProjectActionComment,
  getProjectAction,
  updateProjectAction,
  type ApiProjectAction,
} from "@/modules/actions/api";
import {
  ACTIONS_ROUTES,
  actionsDetailModuleDefinition,
} from "@/modules/actions/config/actions-module-contract";
import { ActionManageRouteClientPage } from "@/modules/actions/features/manage/ui/action-manage-route-client-page";
import {
  type ActionMetadataDraft,
  type ActionsDetailLayoutContext,
} from "@/modules/actions/config/actions-detail-layout-contract";
import { useAuth } from "@/features/auth/auth-context";
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
  const { users: mentionableUsers } = useMentionableUsers("actions.read");
  const dataProvider = React.useMemo(() => createRestDataProvider({ token }), [token]);

  const [action, setAction] = React.useState<ApiProjectAction | null>(null);
  const [draft, setDraft] = React.useState<ActionMetadataDraft>(buildDraft());
  const [loading, setLoading] = React.useState(true);
  const [commentDraft, setCommentDraft] = React.useState(EMPTY_COMMENT_DRAFT);
  const [commentSubmitting, setCommentSubmitting] = React.useState(false);
  const [attachmentUploading, setAttachmentUploading] = React.useState(false);
  const [auditVisibleCount, setAuditVisibleCount] = React.useState(24);
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
          : "Falha ao salvar acao.";
      toast({ variant: "destructive", title: "Falha ao salvar", description: message });
    },
  });
  const { saving, replaceSavedDraft, commitField } = autoSave;

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
        const nextDraft = buildDraft(loaded);
        setAction(loaded);
        setDraft(nextDraft);
        replaceSavedDraft(nextDraft);
      })
      .catch((error) => {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Falha ao carregar acao.";
        toast({ variant: "destructive", title: "Falha ao carregar", description: message });
      })
      .finally(() => setLoading(false));
  }, [canRead, id, projectId, replaceSavedDraft, toast, token]);

  const handleSubmitComment = React.useCallback(async () => {
    if (!token || !projectId || !commentDraft.body.trim()) return;
    setCommentSubmitting(true);
    try {
      const updated = await addProjectActionComment(token, projectId, id, commentDraft);
      const nextDraft = buildDraft(updated);
      setAction(updated);
      setDraft(nextDraft);
      replaceSavedDraft(nextDraft);
      setCommentDraft(EMPTY_COMMENT_DRAFT);
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao comentar na acao.";
      toast({ variant: "destructive", title: "Falha ao comentar", description: message });
    } finally {
      setCommentSubmitting(false);
    }
  }, [commentDraft, id, projectId, replaceSavedDraft, toast, token]);

  const handleDeleteComment = React.useCallback(async (commentId: string) => {
    if (!token || !projectId) return;
    if (!window.confirm("Excluir este comentario?")) return;
    setCommentSubmitting(true);
    try {
      const updated = await deleteProjectActionComment(token, projectId, id, commentId);
      const nextDraft = buildDraft(updated);
      setAction(updated);
      setDraft(nextDraft);
      replaceSavedDraft(nextDraft);
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao excluir comentario.";
      toast({ variant: "destructive", title: "Falha ao excluir", description: message });
    } finally {
      setCommentSubmitting(false);
    }
  }, [id, projectId, replaceSavedDraft, toast, token]);

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
      const nextDraft = buildDraft(updated);
      setAction(updated);
      setDraft(nextDraft);
      replaceSavedDraft(nextDraft);
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
  }, [id, projectId, replaceSavedDraft, toast, token]);

  const handleDeleteAttachment = React.useCallback(async (attachmentId: string) => {
    if (!token || !projectId) return;
    if (!window.confirm("Excluir este anexo?")) return;
    setAttachmentUploading(true);
    try {
      const updated = await deleteProjectActionAttachment(token, projectId, id, attachmentId);
      const nextDraft = buildDraft(updated);
      setAction(updated);
      setDraft(nextDraft);
      replaceSavedDraft(nextDraft);
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao excluir anexo.";
      toast({ variant: "destructive", title: "Falha ao excluir", description: message });
    } finally {
      setAttachmentUploading(false);
    }
  }, [id, projectId, replaceSavedDraft, toast, token]);

  if (!authLoading && !userLoading && !token) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Redirecionando...</div>;
  }

  if (!authLoading && !userLoading && !canRead) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Voce nao tem acesso a Acoes.</div>;
  }

  const closeHref = returnTo
    ? returnTo
    : withTenantPath(ACTIONS_ROUTES.list, tenantSlug);

  const context = {
    mode: "edit" as const,
    readOnly: !canEdit,
    canAudit,
    action,
    draft,
    setDraft,
    mentionableUsers,
    commentDraft,
    commentSubmitting,
    attachmentUploading,
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
        headerTitle={action?.title ?? "Acao"}
        breadcrumbTitle={action?.title ?? "Acao"}
        breadcrumbItems={[
          { label: "Acoes", href: withTenantPath(ACTIONS_ROUTES.list, tenantSlug) },
          { label: action?.title || id || "Acao" },
        ]}
        saving={saving || commentSubmitting || attachmentUploading}
        loading={loading || authLoading || userLoading}
        readOnly={!canEdit}
        onClose={() => router.push(closeHref)}
        fallbackMainSlot={<ActionManageRouteClientPage embedded projectIdOverride={projectId} />}
      />
    </>
  );
}
