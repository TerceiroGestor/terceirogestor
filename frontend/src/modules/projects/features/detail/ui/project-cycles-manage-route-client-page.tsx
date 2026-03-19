"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConfirm } from "@/components/confirm/use-confirm";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { withTenantPath, getTenantSlugFromPath } from "@/lib/tenant-path";
import { DetailShell } from "@/components/layout/DetailShell";
import { DetailTabsRenderer } from "@/web-client/detail/DetailLayoutSections";
import { DetailAuditFeed } from "@/web-client/detail/DetailAuditFeed";
import { DetailNotesPanel } from "@/web-client/detail/DetailNotesPanel";
import { DetailSideTabs } from "@/web-client/detail/DetailSideTabs";
import { buildGroupedAuditFeed } from "@/web-client/detail/audit-feed-utils";
import { useDetailAuditFeed } from "@/web-client/detail/useDetailAuditFeed";
import { useDetailAutoSaveController } from "@/web-client/detail/useDetailAutoSaveController";
import { createRestDataProvider } from "@/web-client/data-provider";
import type { DetailTabTemplate } from "@/web-client/registry/types";
import { ModuleEmptyState } from "@/web-client/ui/ModulePrimitives";
import {
  deleteProjectCycle,
  getProject,
  listProjectCycles,
  listProjectEnrollments,
  setEnrollmentCycle,
  updateProjectCycle,
  type ApiProject,
  type ApiProjectCycle,
  type ApiProjectEnrollment,
} from "@/modules/projects/api";
import { PersonIdentityAvatarTrigger } from "@/modules/people/shared/ui/person-identity-card";
import { getAgeFromBirthDate } from "@/modules/people/shared/domain/utils";
import { ProjectEnrollmentPickerDialog } from "@/modules/projects/features/detail/ui/project-enrollment-picker-dialog";

type CycleDraft = {
  name: string;
  segmentId: string | null;
  segmentName: string | null;
  segmentCategory: string | null;
  segmentAgeMin: number | null;
  segmentAgeMax: number | null;
  catalogCycleId: string | null;
  catalogCycleName: string | null;
  startsAt: string;
  endsAt: string;
  internalNotes: string | null;
};

const CYCLE_AUTO_SAVE_CONFIG = {
  saveMode: "auto",
  autoSave: { trigger: "field-commit" },
} as const;

function normalizeDraft(draft: CycleDraft): CycleDraft {
  return {
    ...draft,
    startsAt: draft.startsAt || "",
    endsAt: draft.endsAt || "",
    internalNotes: draft.internalNotes?.trim() ? draft.internalNotes.trim() : null,
  };
}

type CycleDetailContext = {
  readOnly: boolean;
  rows: ApiProjectEnrollment[];
  loading: boolean;
  canManageParticipants: boolean;
  onOpenPerson: (personId: string) => void;
  onAddParticipant: () => void;
  onEndParticipation: (enrollment: ApiProjectEnrollment) => void;
};

function formatSegmentCategory(value: string | null | undefined) {
  if (!value) return "-";
  return String(value);
}

function formatAgeRange(ageMin: number | null | undefined, ageMax: number | null | undefined) {
  if (ageMin == null && ageMax == null) return "Livre";
  return `${ageMin ?? "-"} a ${ageMax ?? "-"}`;
}

function buildParticipantColumns(
  context: CycleDetailContext,
  tenantSlug: string,
): ColumnDef<ApiProjectEnrollment>[] {
  return [
    {
      id: "person",
      header: "Pessoa",
      accessorFn: (row) => row.person.fullName,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <PersonIdentityAvatarTrigger
            personId={row.original.person.id}
            tenantSlug={tenantSlug}
            fullName={row.original.person.fullName}
            birthDate={row.original.person.birthDate ?? null}
            avatarUrl={row.original.person.avatarUrl}
            hasHealthCondition={row.original.person.hasHealthCondition}
            hasMedication={row.original.person.hasMedication}
          />
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-foreground">
              {row.original.person.fullName}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {row.original.person.status ?? "-"}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "age",
      header: "Idade",
      accessorFn: (row) => getAgeFromBirthDate(row.person.birthDate) ?? null,
      meta: { dataType: "number" },
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {getAgeFromBirthDate(row.original.person.birthDate) ?? "-"}
        </span>
      ),
    },
    {
      id: "groups",
      header: "Grupos",
      accessorFn: (row) => row.groups.map((group) => group.name).join(", "),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.groups.length
            ? row.original.groups.map((group) => group.name).join(", ")
            : "Sem grupo"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) =>
        context.canManageParticipants ? (
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 rounded-none border-b border-border/60 px-1"
              onClick={(event) => {
                event.stopPropagation();
                context.onEndParticipation(row.original);
              }}
            >
              Encerrar vinculo
            </Button>
          </div>
        ) : null,
    },
  ];
}

function buildParticipantTabs(
  tenantSlug: string,
): DetailTabTemplate<CycleDetailContext>[] {
  return [
    {
      key: "participants",
      label: "Participantes",
      badge: (context) => context.rows.length,
      relations: [
        {
          key: "cycle.participants",
          label: "Participantes",
          loading: (context) => context.loading,
          rows: (context) => context.rows,
          columns: (context) => buildParticipantColumns(context, tenantSlug),
          getRowId: (row) => row.id,
          onRowClick: (row, context) => context.onOpenPerson(row.person.id),
          action: {
            label: "Adicionar participante",
            onClick: (context) => context.onAddParticipant(),
            hidden: (context) => context.readOnly || !context.canManageParticipants,
          },
          searchPlaceholder: "Pesquisar",
          filterRows: (rows, query) => {
            const needle = query.trim().toLocaleLowerCase();
            if (!needle) return rows;
            return rows.filter((row) =>
              [
                row.person.fullName,
                row.person.status ?? "",
                row.groups
                  .map((group: { id: string; name: string }) => group.name)
                  .join(" "),
                row.cycle?.name ?? "",
              ]
                .join(" ")
                .toLocaleLowerCase()
                .includes(needle),
            );
          },
          emptyLabel: "Nenhum participante neste segmento.",
        },
      ],
    },
  ];
}

export function ProjectCyclesManageRouteClientPage() {
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const tenantSlug = getTenantSlugFromPath(pathname) ?? "";
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const dataProvider = React.useMemo(() => createRestDataProvider({ token }), [token]);
  const auditAdapter = React.useMemo(() => ({ model: "audit.logs" as const }), []);

  const projectId = params?.id ? String(params.id) : "";
  const cycleId = searchParams.get("cycleId");
  const returnTo =
    searchParams.get("returnTo") ?? withTenantPath(`/projects/${projectId}`, tenantSlug);
  const mode = cycleId ? "edit" : "create";

  const canReadProject = permissions.includes("projects.read");
  const canReadStructure = permissions.includes("project-structure.read");
  const canCreateStructure = permissions.includes("project-structure.create");
  const canUpdateStructure = permissions.includes("project-structure.update");
  const canDeleteStructure = permissions.includes("project-structure.delete");
  const canReadEnrollments = permissions.includes("enrollments.read");
  const canUpdateEnrollments = permissions.includes("enrollments.update");
  const canAudit = permissions.includes("audit.read");

  const [project, setProject] = React.useState<ApiProject | null>(null);
  const [cycle, setCycle] = React.useState<ApiProjectCycle | null>(null);
  const [draft, setDraft] = React.useState<CycleDraft>({
    name: "",
    segmentId: null,
    segmentName: null,
    segmentCategory: null,
    segmentAgeMin: null,
    segmentAgeMax: null,
    catalogCycleId: null,
    catalogCycleName: null,
    startsAt: "",
    endsAt: "",
    internalNotes: null,
  });
  const [rows, setRows] = React.useState<ApiProjectEnrollment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [participantsLoading, setParticipantsLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [auditVisibleCount, setAuditVisibleCount] = React.useState(24);

  const persistDraft = React.useCallback(
    async (nextDraft: CycleDraft) => {
      if (!token || !projectId || !cycleId) {
        return normalizeDraft(nextDraft);
      }
      const updated = await updateProjectCycle(token, projectId, cycleId, {
        startsAt: nextDraft.startsAt || null,
        endsAt: nextDraft.endsAt || null,
        internalNotes: nextDraft.internalNotes?.trim() || null,
      });
      const savedDraft = {
        name: updated.name,
        segmentId: updated.segmentId ?? null,
        segmentName: updated.segment?.name ?? null,
        segmentCategory: updated.segment?.category ?? null,
        segmentAgeMin: updated.segment?.ageMin ?? null,
        segmentAgeMax: updated.segment?.ageMax ?? null,
        catalogCycleId: updated.catalogCycleId ?? null,
        catalogCycleName: updated.catalogCycle?.name ?? null,
        startsAt: updated.startsAt?.slice(0, 10) ?? "",
        endsAt: updated.endsAt?.slice(0, 10) ?? "",
        internalNotes: updated.internalNotes ?? null,
      };
      setCycle(updated);
      setDraft(savedDraft);
      return savedDraft;
    },
    [cycleId, projectId, token],
  );

  const autoSave = useDetailAutoSaveController<CycleDraft>({
    draft,
    enabled: mode === "edit" && canUpdateStructure,
    config: CYCLE_AUTO_SAVE_CONFIG,
    normalizeDraft,
    onSave: persistDraft,
    onError: (error) => {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao salvar vinculo.";
      toast({ variant: "destructive", title: "Falha ao salvar", description: message });
    },
  });
  const { saving: autoSaving, replaceSavedDraft, commitField } = autoSave;

  const loadPage = React.useCallback(async () => {
    if (!token || !projectId || !canReadProject) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const nextProject = await getProject(token, projectId);
      setProject(nextProject);

      if (cycleId && canReadStructure) {
        const cycles = await listProjectCycles(token, projectId);
        const selected = cycles.find((item) => item.id === cycleId) ?? null;
        const nextDraft = {
          name: selected?.name ?? "",
          segmentId: selected?.segmentId ?? null,
          segmentName: selected?.segment?.name ?? null,
          segmentCategory: selected?.segment?.category ?? null,
          segmentAgeMin: selected?.segment?.ageMin ?? null,
          segmentAgeMax: selected?.segment?.ageMax ?? null,
          catalogCycleId: selected?.catalogCycleId ?? null,
          catalogCycleName: selected?.catalogCycle?.name ?? null,
          startsAt: selected?.startsAt?.slice(0, 10) ?? "",
          endsAt: selected?.endsAt?.slice(0, 10) ?? "",
          internalNotes: selected?.internalNotes ?? null,
        };
        setCycle(selected);
        setDraft(nextDraft);
        replaceSavedDraft(nextDraft);
      } else {
        setCycle(null);
        const emptyDraft = {
          name: "",
          segmentId: null,
          segmentName: null,
          segmentCategory: null,
          segmentAgeMin: null,
          segmentAgeMax: null,
          catalogCycleId: null,
          catalogCycleName: null,
          startsAt: "",
          endsAt: "",
          internalNotes: null,
        };
        setDraft(emptyDraft);
        replaceSavedDraft(emptyDraft);
      }
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao carregar segmento.";
      toast({ variant: "destructive", title: "Falha ao carregar", description: message });
    } finally {
      setLoading(false);
    }
  }, [canReadProject, canReadStructure, cycleId, projectId, replaceSavedDraft, toast, token]);

  const loadParticipants = React.useCallback(async () => {
    if (!token || !projectId || !cycleId || !canReadEnrollments) {
      setRows([]);
      return;
    }
    setParticipantsLoading(true);
    try {
      const response = await listProjectEnrollments(token, projectId, {
        cycleId,
        page: 1,
        limit: 200,
      });
      setRows(response.data);
    } catch {
      setRows([]);
    } finally {
      setParticipantsLoading(false);
    }
  }, [canReadEnrollments, cycleId, projectId, token]);

  React.useEffect(() => {
    void loadPage();
  }, [loadPage]);

  React.useEffect(() => {
    void loadParticipants();
  }, [loadParticipants]);

  const handleSave = React.useCallback(async () => {
    if (!token || !projectId || !cycleId) return;
    const normalizedDraft = normalizeDraft(draft);
    if (!normalizedDraft.name) {
      toast({
        variant: "destructive",
        title: "Dados invalidos",
        description: "Informe o nome do segmento.",
      });
      return;
    }
    setSaving(true);
    try {
      await persistDraft(normalizedDraft);
      toast({ title: "Vinculo atualizado" });
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao salvar vinculo.";
      toast({ variant: "destructive", title: "Falha ao salvar", description: message });
    } finally {
      setSaving(false);
    }
  }, [cycleId, draft, persistDraft, projectId, toast, token]);

  const handleNotesBlur = React.useCallback(async () => {
    void commitField("internalNotes");
  }, [commitField]);

  const handleDelete = React.useCallback(async () => {
    if (!token || !projectId || !cycleId || !canDeleteStructure) return;
    const confirmed = await confirm({
      title: "Excluir segmento",
      description: `Excluir o segmento "${cycle?.name ?? ""}"?`,
      confirmLabel: "Excluir",
      cancelLabel: "Cancelar",
      confirmVariant: "destructive",
    });
    if (!confirmed) return;
    try {
      await deleteProjectCycle(token, projectId, cycleId);
      toast({ title: "Segmento excluido" });
      router.push(returnTo);
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao excluir segmento.";
      toast({ variant: "destructive", title: "Falha ao excluir", description: message });
    }
  }, [canDeleteStructure, confirm, cycle?.name, cycleId, projectId, returnTo, router, toast, token]);

  const handleAddParticipant = React.useCallback(() => {
    setPickerOpen(true);
  }, []);

  const handlePickEnrollment = React.useCallback(
    async (enrollment: ApiProjectEnrollment) => {
      if (!token || !projectId || !cycleId) return;
      try {
        await setEnrollmentCycle(token, projectId, enrollment.id, { cycleId });
        toast({ title: "Participante adicionado" });
        await loadParticipants();
      } catch (error) {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Falha ao adicionar participante.";
        toast({ variant: "destructive", title: "Falha ao adicionar", description: message });
      }
    },
    [cycleId, loadParticipants, projectId, toast, token],
  );

  const handleBulkPickEnrollment = React.useCallback(
    async (enrollments: ApiProjectEnrollment[]) => {
      if (!token || !projectId || !cycleId || enrollments.length === 0) return;

      let added = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const enrollment of enrollments) {
        try {
          await setEnrollmentCycle(token, projectId, enrollment.id, { cycleId });
          added += 1;
        } catch (error) {
          failed += 1;
          const message =
            error && typeof error === "object" && "message" in error
              ? String((error as { message?: string }).message)
              : "Falha ao adicionar participante.";
          errors.push(`${enrollment.person.fullName}: ${message}`);
        }
      }

      if (added > 0 || failed === 0) {
        toast({
          title: added === 1 ? "Participante adicionado" : "Participantes adicionados",
          description:
            failed > 0
              ? `${added} adicionados e ${failed} com erro.`
              : `${added} adicionados.`,
          variant: failed > 0 ? "destructive" : "default",
        });
      }

      if (failed > 0 && added === 0) {
        toast({
          variant: "destructive",
          title: "Falha ao adicionar",
          description: errors.slice(0, 3).join(" | "),
        });
      }

      await loadParticipants();
    },
    [cycleId, loadParticipants, projectId, toast, token],
  );

  const handleEndParticipation = React.useCallback(
    async (enrollment: ApiProjectEnrollment) => {
      if (!token || !projectId || !cycleId || !canUpdateEnrollments) return;
      const confirmed = await confirm({
        title: "Encerrar vinculo",
        description: `Encerrar o vinculo de "${enrollment.person.fullName}" com este segmento preservando o historico?`,
        confirmLabel: "Encerrar",
        cancelLabel: "Cancelar",
        confirmVariant: "destructive",
      });
      if (!confirmed) return;
      try {
        await setEnrollmentCycle(token, projectId, enrollment.id, { cycleId: null });
        toast({ title: "Vinculo encerrado" });
        await loadParticipants();
      } catch (error) {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Falha ao encerrar vinculo.";
        toast({ variant: "destructive", title: "Falha ao encerrar", description: message });
      }
    },
    [canUpdateEnrollments, confirm, cycleId, loadParticipants, projectId, toast, token],
  );

  const tabs = React.useMemo(
    () => buildParticipantTabs(tenantSlug),
    [tenantSlug],
  );

  const detailAudit = useDetailAuditFeed({
    dataProvider,
    auditAdapter,
    context: { entityId: cycleId ?? "" },
    enabled: Boolean(cycleId && token && canAudit),
    auditConfig: {
      primaryEntity: {
        key: "projectCycle",
        entity: "ProjectCycle",
        model: "audit.logs",
        label: "Segmento",
        fieldLabels: {
          name: "Nome",
          startsAt: "Inicio",
          endsAt: "Fim",
          internalNotes: "Notas internas",
          createdAt: "Criado em",
          updatedAt: "Atualizado em",
        },
        resolveEntityId: () => cycleId ?? undefined,
      },
      sort: [{ field: "createdAt", direction: "desc" }],
      pagination: { limit: 120 },
    },
  });
  const auditCount = buildGroupedAuditFeed(detailAudit?.logs ?? []).length;

  const context = React.useMemo<CycleDetailContext>(
    () => ({
      readOnly: mode === "create" ? !canCreateStructure : !canUpdateStructure,
      rows,
      loading: participantsLoading,
      canManageParticipants: Boolean(cycleId) && canUpdateEnrollments,
      onOpenPerson: (personId) =>
        router.push(
          withTenantPath(
            `/people/${personId}?returnTo=${encodeURIComponent(pathname)}`,
            tenantSlug,
          ),
        ),
      onAddParticipant: handleAddParticipant,
      onEndParticipation: handleEndParticipation,
    }),
    [
      canCreateStructure,
      canUpdateEnrollments,
      canUpdateStructure,
      cycleId,
      handleAddParticipant,
      handleEndParticipation,
      mode,
      participantsLoading,
      pathname,
      router,
      rows,
      tenantSlug,
    ],
  );

  if (!canReadProject) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Sem permissao.</div>;
  }

  const title =
    mode === "create"
      ? "Adicionar segmento"
      : cycle?.segment?.name ||
        cycle?.catalogCycle?.name ||
        cycle?.name ||
        draft.segmentName ||
        draft.catalogCycleName ||
        draft.name ||
        "Segmento";

  return (
    <>
      <DetailShell
        breadcrumbTitle={title}
        breadcrumbItems={[
          { label: "Projetos", href: "/projects" },
          {
            label: project?.name ?? "Projeto",
            href: `/projects/${projectId}`,
          },
          { label: "Segmentos", href: `/projects/${projectId}` },
          ...(mode === "edit" ? [{ label: title }] : []),
        ]}
        mode={mode}
        headerTitle={title}
        saving={saving || autoSaving}
        loading={loading}
        readOnly={context.readOnly}
        onSave={mode === "edit" ? handleSave : undefined}
        onClose={() => router.push(returnTo)}
        headerInfoSlot={
          <div className="border-y border-border/60 bg-transparent px-0 py-3">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="text-muted-foreground">Projeto</div>
                <div className="font-medium text-foreground">{project?.name ?? "-"}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-muted-foreground">Segmento</div>
                <div className="font-medium text-foreground">
                  {(draft.segmentName ?? draft.catalogCycleName ?? draft.name).trim() || "-"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-muted-foreground">Categoria</div>
                <div className="font-medium text-foreground">
                  {formatSegmentCategory(cycle?.segment?.category ?? draft.segmentCategory)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-muted-foreground">Participantes</div>
                <div className="font-medium text-foreground">{rows.length}</div>
              </div>
            </div>
          </div>
        }
        headerActionsSlot={
          mode === "edit" && canDeleteStructure ? (
            <Button type="button" variant="outline" onClick={handleDelete}>
              Excluir
            </Button>
          ) : null
        }
        mainSlot={
          mode === "edit" ? (
            <div className="border-y border-border/60 bg-transparent px-0 py-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-3">
                  <div className="mb-2 text-xs font-medium text-muted-foreground">
                    Segmento institucional
                  </div>
                  <Input
                    value={draft.segmentName ?? draft.catalogCycleName ?? draft.name}
                    className="h-10 rounded-none border-0 border-b border-border/70 bg-transparent px-0 text-sm shadow-none focus-visible:border-primary focus-visible:ring-0"
                    placeholder="Segmento institucional"
                    readOnly
                  />
                </div>
                <div>
                  <div className="mb-2 text-xs font-medium text-muted-foreground">Categoria</div>
                  <Input
                    value={formatSegmentCategory(cycle?.segment?.category ?? draft.segmentCategory)}
                    className="h-10 rounded-none border-0 border-b border-border/70 bg-transparent px-0 text-sm shadow-none focus-visible:border-primary focus-visible:ring-0"
                    readOnly
                  />
                </div>
                <div>
                  <div className="mb-2 text-xs font-medium text-muted-foreground">Faixa etaria</div>
                  <Input
                    value={formatAgeRange(
                      cycle?.segment?.ageMin ?? draft.segmentAgeMin,
                      cycle?.segment?.ageMax ?? draft.segmentAgeMax,
                    )}
                    className="h-10 rounded-none border-0 border-b border-border/70 bg-transparent px-0 text-sm shadow-none focus-visible:border-primary focus-visible:ring-0"
                    readOnly
                  />
                </div>
                <div>
                  <div className="mb-2 text-xs font-medium text-muted-foreground">Inicio</div>
                  <Input
                    type="date"
                    value={draft.startsAt}
                    onChange={(event) =>
                      setDraft((previous) => ({ ...previous, startsAt: event.target.value }))
                    }
                    onBlur={() => void commitField("startsAt")}
                    className="h-10 rounded-none border-0 border-b border-border/70 bg-transparent px-0 text-sm shadow-none focus-visible:border-primary focus-visible:ring-0"
                    readOnly={context.readOnly}
                  />
                </div>
                <div>
                  <div className="mb-2 text-xs font-medium text-muted-foreground">Fim</div>
                  <Input
                    type="date"
                    value={draft.endsAt}
                    onChange={(event) =>
                      setDraft((previous) => ({ ...previous, endsAt: event.target.value }))
                    }
                    onBlur={() => void commitField("endsAt")}
                    className="h-10 rounded-none border-0 border-b border-border/70 bg-transparent px-0 text-sm shadow-none focus-visible:border-primary focus-visible:ring-0"
                    readOnly={context.readOnly}
                  />
                </div>
              </div>
            </div>
          ) : (
            <ModuleEmptyState
              title="Adicione pelo projeto"
              description="Use a tab de segmentos no detail do projeto para vincular segmentos institucionais."
              compact
            />
          )
        }
        bottomSlot={
          mode === "edit" ? (
            <DetailTabsRenderer tabs={tabs} context={context} />
          ) : (
            <ModuleEmptyState
              title="Gerencie pelo projeto"
              description="Vincule segmentos a partir da tab de segmentos no detail do projeto."
              compact
            />
          )
        }
        sideSlot={
          <DetailSideTabs
            defaultValue="activity"
            tabs={[
              {
                value: "activity",
                label: "Auditoria",
                badge: auditCount || undefined,
                content: canAudit ? (
                  <DetailAuditFeed
                    mode={mode}
                    auditState={detailAudit}
                    auditVisibleCount={auditVisibleCount}
                    onAuditVisibleCountChange={setAuditVisibleCount}
                    emptyLabel="Sem atividade registrada."
                  />
                ) : (
                  <div className="text-sm text-muted-foreground">Sem permissao para auditoria.</div>
                ),
              },
              {
                value: "notes",
                label: "Anotacoes",
                content: (
                  <DetailNotesPanel
                    value={draft.internalNotes}
                    onChange={(next) =>
                      setDraft((previous) => ({ ...previous, internalNotes: next }))
                    }
                    onBlur={() => void handleNotesBlur()}
                    readOnly={context.readOnly}
                  />
                ),
              },
              {
                value: "context",
                label: "Contexto",
                content: (
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-3">
                      <span className="text-muted-foreground">Projeto</span>
                      <span className="text-right text-foreground">{project?.name ?? "-"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-3">
                      <span className="text-muted-foreground">Segmento</span>
                      <span className="text-right text-foreground">
                        {(draft.segmentName ?? draft.catalogCycleName ?? draft.name).trim() || "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-3">
                      <span className="text-muted-foreground">Categoria</span>
                      <span className="text-right text-foreground">
                        {formatSegmentCategory(cycle?.segment?.category ?? draft.segmentCategory)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-3">
                      <span className="text-muted-foreground">Faixa etaria</span>
                      <span className="text-right text-foreground">
                        {formatAgeRange(
                          cycle?.segment?.ageMin ?? draft.segmentAgeMin,
                          cycle?.segment?.ageMax ?? draft.segmentAgeMax,
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-3">
                      <span className="text-muted-foreground">Inicio</span>
                      <span className="text-right text-foreground">
                        {draft.startsAt || "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-3">
                      <span className="text-muted-foreground">Fim</span>
                      <span className="text-right text-foreground">
                        {draft.endsAt || "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Participantes</span>
                      <span className="text-foreground">{rows.length}</span>
                    </div>
                  </div>
                ),
              },
            ]}
          />
        }
      />
      {cycleId && token ? (
        <ProjectEnrollmentPickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          token={token}
          projectId={projectId}
          title="Adicionar participante"
          description="Escolha participantes matriculados no projeto."
          actionLabel="Adicionar"
          excludeCycleId={cycleId}
          onPick={handlePickEnrollment}
          onBulkPick={handleBulkPickEnrollment}
        />
      ) : null}
    </>
  );
}
