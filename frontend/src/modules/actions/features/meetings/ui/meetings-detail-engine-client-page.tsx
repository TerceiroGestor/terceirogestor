"use client";

import * as React from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { uploadActionPhoto } from "@/features/uploads/api";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import {
  createMeeting,
  getMeeting,
  listActivityPeopleGroups,
  updateMeeting,
  type ApiActivityPeopleGroup,
  type ApiMeeting,
} from "@/modules/actions/api";
import {
  meetingsDetailModuleDefinition,
} from "@/modules/actions/features/meetings/config/meetings-module-contract";
import {
  type MeetingDetailDraft,
  type MeetingDetailLayoutContext,
} from "@/modules/actions/features/meetings/config/meeting-detail-layout-contract";
import { ACTIONS_ROUTES } from "@/modules/actions/config/actions-module-contract";
import { createRestDataProvider } from "@/web-client/data-provider";
import { DetailShellEngine } from "@/web-client/detail/DetailShellEngine";
import { useDetailAutoSaveController } from "@/web-client/detail/useDetailAutoSaveController";
import {
  canUseModuleAction,
  getModuleDetailEditingConfig,
  hasModulePermission,
} from "@/web-client/registry/module-utils";

function toTimeInputValue(value: string) {
  const date = new Date(value);
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function toDateInputValue(value: string) {
  return value.slice(0, 10);
}

function buildDraft(meeting?: ApiMeeting | null): MeetingDetailDraft {
  if (!meeting) {
    return {
      title: "",
      scheduledDate: "",
      startTime: "",
      endTime: "",
      status: "SCHEDULED",
      peopleGroupIds: [],
      notes: "",
      planHtml: "",
      executedHtml: "",
      conclusionHtml: "",
      photoPaths: [],
    };
  }
  return {
    title: meeting.title,
    scheduledDate: toDateInputValue(meeting.scheduledDate),
    startTime: toTimeInputValue(meeting.startTime),
    endTime: meeting.endTime ? toTimeInputValue(meeting.endTime) : "",
    status: meeting.status,
    peopleGroupIds: meeting.peopleGroupIds,
    notes: meeting.notes ?? "",
    planHtml: meeting.planHtml ?? "",
    executedHtml: meeting.executedHtml ?? "",
    conclusionHtml: meeting.conclusionHtml ?? "",
    photoPaths: meeting.photoPaths ?? [],
  };
}

function normalizeDraft(draft: MeetingDetailDraft): MeetingDetailDraft {
  return {
    ...draft,
    title: draft.title.trim(),
    notes: draft.notes.trim(),
  };
}

function toUpdatePayload(draft: MeetingDetailDraft) {
  const normalized = normalizeDraft(draft);
  return {
    title: normalized.title,
    scheduledDate: normalized.scheduledDate,
    startTime: normalized.startTime,
    endTime: normalized.endTime || null,
    status: normalized.status,
    peopleGroupIds: normalized.peopleGroupIds,
    notes: normalized.notes || null,
    planHtml: normalized.planHtml || null,
    executedHtml: normalized.executedHtml || null,
    conclusionHtml: normalized.conclusionHtml || null,
    photoPaths: normalized.photoPaths,
  };
}

export function MeetingsDetailEngineClientPage() {
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname) ?? "";

  const id = params?.id ? String(params.id) : "";
  // "/meetings/new" é rota própria (app/.../meetings/new/page.tsx), sem
  // segmento [id] - params.id vem undefined ali, não a string "new".
  // Mesmo fallback por pathname já usado em OccurrencesDetailEngineClientPage.
  const mode = id === "new" || pathname.endsWith("/meetings/new") ? "create" : "edit";
  const isEdit = mode === "edit";
  const projectId = searchParams.get("projectId") ?? "";
  const actionId = searchParams.get("actionId") ?? "";

  const canRead = hasModulePermission(meetingsDetailModuleDefinition, "canRead", permissions);
  const canCreate = canUseModuleAction(meetingsDetailModuleDefinition, "create", permissions);
  const canEdit = permissions.includes("actions.update");
  const canAccessPage = Boolean(projectId && actionId) && (mode === "create" ? canCreate : canRead);
  const dataProvider = React.useMemo(() => createRestDataProvider({ token }), [token]);

  const [meeting, setMeeting] = React.useState<ApiMeeting | null>(null);
  const [draft, setDraft] = React.useState<MeetingDetailDraft>(buildDraft(null));
  const [groups, setGroups] = React.useState<ApiActivityPeopleGroup[]>([]);
  const [loading, setLoading] = React.useState(isEdit);
  const [busy, setBusy] = React.useState(false);
  const [photoUploading, setPhotoUploading] = React.useState(false);

  const persistDraft = React.useCallback(
    async (nextDraft: MeetingDetailDraft) => {
      if (!token || !projectId || !actionId || !id) return nextDraft;
      const updated = await updateMeeting(token, projectId, actionId, id, toUpdatePayload(nextDraft));
      const savedDraft = buildDraft(updated);
      setMeeting(updated);
      setDraft(savedDraft);
      return savedDraft;
    },
    [token, projectId, actionId, id],
  );

  const autoSave = useDetailAutoSaveController<MeetingDetailDraft>({
    draft,
    enabled: Boolean(token && projectId && actionId && isEdit && canEdit),
    config: getModuleDetailEditingConfig(meetingsDetailModuleDefinition),
    normalizeDraft,
    onSave: persistDraft,
    onError: (error) => {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao salvar encontro.";
      toast({ variant: "destructive", title: "Falha ao salvar", description: message });
    },
  });
  const { saving: autoSaving, replaceSavedDraft, commitField } = autoSave;
  const saving = busy || autoSaving;

  React.useEffect(() => {
    if (!token || !projectId || !actionId) {
      setGroups([]);
      return;
    }
    listActivityPeopleGroups(token, projectId, actionId, { participationKind: "PARTICIPANT" })
      .then(setGroups)
      .catch(() => setGroups([]));
  }, [token, projectId, actionId]);

  React.useEffect(() => {
    if (!token || !canAccessPage || !isEdit || !id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getMeeting(token, projectId, actionId, id)
      .then((loaded) => {
        const nextDraft = buildDraft(loaded);
        setMeeting(loaded);
        setDraft(nextDraft);
        replaceSavedDraft(nextDraft);
      })
      .catch((error) => {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Falha ao carregar encontro.";
        toast({ variant: "destructive", title: "Falha ao carregar", description: message });
      })
      .finally(() => setLoading(false));
  }, [canAccessPage, token, projectId, actionId, id, isEdit, replaceSavedDraft, toast]);

  const handleCreate = React.useCallback(async () => {
    if (!canCreate || !token || !projectId || !actionId) return;
    if (!draft.scheduledDate || !draft.startTime) {
      toast({ variant: "destructive", title: "Dados inválidos", description: "Informe a data e o horário de início." });
      return;
    }
    setBusy(true);
    try {
      const created = await createMeeting(token, projectId, actionId, {
        title: draft.title.trim() || null,
        scheduledDate: draft.scheduledDate,
        startTime: draft.startTime,
        endTime: draft.endTime || null,
        peopleGroupIds: draft.peopleGroupIds,
        notes: draft.notes.trim() || null,
      });
      toast({ title: "Encontro criado" });
      router.replace(
        withTenantPath(`/meetings/${created.id}?projectId=${projectId}&actionId=${actionId}`, tenantSlug),
      );
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao criar encontro.";
      toast({ variant: "destructive", title: "Falha ao criar", description: message });
    } finally {
      setBusy(false);
    }
  }, [canCreate, token, projectId, actionId, draft, router, tenantSlug, toast]);

  const handleUploadPhoto = React.useCallback(
    async (file: File) => {
      if (!token || !projectId || !actionId || !id) return;
      setPhotoUploading(true);
      try {
        const uploaded = await uploadActionPhoto(token, file);
        const nextPaths = [...draft.photoPaths, uploaded.path].slice(0, 5);
        const updated = await updateMeeting(token, projectId, actionId, id, { photoPaths: nextPaths });
        setMeeting(updated);
        setDraft((previous) => ({ ...previous, photoPaths: nextPaths }));
      } catch (error) {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Falha ao enviar foto.";
        toast({ variant: "destructive", title: "Falha ao enviar foto", description: message });
      } finally {
        setPhotoUploading(false);
      }
    },
    [token, projectId, actionId, id, draft.photoPaths, toast],
  );

  const handleDeletePhoto = React.useCallback(
    async (path: string) => {
      if (!token || !projectId || !actionId || !id) return;
      setPhotoUploading(true);
      try {
        const nextPaths = draft.photoPaths.filter((item) => item !== path);
        const updated = await updateMeeting(token, projectId, actionId, id, { photoPaths: nextPaths });
        setMeeting(updated);
        setDraft((previous) => ({ ...previous, photoPaths: nextPaths }));
      } catch (error) {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Falha ao remover foto.";
        toast({ variant: "destructive", title: "Falha ao remover foto", description: message });
      } finally {
        setPhotoUploading(false);
      }
    },
    [token, projectId, actionId, id, draft.photoPaths, toast],
  );

  const readOnly = mode === "create" ? !canCreate : !canEdit;

  const context = React.useMemo<MeetingDetailLayoutContext>(
    () => ({
      mode,
      readOnly,
      token: token ?? "",
      tenantSlug,
      projectId,
      actionId,
      meeting,
      draft,
      setDraft,
      groups,
      photoUploading,
      onCommitField: (field, nextValue) => void commitField(field, nextValue),
      onUploadPhoto: (file) => void handleUploadPhoto(file),
      onDeletePhoto: (path) => void handleDeletePhoto(path),
    }),
    [
      mode,
      readOnly,
      token,
      tenantSlug,
      projectId,
      actionId,
      meeting,
      draft,
      groups,
      photoUploading,
      commitField,
      handleUploadPhoto,
      handleDeletePhoto,
    ],
  );

  if (!canAccessPage) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Sem permissão.</div>;
  }

  const headerTitle = mode === "create" ? "Novo encontro" : meeting?.title || draft.title || "Encontro";
  const activityHref = withTenantPath(`${ACTIONS_ROUTES.detail}/${actionId}?projectId=${projectId}`, tenantSlug);

  return (
    <DetailShellEngine<MeetingDetailLayoutContext>
      moduleDefinition={meetingsDetailModuleDefinition}
      context={context}
      dataProvider={dataProvider}
      auditEnabled={false}
      mode={mode}
      headerTitle={headerTitle}
      saving={saving}
      loading={loading}
      readOnly={readOnly}
      onSave={mode === "create" ? handleCreate : undefined}
      onClose={() => router.push(activityHref)}
      breadcrumbTitle={headerTitle}
      breadcrumbItems={[
        { label: "Atividade", href: activityHref },
        ...(mode === "edit" ? [{ label: headerTitle }] : []),
      ]}
    />
  );
}
