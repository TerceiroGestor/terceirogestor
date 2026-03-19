"use client";

import * as React from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { useConfirm } from "@/components/confirm/use-confirm";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { toDateInputValue } from "@/lib/date";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import {
  createProjectPeopleGroup,
  deleteProjectEnrollment,
  listProjectEnrollments,
  listProjectGroups,
  listProjectPeopleGroups,
  type ApiProject,
  type ApiProjectEnrollment,
  type ApiProjectGroup,
  type ApiProjectPeopleGroup,
} from "@/modules/projects/api";
import { BulkEnrollmentDialog } from "@/modules/projects/features/detail/ui/bulk-enrollment-dialog";
import { ProjectCyclePickerDialog } from "@/modules/projects/features/detail/ui/project-cycle-picker-dialog";
import { listPrograms, type ApiProgram } from "@/modules/programs/api";
import {
  type ProjectDetailDraft,
  type ProjectsDetailLayoutContext,
} from "@/modules/projects/config/projects-detail-layout-contract";
import {
  projectsDetailModuleDefinition,
  PROJECTS_ROUTES,
} from "@/modules/projects/config/projects-module-contract";
import { listProjectActions, type ApiProjectAction } from "@/modules/actions/api";
import { createRestDataProvider } from "@/web-client/data-provider";
import { DetailShellEngine } from "@/web-client/detail/DetailShellEngine";
import { useDetailAutoSaveController } from "@/web-client/detail/useDetailAutoSaveController";
import {
  canUseModuleAction,
  getModuleDetailEditingConfig,
  hasModulePermission,
} from "@/web-client/registry/module-utils";

function buildDraft(project?: ApiProject | null, defaults?: { programId?: string }): ProjectDetailDraft {
  return {
    programId: project?.programId ?? defaults?.programId ?? "",
    name: project?.name ?? "",
    status: project?.status ?? "PLANNED",
    startsAt: toDateInputValue(project?.startsAt),
    endsAt: toDateInputValue(project?.endsAt),
    description: project?.description ?? "",
    internalNotes: project?.internalNotes ?? null,
  };
}

function normalizeDraft(draft: ProjectDetailDraft): ProjectDetailDraft {
  return {
    programId: draft.programId,
    name: draft.name.trim(),
    status: draft.status,
    startsAt: draft.startsAt || "",
    endsAt: draft.endsAt || "",
    description: draft.description.trim(),
    internalNotes: draft.internalNotes?.trim() ? draft.internalNotes.trim() : null,
  };
}

export function ProjectsDetailEngineClientPage() {
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
  const mode = id === "new" || pathname.endsWith("/projects/new") ? "create" : "edit";
  const isEdit = mode === "edit";
  const initialProgramId = searchParams.get("programId") ?? "";
  const returnTo = searchParams.get("returnTo");

  const canRead = hasModulePermission(projectsDetailModuleDefinition, "canRead", permissions);
  const canCreate = canUseModuleAction(projectsDetailModuleDefinition, "create", permissions);
  const canEdit = canUseModuleAction(projectsDetailModuleDefinition, "edit", permissions);
  const canAudit = canUseModuleAction(projectsDetailModuleDefinition, "audit", permissions);
  const canManageStructure = permissions.includes("project-structure.update") || permissions.includes("project-structure.create");
  const canManageActions = permissions.includes("actions.create") || permissions.includes("actions.update");
  const canManageEnrollments =
    permissions.includes("enrollments.create") || permissions.includes("enrollments.update");
  const canDeleteEnrollments = permissions.includes("enrollments.delete");

  const canAccessPage = mode === "create" ? canCreate : canRead;
  const dataProvider = React.useMemo(() => createRestDataProvider({ token }), [token]);

  const [project, setProject] = React.useState<ApiProject | null>(null);
  const [draft, setDraft] = React.useState<ProjectDetailDraft>(() =>
    buildDraft(null, { programId: initialProgramId }),
  );
  const [programOptions, setProgramOptions] = React.useState<ApiProgram[]>([]);
  const [peopleGroupRows, setPeopleGroupRows] = React.useState<ApiProjectPeopleGroup[]>([]);
  const [groupRows, setGroupRows] = React.useState<ApiProjectGroup[]>([]);
  const [enrollmentRows, setEnrollmentRows] = React.useState<ApiProjectEnrollment[]>([]);
  const [actionRows, setActionRows] = React.useState<ApiProjectAction[]>([]);
  const [loading, setLoading] = React.useState(isEdit);
  const [relationsLoading, setRelationsLoading] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [auditVisibleCount, setAuditVisibleCount] = React.useState(24);
  const [participantPickerOpen, setParticipantPickerOpen] = React.useState(false);
  const [cyclePickerOpen, setCyclePickerOpen] = React.useState(false);

  const loadRelations = React.useCallback(async () => {
    if (!token || !isEdit || !id || !canRead) {
      setPeopleGroupRows([]);
      setGroupRows([]);
      setEnrollmentRows([]);
      setActionRows([]);
      return;
    }

    setRelationsLoading(true);
    try {
      const [peopleGroups, groups, enrollments, actions] = await Promise.all([
        listProjectPeopleGroups(token, id, { participationKind: "PARTICIPANT" }),
        listProjectGroups(token, id),
        listProjectEnrollments(token, id, { page: 1, limit: 200 }),
        listProjectActions(token, id, { page: 1, limit: 200 }),
      ]);
      setPeopleGroupRows(peopleGroups ?? []);
      setGroupRows(groups ?? []);
      setEnrollmentRows(enrollments.data ?? []);
      setActionRows(actions.data ?? []);
    } catch {
      setPeopleGroupRows([]);
      setGroupRows([]);
      setEnrollmentRows([]);
      setActionRows([]);
    } finally {
      setRelationsLoading(false);
    }
  }, [canRead, id, isEdit, token]);

  const persistDraft = React.useCallback(
    async (nextDraft: ProjectDetailDraft) => {
      const normalized = normalizeDraft(nextDraft);
      const updated = await dataProvider.update<ApiProject>(
        projectsDetailModuleDefinition.queryAdapters.detailDataProvider?.model ?? "projects.detail",
        id,
        {
          ...normalized,
          startsAt: normalized.startsAt || null,
          endsAt: normalized.endsAt || null,
          description: normalized.description || null,
          internalNotes: normalized.internalNotes,
        },
      );
      const savedDraft = buildDraft(updated);
      setProject(updated);
      setDraft(savedDraft);
      return savedDraft;
    },
    [dataProvider, id],
  );

  const autoSave = useDetailAutoSaveController<ProjectDetailDraft>({
    draft,
    enabled: isEdit && canEdit,
    config: getModuleDetailEditingConfig(projectsDetailModuleDefinition),
    normalizeDraft,
    onSave: persistDraft,
    onError: (error) => {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao salvar projeto.";
      toast({ variant: "destructive", title: "Falha ao salvar", description: message });
    },
  });
  const { saving: autoSaving, replaceSavedDraft, commitField } = autoSave;
  const saving = busy || autoSaving;

  React.useEffect(() => {
    setAuditVisibleCount(24);
  }, [id, mode]);

  React.useEffect(() => {
    if (!token || !canAccessPage) {
      setProgramOptions([]);
      return;
    }

    listPrograms(token, { all: true, limit: 200 })
      .then((response) => setProgramOptions(response.data ?? []))
      .catch(() => setProgramOptions([]));
  }, [canAccessPage, token]);

  React.useEffect(() => {
    if (!token || !canAccessPage || !isEdit || !id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    dataProvider
      .read<ApiProject>("projects.detail", id)
      .then((loaded) => {
        const nextDraft = buildDraft(loaded);
        setProject(loaded);
        setDraft(nextDraft);
        replaceSavedDraft(nextDraft);
      })
      .catch((error) => {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Falha ao carregar projeto.";
        toast({ variant: "destructive", title: "Falha ao carregar", description: message });
      })
      .finally(() => setLoading(false));
  }, [canAccessPage, dataProvider, id, isEdit, replaceSavedDraft, toast, token]);

  React.useEffect(() => {
    void loadRelations();
  }, [loadRelations]);

  const handleCreate = React.useCallback(async () => {
    if (!canCreate) return;
    const normalized = normalizeDraft(draft);
    if (!normalized.programId || !normalized.name) {
      toast({
        variant: "destructive",
        title: "Dados invalidos",
        description: "Informe programa e nome do projeto.",
      });
      return;
    }

    setBusy(true);
    try {
      const created = await dataProvider.create<ApiProject>("projects.detail", {
        ...normalized,
        startsAt: normalized.startsAt || null,
        endsAt: normalized.endsAt || null,
        description: normalized.description || null,
        internalNotes: normalized.internalNotes,
      });
      toast({ variant: "success", title: "Projeto criado" });
      router.replace(withTenantPath(`${PROJECTS_ROUTES.detail}/${created.id}`, tenantSlug));
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao criar projeto.";
      toast({ variant: "destructive", title: "Falha ao criar", description: message });
    } finally {
      setBusy(false);
    }
  }, [canCreate, dataProvider, draft, router, tenantSlug, toast]);

  const selectedProgram = React.useMemo(() => {
    const currentProgramId = draft.programId || project?.programId || "";
    return (
      programOptions.find((item) => item.id === currentProgramId) ??
      (project?.program ? ({ ...project.program } as ApiProgram) : null)
    );
  }, [draft.programId, programOptions, project?.program, project?.programId]);

  const closeHref = React.useMemo(() => {
    if (returnTo) return returnTo;
    return withTenantPath(PROJECTS_ROUTES.list, tenantSlug);
  }, [returnTo, tenantSlug]);

  const handleCreateEnrollment = React.useCallback(() => {
    setParticipantPickerOpen(true);
  }, []);

  const handleCreateCycle = React.useCallback(() => {
    setCyclePickerOpen(true);
  }, []);

  const handlePickCycle = React.useCallback(
    async (peopleGroup: { id: string }) => {
      if (!token || !id) return;
      try {
        await createProjectPeopleGroup(token, id, {
          peopleGroupId: peopleGroup.id,
          participationKind: "PARTICIPANT",
        });
        toast({ title: "Grupo de Pessoas adicionado" });
        await loadRelations();
      } catch (error) {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Falha ao adicionar grupo de pessoas.";
        toast({ variant: "destructive", title: "Falha ao adicionar", description: message });
      }
    },
    [id, loadRelations, toast, token],
  );

  const handleEndEnrollment = React.useCallback(
    async (enrollment: ApiProjectEnrollment) => {
      if (!token || !id || !canDeleteEnrollments) return;
      const confirmed = await confirm({
        title: "Encerrar matricula",
        description: `Encerrar a matricula de "${enrollment.person.fullName}" preservando o historico?`,
        confirmLabel: "Encerrar",
        cancelLabel: "Cancelar",
        confirmVariant: "destructive",
      });
      if (!confirmed) return;
      try {
        await deleteProjectEnrollment(token, id, enrollment.id);
        toast({ title: "Matricula encerrada" });
        await loadRelations();
      } catch (error) {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Falha ao encerrar matricula.";
        toast({ variant: "destructive", title: "Falha ao encerrar", description: message });
      }
    },
    [canDeleteEnrollments, confirm, id, loadRelations, toast, token],
  );

  const context = React.useMemo<ProjectsDetailLayoutContext>(
    () => ({
      mode,
      readOnly: mode === "create" ? !canCreate : !canEdit,
      canAudit,
      canEdit,
      canManageStructure,
      canManageActions,
      canManageEnrollments,
      canDeleteEnrollments,
      tenantSlug,
      project,
      draft,
      setDraft,
      programOptions: programOptions.map((item) => ({
        value: item.id,
        label: item.name,
        type: item.type,
        status: item.status,
      })),
      selectedProgram,
      peopleGroupRows,
      groupRows,
      enrollmentRows,
      actionRows,
      relationsLoading,
      onCommitField: (field, nextValue) => void commitField(field, nextValue),
      onNotesChange: (next) =>
        setDraft((previous) => ({ ...previous, internalNotes: next })),
      onNotesBlur: () => void commitField("internalNotes"),
      onOpenGroup: (groupId) =>
        router.push(
          withTenantPath(
            `/group/${encodeURIComponent(groupId)}?returnTo=${encodeURIComponent(pathname)}`,
            tenantSlug,
          ),
        ),
      onCreateGroup: () =>
        router.push(
          withTenantPath(
            `/group/new?projectId=${encodeURIComponent(id)}&returnTo=${encodeURIComponent(pathname)}`,
            tenantSlug,
          ),
        ),
      onOpenCycle: (cycleId) =>
        router.push(
          withTenantPath(
            `/projects/${id}/cycles?cycleId=${encodeURIComponent(cycleId)}&returnTo=${encodeURIComponent(pathname)}`,
            tenantSlug,
          ),
        ),
      onCreateCycle: handleCreateCycle,
      onOpenEnrollment: (personId) =>
        router.push(
          withTenantPath(`/people/${personId}?returnTo=${encodeURIComponent(pathname)}`, tenantSlug),
        ),
      onCreateEnrollment: handleCreateEnrollment,
      onEndEnrollment: handleEndEnrollment,
      onOpenAction: (actionId) =>
        router.push(
          withTenantPath(
            `/actions/${actionId}?projectId=${encodeURIComponent(id)}&returnTo=${encodeURIComponent(pathname)}`,
            tenantSlug,
          ),
        ),
      onCreateAction: () =>
        router.push(
          withTenantPath(
            `/actions/new?projectId=${encodeURIComponent(id)}&returnTo=${encodeURIComponent(pathname)}`,
            tenantSlug,
          ),
        ),
      auditVisibleCount,
      onAuditVisibleCountChange: setAuditVisibleCount,
    }),
    [
      actionRows,
      auditVisibleCount,
      canAudit,
      canCreate,
      canEdit,
      canManageActions,
      canDeleteEnrollments,
      canManageEnrollments,
      canManageStructure,
      commitField,
      draft,
      enrollmentRows,
      groupRows,
      id,
      mode,
      pathname,
      programOptions,
      project,
      relationsLoading,
      handleCreateEnrollment,
      handleCreateCycle,
      handleEndEnrollment,
      router,
      selectedProgram,
      tenantSlug,
    ],
  );

  if (!canAccessPage) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Sem permissao.</div>;
  }

  const headerTitle =
    mode === "create" ? "Novo projeto" : project?.name || draft.name || "Projeto";

  return (
    <>
      <DetailShellEngine<ProjectsDetailLayoutContext>
        moduleDefinition={projectsDetailModuleDefinition}
        context={context}
        dataProvider={dataProvider}
        auditEnabled={canAudit}
        mode={mode}
        headerTitle={headerTitle}
        saving={saving}
        loading={loading}
        readOnly={context.readOnly}
        onSave={mode === "create" ? handleCreate : undefined}
        onClose={() => router.push(closeHref)}
        breadcrumbTitle={headerTitle}
        breadcrumbItems={[
          { label: "Projetos", href: PROJECTS_ROUTES.list },
          ...(mode === "edit" ? [{ label: headerTitle }] : []),
        ]}
      />
      {mode === "edit" && token ? (
        <BulkEnrollmentDialog
          open={participantPickerOpen}
          onOpenChange={setParticipantPickerOpen}
          token={token}
          projectId={id}
          canReadPeople={permissions.includes("people.read")}
          onCompleted={() => {
            void loadRelations();
          }}
        />
      ) : null}
      {mode === "edit" && token ? (
        <ProjectCyclePickerDialog
          open={cyclePickerOpen}
          onOpenChange={setCyclePickerOpen}
          token={token}
          onPick={handlePickCycle}
        />
      ) : null}
    </>
  );
}
