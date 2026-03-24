"use client";

import * as React from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/features/auth/auth-context";
import { useMentionableUsers } from "@/features/auth/use-mentionable-users";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { uploadCycleAttachment } from "@/features/uploads/api";
import type { ApiCycle, CycleAudienceType } from "@/modules/cycles/api";
import {
  addCycleAttachment,
  addCycleComment,
  deleteCycleAttachment,
  deleteCycleComment,
} from "@/modules/cycles/api";
import {
  CYCLES_ROUTES,
  cyclesDetailModuleDefinition,
} from "@/modules/cycles/config/cycles-module-contract";
import {
  type CycleDetailDraft,
  type CyclesDetailLayoutContext,
} from "@/modules/cycles/config/cycles-detail-layout-contract";
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

function buildDraft(cycle?: ApiCycle | null): CycleDetailDraft {
  return {
    name: cycle?.name ?? "",
    description: cycle?.description ?? "",
    audienceType: (cycle?.audienceType as CycleAudienceType | null) ?? "",
    ageMin: cycle?.ageMin != null ? String(cycle.ageMin) : "",
    ageMax: cycle?.ageMax != null ? String(cycle.ageMax) : "",
    isActive: cycle?.isActive ?? true,
    tags: cycle?.tags ?? [],
    internalNotes: cycle?.internalNotes ?? null,
  };
}

const EMPTY_COMMENT_DRAFT = {
  body: "",
  mentionUserIds: [] as string[],
};

function normalizeDraft(draft: CycleDetailDraft): CycleDetailDraft {
  return {
    name: draft.name.trim(),
    description: draft.description.trim(),
    audienceType: draft.audienceType,
    ageMin: draft.ageMin.trim(),
    ageMax: draft.ageMax.trim(),
    isActive: draft.isActive,
    tags: Array.from(new Set((draft.tags ?? []).map((tag) => tag.trim()).filter(Boolean))),
    internalNotes: draft.internalNotes?.trim() ? draft.internalNotes.trim() : null,
  };
}

function toPayload(draft: CycleDetailDraft) {
  const normalized = normalizeDraft(draft);
  return {
    name: normalized.name,
    description: normalized.description || null,
    audienceType: normalized.audienceType || null,
    ageMin: normalized.ageMin ? Number(normalized.ageMin) : null,
    ageMax: normalized.ageMax ? Number(normalized.ageMax) : null,
    isActive: normalized.isActive,
    tags: normalized.tags ?? [],
    internalNotes: normalized.internalNotes,
  };
}

export function CyclesDetailEngineClientPage() {
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);

  const id = params?.id ? String(params.id) : "";
  const mode = id === "new" || pathname.endsWith("/cycle/new") ? "create" : "edit";
  const isEdit = mode === "edit";
  const returnTo = searchParams.get("returnTo");

  const canRead = hasModulePermission(cyclesDetailModuleDefinition, "canRead", permissions);
  const canCreate = hasModulePermission(cyclesDetailModuleDefinition, "canCreate", permissions);
  const canEdit = canUseModuleAction(cyclesDetailModuleDefinition, "edit", permissions);
  const canAudit = canUseModuleAction(cyclesDetailModuleDefinition, "audit", permissions);
  const { users: mentionableUsers } = useMentionableUsers("project-structure.read");

  const canAccessPage = mode === "create" ? canCreate : canRead;
  const dataProvider = React.useMemo(() => createRestDataProvider({ token }), [token]);

  const [cycle, setCycle] = React.useState<ApiCycle | null>(null);
  const [draft, setDraft] = React.useState<CycleDetailDraft>(buildDraft());
  const [loading, setLoading] = React.useState(isEdit);
  const [busy, setBusy] = React.useState(false);
  const [commentDraft, setCommentDraft] = React.useState(EMPTY_COMMENT_DRAFT);
  const [commentSubmitting, setCommentSubmitting] = React.useState(false);
  const [attachmentUploading, setAttachmentUploading] = React.useState(false);
  const [auditVisibleCount, setAuditVisibleCount] = React.useState(24);
  const attachmentInputRef = React.useRef<HTMLInputElement | null>(null);

  const persistDraft = React.useCallback(
    async (nextDraft: CycleDetailDraft) => {
      const updated = await dataProvider.update<ApiCycle>(
        cyclesDetailModuleDefinition.queryAdapters.detailDataProvider?.model ?? "cycles.detail",
        id,
        toPayload(nextDraft),
      );
      const savedDraft = buildDraft(updated);
      setCycle(updated);
      setDraft(savedDraft);
      return savedDraft;
    },
    [dataProvider, id],
  );

  const autoSave = useDetailAutoSaveController<CycleDetailDraft>({
    draft,
    enabled: isEdit && canEdit,
    config: getModuleDetailEditingConfig(cyclesDetailModuleDefinition),
    normalizeDraft,
    onSave: persistDraft,
    onError: (error) => {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao salvar ciclo.";
      toast({ variant: "destructive", title: "Falha ao salvar", description: message });
    },
  });
  const { saving: autoSaving, replaceSavedDraft, commitField } = autoSave;
  const saving = busy || autoSaving;

  React.useEffect(() => {
    setAuditVisibleCount(24);
    setCommentDraft(EMPTY_COMMENT_DRAFT);
  }, [id, mode]);

  React.useEffect(() => {
    if (!token || !canAccessPage || !isEdit || !id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    dataProvider
      .read<ApiCycle>("cycles.detail", id)
      .then((loaded) => {
        const nextDraft = buildDraft(loaded);
        setCycle(loaded);
        setDraft(nextDraft);
        replaceSavedDraft(nextDraft);
      })
      .catch((error) => {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Falha ao carregar ciclo.";
        toast({ variant: "destructive", title: "Falha ao carregar", description: message });
      })
      .finally(() => setLoading(false));
  }, [canAccessPage, dataProvider, id, isEdit, replaceSavedDraft, toast, token]);

  const handleCreate = React.useCallback(async () => {
    if (!canCreate) return;
    const payload = toPayload(draft);
    if (!payload.name) {
      toast({
        variant: "destructive",
        title: "Dados invalidos",
        description: "Informe o nome do ciclo.",
      });
      return;
    }

    setBusy(true);
    try {
      const created = await dataProvider.create<ApiCycle>("cycles.detail", payload);
      toast({ variant: "success", title: "Ciclo criado" });
      router.replace(withTenantPath(`${CYCLES_ROUTES.detail}/${created.id}`, tenantSlug));
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao criar ciclo.";
      toast({ variant: "destructive", title: "Falha ao criar", description: message });
    } finally {
      setBusy(false);
    }
  }, [canCreate, dataProvider, draft, router, tenantSlug, toast]);

  const handleSubmitComment = React.useCallback(async () => {
    if (!token || !id || !commentDraft.body.trim()) return;
    setCommentSubmitting(true);
    try {
      const updated = await addCycleComment(token, id, commentDraft);
      const nextDraft = buildDraft(updated);
      setCycle(updated);
      setDraft(nextDraft);
      replaceSavedDraft(nextDraft);
      setCommentDraft(EMPTY_COMMENT_DRAFT);
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao comentar no ciclo.";
      toast({ variant: "destructive", title: "Falha ao comentar", description: message });
    } finally {
      setCommentSubmitting(false);
    }
  }, [commentDraft, id, replaceSavedDraft, toast, token]);

  const handleDeleteComment = React.useCallback(
    async (commentId: string) => {
      if (!token || !id) return;
      if (!window.confirm("Excluir este comentario?")) return;
      setCommentSubmitting(true);
      try {
        const updated = await deleteCycleComment(token, id, commentId);
        const nextDraft = buildDraft(updated);
        setCycle(updated);
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
    },
    [id, replaceSavedDraft, toast, token],
  );

  const handleSelectAttachment = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file || !token || !id) {
        resumeDetailAutoSave();
        return;
      }

      setAttachmentUploading(true);
      try {
        const uploaded = await uploadCycleAttachment(token, file);
        const updated = await addCycleAttachment(token, id, {
          label: uploaded.originalName?.trim() || file.name.trim() || "Anexo",
          filePath: uploaded.path,
          mimeType: uploaded.mimeType ?? file.type ?? null,
          fileSizeBytes: uploaded.size ?? file.size,
        });
        const nextDraft = buildDraft(updated);
        setCycle(updated);
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
    },
    [id, replaceSavedDraft, toast, token],
  );

  const handleDeleteAttachment = React.useCallback(
    async (attachmentId: string) => {
      if (!token || !id) return;
      if (!window.confirm("Excluir este anexo?")) return;
      setAttachmentUploading(true);
      try {
        const updated = await deleteCycleAttachment(token, id, attachmentId);
        const nextDraft = buildDraft(updated);
        setCycle(updated);
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
    },
    [id, replaceSavedDraft, toast, token],
  );

  const closeHref = React.useMemo(() => {
    if (returnTo) return returnTo;
    return withTenantPath(CYCLES_ROUTES.list, tenantSlug);
  }, [returnTo, tenantSlug]);

  const context = React.useMemo<CyclesDetailLayoutContext>(
    () => ({
      mode,
      readOnly: mode === "create" ? !canCreate : !canEdit,
      canAudit,
      canEdit,
      cycle,
      draft,
      setDraft,
      mentionableUsers,
      commentDraft,
      commentSubmitting,
      attachmentUploading,
      onCommitField: (field, nextValue) => void commitField(field, nextValue),
      onCommentDraftChange: setCommentDraft,
      onSubmitComment: handleSubmitComment,
      onDeleteComment: handleDeleteComment,
      onUploadAttachment: () => {
        if (!canEdit || mode !== "edit") return;
        suspendDetailAutoSave();
        attachmentInputRef.current?.click();
      },
      onDeleteAttachment: handleDeleteAttachment,
      onNotesChange: (next) => setDraft((previous) => ({ ...previous, internalNotes: next })),
      onNotesBlur: () => void commitField("internalNotes"),
      auditVisibleCount,
      onAuditVisibleCountChange: setAuditVisibleCount,
    }),
    [
      attachmentUploading,
      auditVisibleCount,
      canAudit,
      canCreate,
      canEdit,
      commentDraft,
      commentSubmitting,
      commitField,
      cycle,
      draft,
      handleDeleteAttachment,
      handleDeleteComment,
      handleSubmitComment,
      mentionableUsers,
      mode,
    ],
  );

  if (!canAccessPage) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Sem permissao.</div>;
  }

  const headerTitle = mode === "create" ? "Novo ciclo" : cycle?.name || draft.name || "Ciclo";

  return (
    <>
      <input
        ref={attachmentInputRef}
        type="file"
        className="hidden"
        onChange={handleSelectAttachment}
      />
      <DetailShellEngine<CyclesDetailLayoutContext>
        moduleDefinition={cyclesDetailModuleDefinition}
        context={context}
        dataProvider={dataProvider}
        auditEnabled={canAudit}
        mode={mode}
        headerTitle={headerTitle}
        saving={saving || commentSubmitting || attachmentUploading}
        loading={loading}
        readOnly={context.readOnly}
        onSave={mode === "create" ? handleCreate : undefined}
        onClose={() => router.push(closeHref)}
        breadcrumbTitle={headerTitle}
        breadcrumbItems={[
          { label: "Ciclos", href: CYCLES_ROUTES.list },
          ...(mode === "edit" ? [{ label: headerTitle }] : []),
        ]}
      />
    </>
  );
}
