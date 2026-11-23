"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { resolveMediaUrl } from "@/lib/api";
import { formatDateOnlyPtBR } from "@/lib/date";
import type {
  ApiDepositDonor,
  ApiDepositEntry,
  ApiDepositExit,
  ApiDepositHistoryMovement,
  ApiDepositItem,
} from "@/modules/deposit/api";
import type {
  ItemDraft,
  DepositItemDetailMode,
} from "@/modules/deposit/features/items/domain/deposit-item-detail.types";
import {
  formatAuditDate,
  formatAuditNumber,
  formatAuditReferenceLabel,
  normalizeSector,
  resolveExitTypeLabel,
} from "@/modules/deposit/features/items/domain/deposit-item-detail.helpers";
import { DepositItemDetailForm } from "@/modules/deposit/features/items/ui/detail/deposit-item-detail-form";
import { DepositItemEntriesSection } from "@/modules/deposit/features/items/ui/detail/deposit-item-entries-section";
import { DepositItemExitsSection } from "@/modules/deposit/features/items/ui/detail/deposit-item-exits-section";
import { DepositItemHistorySection } from "@/modules/deposit/features/items/ui/detail/deposit-item-history-section";
import { DepositDonorDonationsSection } from "@/modules/deposit/features/donors/ui/detail/deposit-donor-donations-section";
import { DepositEntryAllocatedExitsSection } from "@/modules/deposit/features/entries/ui/detail/deposit-entry-allocated-exits-section";
import {
  DEPOSIT_AUDIT_FIELD_LABELS,
  DEPOSIT_ENTRY_DONOR_NONE_VALUE,
  DEPOSIT_DONOR_TYPE_LABELS,
  DEPOSIT_DONOR_AUDIT_FIELD_LABELS,
  DEPOSIT_DEFAULT_SECTOR,
  DEPOSIT_ENTRY_AUDIT_FIELD_LABELS,
  DEPOSIT_EXIT_ENTRY_AUTO_VALUE,
  DEPOSIT_EXIT_AUDIT_FIELD_LABELS,
  DEPOSIT_EXIT_TYPE_OPTIONS,
  DEPOSIT_ITEM_UNIT,
} from "@/modules/deposit/shared/domain/deposit.constants";
import { DetailIdentityMediaField } from "@/web-client/detail/DetailIdentityMediaField";
import { StandardDetailMetadataSide } from "@/web-client/detail/StandardDetailMetadataSide";
import type { DetailShellAuditContext } from "@/web-client/detail/DetailShellEngine";
import type {
  DetailCommentDraft,
  DetailCommentUser,
  DetailHistoryItem,
  DetailLayoutConfig,
} from "@/web-client/registry/types";

type DepositMetadataContext = {
  mentionableUsers: DetailCommentUser[];
  commentDraft: DetailCommentDraft;
  onCommentDraftChange: React.Dispatch<React.SetStateAction<DetailCommentDraft>>;
  onSubmitComment: () => void;
  onDeleteComment?: (commentId: string) => void;
  commentSubmitting: boolean;
  tags: string[];
  onTagsChange: (next: string[]) => void;
  onTagsCommit?: (next: string[]) => void;
  internalNotes: string | null;
  onInternalNotesChange: (next: string | null) => void;
  onInternalNotesBlur: () => void;
  onUploadAttachment?: () => void;
  onDeleteAttachment?: (attachmentId: string) => void;
  attachmentUploading?: boolean;
  historyItems: DetailHistoryItem[];
};

export type DepositItemDetailLayoutContext = DetailShellAuditContext & DepositMetadataContext & {
  mode: DepositItemDetailMode;
  readOnly: boolean;
  token: string;
  draft: ItemDraft;
  setDraft: React.Dispatch<React.SetStateAction<ItemDraft>>;
  item: ApiDepositItem | null;
  onCommitField: (key: keyof ItemDraft) => void;
  onUnitChange: (value: string) => void;
  onGroupChange: (value: string | null) => void;
  sectorsLoading: boolean;
  sectorOptions: string[];
  onDefaultSectorChange: (value: string) => void;
  onOpenNewSector: () => void;
  entryRows: ApiDepositEntry[];
  exitRows: ApiDepositExit[];
  donorNameById: Record<string, string>;
  entryLabelById: Record<string, string>;
  exitLabelById: Record<string, string>;
  historyRows: ApiDepositHistoryMovement[];
  movementLoading: boolean;
  canDeleteEntry: boolean;
  canDeleteExit: boolean;
  onNewEntry: () => void;
  onNewExit: () => void;
  onOpenEntry: (entryId: string) => void;
  onOpenExit: (exitId: string) => void;
  onMovementsChanged: () => void;
  auditVisibleCount: number;
  onAuditVisibleCountChange: React.Dispatch<React.SetStateAction<number>>;
};

export type DepositDonorDraft = {
  name: string;
  type: ApiDepositDonor["type"];
  contact: string | null;
  avatarUrl: string | File | null;
};

export type DepositDonorDetailLayoutContext = DetailShellAuditContext & DepositMetadataContext & {
  mode: "create" | "edit";
  readOnly: boolean;
  avatarUploading: boolean;
  draft: DepositDonorDraft;
  setDraft: React.Dispatch<React.SetStateAction<DepositDonorDraft>>;
  onCommitField: (key: keyof DepositDonorDraft) => void;
  onTypeChange: (type: ApiDepositDonor["type"]) => void;
  onAvatarFileSelect: (file: File) => Promise<void> | void;
  donor: ApiDepositDonor | null;
  donorNameById: Record<string, string>;
  entries: ApiDepositEntry[];
  entriesLoading: boolean;
  auditVisibleCount: number;
  onAuditVisibleCountChange: React.Dispatch<React.SetStateAction<number>>;
  onOpenEntry: (entryId: string) => void;
};

export type DepositAllocatedExitRow = {
  exitId: string;
  exitDate: string;
  type: ApiDepositExit["type"];
  sector: string;
  quantity: number;
  unit: string;
  destinationName: string | null;
  internalNotes: string | null;
};

export type DepositEntryDraft = {
  donorId: string | null;
  sector: string;
  quantity: number;
  unit: string;
  entryDate: string;
  expiryDate: string;
};

export type DepositEntryDetailLayoutContext = DetailShellAuditContext & DepositMetadataContext & {
  mode: "create" | "edit";
  readOnly: boolean;
  saving: boolean;
  draft: DepositEntryDraft;
  setDraft: React.Dispatch<React.SetStateAction<DepositEntryDraft>>;
  entry: ApiDepositEntry | null;
  donors: ApiDepositDonor[];
  donorsLoading: boolean;
  sectorsLoading: boolean;
  sectorOptions: string[];
  allocatedExitsLoading: boolean;
  allocatedExits: DepositAllocatedExitRow[];
  donorNameById: Record<string, string>;
  exitLabelById: Record<string, string>;
  canCreateRelatedExit: boolean;
  onCommitField: (key: keyof DepositEntryDraft) => void;
  onPatch: (patch: Partial<DepositEntryDraft>) => void;
  onOpenNewSector: () => void;
  onOpenCreateDonor: () => void;
  onOpenCreateExit: () => void;
  onOpenExit: (exitId: string) => void;
  auditVisibleCount: number;
  onAuditVisibleCountChange: React.Dispatch<React.SetStateAction<number>>;
};

export type DepositExitDraft = {
  entryId: string;
  sector: string;
  quantity: number;
  unit: string;
  exitDate: string;
  type: ApiDepositExit["type"];
  destinationName: string;
  destinationType: string;
  expectedReturnAt: string;
  returnedAt: string;
  returnedQuantity: number;
  returnNotes: string;
};

export type DepositExitDetailLayoutContext = DetailShellAuditContext & DepositMetadataContext & {
  mode: "create" | "edit";
  readOnly: boolean;
  saving: boolean;
  entryLocked: boolean;
  draft: DepositExitDraft;
  setDraft: React.Dispatch<React.SetStateAction<DepositExitDraft>>;
  exit: ApiDepositExit | null;
  entriesLoading: boolean;
  entries: ApiDepositEntry[];
  selectedEntry: ApiDepositEntry | null;
  sectorsLoading: boolean;
  sectorOptions: string[];
  donorNameById: Record<string, string>;
  entryLabelById: Record<string, string>;
  onCommitField: (key: keyof DepositExitDraft) => void;
  onPatch: (patch: Partial<DepositExitDraft>) => void;
  onOpenNewSector: () => void;
  auditVisibleCount: number;
  onAuditVisibleCountChange: React.Dispatch<React.SetStateAction<number>>;
};

export const DEPOSIT_DETAIL_INPUT_CLASS =
  "h-10 rounded-none border-0 border-b border-border/70 bg-transparent px-0 text-sm shadow-none focus-visible:border-primary focus-visible:ring-0";

const DEPOSIT_DETAIL_SECTION_CLASS =
  "border-y border-border/60 bg-transparent px-0 py-4";

const AUTO_SAVE_EDITING = {
  saveMode: "auto",
  autoSave: {
    trigger: "field-commit",
  },
} as const;

function resolveDonorAuditValue(
  donorNameById: Record<string, string>,
  value: unknown,
) {
  const donorId = typeof value === "string" ? value.trim() : "";
  if (!donorId) return "Sem fonte";

  return formatAuditReferenceLabel(
    donorNameById[donorId],
    donorId,
    "Fonte",
  );
}

function resolveDonorTypeAuditValue(value: unknown) {
  const donorType = typeof value === "string" ? value : "";
  return donorType && donorType in DEPOSIT_DONOR_TYPE_LABELS
    ? DEPOSIT_DONOR_TYPE_LABELS[donorType as keyof typeof DEPOSIT_DONOR_TYPE_LABELS]
    : donorType || "-";
}

function resolveAvatarAuditValue(value: unknown) {
  return typeof value === "string" && value.trim() ? "Foto definida" : "Sem foto";
}


export const depositItemDetailLayout: DetailLayoutConfig<DepositItemDetailLayoutContext> = {
  editing: AUTO_SAVE_EDITING,
  mainTab: true,
  main: ({
    mode,
    readOnly,
    draft,
    setDraft,
    onCommitField,
    onUnitChange,
    onGroupChange,
    sectorsLoading,
    sectorOptions,
    onDefaultSectorChange,
    onOpenNewSector,
  }) => (
    <DepositItemDetailForm
      mode={mode}
      readOnly={readOnly}
      draft={draft}
      setDraft={setDraft}
      onCommitField={onCommitField}
      onUnitChange={onUnitChange}
      onGroupChange={onGroupChange}
      sectorsLoading={sectorsLoading}
      sectorOptions={sectorOptions}
      onDefaultSectorChange={onDefaultSectorChange}
      onOpenNewSector={onOpenNewSector}
      inputLineClassName={DEPOSIT_DETAIL_INPUT_CLASS}
    />
  ),
  tabTemplates: [
    {
      key: "entries",
      label: "Entradas",
      badge: ({ entryRows }) => entryRows.length,
      flushContent: true,
      content: ({
        mode,
        readOnly,
        token,
        entryRows,
        movementLoading,
        canDeleteEntry,
        onOpenEntry,
        onNewEntry,
        onMovementsChanged,
      }) => (
        <DepositItemEntriesSection
          rows={mode === "edit" ? entryRows : []}
          loading={movementLoading}
          token={token}
          canAdd={!readOnly && mode === "edit"}
          canDelete={canDeleteEntry && mode === "edit"}
          onOpenEntry={onOpenEntry}
          onAddEntry={onNewEntry}
          onDeleted={onMovementsChanged}
        />
      ),
    },
    {
      key: "exits",
      label: "Saídas",
      badge: ({ exitRows }) => exitRows.length,
      flushContent: true,
      content: ({
        mode,
        readOnly,
        token,
        exitRows,
        movementLoading,
        canDeleteExit,
        onOpenExit,
        onNewExit,
        onMovementsChanged,
      }) => (
        <DepositItemExitsSection
          rows={mode === "edit" ? exitRows : []}
          loading={movementLoading}
          token={token}
          canAdd={!readOnly && mode === "edit"}
          canDelete={canDeleteExit && mode === "edit"}
          onOpenExit={onOpenExit}
          onAddExit={onNewExit}
          onDeleted={onMovementsChanged}
        />
      ),
    },
    {
      key: "history",
      label: "Histórico",
      badge: ({ historyRows }) => historyRows.length,
      flushContent: true,
      content: ({ mode, historyRows, movementLoading, onOpenEntry, onOpenExit }) => (
        <DepositItemHistorySection
          rows={mode === "edit" ? historyRows : []}
          loading={movementLoading}
          onOpenEntry={onOpenEntry}
          onOpenExit={onOpenExit}
        />
      ),
    },
  ],
  side: ({
    mode,
    readOnly,
    detailAudit,
    auditVisibleCount,
    onAuditVisibleCountChange,
    mentionableUsers,
    commentDraft,
    onCommentDraftChange,
    onSubmitComment,
    onDeleteComment,
    commentSubmitting,
    tags,
    onTagsChange,
    onTagsCommit,
    internalNotes,
    onInternalNotesChange,
    onInternalNotesBlur,
    onUploadAttachment,
    onDeleteAttachment,
    item,
    historyItems,
  }) => {
    return (
      <StandardDetailMetadataSide
        mode={mode}
        readOnly={readOnly}
        detailAudit={detailAudit}
        auditVisibleCount={auditVisibleCount}
        onAuditVisibleCountChange={onAuditVisibleCountChange}
        canAudit
        tabOrder={["tags", "notes", "attachments", "activity"]}
        comments={{
          items: item?.comments ?? [],
          draft: commentDraft,
          users: mentionableUsers,
          onDraftChange: onCommentDraftChange,
          onSubmit: onSubmitComment,
          onDelete: mode === "edit" ? onDeleteComment : undefined,
          submitting: commentSubmitting,
          readOnly: readOnly || mode !== "edit",
          emptyLabel:
            mode === "create"
              ? "Salve o objeto para habilitar comentários."
              : "Nenhum comentário registrado para este objeto.",
        }}
        notes={{
          value: internalNotes,
          onChange: onInternalNotesChange,
          onBlur: onInternalNotesBlur,
          readOnly,
          richText: true,
          mentionUsers: mentionableUsers,
        }}
        tags={{
          value: tags,
          onChange: onTagsChange,
          onCommit: onTagsCommit,
          readOnly,
        }}
        attachments={{
          items:
            item?.attachments?.map((attachment) => ({
              id: attachment.id,
              label: attachment.label,
              href: resolveMediaUrl(attachment.filePath),
              mimeType: attachment.mimeType ?? null,
              sizeLabel: attachment.sizeLabel ?? null,
              createdAt: attachment.createdAt,
            })) ?? [],
          onUpload: onUploadAttachment,
          onDelete: mode === "edit" ? onDeleteAttachment : undefined,
          readOnly: readOnly || mode !== "edit",
          emptyLabel:
            mode === "create"
              ? "Salve o objeto para habilitar anexos."
              : "Nenhum anexo registrado para este objeto.",
        }}
        history={{
          items: historyItems,
          emptyLabel:
            mode === "create"
              ? "Salve o objeto para habilitar histórico."
              : "Nenhum histórico registrado para este objeto.",
        }}
        contextItems={[
          { key: "stock", label: "Saldo total", value: Number(item?.stock ?? 0).toLocaleString("pt-BR") },
          { key: "group", label: "Grupos", value: item?.group ?? "Sem Grupos" },
          { key: "sector", label: "Setor padrão", value: item?.defaultSector ?? DEPOSIT_DEFAULT_SECTOR },
          { key: "status", label: "Status", value: item?.validityStatus ?? "Sem status" },
        ]}
      />
    );
  },
  auditSources: {
    primaryEntity: {
      key: "item",
      entity: "DepositItem",
      model: "deposit.items",
      label: "Item",
      fieldLabels: DEPOSIT_AUDIT_FIELD_LABELS,
      valueFormatters: {
        defaultSector: (value) =>
          normalizeSector(typeof value === "string" ? value : null),
        minStock: (value) => formatAuditNumber(value),
      },
      joinKey: "itemId",
      idField: "id",
      resolveEntityId: ({ item }) => item?.id,
    },
    relatedEntities: [
      {
        key: "entries",
        entity: "DepositEntry",
        model: "deposit.entries",
        label: "Entrada",
        fieldLabels: DEPOSIT_ENTRY_AUDIT_FIELD_LABELS,
        valueFormatters: {
          donorId: (value, { context }) =>
            resolveDonorAuditValue(context.donorNameById, value),
          sector: (value) =>
            normalizeSector(typeof value === "string" ? value : null),
          quantity: (value) => formatAuditNumber(value),
          entryDate: (value) => formatAuditDate(value),
          expiryDate: (value) =>
            typeof value === "string" && value.trim()
              ? formatAuditDate(value)
              : "Sem data limite",
          reversalOfExitId: (value, { context }) =>
            formatAuditReferenceLabel(
              context.exitLabelById[typeof value === "string" ? value.trim() : ""],
              value,
              "Saída",
            ),
        },
        joinKey: "itemId",
        idField: "id",
        resolveEntityIds: ({ entryRows }) => entryRows.map((entry) => entry.id),
      },
      {
        key: "exits",
        entity: "DepositExit",
        model: "deposit.exits",
        label: "Saída",
        fieldLabels: DEPOSIT_EXIT_AUDIT_FIELD_LABELS,
        valueFormatters: {
          sector: (value) =>
            normalizeSector(typeof value === "string" ? value : null),
          quantity: (value) => formatAuditNumber(value),
          exitDate: (value) => formatAuditDate(value),
          type: (value) =>
            resolveExitTypeLabel(typeof value === "string" ? value : null),
          destinationName: (value) =>
            typeof value === "string" && value.trim()
              ? value.trim()
              : "Sem destino",
          reversalOfEntryId: (value, { context }) =>
            formatAuditReferenceLabel(
              context.entryLabelById[typeof value === "string" ? value.trim() : ""],
              value,
              "Entrada",
            ),
        },
        joinKey: "itemId",
        idField: "id",
        resolveEntityIds: ({ exitRows }) => exitRows.map((exit) => exit.id),
      },
    ],
    sort: [{ field: "createdAt", direction: "desc" }],
    pagination: { limit: 120 },
  },
};

export const depositDonorDetailLayout: DetailLayoutConfig<DepositDonorDetailLayoutContext> = {
  editing: AUTO_SAVE_EDITING,
  header: {
    leadingSlot: ({
      draft,
      readOnly,
      avatarUploading,
      onAvatarFileSelect,
    }) => (
      <DetailIdentityMediaField
        variant="header"
        name={draft.name || "Fonte"}
        value={draft.avatarUrl}
        readOnly={readOnly}
        busy={avatarUploading}
        onFileSelect={onAvatarFileSelect}
      />
    ),
  },
  mainTab: true,
  main: ({
    readOnly,
    draft,
    setDraft,
    onCommitField,
    onTypeChange,
  }) => (
    <div className={DEPOSIT_DETAIL_SECTION_CLASS}>
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="space-y-1">
              <div className="text-[11px] font-medium text-muted-foreground">
                Nome
              </div>
              <Input
                value={draft.name}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, name: event.target.value }))
                }
                onBlur={() => onCommitField("name")}
                placeholder="Ex: Mercado Central"
                className={DEPOSIT_DETAIL_INPUT_CLASS}
                readOnly={readOnly}
              />
            </div>

            <div className="space-y-1">
              <div className="text-[11px] font-medium text-muted-foreground">
                Tipo
              </div>
              <Select
                value={draft.type}
                onValueChange={(value) => {
                  const next = value as ApiDepositDonor["type"];
                  setDraft((prev) => ({ ...prev, type: next }));
                  onTypeChange(next);
                }}
                disabled={readOnly}
              >
                <SelectTrigger className={DEPOSIT_DETAIL_INPUT_CLASS}>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERSON">
                    {DEPOSIT_DONOR_TYPE_LABELS.PERSON}
                  </SelectItem>
                  <SelectItem value="COMPANY">
                    {DEPOSIT_DONOR_TYPE_LABELS.COMPANY}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-medium text-muted-foreground">
              Contato
            </div>
            <Input
              value={draft.contact ?? ""}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  contact: event.target.value || null,
                }))
              }
              onBlur={() => onCommitField("contact")}
              placeholder="Telefone, e-mail..."
              className={DEPOSIT_DETAIL_INPUT_CLASS}
              readOnly={readOnly}
            />
          </div>
        </div>
      </div>
    </div>
  ),
  tabTemplates: [
    {
      key: "donations",
      label: "Doações",
      badge: ({ entries }) => entries.length,
      flushContent: true,
      content: ({ mode, entries, entriesLoading, onOpenEntry }) => (
        <DepositDonorDonationsSection
          rows={mode === "edit" ? entries : []}
          loading={entriesLoading}
          onOpenEntry={onOpenEntry}
        />
      ),
    },
  ],
  side: ({
    mode,
    readOnly,
    detailAudit,
    auditVisibleCount,
    onAuditVisibleCountChange,
    mentionableUsers,
    commentDraft,
    onCommentDraftChange,
    onSubmitComment,
    onDeleteComment,
    commentSubmitting,
    tags,
    onTagsChange,
    onTagsCommit,
    internalNotes,
    onInternalNotesChange,
    onInternalNotesBlur,
    onUploadAttachment,
    onDeleteAttachment,
    donor,
    historyItems,
  }) => (
    <StandardDetailMetadataSide
      mode={mode}
      readOnly={readOnly}
      detailAudit={detailAudit}
      auditVisibleCount={auditVisibleCount}
      onAuditVisibleCountChange={onAuditVisibleCountChange}
      canAudit
      tabOrder={["tags", "notes", "attachments", "activity"]}
      comments={{
        items: donor?.comments ?? [],
        draft: commentDraft,
        users: mentionableUsers,
        onDraftChange: onCommentDraftChange,
        onSubmit: onSubmitComment,
        onDelete: mode === "edit" ? onDeleteComment : undefined,
        submitting: commentSubmitting,
        readOnly: readOnly || mode !== "edit",
        emptyLabel: mode === "create" ? "Salve a fonte para habilitar comentários." : "Nenhum comentário registrado para esta fonte.",
      }}
      notes={{
        value: internalNotes,
        onChange: onInternalNotesChange,
        onBlur: onInternalNotesBlur,
        readOnly,
        richText: true,
        mentionUsers: mentionableUsers,
      }}
      tags={{ value: tags, onChange: onTagsChange, onCommit: onTagsCommit, readOnly }}
      attachments={{
        items:
          donor?.attachments?.map((attachment) => ({
            id: attachment.id,
            label: attachment.label,
            href: resolveMediaUrl(attachment.filePath),
            mimeType: attachment.mimeType ?? null,
            sizeLabel: attachment.sizeLabel ?? null,
            createdAt: attachment.createdAt,
          })) ?? [],
        onUpload: onUploadAttachment,
        onDelete: mode === "edit" ? onDeleteAttachment : undefined,
        readOnly: readOnly || mode !== "edit",
        emptyLabel: mode === "create" ? "Salve o fonte para habilitar anexos." : "Nenhum anexo registrado para este fonte.",
      }}
      history={{ items: historyItems }}
      contextItems={[
        { key: "type", label: "Tipo", value: donor ? resolveDonorTypeAuditValue(donor.type) : "Sem tipo" },
        { key: "contact", label: "Contato", value: donor?.contact ?? "Sem contato" },
      ]}
    />
  ),
  auditSources: {
    primaryEntity: {
      key: "donor",
      entity: "DepositDonor",
      model: "deposit.donors",
      label: "Fonte",
      fieldLabels: DEPOSIT_DONOR_AUDIT_FIELD_LABELS,
      valueFormatters: {
        type: (value) => resolveDonorTypeAuditValue(value),
        avatarUrl: (value) => resolveAvatarAuditValue(value),
      },
      joinKey: "donorId",
      idField: "id",
      resolveEntityId: ({ donor }) => donor?.id,
    },
    relatedEntities: [
      {
        key: "donations",
        entity: "DepositEntry",
        model: "deposit.entries",
        label: "Doa??o",
        fieldLabels: DEPOSIT_ENTRY_AUDIT_FIELD_LABELS,
        valueFormatters: {
          donorId: (value, { context }) =>
            resolveDonorAuditValue(context.donorNameById, value),
          sector: (value) =>
            normalizeSector(typeof value === "string" ? value : null),
          quantity: (value) => formatAuditNumber(value),
          entryDate: (value) => formatAuditDate(value),
          expiryDate: (value) =>
            typeof value === "string" && value.trim()
              ? formatAuditDate(value)
              : "Sem data limite",
          reversalOfExitId: (value) =>
            formatAuditReferenceLabel(undefined, value, "Saída"),
        },
        joinKey: "donorId",
        idField: "id",
        resolveEntityIds: ({ entries }) => entries.map((entry) => entry.id),
      },
    ],
    sort: [{ field: "createdAt", direction: "desc" }],
    pagination: { limit: 120 },
  },
};

export const depositEntryDetailLayout: DetailLayoutConfig<DepositEntryDetailLayoutContext> = {
  editing: AUTO_SAVE_EDITING,
  mainTab: true,
  main: ({
    draft,
    setDraft,
    readOnly,
    saving,
    donors,
    donorsLoading,
    sectorsLoading,
    sectorOptions,
    onCommitField,
    onPatch,
    onOpenNewSector,
    onOpenCreateDonor,
  }) => (
    <div className={DEPOSIT_DETAIL_SECTION_CLASS}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[120px_1fr_1fr] md:items-end">
        <div>
          <div className="mb-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Quantidade
          </div>
          <Input
            value={String(draft.quantity)}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, quantity: Number(event.target.value) }))
            }
            onBlur={() => onCommitField("quantity")}
            className={DEPOSIT_DETAIL_INPUT_CLASS}
            inputMode="numeric"
            placeholder="Qtd."
            readOnly={saving || readOnly}
          />
        </div>

        <div>
          <div className="mb-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Unidade
          </div>
          <Select
            value={draft.unit}
            onValueChange={(value) => {
              setDraft((prev) => ({ ...prev, unit: value }));
              onPatch({ unit: value });
            }}
            disabled={saving || readOnly}
          >
            <SelectTrigger className={DEPOSIT_DETAIL_INPUT_CLASS}>
              <SelectValue placeholder="Unidade" />
            </SelectTrigger>
            <SelectContent>
              {DEPOSIT_ITEM_UNIT.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="mb-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Setor
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={draft.sector}
              onValueChange={(value) => {
                setDraft((prev) => ({ ...prev, sector: value }));
                onPatch({ sector: value });
              }}
              disabled={saving || readOnly}
            >
              <SelectTrigger className={DEPOSIT_DETAIL_INPUT_CLASS}>
                <SelectValue placeholder={sectorsLoading ? "Carregando..." : "Setor"} />
              </SelectTrigger>
              <SelectContent>
                {sectorOptions.map((sector) => (
                  <SelectItem key={sector} value={sector}>
                    {sector}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0"
              title="Novo setor"
              aria-label="Novo setor"
              onClick={onOpenNewSector}
              disabled={saving || readOnly}
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr] md:items-end">
        <div>
          <div className="mb-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Fonte
          </div>
          <Select
            value={draft.donorId ?? DEPOSIT_ENTRY_DONOR_NONE_VALUE}
            onValueChange={(value) => {
              const next = value === DEPOSIT_ENTRY_DONOR_NONE_VALUE ? null : value;
              setDraft((prev) => ({ ...prev, donorId: next }));
              onPatch({ donorId: next });
            }}
            disabled={saving || readOnly}
          >
            <SelectTrigger className={DEPOSIT_DETAIL_INPUT_CLASS}>
              <SelectValue placeholder={donorsLoading ? "Carregando..." : "Fonte"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={DEPOSIT_ENTRY_DONOR_NONE_VALUE}>Sem fonte</SelectItem>
              {donors.map((donor) => (
                <SelectItem key={donor.id} value={donor.id}>
                  {donor.name}
                </SelectItem>
              ))}
              <div className="px-2 py-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-8 w-full"
                  onClick={onOpenCreateDonor}
                  disabled={saving || readOnly}
                >
                  <Plus className="mr-1 size-4" />
                  Nova fonte
                </Button>
              </div>
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="mb-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Data da entrada
          </div>
          <Input
            type="date"
            value={draft.entryDate}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, entryDate: event.target.value }))
            }
            onBlur={() => onCommitField("entryDate")}
            className={DEPOSIT_DETAIL_INPUT_CLASS}
            readOnly={saving || readOnly}
            title="Data da entrada"
          />
        </div>
      </div>
    </div>
  ),
  tabTemplates: [
    {
      key: "allocatedExits",
      label: "Saídas",
      badge: ({ allocatedExits }) => allocatedExits.length,
      flushContent: true,
      content: ({ mode, readOnly, allocatedExits, allocatedExitsLoading, canCreateRelatedExit, onOpenExit, onOpenCreateExit }) => (
        <DepositEntryAllocatedExitsSection
          rows={mode === "edit" ? allocatedExits : []}
          loading={allocatedExitsLoading}
          canAdd={!readOnly && canCreateRelatedExit && mode === "edit"}
          onOpenExit={onOpenExit}
          onAddExit={onOpenCreateExit}
        />
      ),
    },
  ],
  side: ({
    mode,
    readOnly,
    detailAudit,
    auditVisibleCount,
    onAuditVisibleCountChange,
    mentionableUsers,
    commentDraft,
    onCommentDraftChange,
    onSubmitComment,
    onDeleteComment,
    commentSubmitting,
    tags,
    onTagsChange,
    onTagsCommit,
    internalNotes,
    onInternalNotesChange,
    onInternalNotesBlur,
    onUploadAttachment,
    onDeleteAttachment,
    entry,
    historyItems,
  }) => (
    <StandardDetailMetadataSide
      mode={mode}
      readOnly={readOnly}
      detailAudit={detailAudit}
      auditVisibleCount={auditVisibleCount}
      onAuditVisibleCountChange={onAuditVisibleCountChange}
      canAudit
      tabOrder={["tags", "notes", "attachments", "activity"]}
      comments={{
        items: entry?.comments ?? [],
        draft: commentDraft,
        users: mentionableUsers,
        onDraftChange: onCommentDraftChange,
        onSubmit: onSubmitComment,
        onDelete: mode === "edit" ? onDeleteComment : undefined,
        submitting: commentSubmitting,
        readOnly: readOnly || mode !== "edit",
        emptyLabel: mode === "create" ? "Salve a entrada para habilitar comentários." : "Nenhum comentário registrado para esta entrada.",
      }}
      notes={{
        value: internalNotes,
        onChange: onInternalNotesChange,
        onBlur: onInternalNotesBlur,
        readOnly,
        richText: true,
        mentionUsers: mentionableUsers,
      }}
      tags={{ value: tags, onChange: onTagsChange, onCommit: onTagsCommit, readOnly }}
      attachments={{
        items:
          entry?.attachments?.map((attachment) => ({
            id: attachment.id,
            label: attachment.label,
            href: resolveMediaUrl(attachment.filePath),
            mimeType: attachment.mimeType ?? null,
            sizeLabel: attachment.sizeLabel ?? null,
            createdAt: attachment.createdAt,
          })) ?? [],
        onUpload: onUploadAttachment,
        onDelete: mode === "edit" ? onDeleteAttachment : undefined,
        readOnly: readOnly || mode !== "edit",
        emptyLabel: mode === "create" ? "Salve a entrada para habilitar anexos." : "Nenhum anexo registrado para esta entrada.",
      }}
      history={{ items: historyItems }}
      contextItems={[
        { key: "item", label: "Objeto", value: entry?.item?.name ?? "Sem objeto" },
        { key: "sector", label: "Setor", value: entry?.sector ?? DEPOSIT_DEFAULT_SECTOR },
        { key: "status", label: "Status", value: entry?.isClosed ? "Fechada" : "Aberta" },
      ]}
    />
  ),
  auditSources: {
    primaryEntity: {
      key: "entry",
      entity: "DepositEntry",
      model: "deposit.entries",
      label: "Entrada",
      fieldLabels: DEPOSIT_ENTRY_AUDIT_FIELD_LABELS,
      valueFormatters: {
        donorId: (value, { context }) =>
          resolveDonorAuditValue(context.donorNameById, value),
        sector: (value) =>
          normalizeSector(typeof value === "string" ? value : null),
        quantity: (value) => formatAuditNumber(value),
        entryDate: (value) => formatAuditDate(value),
        expiryDate: (value) =>
          typeof value === "string" && value.trim()
            ? formatAuditDate(value)
            : "Sem data limite",
        reversalOfExitId: (value, { context }) =>
          formatAuditReferenceLabel(
            context.exitLabelById[typeof value === "string" ? value.trim() : ""],
            value,
            "Saída",
          ),
      },
      joinKey: "entryId",
      idField: "id",
      resolveEntityId: ({ entry }) => entry?.id,
    },
    relatedEntities: [
      {
        key: "entry.exits",
        entity: "DepositExit",
        model: "deposit.exits",
        label: "Saída",
        fieldLabels: DEPOSIT_EXIT_AUDIT_FIELD_LABELS,
        valueFormatters: {
          sector: (value) =>
            normalizeSector(typeof value === "string" ? value : null),
          quantity: (value) => formatAuditNumber(value),
          exitDate: (value) => formatAuditDate(value),
          type: (value) =>
            resolveExitTypeLabel(typeof value === "string" ? value : null),
          destinationName: (value) =>
            typeof value === "string" && value.trim() ? value.trim() : "Sem destino",
          reversalOfEntryId: (value) =>
            formatAuditReferenceLabel(undefined, value, "Entrada"),
        },
        joinKey: "entryId",
        idField: "id",
        resolveEntityIds: ({ allocatedExits }) =>
          allocatedExits.map((exitRow) => exitRow.exitId),
      },
    ],
    sort: [{ field: "createdAt", direction: "desc" }],
    pagination: { limit: 120 },
  },
};

export const depositExitDetailLayout: DetailLayoutConfig<DepositExitDetailLayoutContext> = {
  editing: AUTO_SAVE_EDITING,
  main: ({
    draft,
    setDraft,
    readOnly,
    saving,
    entriesLoading,
    entries,
    entryLocked,
    selectedEntry,
    sectorsLoading,
    sectorOptions,
    onCommitField,
    onPatch,
    onOpenNewSector,
  }) => (
    <div className={DEPOSIT_DETAIL_SECTION_CLASS}>
      <div className="mt-3">
        <div className="max-w-4xl">
          <div className="mb-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Entrada de origem
          </div>
          <Select
            value={draft.entryId || DEPOSIT_EXIT_ENTRY_AUTO_VALUE}
            onValueChange={(value) => {
              const nextEntryId = value === DEPOSIT_EXIT_ENTRY_AUTO_VALUE ? "" : value;
              const nextEntry = entries.find((row) => row.id === nextEntryId) ?? null;
              setDraft((prev) => ({
                ...prev,
                entryId: nextEntryId,
                sector: nextEntry?.sector ?? prev.sector ?? DEPOSIT_DEFAULT_SECTOR,
                unit: nextEntry?.unit ?? prev.unit,
              }));
              onPatch({ entryId: nextEntryId });
            }}
            disabled={saving || readOnly || entryLocked}
          >
            <SelectTrigger className={DEPOSIT_DETAIL_INPUT_CLASS}>
              <SelectValue placeholder={entriesLoading ? "Carregando..." : "Entrada de origem"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={DEPOSIT_EXIT_ENTRY_AUTO_VALUE}>Automático</SelectItem>
              {entries.map((entry) => {
                const remaining =
                  typeof entry.remaining === "number"
                    ? entry.remaining
                    : entry.quantity - (entry.allocatedTotal ?? 0);
                const expiry = entry.expiryDate ? formatDateOnlyPtBR(entry.expiryDate) : "Sem data limite";
                return (
                  <SelectItem key={entry.id} value={entry.id}>
                    {`Entrada ${formatDateOnlyPtBR(entry.entryDate)} - ${expiry} - ${entry.sector || DEPOSIT_DEFAULT_SECTOR} - ${Number(remaining).toLocaleString("pt-BR")} ${entry.unit}`}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <div className="mt-2 text-[11px] text-muted-foreground">
            {selectedEntry ? (
              <>
                Saindo a partir da entrada{" "}
                <span className="font-medium text-foreground">
                  {selectedEntry.entryDate
                    ? formatDateOnlyPtBR(selectedEntry.entryDate)
                    : "-"}
                </span>
                {" - "}
                <span className="font-medium text-foreground">
                  {selectedEntry.sector || DEPOSIT_DEFAULT_SECTOR}
                </span>
                {" - saldo "}
                <span className="font-mono font-medium text-foreground">
                  {Number(
                    typeof selectedEntry.remaining === "number"
                      ? selectedEntry.remaining
                      : selectedEntry.quantity - (selectedEntry.allocatedTotal ?? 0),
                  ).toLocaleString("pt-BR")}{" "}
                  {selectedEntry.unit}
                </span>
              </>
            ) : (
              "Automático: distribui pela entrada dispon?vel mais adequada no setor."
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-[120px_1fr_1fr] md:items-end">
        <Input
          value={String(draft.quantity)}
          onChange={(event) =>
            setDraft((prev) => ({ ...prev, quantity: Number(event.target.value) }))
          }
          onBlur={() => onCommitField("quantity")}
          className={DEPOSIT_DETAIL_INPUT_CLASS}
          inputMode="numeric"
          placeholder="Qtd."
          readOnly={saving || readOnly}
        />

        <Select
          value={draft.unit}
          onValueChange={(value) => {
            setDraft((prev) => ({ ...prev, unit: value }));
            onPatch({ unit: value });
          }}
          disabled={saving || readOnly}
        >
          <SelectTrigger className={DEPOSIT_DETAIL_INPUT_CLASS}>
            <SelectValue placeholder="Unidade" />
          </SelectTrigger>
          <SelectContent>
            {DEPOSIT_ITEM_UNIT.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Select
            value={draft.sector}
            onValueChange={(value) => {
              setDraft((prev) => ({ ...prev, sector: value }));
              onPatch({ sector: value });
            }}
            disabled={saving || readOnly || Boolean(selectedEntry)}
          >
            <SelectTrigger className={DEPOSIT_DETAIL_INPUT_CLASS}>
              <SelectValue placeholder={sectorsLoading ? "Carregando..." : "Setor"} />
            </SelectTrigger>
            <SelectContent>
              {sectorOptions.map((sector) => (
                <SelectItem key={sector} value={sector}>
                  {sector}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0"
            title="Novo setor"
            aria-label="Novo setor"
            onClick={onOpenNewSector}
            disabled={saving || readOnly || Boolean(selectedEntry)}
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[220px_220px_1fr] md:items-end">
        <div>
          <div className="mb-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Data da saída
          </div>
          <Input
            type="date"
            value={draft.exitDate}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, exitDate: event.target.value }))
            }
            onBlur={() => onCommitField("exitDate")}
            className={DEPOSIT_DETAIL_INPUT_CLASS}
            readOnly={saving || readOnly}
            title="Data da saída"
          />
        </div>

        <div>
          <div className="mb-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Tipo de saída
          </div>
          <Select
            value={draft.type}
            onValueChange={(value) => {
              const nextType = value as DepositExitDraft["type"];
              setDraft((prev) => ({ ...prev, type: nextType }));
              onPatch({ type: nextType });
            }}
            disabled={saving || readOnly}
          >
            <SelectTrigger className={DEPOSIT_DETAIL_INPUT_CLASS}>
              <SelectValue placeholder="Tipo de saída" />
            </SelectTrigger>
            <SelectContent>
              {DEPOSIT_EXIT_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {resolveExitTypeLabel(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {draft.type === "LOAN" || draft.type === "FINAL_REMOVAL" || draft.type === "TRANSFER" ? (
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Nome do destino
            </div>
            <Input
              value={draft.destinationName}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, destinationName: event.target.value }))
              }
              onBlur={() => onCommitField("destinationName")}
              className={DEPOSIT_DETAIL_INPUT_CLASS}
              placeholder="Ex: Escola parceira"
              readOnly={saving || readOnly}
            />
          </div>
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Tipo de destino
            </div>
            <Input
              value={draft.destinationType}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, destinationType: event.target.value }))
              }
              onBlur={() => onCommitField("destinationType")}
              className={DEPOSIT_DETAIL_INPUT_CLASS}
              placeholder="Ex: Doa??o, sala, oficina"
              readOnly={saving || readOnly}
            />
          </div>
        </div>
      ) : null}

      {draft.type === "LOAN" ? (
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Retorno previsto
            </div>
            <Input
              type="date"
              value={draft.expectedReturnAt}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, expectedReturnAt: event.target.value }))
              }
              onBlur={() => onCommitField("expectedReturnAt")}
              className={DEPOSIT_DETAIL_INPUT_CLASS}
              readOnly={saving || readOnly}
              title="Retorno previsto"
            />
          </div>
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Retornado em
            </div>
            <Input
              type="date"
              value={draft.returnedAt}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, returnedAt: event.target.value }))
              }
              onBlur={() => onCommitField("returnedAt")}
              className={DEPOSIT_DETAIL_INPUT_CLASS}
              readOnly={saving || readOnly}
              title="Retornado em"
            />
          </div>
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Quantidade retornada
            </div>
            <Input
              value={draft.returnedQuantity ? String(draft.returnedQuantity) : ""}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  returnedQuantity: Number(event.target.value || 0),
                }))
              }
              onBlur={() => onCommitField("returnedQuantity")}
              className={DEPOSIT_DETAIL_INPUT_CLASS}
              inputMode="decimal"
              placeholder="Qtd. retornada"
              readOnly={saving || readOnly}
            />
          </div>
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Notas do retorno
            </div>
            <Input
              value={draft.returnNotes}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, returnNotes: event.target.value }))
              }
              onBlur={() => onCommitField("returnNotes")}
              className={DEPOSIT_DETAIL_INPUT_CLASS}
              placeholder="Notas do retorno"
              readOnly={saving || readOnly}
            />
          </div>
        </div>
      ) : null}
    </div>
  ),
  side: ({
    mode,
    readOnly,
    detailAudit,
    auditVisibleCount,
    onAuditVisibleCountChange,
    mentionableUsers,
    commentDraft,
    onCommentDraftChange,
    onSubmitComment,
    onDeleteComment,
    commentSubmitting,
    tags,
    onTagsChange,
    onTagsCommit,
    internalNotes,
    onInternalNotesChange,
    onInternalNotesBlur,
    onUploadAttachment,
    onDeleteAttachment,
    exit,
    historyItems,
  }) => (
    <StandardDetailMetadataSide
      mode={mode}
      readOnly={readOnly}
      detailAudit={detailAudit}
      auditVisibleCount={auditVisibleCount}
      onAuditVisibleCountChange={onAuditVisibleCountChange}
      canAudit
      tabOrder={["tags", "notes", "attachments", "activity"]}
      comments={{
        items: exit?.comments ?? [],
        draft: commentDraft,
        users: mentionableUsers,
        onDraftChange: onCommentDraftChange,
        onSubmit: onSubmitComment,
        onDelete: mode === "edit" ? onDeleteComment : undefined,
        submitting: commentSubmitting,
        readOnly: readOnly || mode !== "edit",
        emptyLabel: mode === "create" ? "Salve a saída para habilitar comentários." : "Nenhum comentário registrado para esta saída.",
      }}
      notes={{
        value: internalNotes,
        onChange: onInternalNotesChange,
        onBlur: onInternalNotesBlur,
        readOnly,
        richText: true,
        mentionUsers: mentionableUsers,
      }}
      tags={{ value: tags, onChange: onTagsChange, onCommit: onTagsCommit, readOnly }}
      attachments={{
        items:
          exit?.attachments?.map((attachment) => ({
            id: attachment.id,
            label: attachment.label,
            href: resolveMediaUrl(attachment.filePath),
            mimeType: attachment.mimeType ?? null,
            sizeLabel: attachment.sizeLabel ?? null,
            createdAt: attachment.createdAt,
          })) ?? [],
        onUpload: onUploadAttachment,
        onDelete: mode === "edit" ? onDeleteAttachment : undefined,
        readOnly: readOnly || mode !== "edit",
        emptyLabel: mode === "create" ? "Salve a saída para habilitar anexos." : "Nenhum anexo registrado para esta saída.",
      }}
      history={{ items: historyItems }}
      contextItems={[
        { key: "item", label: "Objeto", value: exit?.item?.name ?? "Sem objeto" },
        { key: "sector", label: "Setor", value: exit?.sector ?? DEPOSIT_DEFAULT_SECTOR },
        { key: "type", label: "Tipo", value: exit ? resolveExitTypeLabel(exit.type) : "Sem tipo" },
      ]}
    />
  ),
  auditSources: {
    primaryEntity: {
      key: "exit",
      entity: "DepositExit",
      model: "deposit.exits",
      label: "Saída",
      fieldLabels: DEPOSIT_EXIT_AUDIT_FIELD_LABELS,
      valueFormatters: {
        sector: (value) =>
          normalizeSector(typeof value === "string" ? value : null),
        quantity: (value) => formatAuditNumber(value),
        exitDate: (value) => formatAuditDate(value),
        type: (value) =>
          resolveExitTypeLabel(typeof value === "string" ? value : null),
        destinationName: (value) =>
          typeof value === "string" && value.trim() ? value.trim() : "Sem destino",
        reversalOfEntryId: (value, { context }) =>
          formatAuditReferenceLabel(
            context.entryLabelById[typeof value === "string" ? value.trim() : ""],
            value,
            "Entrada",
          ),
      },
      joinKey: "exitId",
      idField: "id",
      resolveEntityId: ({ exit }) => exit?.id,
    },
    relatedEntities: [
      {
        key: "exit.entries",
        entity: "DepositEntry",
        model: "deposit.entries",
        label: "Entrada",
        fieldLabels: DEPOSIT_ENTRY_AUDIT_FIELD_LABELS,
        valueFormatters: {
          donorId: (value, { context }) =>
            resolveDonorAuditValue(context.donorNameById, value),
          sector: (value) =>
            normalizeSector(typeof value === "string" ? value : null),
          quantity: (value) => formatAuditNumber(value),
          entryDate: (value) => formatAuditDate(value),
          expiryDate: (value) =>
            typeof value === "string" && value.trim()
              ? formatAuditDate(value)
              : "Sem data limite",
          reversalOfExitId: (value) =>
            formatAuditReferenceLabel(undefined, value, "Saída"),
        },
        joinKey: "entryId",
        idField: "id",
        resolveEntityIds: ({ exit }) =>
          (exit?.allocations ?? []).map((allocation) => allocation.entryId),
      },
    ],
    sort: [{ field: "createdAt", direction: "desc" }],
    pagination: { limit: 120 },
  },
};




