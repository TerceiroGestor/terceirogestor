"use client";

import * as React from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRegisterUsageDocumentation } from "@/components/UsageDocumentation/UsageDocumentationProvider";
import { buildUsageDocumentationItems } from "@/components/UsageDocumentation/usage-documentation.helpers";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { uploadReferralAttachment } from "@/features/uploads/api";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import type { ApiReferral, ApiReferralDestination } from "@/modules/referrals/api";
import { addReferralAttachment, deleteReferralAttachment } from "@/modules/referrals/api";
import {
  REFERRALS_ROUTES,
  referralsDetailModuleDefinition,
} from "@/modules/referrals/config/referrals-module-contract";
import {
  type ReferralDetailDraft,
  type ReferralsDetailLayoutContext,
} from "@/modules/referrals/config/referrals-detail-layout-contract";
import { REFERRAL_USAGE_TEXT } from "@/modules/referrals/shared/domain/referrals.constants";
import { ReferralDestinationPickerDialog } from "@/modules/referrals/features/detail/ui/referral-destination-picker-dialog";
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

function buildDraft(referral?: ApiReferral | null): ReferralDetailDraft {
  return {
    destinationId: referral?.destinationId ?? "",
    type: referral?.type ?? "SAUDE",
    status: referral?.status ?? "ABERTO",
    outcomeNotes: referral?.outcomeNotes ?? "",
  };
}

function normalizeDraft(draft: ReferralDetailDraft): ReferralDetailDraft {
  return {
    destinationId: draft.destinationId,
    type: draft.type,
    status: draft.status,
    outcomeNotes: draft.outcomeNotes.trim(),
  };
}

function toUpdatePayload(draft: ReferralDetailDraft) {
  const normalized = normalizeDraft(draft);
  return {
    destinationId: normalized.destinationId || undefined,
    type: normalized.type,
    status: normalized.status,
    outcomeNotes: normalized.outcomeNotes || null,
  };
}

export function ReferralsDetailEngineClientPage() {
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname) ?? "";

  const id = params?.id ? String(params.id) : "";
  const mode = id === "new" || pathname.endsWith("/referrals/new") ? "create" : "edit";
  const isEdit = mode === "edit";
  const prefillEvolutionId = searchParams.get("evolutionId");

  const canRead = hasModulePermission(referralsDetailModuleDefinition, "canRead", permissions);
  const canCreate = canUseModuleAction(referralsDetailModuleDefinition, "create", permissions);
  const canEdit = canUseModuleAction(referralsDetailModuleDefinition, "edit", permissions);
  const canAudit = canUseModuleAction(referralsDetailModuleDefinition, "audit", permissions);

  const canAccessPage = mode === "create" ? canCreate : canRead;
  const dataProvider = React.useMemo(() => createRestDataProvider({ token }), [token]);

  const [referral, setReferral] = React.useState<ApiReferral | null>(null);
  const [draft, setDraft] = React.useState<ReferralDetailDraft>(buildDraft(null));
  const [destinationName, setDestinationName] = React.useState("");
  const [loading, setLoading] = React.useState(isEdit);
  const [busy, setBusy] = React.useState(false);
  const [destinationPickerOpen, setDestinationPickerOpen] = React.useState(false);
  const [attachmentUploading, setAttachmentUploading] = React.useState(false);
  const [auditVisibleCount, setAuditVisibleCount] = React.useState(24);
  const attachmentInputRef = React.useRef<HTMLInputElement>(null);

  const usageItems = React.useMemo(
    () => buildUsageDocumentationItems("referrals-detail", REFERRAL_USAGE_TEXT.detail.sections),
    [],
  );

  useRegisterUsageDocumentation({
    title: REFERRAL_USAGE_TEXT.detail.title,
    items: usageItems,
  });

  const persistDraft = React.useCallback(
    async (nextDraft: ReferralDetailDraft) => {
      const updated = await dataProvider.update<ApiReferral>(
        referralsDetailModuleDefinition.queryAdapters.detailDataProvider?.model ?? "referrals.detail",
        id,
        toUpdatePayload(nextDraft),
      );
      const savedDraft = buildDraft(updated);
      setReferral(updated);
      setDestinationName(updated.destination.name);
      setDraft(savedDraft);
      return savedDraft;
    },
    [dataProvider, id, setReferral],
  );

  const autoSave = useDetailAutoSaveController<ReferralDetailDraft>({
    draft,
    enabled: isEdit && canEdit,
    config: getModuleDetailEditingConfig(referralsDetailModuleDefinition),
    normalizeDraft,
    onSave: persistDraft,
    onError: (error) => {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao salvar encaminhamento.";
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
      .read<ApiReferral>("referrals.detail", id)
      .then((loaded) => {
        const nextDraft = buildDraft(loaded);
        setReferral(loaded);
        setDestinationName(loaded.destination.name);
        setDraft(nextDraft);
        replaceSavedDraft(nextDraft);
      })
      .catch((error) => {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Falha ao carregar encaminhamento.";
        toast({ variant: "destructive", title: "Falha ao carregar", description: message });
      })
      .finally(() => setLoading(false));
  }, [canAccessPage, dataProvider, id, isEdit, replaceSavedDraft, toast, token]);

  const handleCreate = React.useCallback(async () => {
    if (!canCreate) return;
    if (!prefillEvolutionId) {
      toast({
        variant: "destructive",
        title: "Encaminhamento sem origem",
        description:
          "Encaminhamentos nascem de uma Evolução - abra o Atendimento, entre na evolução e use 'Registrar encaminhamento'.",
      });
      return;
    }
    const normalized = normalizeDraft(draft);
    if (!normalized.destinationId) {
      toast({ variant: "destructive", title: "Dados inválidos", description: "Selecione a rede de destino." });
      return;
    }

    setBusy(true);
    try {
      const created = await dataProvider.create<ApiReferral>("referrals.detail", {
        evolutionId: prefillEvolutionId,
        destinationId: normalized.destinationId,
        type: normalized.type,
        status: normalized.status,
        outcomeNotes: normalized.outcomeNotes || null,
      });
      toast({ variant: "success", title: "Encaminhamento criado" });
      router.replace(withTenantPath(`${REFERRALS_ROUTES.detail}/${created.id}`, tenantSlug));
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Falha ao criar encaminhamento.";
      toast({ variant: "destructive", title: "Falha ao criar", description: message });
    } finally {
      setBusy(false);
    }
  }, [canCreate, dataProvider, draft, prefillEvolutionId, router, tenantSlug, toast]);

  const handlePickDestination = React.useCallback(
    async (destination: ApiReferralDestination) => {
      setDraft((previous) => ({ ...previous, destinationId: destination.id }));
      setDestinationName(destination.name);
      setDestinationPickerOpen(false);
      if (isEdit) {
        commitField("destinationId", destination.id);
      }
    },
    [commitField, isEdit],
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
        const uploaded = await uploadReferralAttachment(token, file);
        const updated = await addReferralAttachment(token, id, {
          label: uploaded.originalName?.trim() || file.name.trim() || "Anexo",
          filePath: uploaded.path,
          mimeType: uploaded.mimeType ?? file.type ?? null,
          fileSizeBytes: uploaded.size ?? file.size,
        });
        setReferral(updated);
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
    [id, setReferral, toast, token],
  );

  const handleDeleteAttachment = React.useCallback(
    async (attachmentId: string) => {
      if (!token || !id) return;
      if (!window.confirm("Excluir este anexo?")) return;
      setAttachmentUploading(true);
      try {
        const updated = await deleteReferralAttachment(token, id, attachmentId);
        setReferral(updated);
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
    [id, setReferral, toast, token],
  );

  const context = React.useMemo<ReferralsDetailLayoutContext>(
    () => ({
      mode,
      readOnly: mode === "create" ? !canCreate : !canEdit,
      canAudit,
      canEdit,
      tenantSlug,
      referral,
      draft,
      setDraft,
      destinationName,
      onCommitField: (field, nextValue) => void commitField(field, nextValue),
      onPickDestination: () => setDestinationPickerOpen(true),
      attachmentUploading,
      onUploadAttachment: () => {
        if (!canEdit || mode !== "edit") return;
        suspendDetailAutoSave();
        attachmentInputRef.current?.click();
      },
      onDeleteAttachment: (attachmentId) => void handleDeleteAttachment(attachmentId),
      auditVisibleCount,
      onAuditVisibleCountChange: setAuditVisibleCount,
    }),
    [
      attachmentUploading,
      auditVisibleCount,
      canAudit,
      canCreate,
      canEdit,
      commitField,
      destinationName,
      draft,
      handleDeleteAttachment,
      mode,
      referral,
      tenantSlug,
    ],
  );

  if (!canAccessPage) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Sem permissão.</div>;
  }

  if (mode === "create" && !prefillEvolutionId) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Encaminhamentos nascem de uma Evolução. Abra o Atendimento, entre na evolução desejada e use o botão
        &quot;Registrar encaminhamento&quot; lá.
      </div>
    );
  }

  const headerTitle =
    mode === "create" ? "Novo encaminhamento" : referral?.destination.name || destinationName || "Encaminhamento";

  return (
    <>
      <input ref={attachmentInputRef} type="file" className="hidden" onChange={handleSelectAttachment} />
      <DetailShellEngine<ReferralsDetailLayoutContext>
        moduleDefinition={referralsDetailModuleDefinition}
        context={context}
        dataProvider={dataProvider}
        auditEnabled={canAudit}
        mode={mode}
        headerTitle={headerTitle}
        saving={saving}
        loading={loading}
        readOnly={context.readOnly}
        onSave={mode === "create" ? handleCreate : undefined}
        onClose={() => router.push(withTenantPath(REFERRALS_ROUTES.list, tenantSlug))}
        breadcrumbTitle={headerTitle}
        breadcrumbItems={[
          { label: "Encaminhamentos", href: REFERRALS_ROUTES.list },
          ...(mode === "edit" ? [{ label: headerTitle }] : []),
        ]}
      />
      <ReferralDestinationPickerDialog
        open={destinationPickerOpen}
        onOpenChange={setDestinationPickerOpen}
        onPick={handlePickDestination}
      />
    </>
  );
}
