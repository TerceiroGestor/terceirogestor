"use client";

import { usePathname, useRouter } from "next/navigation";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import {
  ACTIONS_ROUTES,
  actionsDetailModuleDefinition,
} from "@/modules/actions/config/actions-module-contract";
import { DetailShellEngine } from "@/web-client/detail/DetailShellEngine";
import type { ActionsDetailLayoutContext } from "@/modules/actions/config/actions-detail-layout-contract";

export function ActionCreateEngineClientPage() {
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);

  const context = {
    mode: "create",
    readOnly: true,
    canAudit: false,
    canUpdate: false,
    canReadStructure: false,
    canReadPeople: false,
    canReadPeopleIdentity: false,
    token: "",
    projectId: "",
    action: null,
    draft: {
      tags: [],
      internalNotes: null,
    },
    setDraft: () => undefined,
    mentionableUsers: [],
    commentDraft: { body: "", mentionUserIds: [] },
    commentSubmitting: false,
    attachmentUploading: false,
    onCommitField: () => undefined,
    onCommentDraftChange: () => undefined,
    onSubmitComment: () => undefined,
    onDeleteComment: () => undefined,
    onUploadAttachment: () => undefined,
    onDeleteAttachment: () => undefined,
    onNotesChange: () => undefined,
    onNotesBlur: () => undefined,
    onSaveActionPatch: async () => undefined,
    onActionLoaded: () => undefined,
    onUploadPhoto: async () => undefined,
    onDeletePhoto: async () => undefined,
    onOpenTeamPicker: () => undefined,
    onEndTeamParticipation: async () => undefined,
    photoUploading: false,
    reportRows: [],
    reportPeopleRows: [],
    reportLoading: false,
    reportError: null,
    auditVisibleCount: 24,
    onAuditVisibleCountChange: () => undefined,
  } satisfies ActionsDetailLayoutContext;

  return (
    <DetailShellEngine
      moduleDefinition={actionsDetailModuleDefinition}
      context={context}
      mode="create"
      headerTitle="Nova ação"
      breadcrumbTitle="Nova ação"
      breadcrumbItems={[
        { label: "Ações", href: withTenantPath(ACTIONS_ROUTES.list, tenantSlug) },
        { label: "Nova ação" },
      ]}
      saving={false}
      loading={false}
      readOnly
      onClose={() => router.push(withTenantPath(ACTIONS_ROUTES.list, tenantSlug))}
    />
  );
}
