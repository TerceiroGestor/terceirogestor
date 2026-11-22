"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDateOnlyPtBR } from "@/lib/date";
import type {
  ApiAttendance,
  ApiAttendanceBenefit,
  ApiAttendanceEvolution,
  ApiAttendancePerson,
  AttendanceCaseStatus,
  AttendanceType,
} from "@/modules/attendances/api";
import {
  ATTENDANCE_AUDIT_FIELD_LABELS,
  ATTENDANCE_CASE_STATUS_LABELS,
  ATTENDANCE_CASE_STATUS_OPTIONS,
  ATTENDANCE_PERSON_ROLE_LABELS,
  ATTENDANCE_TYPE_LABELS,
  ATTENDANCE_TYPE_OPTIONS,
} from "@/modules/attendances/shared/domain/attendances.constants";
import { AttendanceBenefitDialog } from "@/modules/attendances/features/detail/ui/attendance-benefit-dialog";
import { AttendanceEvolutionDialog } from "@/modules/attendances/features/detail/ui/attendance-evolution-dialog";
import { DetailSectionField, DetailSectionHeading } from "@/web-client/detail/DetailFormSection";
import { DetailRelationTablePanel } from "@/web-client/detail/DetailRelationTablePanel";
import { StandardDetailMetadataSide } from "@/web-client/detail/StandardDetailMetadataSide";
import { buildAuditHistoryItems } from "@/web-client/detail/audit-feed-utils";
import type { DetailShellAuditContext } from "@/web-client/detail/DetailShellEngine";
import type { DetailLayoutConfig } from "@/web-client/registry/types";

const ATTENDANCE_DETAIL_INPUT_CLASS =
  "h-10 rounded-none border-0 border-b border-border/70 bg-transparent px-0 text-sm shadow-none focus-visible:border-primary focus-visible:ring-0";
const ATTENDANCE_DETAIL_TEXTAREA_CLASS =
  "min-h-[120px] rounded-none border-0 border-b border-border/70 bg-transparent px-0 py-3 text-sm shadow-none resize-none focus-visible:border-primary focus-visible:ring-0";
const ATTENDANCE_DETAIL_SECTION_CLASS = "border-y border-border/60 bg-transparent px-0 py-4";

const AUTO_SAVE_EDITING = {
  saveMode: "auto",
  autoSave: {
    trigger: "field-commit",
  },
} as const;

function resolveOriginLabel(occurrence: ApiAttendance["occurrence"], occurrenceId?: string | null) {
  if (occurrence) return `Ocorrência: ${occurrence.title}`;
  if (occurrenceId) return "Vinculado a uma ocorrência";
  return "Espontâneo";
}

export type AttendanceDetailDraft = {
  type: AttendanceType;
  scheduledDate: string;
  professionalId: string;
  occurrenceId: string | null;
  status: AttendanceCaseStatus;
  notes: string;
  closingNotes: string;
};

export type AttendancesDetailLayoutContext = DetailShellAuditContext & {
  mode: "create" | "edit";
  readOnly: boolean;
  canAudit: boolean;
  canEdit: boolean;
  tenantSlug: string;
  attendance: ApiAttendance | null;
  draft: AttendanceDetailDraft;
  setDraft: React.Dispatch<React.SetStateAction<AttendanceDetailDraft>>;
  professionalName: string;
  people: ApiAttendancePerson[];
  evolutions: ApiAttendanceEvolution[];
  benefits: ApiAttendanceBenefit[];
  onCommitField: <K extends keyof AttendanceDetailDraft>(
    field: K,
    nextValue?: AttendanceDetailDraft[K],
  ) => void;
  onOpenPerson: (personId: string) => void;
  onAddPerson: () => void;
  onRemovePerson: (link: ApiAttendancePerson) => void;
  onPickProfessional: () => void;
  onAddEvolution: (payload: { date: string; notes: string }) => Promise<void>;
  onRemoveEvolution: (evolution: ApiAttendanceEvolution) => void;
  onOpenEvolution: (evolutionId: string) => void;
  onAddBenefit: (payload: {
    name: string;
    date: string;
    quantity: number | null;
    notes: string | null;
  }) => Promise<void>;
  onRemoveBenefit: (benefit: ApiAttendanceBenefit) => void;
  onOpenBenefit: (benefitId: string) => void;
  auditVisibleCount: number;
  onAuditVisibleCountChange: React.Dispatch<React.SetStateAction<number>>;
};

function peopleColumns({
  canEdit,
  onRemovePerson,
}: Pick<AttendancesDetailLayoutContext, "canEdit" | "onRemovePerson">): ColumnDef<
  ApiAttendancePerson,
  unknown
>[] {
  return [
    {
      accessorKey: "person.fullName",
      header: "Pessoa",
      cell: ({ row }) => <div className="font-medium text-foreground">{row.original.person.fullName}</div>,
    },
    {
      accessorKey: "role",
      header: "Papel",
      cell: ({ row }) => (
        <Badge variant="outline">{ATTENDANCE_PERSON_ROLE_LABELS[row.original.role] ?? row.original.role}</Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) =>
        canEdit ? (
          <div className="flex justify-end">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Remover pessoa"
              onClick={(event) => {
                event.stopPropagation();
                onRemovePerson(row.original);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ) : null,
    },
  ];
}

function evolutionColumns({
  canEdit,
  onRemoveEvolution,
}: Pick<AttendancesDetailLayoutContext, "canEdit" | "onRemoveEvolution">): ColumnDef<
  ApiAttendanceEvolution,
  unknown
>[] {
  return [
    {
      accessorKey: "date",
      header: "Data",
      cell: ({ row }) => formatDateOnlyPtBR(row.original.date),
    },
    {
      accessorKey: "notes",
      header: "Registro",
      cell: ({ row }) => (
        <span className="block max-w-[520px] whitespace-normal break-words py-1">{row.original.notes}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) =>
        canEdit ? (
          <div className="flex justify-end">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Remover evolução"
              onClick={(event) => {
                event.stopPropagation();
                onRemoveEvolution(row.original);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ) : null,
    },
  ];
}

function benefitColumns({
  canEdit,
  onRemoveBenefit,
}: Pick<AttendancesDetailLayoutContext, "canEdit" | "onRemoveBenefit">): ColumnDef<
  ApiAttendanceBenefit,
  unknown
>[] {
  return [
    {
      accessorKey: "name",
      header: "Benefício",
      cell: ({ row }) => <div className="font-medium text-foreground">{row.original.name}</div>,
    },
    {
      accessorKey: "date",
      header: "Data",
      cell: ({ row }) => formatDateOnlyPtBR(row.original.date),
    },
    {
      accessorKey: "quantity",
      header: "Quantidade",
      cell: ({ row }) => row.original.quantity ?? "—",
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) =>
        canEdit ? (
          <div className="flex justify-end">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Remover benefício"
              onClick={(event) => {
                event.stopPropagation();
                onRemoveBenefit(row.original);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ) : null,
    },
  ];
}

function AttendanceDetailMain({
  draft,
  setDraft,
  readOnly,
  onCommitField,
  attendance,
  professionalName,
  onPickProfessional,
  canEdit,
}: Pick<
  AttendancesDetailLayoutContext,
  | "draft"
  | "setDraft"
  | "readOnly"
  | "onCommitField"
  | "attendance"
  | "professionalName"
  | "onPickProfessional"
  | "canEdit"
>) {
  return (
    <div className={ATTENDANCE_DETAIL_SECTION_CLASS}>
      <div className="grid gap-6 md:grid-cols-2 md:items-end">
        <DetailSectionField label="Tipo" required>
          <Select
            value={draft.type}
            onValueChange={(value) => {
              const nextValue = value as AttendanceType;
              setDraft((previous) => ({ ...previous, type: nextValue }));
              onCommitField("type", nextValue);
            }}
            disabled={readOnly}
          >
            <SelectTrigger className={ATTENDANCE_DETAIL_INPUT_CLASS}>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              {ATTENDANCE_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DetailSectionField>
        <DetailSectionField label="Data" required>
          <Input
            type="date"
            value={draft.scheduledDate}
            onChange={(event) => setDraft((previous) => ({ ...previous, scheduledDate: event.target.value }))}
            onBlur={() => onCommitField("scheduledDate")}
            className={ATTENDANCE_DETAIL_INPUT_CLASS}
            readOnly={readOnly}
          />
        </DetailSectionField>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2 md:items-end">
        <DetailSectionField label="Profissional responsável" required>
          <div className="flex h-10 items-center justify-between border-b border-border/70">
            <span className="text-sm text-foreground">
              {professionalName || "Nenhum profissional selecionado"}
            </span>
            {!readOnly && canEdit ? (
              <Button type="button" size="sm" variant="ghost" onClick={onPickProfessional}>
                {professionalName ? "Alterar" : "Selecionar"}
              </Button>
            ) : null}
          </div>
        </DetailSectionField>
        <DetailSectionField label="Origem">
          <div className="flex h-10 items-center border-b border-border/70 text-sm text-muted-foreground">
            {resolveOriginLabel(attendance?.occurrence ?? null, draft.occurrenceId)}
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
                const nextValue = value as AttendanceCaseStatus;
                setDraft((previous) => ({ ...previous, status: nextValue }));
                onCommitField("status", nextValue);
              }}
              disabled={readOnly}
            >
              <SelectTrigger className={ATTENDANCE_DETAIL_INPUT_CLASS}>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {ATTENDANCE_CASE_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </DetailSectionField>
        </div>
      </div>

      <div className="mt-6">
        <DetailSectionField label="Observações">
          <Textarea
            value={draft.notes}
            onChange={(event) => setDraft((previous) => ({ ...previous, notes: event.target.value }))}
            onBlur={() => onCommitField("notes")}
            className={ATTENDANCE_DETAIL_TEXTAREA_CLASS}
            placeholder="Contexto geral do atendimento"
            readOnly={readOnly}
          />
        </DetailSectionField>
      </div>

      <div className="mt-6">
        <DetailSectionField label="Parecer de encerramento">
          <Textarea
            value={draft.closingNotes}
            onChange={(event) => setDraft((previous) => ({ ...previous, closingNotes: event.target.value }))}
            onBlur={() => onCommitField("closingNotes")}
            className={ATTENDANCE_DETAIL_TEXTAREA_CLASS}
            placeholder="Obrigatório para marcar como 'Encerrado'"
            readOnly={readOnly}
          />
        </DetailSectionField>
      </div>
    </div>
  );
}

function AttendancePeopleTab({
  mode,
  canEdit,
  readOnly,
  people,
  onOpenPerson,
  onAddPerson,
  onRemovePerson,
}: Pick<
  AttendancesDetailLayoutContext,
  "mode" | "canEdit" | "readOnly" | "people" | "onOpenPerson" | "onAddPerson" | "onRemovePerson"
>) {
  const columns = React.useMemo(() => peopleColumns({ canEdit, onRemovePerson }), [canEdit, onRemovePerson]);

  if (mode === "create") {
    return (
      <div className={ATTENDANCE_DETAIL_SECTION_CLASS}>
        <p className="text-sm text-muted-foreground">Salve o atendimento para vincular pessoas.</p>
      </div>
    );
  }

  return (
    <DetailRelationTablePanel
      data={people}
      columns={columns}
      getRowId={(row) => row.id}
      onRowClick={(row) => onOpenPerson(row.person.id)}
      onAdd={!readOnly && canEdit ? onAddPerson : undefined}
      searchPlaceholder="Pesquisar pessoa"
      filterRow={(row, query) =>
        [row.person.fullName, ATTENDANCE_PERSON_ROLE_LABELS[row.role] ?? row.role]
          .join(" ")
          .toLocaleLowerCase()
          .includes(query)
      }
      emptyMessage="Nenhuma pessoa vinculada."
      tableMinWidthClassName="min-w-[640px]"
    />
  );
}

function AttendanceEvolutionsTab({
  mode,
  canEdit,
  readOnly,
  evolutions,
  onAddEvolution,
  onRemoveEvolution,
  onOpenEvolution,
}: Pick<
  AttendancesDetailLayoutContext,
  "mode" | "canEdit" | "readOnly" | "evolutions" | "onAddEvolution" | "onRemoveEvolution" | "onOpenEvolution"
>) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const columns = React.useMemo(
    () => evolutionColumns({ canEdit, onRemoveEvolution }),
    [canEdit, onRemoveEvolution],
  );

  if (mode === "create") {
    return (
      <div className={ATTENDANCE_DETAIL_SECTION_CLASS}>
        <p className="text-sm text-muted-foreground">Salve o atendimento para registrar evoluções.</p>
      </div>
    );
  }

  return (
    <>
      <DetailRelationTablePanel
        data={evolutions}
        columns={columns}
        getRowId={(row) => row.id}
        onRowClick={(row) => onOpenEvolution(row.id)}
        onAdd={!readOnly && canEdit ? () => setDialogOpen(true) : undefined}
        searchPlaceholder="Pesquisar evolução"
        filterRow={(row, query) => row.notes.toLocaleLowerCase().includes(query)}
        emptyMessage="Nenhuma evolução registrada."
        tableMinWidthClassName="min-w-[640px]"
      />
      <AttendanceEvolutionDialog open={dialogOpen} onOpenChange={setDialogOpen} onSubmit={onAddEvolution} />
    </>
  );
}

function AttendanceBenefitsTab({
  mode,
  canEdit,
  readOnly,
  benefits,
  onAddBenefit,
  onRemoveBenefit,
  onOpenBenefit,
}: Pick<
  AttendancesDetailLayoutContext,
  "mode" | "canEdit" | "readOnly" | "benefits" | "onAddBenefit" | "onRemoveBenefit" | "onOpenBenefit"
>) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const columns = React.useMemo(
    () => benefitColumns({ canEdit, onRemoveBenefit }),
    [canEdit, onRemoveBenefit],
  );

  if (mode === "create") {
    return (
      <div className={ATTENDANCE_DETAIL_SECTION_CLASS}>
        <p className="text-sm text-muted-foreground">Salve o atendimento para lançar benefícios.</p>
      </div>
    );
  }

  return (
    <>
      <DetailRelationTablePanel
        data={benefits}
        columns={columns}
        getRowId={(row) => row.id}
        onRowClick={(row) => onOpenBenefit(row.id)}
        onAdd={!readOnly && canEdit ? () => setDialogOpen(true) : undefined}
        searchPlaceholder="Pesquisar benefício"
        filterRow={(row, query) => row.name.toLocaleLowerCase().includes(query)}
        emptyMessage="Nenhum benefício lançado."
        tableMinWidthClassName="min-w-[640px]"
      />
      <AttendanceBenefitDialog open={dialogOpen} onOpenChange={setDialogOpen} onSubmit={onAddBenefit} />
    </>
  );
}

export const attendancesDetailLayout: DetailLayoutConfig<AttendancesDetailLayoutContext> = {
  editing: AUTO_SAVE_EDITING,
  mainTab: true,
  header: {
    title: ({ attendance, draft, mode }) =>
      mode === "create"
        ? "Novo atendimento"
        : (attendance ? ATTENDANCE_TYPE_LABELS[attendance.type] : ATTENDANCE_TYPE_LABELS[draft.type]) ||
          "Atendimento",
  },
  main: (context) => (
    <AttendanceDetailMain
      draft={context.draft}
      setDraft={context.setDraft}
      readOnly={context.readOnly}
      onCommitField={context.onCommitField}
      attendance={context.attendance}
      professionalName={context.professionalName}
      onPickProfessional={context.onPickProfessional}
      canEdit={context.canEdit}
    />
  ),
  side: ({
    mode,
    canAudit,
    readOnly,
    detailAudit,
    auditVisibleCount,
    onAuditVisibleCountChange,
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
          mode === "create" ? "O histórico aparece após salvar o atendimento." : "Nenhum histórico disponível.",
      }}
      tabOrder={["activity"]}
      defaultTab="activity"
    />
  ),
  tabTemplates: [
    {
      key: "people",
      label: "Pessoas",
      badge: ({ people }) => people.length,
      flushContent: true,
      content: (context) => (
        <AttendancePeopleTab
          mode={context.mode}
          canEdit={context.canEdit}
          readOnly={context.readOnly}
          people={context.people}
          onOpenPerson={context.onOpenPerson}
          onAddPerson={context.onAddPerson}
          onRemovePerson={context.onRemovePerson}
        />
      ),
    },
    {
      key: "evolutions",
      label: "Evoluções",
      badge: ({ evolutions }) => evolutions.length,
      flushContent: true,
      content: (context) => (
        <AttendanceEvolutionsTab
          mode={context.mode}
          canEdit={context.canEdit}
          readOnly={context.readOnly}
          evolutions={context.evolutions}
          onAddEvolution={context.onAddEvolution}
          onRemoveEvolution={context.onRemoveEvolution}
          onOpenEvolution={context.onOpenEvolution}
        />
      ),
    },
    {
      key: "benefits",
      label: "Benefícios",
      badge: ({ benefits }) => benefits.length,
      flushContent: true,
      content: (context) => (
        <AttendanceBenefitsTab
          mode={context.mode}
          canEdit={context.canEdit}
          readOnly={context.readOnly}
          benefits={context.benefits}
          onAddBenefit={context.onAddBenefit}
          onRemoveBenefit={context.onRemoveBenefit}
          onOpenBenefit={context.onOpenBenefit}
        />
      ),
    },
  ],
  auditSources: {
    primaryEntity: {
      key: "attendance",
      entity: "Attendance",
      model: "audit.logs",
      label: "Atendimento",
      fieldLabels: ATTENDANCE_AUDIT_FIELD_LABELS,
      valueFormatters: {
        type: (value) => ATTENDANCE_TYPE_LABELS[value as string] ?? String(value),
        status: (value) => ATTENDANCE_CASE_STATUS_LABELS[value as string] ?? String(value),
      },
      resolveEntityId: ({ attendance }) => attendance?.id,
    },
    relatedEntities: [
      {
        key: "attendancePeople",
        entity: "AttendancePeople",
        model: "audit.logs",
        label: "Vínculo",
        fieldLabels: { role: "Papel" },
        valueFormatters: {
          role: (value) => ATTENDANCE_PERSON_ROLE_LABELS[value as string] ?? String(value),
        },
        resolveEntityIds: ({ people }) => people.map((person) => person.id),
      },
      {
        key: "attendanceEvolution",
        entity: "AttendanceEvolution",
        model: "audit.logs",
        label: "Evolução",
        fieldLabels: { date: "Data", notes: "Registro" },
        resolveEntityIds: ({ evolutions }) => evolutions.map((evolution) => evolution.id),
      },
      {
        key: "attendanceBenefit",
        entity: "AttendanceBenefit",
        model: "audit.logs",
        label: "Benefício",
        fieldLabels: { name: "Nome", date: "Data", quantity: "Quantidade", notes: "Observações" },
        resolveEntityIds: ({ benefits }) => benefits.map((benefit) => benefit.id),
      },
    ],
    sort: [{ field: "createdAt", direction: "desc" }],
    pagination: { limit: 120 },
  },
};
