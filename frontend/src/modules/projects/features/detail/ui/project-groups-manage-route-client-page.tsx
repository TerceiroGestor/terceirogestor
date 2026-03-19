"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { buildQueryFacets } from "@/web-client/control-panel/queryFacets";
import { SearchBar } from "@/web-client/control-panel/SearchBar";
import { SearchPanelMenu } from "@/web-client/control-panel/SearchPanelMenu";
import { createRestDataProvider } from "@/web-client/data-provider";
import { removeConditionAtIndex } from "@/web-client/domain/conditions";
import {
  includesFoldedText,
  matchesDomainRecord,
} from "@/web-client/domain/evaluate";
import type { Domain } from "@/web-client/domain/types";
import type {
  AuditFeedConfig,
  DetailTabTemplate,
} from "@/web-client/registry/types";
import { adminAuditSearchView } from "@/web-client/registry/searchViews/admin";
import { peopleSearchView } from "@/web-client/registry/searchViews/people";
import { ModuleEmptyState } from "@/web-client/ui/ModulePrimitives";
import {
  addEnrollmentToGroup,
  createProjectGroup,
  deleteProjectGroup,
  getProject,
  listAllProjectGroups,
  listProjectEnrollments,
  listProjectGroups,
  removeEnrollmentFromGroup,
  updateProjectGroup,
  type ApiProject,
  type ApiProjectEnrollment,
  type ApiProjectGroup,
} from "@/modules/projects/api";
import { PersonIdentityAvatarTrigger } from "@/modules/people/shared/ui/person-identity-card";
import { getAgeFromBirthDate } from "@/modules/people/shared/domain/utils";
import { ProjectEnrollmentPickerDialog } from "@/modules/projects/features/detail/ui/project-enrollment-picker-dialog";

type GroupDraft = {
  name: string;
  description: string;
  internalNotes: string | null;
};

const GROUP_AUTO_SAVE_CONFIG = {
  saveMode: "auto",
  autoSave: { trigger: "field-commit" },
} as const;

function normalizeDraft(draft: GroupDraft): GroupDraft {
  return {
    name: draft.name.trim(),
    description: draft.description.trim(),
    internalNotes: draft.internalNotes?.trim()
      ? draft.internalNotes.trim()
      : null,
  };
}

function flattenSearchableValues(value: unknown): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value.flatMap((entry) => flattenSearchableValues(entry));
  }
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap((entry) =>
      flattenSearchableValues(entry),
    );
  }
  return [String(value)];
}

type GroupDetailContext = {
  readOnly: boolean;
  rows: ApiProjectEnrollment[];
  historyRows: ApiProjectEnrollment[];
  loading: boolean;
  canManageParticipants: boolean;
  onOpenPerson: (personId: string) => void;
  onAddParticipant: () => void;
  onEndMembership: (enrollment: ApiProjectEnrollment) => void;
};

function buildParticipantColumns(
  context: GroupDetailContext,
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
      id: "peopleGroups",
      header: "Grupos de Pessoas",
      accessorFn: (row) =>
        row.peopleGroups.map((peopleGroup) => peopleGroup.name).join(", "),
      cell: ({ row }) => {
        const label = row.original.peopleGroups
          .map((peopleGroup) => peopleGroup.name)
          .join(", ");
        return (
          <span className="text-xs text-muted-foreground">
            {label || "Sem grupo de pessoas"}
          </span>
        );
      },
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
                context.onEndMembership(row.original);
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
): DetailTabTemplate<GroupDetailContext>[] {
  return [
    {
      key: "participants",
      label: "Participantes",
      badge: (context) => context.rows.length,
      relations: [
        {
          key: "group.participants",
          label: "Participantes",
          loading: (context) => context.loading,
          rows: (context) => context.rows,
          columns: (context) => buildParticipantColumns(context, tenantSlug),
          getRowId: (row) => row.id,
          onRowClick: (row, context) => context.onOpenPerson(row.person.id),
          action: {
            label: "Adicionar participante",
            onClick: (context) => context.onAddParticipant(),
            hidden: (context) =>
              context.readOnly || !context.canManageParticipants,
          },
          searchPlaceholder: "Pesquisar",
          filterRows: (rows, query) => {
            const needle = query.trim().toLocaleLowerCase();
            if (!needle) return rows;
            return rows.filter((row) =>
              [
                row.person.fullName,
                row.person.status ?? "",
                row.peopleGroups
                  .map(
                    (peopleGroup: {
                      id: string;
                      name: string;
                      category?: string | null;
                    }) => peopleGroup.name,
                  )
                  .join(" "),
                row.groups
                  .map((group: { id: string; name: string }) => group.name)
                  .join(" "),
              ]
                .join(" ")
                .toLocaleLowerCase()
                .includes(needle),
            );
          },
          emptyLabel: "Nenhum participante neste grupo operacional.",
        },
      ],
    },
  ];
}

export function ProjectGroupsManageRouteClientPage({
  forcedProjectId,
  forcedGroupId,
  returnToOverride,
}: {
  forcedProjectId?: string;
  forcedGroupId?: string;
  returnToOverride?: string;
} = {}) {
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const tenantSlug = getTenantSlugFromPath(pathname) ?? "";
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const dataProvider = React.useMemo(
    () => createRestDataProvider({ token }),
    [token],
  );
  const auditAdapter = React.useMemo(
    () => ({ model: "audit.logs" as const }),
    [],
  );

  const projectId = forcedProjectId ?? (params?.id ? String(params.id) : "");
  const groupId = forcedGroupId ?? searchParams.get("groupId");
  const returnTo =
    returnToOverride ??
    searchParams.get("returnTo") ??
    withTenantPath(projectId ? `/projects/${projectId}` : "/group", tenantSlug);
  const mode = groupId ? "edit" : "create";

  const canReadProject = permissions.includes("projects.read");
  const canReadStructure = permissions.includes("project-structure.read");
  const canCreateStructure = permissions.includes("project-structure.create");
  const canUpdateStructure = permissions.includes("project-structure.update");
  const canDeleteStructure = permissions.includes("project-structure.delete");
  const canReadEnrollments = permissions.includes("enrollments.read");
  const canUpdateEnrollments = permissions.includes("enrollments.update");
  const canAudit = permissions.includes("audit.read");

  const [project, setProject] = React.useState<ApiProject | null>(null);
  const [group, setGroup] = React.useState<ApiProjectGroup | null>(null);
  const [draft, setDraft] = React.useState<GroupDraft>({
    name: "",
    description: "",
    internalNotes: null,
  });
  const [rows, setRows] = React.useState<ApiProjectEnrollment[]>([]);
  const [historyRows, setHistoryRows] = React.useState<ApiProjectEnrollment[]>(
    [],
  );
  const [loading, setLoading] = React.useState(true);
  const [participantsLoading, setParticipantsLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [auditVisibleCount, setAuditVisibleCount] = React.useState(24);
  const [historySearchText, setHistorySearchText] = React.useState("");
  const [historyDomain, setHistoryDomain] = React.useState<Domain>(null);
  const [historyGroupBy, setHistoryGroupBy] = React.useState<string[]>([]);
  const [auditSearchText, setAuditSearchText] = React.useState("");
  const [auditDomain, setAuditDomain] = React.useState<Domain>(null);
  const [auditGroupBy, setAuditGroupBy] = React.useState<string[]>([]);

  const persistDraft = React.useCallback(
    async (nextDraft: GroupDraft) => {
      if (!token || !projectId || !groupId) {
        return normalizeDraft(nextDraft);
      }
      const updated = await updateProjectGroup(token, projectId, groupId, {
        name: nextDraft.name.trim(),
        description: nextDraft.description.trim() || null,
        internalNotes: nextDraft.internalNotes?.trim() || null,
      });
      const savedDraft = {
        name: updated.name,
        description: updated.description ?? "",
        internalNotes: updated.internalNotes ?? null,
      };
      setGroup(updated);
      setDraft(savedDraft);
      return savedDraft;
    },
    [groupId, projectId, token],
  );

  const autoSave = useDetailAutoSaveController<GroupDraft>({
    draft,
    enabled: mode === "edit" && canUpdateStructure,
    config: GROUP_AUTO_SAVE_CONFIG,
    normalizeDraft,
    onSave: persistDraft,
    onError: (error) => {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao salvar grupo operacional.";
      toast({
        variant: "destructive",
        title: "Falha ao salvar",
        description: message,
      });
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

      if (groupId && canReadStructure) {
        const groups = await listProjectGroups(token, projectId);
        const selected = groups.find((item) => item.id === groupId) ?? null;
        const nextDraft = {
          name: selected?.name ?? "",
          description: selected?.description ?? "",
          internalNotes: selected?.internalNotes ?? null,
        };
        setGroup(selected);
        setDraft(nextDraft);
        replaceSavedDraft(nextDraft);
      } else {
        setGroup(null);
        const emptyDraft = { name: "", description: "", internalNotes: null };
        setDraft(emptyDraft);
        replaceSavedDraft(emptyDraft);
      }
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao carregar grupo.";
      toast({
        variant: "destructive",
        title: "Falha ao carregar",
        description: message,
      });
    } finally {
      setLoading(false);
    }
  }, [
    canReadProject,
    canReadStructure,
    groupId,
    projectId,
    replaceSavedDraft,
    toast,
    token,
  ]);

  const loadParticipants = React.useCallback(async () => {
    if (!token || !projectId || !groupId || !canReadEnrollments) {
      setRows([]);
      setHistoryRows([]);
      return;
    }
    setParticipantsLoading(true);
    try {
      const response = await listProjectEnrollments(token, projectId, {
        groupHistoryId: groupId,
        page: 1,
        limit: 200,
      });
      const active = response.data.filter((enrollment) =>
        enrollment.groupMembershipHistory.some(
          (membership) =>
            membership.group.id === groupId &&
            membership.isActive &&
            !membership.deletedAt,
        ),
      );
      const history = response.data.filter((enrollment) =>
        enrollment.groupMembershipHistory.some(
          (membership) =>
            membership.group.id === groupId &&
            (!membership.isActive || Boolean(membership.deletedAt)),
        ),
      );
      setRows(active);
      setHistoryRows(history);
    } catch {
      setRows([]);
      setHistoryRows([]);
    } finally {
      setParticipantsLoading(false);
    }
  }, [canReadEnrollments, groupId, projectId, token]);

  React.useEffect(() => {
    void loadPage();
  }, [loadPage]);

  React.useEffect(() => {
    void loadParticipants();
  }, [loadParticipants]);

  React.useEffect(() => {
    setAuditVisibleCount(24);
    setHistorySearchText("");
    setHistoryDomain(null);
    setHistoryGroupBy([]);
    setAuditSearchText("");
    setAuditDomain(null);
    setAuditGroupBy([]);
  }, [groupId]);

  const handleSave = React.useCallback(async () => {
    if (!token || !projectId) return;
    const normalizedDraft = normalizeDraft(draft);
    if (!normalizedDraft.name) {
      toast({
        variant: "destructive",
        title: "Dados invalidos",
        description: "Informe o nome do grupo operacional.",
      });
      return;
    }
    setSaving(true);
    try {
      if (groupId) {
        await persistDraft(normalizedDraft);
        toast({ title: "Grupo atualizado" });
      } else {
        const created = await createProjectGroup(token, projectId, {
          name: normalizedDraft.name,
          description: normalizedDraft.description || null,
          internalNotes: normalizedDraft.internalNotes,
        });
        setGroup(created);
        const createdDraft = {
          name: created.name,
          description: created.description ?? "",
          internalNotes: created.internalNotes ?? null,
        };
        setDraft(createdDraft);
        replaceSavedDraft(createdDraft);
        toast({ title: "Grupo criado" });
        router.replace(
          withTenantPath(
            `/group/${encodeURIComponent(created.id)}?returnTo=${encodeURIComponent(returnTo)}`,
            tenantSlug,
          ),
        );
      }
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao salvar grupo operacional.";
      toast({
        variant: "destructive",
        title: "Falha ao salvar",
        description: message,
      });
    } finally {
      setSaving(false);
    }
  }, [
    draft,
    groupId,
    persistDraft,
    projectId,
    replaceSavedDraft,
    returnTo,
    router,
    tenantSlug,
    toast,
    token,
  ]);

  const handleNotesBlur = React.useCallback(async () => {
    void commitField("internalNotes");
  }, [commitField]);

  const handleDelete = React.useCallback(async () => {
    if (!token || !projectId || !groupId || !canDeleteStructure) return;
    const confirmed = await confirm({
      title: "Excluir grupo",
      description: `Excluir o grupo "${group?.name ?? ""}"?`,
      confirmLabel: "Excluir",
      cancelLabel: "Cancelar",
      confirmVariant: "destructive",
    });
    if (!confirmed) return;
    try {
      await deleteProjectGroup(token, projectId, groupId);
      toast({ title: "Grupo excluido" });
      router.push(returnTo);
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao excluir grupo.";
      toast({
        variant: "destructive",
        title: "Falha ao excluir",
        description: message,
      });
    }
  }, [
    canDeleteStructure,
    confirm,
    group?.name,
    groupId,
    projectId,
    returnTo,
    router,
    toast,
    token,
  ]);

  const handleAddParticipant = React.useCallback(() => {
    setPickerOpen(true);
  }, []);

  const handlePickEnrollment = React.useCallback(
    async (enrollment: ApiProjectEnrollment) => {
      if (!token || !projectId || !groupId) return;
      try {
        await addEnrollmentToGroup(token, projectId, enrollment.id, {
          groupId,
        });
        toast({ title: "Participante adicionado" });
        await loadParticipants();
      } catch (error) {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Falha ao adicionar participante.";
        toast({
          variant: "destructive",
          title: "Falha ao adicionar",
          description: message,
        });
      }
    },
    [groupId, loadParticipants, projectId, toast, token],
  );

  const handleBulkPickEnrollment = React.useCallback(
    async (enrollments: ApiProjectEnrollment[]) => {
      if (!token || !projectId || !groupId || enrollments.length === 0) return;
      let added = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const enrollment of enrollments) {
        try {
          await addEnrollmentToGroup(token, projectId, enrollment.id, {
            groupId,
          });
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
          title:
            added === 1
              ? "Participante adicionado"
              : "Participantes adicionados",
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
    [groupId, loadParticipants, projectId, toast, token],
  );

  const handleEndMembership = React.useCallback(
    async (enrollment: ApiProjectEnrollment) => {
      if (!token || !projectId || !groupId || !canUpdateEnrollments) return;
      const confirmed = await confirm({
        title: "Encerrar vinculo",
        description: `Encerrar o vinculo de "${enrollment.person.fullName}" com este grupo preservando o historico?`,
        confirmLabel: "Encerrar",
        cancelLabel: "Cancelar",
        confirmVariant: "destructive",
      });
      if (!confirmed) return;
      try {
        await removeEnrollmentFromGroup(
          token,
          projectId,
          enrollment.id,
          groupId,
        );
        toast({ title: "Vinculo encerrado" });
        await loadParticipants();
      } catch (error) {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Falha ao encerrar vinculo.";
        toast({
          variant: "destructive",
          title: "Falha ao encerrar",
          description: message,
        });
      }
    },
    [
      canUpdateEnrollments,
      confirm,
      groupId,
      loadParticipants,
      projectId,
      toast,
      token,
    ],
  );

  const tabs = React.useMemo(
    () => buildParticipantTabs(tenantSlug),
    [tenantSlug],
  );

  const relatedMembershipIds = React.useMemo(
    () =>
      [...rows, ...historyRows]
        .flatMap((enrollment) => enrollment.groupMembershipHistory)
        .filter((membership) => membership.group.id === groupId)
        .map((membership) => membership.id),
    [groupId, historyRows, rows],
  );

  const groupAuditConfig = React.useMemo<AuditFeedConfig<{ entityId: string }>>(
    () => ({
      primaryEntity: {
        key: "projectGroup",
        entity: "ProjectGroup",
        model: "audit.logs",
        label: "Grupo",
        fieldLabels: {
          name: "Nome",
          description: "Descricao",
          internalNotes: "Notas internas",
          createdAt: "Criado em",
          updatedAt: "Atualizado em",
        },
        resolveEntityId: () => groupId ?? undefined,
      },
      relatedEntities: relatedMembershipIds.length
        ? [
            {
              key: "projectEnrollmentGroupMembership",
              entity: "ProjectEnrollmentGroupMembership",
              model: "audit.logs",
              label: "Vinculo de grupo",
              fieldLabels: {
                startsAt: "Inicio",
                endsAt: "Fim",
                isActive: "Status",
                deletedAt: "Encerrado em",
              },
              resolveEntityIds: () => relatedMembershipIds,
            },
          ]
        : [],
      sort: [{ field: "createdAt", direction: "desc" }],
      pagination: { limit: 120 },
    }),
    [groupId, relatedMembershipIds],
  );

  const auditContext = React.useMemo(
    () => ({ entityId: groupId ?? "" }),
    [groupId],
  );

  const detailAudit = useDetailAuditFeed({
    dataProvider,
    auditAdapter,
    context: auditContext,
    enabled: Boolean(groupId && token && canAudit),
    auditConfig: groupAuditConfig,
  });
  const removeHistoryCondition = React.useCallback((index: number) => {
    setHistoryDomain((previous) =>
      removeConditionAtIndex(previous, "and", index),
    );
  }, []);

  const removeAuditCondition = React.useCallback((index: number) => {
    setAuditDomain((previous) =>
      removeConditionAtIndex(previous, "and", index),
    );
  }, []);

  const historyQueryFacets = React.useMemo(
    () =>
      buildQueryFacets({
        domain: historyDomain,
        groupBy: historyGroupBy,
        searchView: peopleSearchView,
        onClearGroupBy: () => setHistoryGroupBy([]),
        onClearDomain: () => setHistoryDomain(null),
        onRemoveDomainCondition: removeHistoryCondition,
      }),
    [historyDomain, historyGroupBy, removeHistoryCondition],
  );

  const auditQueryFacets = React.useMemo(
    () =>
      buildQueryFacets({
        domain: auditDomain,
        groupBy: auditGroupBy,
        searchView: adminAuditSearchView,
        onClearGroupBy: () => setAuditGroupBy([]),
        onClearDomain: () => setAuditDomain(null),
        onRemoveDomainCondition: removeAuditCondition,
      }),
    [auditDomain, auditGroupBy, removeAuditCondition],
  );

  const filteredHistoryRows = React.useMemo(
    () =>
      historyRows.filter((enrollment) => {
        const membership = enrollment.groupMembershipHistory.find(
          (entry) => entry.group.id === groupId,
        );
        const record = {
          name: enrollment.person.fullName,
          status: enrollment.person.status ?? "",
          personType: "",
          createdAt: membership?.startsAt ?? "",
          updatedAt: membership?.endsAt ?? "",
          enrollment,
          membership,
        };

        const matchesSearch =
          !historySearchText ||
          includesFoldedText(
            flattenSearchableValues(record).join(" "),
            historySearchText,
          );

        return (
          matchesSearch &&
          matchesDomainRecord(
            record,
            historyDomain,
            (current, field) => current[field as keyof typeof current],
          )
        );
      }),
    [groupId, historyDomain, historyRows, historySearchText],
  );

  const filteredAuditLogs = React.useMemo(
    () =>
      (detailAudit?.logs ?? []).filter((log) => {
        const record = {
          entity: log.entity,
          entityId: log.entityId,
          action: log.action,
          userName: log.user?.name ?? "",
          userEmail: log.user?.email ?? "",
          createdAt: log.createdAt,
          sourceLabel: log.sourceLabel,
          before: log.before,
          after: log.after,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          requestId: log.requestId,
        };

        const matchesSearch =
          !auditSearchText ||
          includesFoldedText(
            flattenSearchableValues(record).join(" "),
            auditSearchText,
          );

        return (
          matchesSearch &&
          matchesDomainRecord(
            record,
            auditDomain,
            (current, field) => current[field as keyof typeof current],
          )
        );
      }),
    [auditDomain, auditSearchText, detailAudit?.logs],
  );

  const filteredAuditState = React.useMemo(
    () =>
      detailAudit
        ? {
            ...detailAudit,
            logs: filteredAuditLogs,
          }
        : detailAudit,
    [detailAudit, filteredAuditLogs],
  );

  const auditCount = buildGroupedAuditFeed(filteredAuditLogs).length;

  const context = React.useMemo<GroupDetailContext>(
    () => ({
      readOnly: mode === "create" ? !canCreateStructure : !canUpdateStructure,
      rows,
      historyRows,
      loading: participantsLoading,
      canManageParticipants: Boolean(groupId) && canUpdateEnrollments,
      onOpenPerson: (personId) =>
        router.push(
          withTenantPath(
            `/people/${personId}?returnTo=${encodeURIComponent(pathname)}`,
            tenantSlug,
          ),
        ),
      onAddParticipant: handleAddParticipant,
      onEndMembership: handleEndMembership,
    }),
    [
      canCreateStructure,
      canUpdateEnrollments,
      canUpdateStructure,
      groupId,
      handleAddParticipant,
      handleEndMembership,
      mode,
      participantsLoading,
      pathname,
      router,
      rows,
      historyRows,
      tenantSlug,
    ],
  );

  if (!canReadProject) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Sem permissao.
      </div>
    );
  }

  const title =
    mode === "create" ? "Novo grupo" : group?.name || draft.name || "Grupo";

  return (
    <>
      <DetailShell
        breadcrumbTitle={title}
        breadcrumbItems={[
          { label: "Grupos", href: "/group" },
          ...(mode === "edit" ? [{ label: title }] : []),
        ]}
        mode={mode}
        headerTitle={title}
        saving={saving || autoSaving}
        loading={loading}
        readOnly={context.readOnly}
        onSave={handleSave}
        onClose={() => router.push(returnTo)}
        headerInfoSlot={
          <div className=" bg-transparent px-0 pb-3">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="text-muted-foreground">Projeto</div>
                <div className="font-medium text-foreground">
                  {project?.name ?? "-"}
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
          <div className="bg-transparent px-0 py-2">
            <div className="space-y-4">
              <div>
                <div className="mb-2 text-xs font-medium text-muted-foreground">
                  Nome
                </div>
                <Input
                  value={draft.name}
                  onChange={(event) =>
                    setDraft((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }))
                  }
                  onBlur={() => void commitField("name")}
                  className="h-10 rounded-none border-0 border-b border-border/70 bg-transparent px-0 text-sm shadow-none focus-visible:border-primary focus-visible:ring-0"
                  placeholder="Nome do grupo operacional"
                  readOnly={context.readOnly}
                />
              </div>
              <div>
                <div className="mb-2 text-xs font-medium text-muted-foreground">
                  Descricao
                </div>
                <Textarea
                  value={draft.description}
                  onChange={(event) =>
                    setDraft((previous) => ({
                      ...previous,
                      description: event.target.value,
                    }))
                  }
                  onBlur={() => void commitField("description")}
                  className="min-h-[120px] rounded-none border-0 border-b border-border/70 bg-transparent px-0 py-3 text-sm shadow-none resize-none focus-visible:border-primary focus-visible:ring-0"
                  placeholder="Descricao do grupo operacional"
                  readOnly={context.readOnly}
                />
              </div>
            </div>
          </div>
        }
        bottomSlot={
          mode === "edit" ? (
            <DetailTabsRenderer tabs={tabs} context={context} />
          ) : (
            <ModuleEmptyState
              title="Salve o grupo"
              description="Apos salvar, voce podera adicionar participantes."
              compact
            />
          )
        }
        sideSlot={
          <DetailSideTabs
            defaultValue="notes"
            tabs={[
              {
                value: "notes",
                label: "Anotações",
                content: (
                  <DetailNotesPanel
                    value={draft.internalNotes}
                    onChange={(next) =>
                      setDraft((previous) => ({
                        ...previous,
                        internalNotes: next,
                      }))
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
                      <span className="text-right text-foreground">
                        {project?.name ?? "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-3">
                      <span className="text-muted-foreground">Grupo</span>
                      <span className="text-right text-foreground">
                        {draft.name.trim() || "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">
                        Participantes
                      </span>
                      <span className="text-foreground">{rows.length}</span>
                    </div>
                  </div>
                ),
              },
              {
                value: "history",
                label: "Histórico",
                badge: filteredHistoryRows.length || undefined,
                content: (
                  <div className="flex h-full min-h-0 flex-col gap-4">
                    <div className="sticky top-0 z-10 bg-background pb-3">
                      <SearchBar
                        value={historySearchText}
                        onChange={setHistorySearchText}
                        placeholder="Pesquisar"
                        facets={historyQueryFacets}
                        rightSlot={
                          <SearchPanelMenu
                            actionId="project-group.history"
                            searchView={peopleSearchView}
                            domain={historyDomain}
                            onDomainChange={setHistoryDomain}
                            groupBy={historyGroupBy}
                            onGroupByChange={setHistoryGroupBy}
                            groupByOptions={peopleSearchView.groupBy}
                            snapshot={{
                              searchText: historySearchText,
                              domain: historyDomain,
                              groupBy: historyGroupBy,
                            }}
                            onApplyFavorite={(snapshot) => {
                              setHistorySearchText(
                                String(snapshot.searchText ?? ""),
                              );
                              setHistoryDomain(
                                (snapshot.domain as Domain) ?? null,
                              );
                              setHistoryGroupBy(
                                Array.isArray(snapshot.groupBy)
                                  ? (snapshot.groupBy as string[])
                                  : [],
                              );
                            }}
                            variant="compact"
                          />
                        }
                      />
                    </div>
                    {filteredHistoryRows.length ? (
                      <div className="min-h-0 flex-1 overflow-y-auto space-y-4 pr-1">
                        {filteredHistoryRows.map((enrollment) => {
                          const membership =
                            enrollment.groupMembershipHistory.find(
                              (entry) => entry.group.id === groupId,
                            );
                          return (
                            <div
                              key={enrollment.id}
                              className="space-y-1 border-b border-border/50 pb-3 last:border-b-0 last:pb-0"
                            >
                              <div className="font-medium text-foreground">
                                {enrollment.person.fullName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {enrollment.person.status ?? "-"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {membership
                                  ? `${membership.startsAt ? membership.startsAt.slice(0, 10) : "-"} ate ${membership.endsAt ? membership.endsAt.slice(0, 10) : "-"}`
                                  : "-"}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Nenhum participante encerrado.
                      </div>
                    )}
                  </div>
                ),
              },
              {
                value: "activity",
                label: "Auditoria",
                badge: auditCount || undefined,
                content: canAudit ? (
                  <div className="flex h-full min-h-0 flex-col gap-4">
                    <div className="sticky top-0 z-10 bg-background pb-3">
                      <SearchBar
                        value={auditSearchText}
                        onChange={setAuditSearchText}
                        placeholder="Pesquisar"
                        facets={auditQueryFacets}
                        rightSlot={
                          <SearchPanelMenu
                            actionId="project-group.audit"
                            searchView={adminAuditSearchView}
                            domain={auditDomain}
                            onDomainChange={setAuditDomain}
                            groupBy={auditGroupBy}
                            onGroupByChange={setAuditGroupBy}
                            groupByOptions={adminAuditSearchView.groupBy}
                            snapshot={{
                              searchText: auditSearchText,
                              domain: auditDomain,
                              groupBy: auditGroupBy,
                            }}
                            onApplyFavorite={(snapshot) => {
                              setAuditSearchText(
                                String(snapshot.searchText ?? ""),
                              );
                              setAuditDomain(
                                (snapshot.domain as Domain) ?? null,
                              );
                              setAuditGroupBy(
                                Array.isArray(snapshot.groupBy)
                                  ? (snapshot.groupBy as string[])
                                  : [],
                              );
                            }}
                            variant="compact"
                          />
                        }
                      />
                    </div>
                    <DetailAuditFeed
                      mode={mode}
                      auditState={filteredAuditState}
                      auditVisibleCount={auditVisibleCount}
                      onAuditVisibleCountChange={setAuditVisibleCount}
                      emptyLabel="Sem atividade registrada."
                    />
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Sem permissao para auditoria.
                  </div>
                ),
              },
            ]}
          />
        }
      />
      {groupId && token ? (
        <ProjectEnrollmentPickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          token={token}
          projectId={projectId}
          title="Adicionar participante"
          description="Escolha participantes matriculados no projeto."
          actionLabel="Adicionar"
          excludeGroupId={groupId}
          onPick={handlePickEnrollment}
          onBulkPick={handleBulkPickEnrollment}
        />
      ) : null}
    </>
  );
}
