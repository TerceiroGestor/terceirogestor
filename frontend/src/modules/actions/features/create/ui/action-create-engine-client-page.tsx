"use client";

import { usePathname, useRouter } from "next/navigation";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import {
  ACTIONS_ROUTES,
  actionsDetailModuleDefinition,
} from "@/modules/actions/config/actions-module-contract";
import type { ActionsDetailLayoutContext } from "@/modules/actions/config/actions-detail-layout-contract";
import { ACTION_RELATION_VALUES } from "@/modules/actions/features/manage/config/action-relations.constants";
import { DetailShellEngine } from "@/web-client/detail/DetailShellEngine";

export function ActionCreateEngineClientPage() {
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname) ?? "";

  const context = {
    mode: "create",
    readOnly: true,
    canAudit: false,
    canUpdate: false,
    canReadStructure: false,
    canReadPeople: false,
    canReadPeopleIdentity: false,
    tenantSlug,
    token: "",
    projectId: "",
    action: null,
    selectedOccurrence: null,
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
    onOpenTeamPicker: () => undefined,
    onEndTeamParticipation: async () => undefined,
    reportRows: [],
    reportPeopleRows: [],
    reportLoading: false,
    reportError: null,
    occurrenceId: null,
    occurrenceOptions: [],
    onOccurrenceIdChange: () => undefined,
    attendanceGroupId: ACTION_RELATION_VALUES.allGroups,
    attendanceStatusFilter: "all",
    attendanceGroupOptions: [],
    attendanceDrafts: {},
    attendanceSaving: false,
    attendanceNotesDialog: null,
    qualityGroupId: ACTION_RELATION_VALUES.allGroups,
    qualityDrafts: {},
    qualitySaving: false,
    qualityNotesDialog: null,
    participantRows: [],
    qualityRows: [],
    onAttendanceGroupChange: () => undefined,
    onAttendanceStatusFilterChange: () => undefined,
    getAttendanceEffective: () => ({ status: null, notes: null }),
    setAttendanceRowDraft: () => undefined,
    applyAttendanceStatusToRows: () => undefined,
    saveAttendanceDrafts: () => undefined,
    onAttendanceNotesDialogChange: () => undefined,
    applyAttendanceNotesDialog: () => undefined,
    onQualityGroupChange: () => undefined,
    getQualityEffective: () => ({
      qualityScore: null,
      qualityNotes: null,
      isHighlight: false,
    }),
    setQualityRowDraft: () => undefined,
    saveQualityDrafts: () => undefined,
    onQualityNotesDialogChange: () => undefined,
    applyQualityNotesDialog: () => undefined,
    auditVisibleCount: 24,
    onAuditVisibleCountChange: () => undefined,
  } satisfies ActionsDetailLayoutContext;

  return (
    <DetailShellEngine
      moduleDefinition={actionsDetailModuleDefinition}
      context={context}
      mode="create"
      headerTitle="Nova atividade"
      breadcrumbTitle="Nova atividade"
      breadcrumbItems={[
        { label: "Atividades", href: withTenantPath(ACTIONS_ROUTES.list, tenantSlug) },
        { label: "Nova atividade" },
      ]}
      saving={false}
      loading={false}
      readOnly
      onClose={() => router.push(withTenantPath(ACTIONS_ROUTES.list, tenantSlug))}
    />
  );
}
