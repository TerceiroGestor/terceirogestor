"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { resolveMediaUrl } from "@/lib/api";
import { formatDateOnlyPtBR } from "@/lib/date";
import type { ApiReferral, ApiReferralAttachment, ReferralStatus, ReferralType } from "@/modules/referrals/api";
import {
  REFERRAL_AUDIT_FIELD_LABELS,
  REFERRAL_STATUS_LABELS,
  REFERRAL_STATUS_OPTIONS,
  REFERRAL_TYPE_LABELS,
  REFERRAL_TYPE_OPTIONS,
} from "@/modules/referrals/shared/domain/referrals.constants";
import { DetailSectionField, DetailSectionHeading } from "@/web-client/detail/DetailFormSection";
import { StandardDetailMetadataSide } from "@/web-client/detail/StandardDetailMetadataSide";
import { buildAuditHistoryItems } from "@/web-client/detail/audit-feed-utils";
import type { DetailShellAuditContext } from "@/web-client/detail/DetailShellEngine";
import type { DetailLayoutConfig } from "@/web-client/registry/types";

const REFERRAL_DETAIL_INPUT_CLASS =
  "h-10 rounded-none border-0 border-b border-border/70 bg-transparent px-0 text-sm shadow-none focus-visible:border-primary focus-visible:ring-0";
const REFERRAL_DETAIL_TEXTAREA_CLASS =
  "min-h-[120px] rounded-none border-0 border-b border-border/70 bg-transparent px-0 py-3 text-sm shadow-none resize-none focus-visible:border-primary focus-visible:ring-0";
const REFERRAL_DETAIL_SECTION_CLASS = "border-y border-border/60 bg-transparent px-0 py-4";

const AUTO_SAVE_EDITING = {
  saveMode: "auto",
  autoSave: {
    trigger: "field-commit",
  },
} as const;

const ATTENDANCE_TYPE_SHORT_LABELS: Record<string, string> = {
  SOCIAL: "Social",
  PSICOLOGICO: "Psicológico",
};

function resolveOriginLabel(evolution: ApiReferral["evolution"] | null, attendance: ApiReferral["attendance"] | null) {
  if (!evolution) return "Evolução de origem não encontrada";
  const typeLabel = attendance ? ATTENDANCE_TYPE_SHORT_LABELS[attendance.type] ?? attendance.type : "Atendimento";
  const snippet = evolution.notes.length > 80 ? `${evolution.notes.slice(0, 80)}...` : evolution.notes;
  return `${typeLabel} - Evolução de ${formatDateOnlyPtBR(evolution.date)}: ${snippet}`;
}

function buildReferralAttachmentItems(attachments: ApiReferralAttachment[]) {
  return attachments.map((attachment) => ({
    id: attachment.id,
    label: attachment.label,
    href: resolveMediaUrl(attachment.filePath),
    description: attachment.uploadedBy?.name
      ? `Enviado por ${attachment.uploadedBy.name}`
      : "Anexo do Encaminhamento",
    mimeType: attachment.mimeType ?? null,
    sizeLabel:
      typeof attachment.fileSizeBytes === "number" && attachment.fileSizeBytes > 0
        ? attachment.fileSizeBytes >= 1024 * 1024
          ? `${(attachment.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`
          : attachment.fileSizeBytes >= 1024
            ? `${Math.round(attachment.fileSizeBytes / 1024)} KB`
            : `${attachment.fileSizeBytes} B`
        : null,
  }));
}

export type ReferralDetailDraft = {
  destinationId: string;
  type: ReferralType;
  status: ReferralStatus;
  outcomeNotes: string;
};

export type ReferralsDetailLayoutContext = DetailShellAuditContext & {
  mode: "create" | "edit";
  readOnly: boolean;
  canAudit: boolean;
  canEdit: boolean;
  tenantSlug: string;
  referral: ApiReferral | null;
  draft: ReferralDetailDraft;
  setDraft: React.Dispatch<React.SetStateAction<ReferralDetailDraft>>;
  destinationName: string;
  onCommitField: <K extends keyof ReferralDetailDraft>(
    field: K,
    nextValue?: ReferralDetailDraft[K],
  ) => void;
  onPickDestination: () => void;
  attachmentUploading: boolean;
  onUploadAttachment: () => void;
  onDeleteAttachment: (attachmentId: string) => void;
  auditVisibleCount: number;
  onAuditVisibleCountChange: React.Dispatch<React.SetStateAction<number>>;
};

function ReferralDetailMain({
  draft,
  setDraft,
  readOnly,
  canEdit,
  onCommitField,
  referral,
  destinationName,
  onPickDestination,
}: Pick<
  ReferralsDetailLayoutContext,
  "draft" | "setDraft" | "readOnly" | "canEdit" | "onCommitField" | "referral" | "destinationName" | "onPickDestination"
>) {
  return (
    <div className={REFERRAL_DETAIL_SECTION_CLASS}>
      <div className="grid gap-6 md:grid-cols-2 md:items-end">
        <DetailSectionField label="Tipo" required>
          <Select
            value={draft.type}
            onValueChange={(value) => {
              const nextValue = value as ReferralType;
              setDraft((previous) => ({ ...previous, type: nextValue }));
              onCommitField("type", nextValue);
            }}
            disabled={readOnly}
          >
            <SelectTrigger className={REFERRAL_DETAIL_INPUT_CLASS}>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              {REFERRAL_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DetailSectionField>
        <DetailSectionField label="Rede de destino" required>
          <div className="flex h-10 items-center justify-between border-b border-border/70">
            <span className="text-sm text-foreground">{destinationName || "Nenhuma rede selecionada"}</span>
            {!readOnly && canEdit ? (
              <Button type="button" size="sm" variant="ghost" onClick={onPickDestination}>
                {destinationName ? "Alterar" : "Selecionar"}
              </Button>
            ) : null}
          </div>
        </DetailSectionField>
      </div>

      <div className="mt-6 space-y-4">
        <DetailSectionHeading title="Status" />
        <div className="grid gap-6 md:grid-cols-2 md:items-end">
          <DetailSectionField label="Status">
            <Select
              value={draft.status}
              onValueChange={(value) => {
                const nextValue = value as ReferralStatus;
                setDraft((previous) => ({ ...previous, status: nextValue }));
                onCommitField("status", nextValue);
              }}
              disabled={readOnly}
            >
              <SelectTrigger className={REFERRAL_DETAIL_INPUT_CLASS}>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {REFERRAL_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </DetailSectionField>
          <DetailSectionField label="Origem">
            <div className="flex h-10 items-center border-b border-border/70 text-sm text-muted-foreground">
              {resolveOriginLabel(referral?.evolution ?? null, referral?.attendance ?? null)}
            </div>
          </DetailSectionField>
        </div>
      </div>

      <div className="mt-6">
        <DetailSectionField label="Desfecho">
          <Textarea
            value={draft.outcomeNotes}
            onChange={(event) => setDraft((previous) => ({ ...previous, outcomeNotes: event.target.value }))}
            onBlur={() => onCommitField("outcomeNotes")}
            className={REFERRAL_DETAIL_TEXTAREA_CLASS}
            placeholder="Obrigatório para marcar como 'Encerrado'"
            readOnly={readOnly}
          />
        </DetailSectionField>
      </div>
    </div>
  );
}

export const referralsDetailLayout: DetailLayoutConfig<ReferralsDetailLayoutContext> = {
  editing: AUTO_SAVE_EDITING,
  mainTab: true,
  header: {
    title: ({ referral, destinationName, mode }) =>
      mode === "create" ? "Novo encaminhamento" : (referral?.destination.name ?? destinationName) || "Encaminhamento",
  },
  main: (context) => (
    <ReferralDetailMain
      draft={context.draft}
      setDraft={context.setDraft}
      readOnly={context.readOnly}
      canEdit={context.canEdit}
      onCommitField={context.onCommitField}
      referral={context.referral}
      destinationName={context.destinationName}
      onPickDestination={context.onPickDestination}
    />
  ),
  side: ({
    mode,
    canAudit,
    readOnly,
    canEdit,
    referral,
    detailAudit,
    auditVisibleCount,
    onAuditVisibleCountChange,
    attachmentUploading,
    onUploadAttachment,
    onDeleteAttachment,
  }) => (
    <StandardDetailMetadataSide
      mode={mode}
      canAudit={canAudit}
      readOnly={readOnly}
      detailAudit={detailAudit}
      auditVisibleCount={auditVisibleCount}
      onAuditVisibleCountChange={onAuditVisibleCountChange}
      history={{
        items: buildAuditHistoryItems(detailAudit?.logs ?? []),
        emptyLabel:
          mode === "create" ? "O histórico aparece após salvar o encaminhamento." : "Nenhum histórico disponível.",
      }}
      tabOrder={["attachments", "activity"]}
      attachments={{
        items: buildReferralAttachmentItems(referral?.attachments ?? []),
        onUpload: mode === "edit" && !readOnly && canEdit ? onUploadAttachment : undefined,
        onDelete: mode === "edit" && !readOnly && canEdit ? onDeleteAttachment : undefined,
        readOnly: readOnly || mode !== "edit",
        emptyLabel:
          mode === "create"
            ? "Salve o encaminhamento para habilitar anexos."
            : attachmentUploading
              ? "Enviando anexo..."
              : "Nenhum anexo registrado para este encaminhamento.",
      }}
      defaultTab="activity"
    />
  ),
  auditSources: {
    primaryEntity: {
      key: "referral",
      entity: "Referral",
      model: "audit.logs",
      label: "Encaminhamento",
      fieldLabels: REFERRAL_AUDIT_FIELD_LABELS,
      valueFormatters: {
        type: (value) => REFERRAL_TYPE_LABELS[value as string] ?? String(value),
        status: (value) => REFERRAL_STATUS_LABELS[value as string] ?? String(value),
      },
      resolveEntityId: ({ referral }) => referral?.id,
    },
    sort: [{ field: "createdAt", direction: "desc" }],
    pagination: { limit: 120 },
  },
};
