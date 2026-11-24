"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { createActivity } from "@/modules/actions/api";
import {
  ACTIONS_ROUTES,
  actionsDetailModuleDefinition,
} from "@/modules/actions/config/actions-module-contract";
import type { ActionsDetailLayoutContext } from "@/modules/actions/config/actions-detail-layout-contract";
import {
  buildDraft,
  normalizeDraft,
} from "@/modules/actions/features/manage/ui/action-detail-engine-client-page";
import { DetailShellEngine } from "@/web-client/detail/DetailShellEngine";

export function ActionCreateEngineClientPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tenantSlug = getTenantSlugFromPath(pathname) ?? "";
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { toast } = useToast();

  const canCreate = permissions.includes("actions.create");
  const [projectId, setProjectId] = React.useState(searchParams.get("projectId") ?? "");
  const [draft, setDraft] = React.useState(buildDraft());
  const [creating, setCreating] = React.useState(false);

  const handleCreate = React.useCallback(async () => {
    if (!canCreate || !token) return;
    const normalized = normalizeDraft(draft);

    if (!projectId) {
      toast({ variant: "destructive", title: "Dados inválidos", description: "Selecione o projeto." });
      return;
    }
    if (!normalized.actionTypeId) {
      toast({
        variant: "destructive",
        title: "Dados inválidos",
        description: "Selecione o tipo da atividade.",
      });
      return;
    }
    if (!normalized.title) {
      toast({ variant: "destructive", title: "Dados inválidos", description: "Informe o título." });
      return;
    }

    setCreating(true);
    try {
      const created = await createActivity(token, projectId, {
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
      toast({ title: "Atividade criada" });
      router.replace(
        withTenantPath(
          `${ACTIONS_ROUTES.detail}/${created.id}?projectId=${encodeURIComponent(projectId)}`,
          tenantSlug,
        ),
      );
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao criar atividade.";
      toast({ variant: "destructive", title: "Falha ao criar", description: message });
    } finally {
      setCreating(false);
    }
  }, [canCreate, draft, projectId, router, tenantSlug, toast, token]);

  const context = {
    mode: "create" as const,
    readOnly: !canCreate,
    canAudit: false,
    canUpdate: false,
    canReadStructure: false,
    canReadPeople: false,
    canReadPeopleIdentity: false,
    tenantSlug,
    token: token ?? "",
    projectId,
    onProjectIdChange: setProjectId,
    action: null,
    draft,
    setDraft,
    mentionableUsers: [],
    attachmentUploading: false,
    onCommitField: () => undefined,
    onUploadAttachment: () => undefined,
    onDeleteAttachment: () => undefined,
    onActionLoaded: () => undefined,
    onOpenTeamPicker: () => undefined,
    onEndTeamParticipation: async () => undefined,
    onOpenParticipantPicker: () => undefined,
    onRemoveParticipant: async () => undefined,
    reportPeopleRows: [],
    attendanceSummaryRows: [],
    attendanceSummaryLoading: false,
    attendanceSummaryError: null,
    auditVisibleCount: 24,
    onAuditVisibleCountChange: () => undefined,
  } satisfies ActionsDetailLayoutContext;

  return (
    <DetailShellEngine<ActionsDetailLayoutContext>
      moduleDefinition={actionsDetailModuleDefinition}
      context={context}
      mode="create"
      headerTitle="Nova atividade"
      breadcrumbTitle="Nova atividade"
      breadcrumbItems={[
        { label: "Atividades", href: withTenantPath(ACTIONS_ROUTES.list, tenantSlug) },
        { label: "Nova atividade" },
      ]}
      saving={creating}
      loading={false}
      readOnly={!canCreate}
      onSave={handleCreate}
      onClose={() => router.push(withTenantPath(ACTIONS_ROUTES.list, tenantSlug))}
    />
  );
}
