"use client";

import * as React from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import type { ApiCycle, CycleAudienceType } from "@/modules/cycles/api";
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
    internalNotes: cycle?.internalNotes ?? null,
  };
}

function normalizeDraft(draft: CycleDetailDraft): CycleDetailDraft {
  return {
    name: draft.name.trim(),
    description: draft.description.trim(),
    audienceType: draft.audienceType,
    ageMin: draft.ageMin.trim(),
    ageMax: draft.ageMax.trim(),
    isActive: draft.isActive,
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
    internalNotes: normalized.internalNotes,
  };
}

export function CyclesDetailEngineClientPage() {
  const params = useParams<{ id?: string }>();
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);

  const id = params?.id ? String(params.id) : "";
  const mode = id === "new" || pathname.endsWith("/cycle/new") ? "create" : "edit";
  const isEdit = mode === "edit";

  const canRead = hasModulePermission(cyclesDetailModuleDefinition, "canRead", permissions);
  const canCreate = canUseModuleAction(cyclesDetailModuleDefinition, "create", permissions);
  const canEdit = canUseModuleAction(cyclesDetailModuleDefinition, "edit", permissions);
  const canAudit = canUseModuleAction(cyclesDetailModuleDefinition, "audit", permissions);

  const canAccessPage = mode === "create" ? canCreate : canRead;
  const dataProvider = React.useMemo(() => createRestDataProvider({ token }), [token]);

  const [cycle, setCycle] = React.useState<ApiCycle | null>(null);
  const [draft, setDraft] = React.useState<CycleDetailDraft>(buildDraft());
  const [loading, setLoading] = React.useState(isEdit);
  const [busy, setBusy] = React.useState(false);
  const [auditVisibleCount, setAuditVisibleCount] = React.useState(24);

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

  const context = React.useMemo<CyclesDetailLayoutContext>(
    () => ({
      mode,
      readOnly: mode === "create" ? !canCreate : !canEdit,
      canAudit,
      canEdit,
      cycle,
      draft,
      setDraft,
      onCommitField: (field, nextValue) => void commitField(field, nextValue),
      onNotesChange: (next) => setDraft((previous) => ({ ...previous, internalNotes: next })),
      onNotesBlur: () => void commitField("internalNotes"),
      auditVisibleCount,
      onAuditVisibleCountChange: setAuditVisibleCount,
    }),
    [auditVisibleCount, canAudit, canCreate, canEdit, commitField, cycle, draft, mode],
  );

  if (!canAccessPage) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Sem permissao.</div>;
  }

  const headerTitle = mode === "create" ? "Novo ciclo" : cycle?.name || draft.name || "Ciclo";

  return (
    <DetailShellEngine<CyclesDetailLayoutContext>
      moduleDefinition={cyclesDetailModuleDefinition}
      context={context}
      dataProvider={dataProvider}
      auditEnabled={canAudit}
      mode={mode}
      headerTitle={headerTitle}
      saving={saving}
      loading={loading}
      readOnly={context.readOnly}
      onSave={mode === "create" ? handleCreate : undefined}
      onClose={() => router.push(withTenantPath(CYCLES_ROUTES.list, tenantSlug))}
      breadcrumbTitle={headerTitle}
      breadcrumbItems={[
        { label: "Ciclos", href: CYCLES_ROUTES.list },
        ...(mode === "edit" ? [{ label: headerTitle }] : []),
      ]}
    />
  );
}
