"use client";

import * as React from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { toDateInputValue } from "@/lib/date";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { listProjects, type ApiProject } from "@/modules/projects/api";
import { type ApiProgram } from "@/modules/programs/api";
import { type ProgramsDetailLayoutContext, type ProgramDetailDraft } from "@/modules/programs/config/programs-detail-layout-contract";
import {
  programsDetailModuleDefinition,
  PROGRAMS_ROUTES,
} from "@/modules/programs/config/programs-module-contract";
import { createRestDataProvider } from "@/web-client/data-provider";
import { DetailShellEngine } from "@/web-client/detail/DetailShellEngine";
import { useDetailAutoSaveController } from "@/web-client/detail/useDetailAutoSaveController";
import {
  canUseModuleAction,
  getModuleDetailEditingConfig,
  hasModulePermission,
} from "@/web-client/registry/module-utils";

function buildDraft(program?: ApiProgram | null): ProgramDetailDraft {
  return {
    name: program?.name ?? "",
    type: program?.type ?? "OTHER",
    status: program?.status ?? "PLANNED",
    startsAt: toDateInputValue(program?.startsAt),
    endsAt: toDateInputValue(program?.endsAt),
    description: program?.description ?? "",
    internalNotes: program?.internalNotes ?? null,
  };
}

function normalizeDraft(draft: ProgramDetailDraft): ProgramDetailDraft {
  return {
    name: draft.name.trim(),
    type: draft.type,
    status: draft.status,
    startsAt: draft.startsAt || "",
    endsAt: draft.endsAt || "",
    description: draft.description.trim(),
    internalNotes: draft.internalNotes?.trim() ? draft.internalNotes.trim() : null,
  };
}

export function ProgramsDetailEngineClientPage() {
  const params = useParams<{ id?: string }>();
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);

  const id = params?.id ? String(params.id) : "";
  const mode = id === "new" || pathname.endsWith("/programs/new") ? "create" : "edit";
  const isEdit = mode === "edit";

  const canRead = hasModulePermission(programsDetailModuleDefinition, "canRead", permissions);
  const canCreate = canUseModuleAction(programsDetailModuleDefinition, "create", permissions);
  const canEdit = canUseModuleAction(programsDetailModuleDefinition, "edit", permissions);
  const canAudit = canUseModuleAction(programsDetailModuleDefinition, "audit", permissions);

  const canAccessPage = mode === "create" ? canCreate : canRead;
  const dataProvider = React.useMemo(() => createRestDataProvider({ token }), [token]);

  const [program, setProgram] = React.useState<ApiProgram | null>(null);
  const [draft, setDraft] = React.useState<ProgramDetailDraft>(buildDraft());
  const [projectRows, setProjectRows] = React.useState<ApiProject[]>([]);
  const [loading, setLoading] = React.useState(isEdit);
  const [projectsLoading, setProjectsLoading] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [auditVisibleCount, setAuditVisibleCount] = React.useState(24);

  const persistDraft = React.useCallback(
    async (nextDraft: ProgramDetailDraft) => {
      const normalized = normalizeDraft(nextDraft);
      const updated = await dataProvider.update<ApiProgram>(
        programsDetailModuleDefinition.queryAdapters.detailDataProvider?.model ?? "programs.detail",
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
      setProgram(updated);
      setDraft(savedDraft);
      return savedDraft;
    },
    [dataProvider, id],
  );

  const autoSave = useDetailAutoSaveController<ProgramDetailDraft>({
    draft,
    enabled: isEdit && canEdit,
    config: getModuleDetailEditingConfig(programsDetailModuleDefinition),
    normalizeDraft,
    onSave: persistDraft,
    onError: (error) => {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao salvar programa.";
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
      .read<ApiProgram>("programs.detail", id)
      .then((loaded) => {
        const nextDraft = buildDraft(loaded);
        setProgram(loaded);
        setDraft(nextDraft);
        replaceSavedDraft(nextDraft);
      })
      .catch((error) => {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Falha ao carregar programa.";
        toast({ variant: "destructive", title: "Falha ao carregar", description: message });
      })
      .finally(() => setLoading(false));
  }, [canAccessPage, dataProvider, id, isEdit, replaceSavedDraft, toast, token]);

  React.useEffect(() => {
    if (!token || !isEdit || !id || !canRead) {
      setProjectRows([]);
      return;
    }

    setProjectsLoading(true);
    listProjects(token, { programId: id, all: true })
      .then((response) => setProjectRows(response.data ?? []))
      .catch(() => setProjectRows([]))
      .finally(() => setProjectsLoading(false));
  }, [canRead, id, isEdit, token]);

  const handleCreate = React.useCallback(async () => {
    if (!canCreate) return;
    const normalized = normalizeDraft(draft);
    if (!normalized.name) {
      toast({
        variant: "destructive",
        title: "Dados invalidos",
        description: "Informe o nome do programa.",
      });
      return;
    }

    setBusy(true);
    try {
      const created = await dataProvider.create<ApiProgram>("programs.detail", {
        ...normalized,
        startsAt: normalized.startsAt || null,
        endsAt: normalized.endsAt || null,
        description: normalized.description || null,
        internalNotes: normalized.internalNotes,
      });
      toast({ variant: "success", title: "Programa criado" });
      router.replace(withTenantPath(`${PROGRAMS_ROUTES.detail}/${created.id}`, tenantSlug));
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao criar programa.";
      toast({ variant: "destructive", title: "Falha ao criar", description: message });
    } finally {
      setBusy(false);
    }
  }, [canCreate, dataProvider, draft, router, tenantSlug, toast]);

  const context = React.useMemo<ProgramsDetailLayoutContext>(
    () => ({
      mode,
      readOnly: mode === "create" ? !canCreate : !canEdit,
      canAudit,
      canEdit,
      program,
      draft,
      setDraft,
      projectRows,
      projectsLoading,
      onCommitField: (field, nextValue) => void commitField(field, nextValue),
      onNotesChange: (next) =>
        setDraft((previous) => ({ ...previous, internalNotes: next })),
      onNotesBlur: () => void commitField("internalNotes"),
      onOpenProject: (projectId) =>
        router.push(
          withTenantPath(`/projects/${projectId}?returnTo=${encodeURIComponent(pathname)}`, tenantSlug),
        ),
      onCreateProject: () =>
        router.push(
          withTenantPath(
            `/projects/new?programId=${encodeURIComponent(id)}&returnTo=${encodeURIComponent(pathname)}`,
            tenantSlug,
          ),
        ),
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
      id,
      mode,
      pathname,
      program,
      projectRows,
      projectsLoading,
      router,
      tenantSlug,
    ],
  );

  if (!canAccessPage) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Sem permissao.</div>;
  }

  const headerTitle =
    mode === "create" ? "Novo programa" : program?.name || draft.name || "Programa";

  return (
    <DetailShellEngine<ProgramsDetailLayoutContext>
      moduleDefinition={programsDetailModuleDefinition}
      context={context}
      dataProvider={dataProvider}
      auditEnabled={canAudit}
      mode={mode}
      headerTitle={headerTitle}
      saving={saving}
      loading={loading}
      readOnly={context.readOnly}
      onSave={mode === "create" ? handleCreate : undefined}
      onClose={() => router.push(withTenantPath(PROGRAMS_ROUTES.list, tenantSlug))}
      breadcrumbTitle={headerTitle}
      breadcrumbItems={[
        { label: "Programas", href: PROGRAMS_ROUTES.list },
        ...(mode === "edit" ? [{ label: headerTitle }] : []),
      ]}
    />
  );
}
