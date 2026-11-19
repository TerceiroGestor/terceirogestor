"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MeetingAttendancesListItem } from "@/modules/actions/api";
import {
  QualityNotesDialog,
  buildQualityColumns,
  type QualityDraft,
  type QualityNotesDialogState,
} from "@/modules/actions/features/manage/ui/action-operational-relations";
import { RelationListHost } from "@/web-client/relation/RelationListHost";
import { ListView } from "@/web-client/views/ListView";

export function ActionQualitySection({
  rows,
  loading,
  error,
  canUpdate,
  canReadPeople,
  tenantSlug,
  occurrenceId,
  occurrenceOptions,
  onOccurrenceIdChange,
  qualityGroupId,
  attendanceGroupOptions,
  onQualityGroupChange,
  qualityDrafts,
  qualitySaving,
  getQualityEffective,
  setQualityRowDraft,
  saveQualityDrafts,
  qualityNotesDialog,
  onQualityNotesDialogChange,
  applyQualityNotesDialog,
}: {
  rows: MeetingAttendancesListItem[];
  loading: boolean;
  error: string | null;
  canUpdate: boolean;
  canReadPeople: boolean;
  tenantSlug: string;
  occurrenceId: string | null;
  occurrenceOptions: Array<{ label: string; value: string }>;
  onOccurrenceIdChange: (value: string) => void;
  qualityGroupId: string;
  attendanceGroupOptions: Array<{ label: string; value: string }>;
  onQualityGroupChange: (value: string) => void;
  qualityDrafts: Record<string, QualityDraft>;
  qualitySaving: boolean;
  getQualityEffective: (row: MeetingAttendancesListItem) => {
    qualityScore: number | null;
    qualityNotes: string | null;
    isHighlight: boolean;
  };
  setQualityRowDraft: (row: MeetingAttendancesListItem, patch: QualityDraft, prune?: boolean) => void;
  saveQualityDrafts: () => void;
  qualityNotesDialog: QualityNotesDialogState | null;
  onQualityNotesDialogChange: (state: QualityNotesDialogState | null) => void;
  applyQualityNotesDialog: (state: QualityNotesDialogState) => void;
}) {
  const [searchText, setSearchText] = React.useState("");

  const columns = React.useMemo(
    () =>
      buildQualityColumns({
        canUpdate,
        canReadPeople,
        tenantSlug,
        getEffective: getQualityEffective,
        onSetRowDraft: setQualityRowDraft,
        onOpenNotesDialog: (row) =>
          onQualityNotesDialogChange({
            enrollmentId: row.enrollment.id,
            fullName: row.enrollment.person.fullName,
            qualityNotes: getQualityEffective(row).qualityNotes ?? "",
          }),
      }),
    [canUpdate, canReadPeople, tenantSlug, getQualityEffective, setQualityRowDraft, onQualityNotesDialogChange],
  );

  const filteredRows = React.useMemo(() => {
    const query = searchText.trim().toLocaleLowerCase("pt-BR");
    if (!query) return rows;
    return rows.filter((row) =>
      row.enrollment.person.fullName.toLocaleLowerCase("pt-BR").includes(query),
    );
  }, [rows, searchText]);

  const changedCount = Object.keys(qualityDrafts).length;

  return (
    <>
      <QualityNotesDialog
        state={qualityNotesDialog}
        canUpdate={canUpdate}
        onOpenChange={(open) => {
          if (!open) onQualityNotesDialogChange(null);
        }}
        onStateChange={onQualityNotesDialogChange}
        onConfirm={applyQualityNotesDialog}
      />

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <RelationListHost<MeetingAttendancesListItem>
        flushToolbar
        data={filteredRows}
        searchText={searchText}
        onSearchTextChange={setSearchText}
        domain={null}
        onDomainChange={() => undefined}
        searchPlaceholder="Pesquisar participantes"
        filteredCount={filteredRows.length}
        viewSwitcherSlot={
          <div className="flex items-center gap-2">
            <Select value={occurrenceId ?? ""} onValueChange={onOccurrenceIdChange}>
              <SelectTrigger className="h-8 w-[140px] text-xs">
                <SelectValue placeholder="Encontro" />
              </SelectTrigger>
              <SelectContent>
                {occurrenceOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={qualityGroupId} onValueChange={onQualityGroupChange}>
              <SelectTrigger className="h-8 w-[140px] text-xs">
                <SelectValue placeholder="Grupo" />
              </SelectTrigger>
              <SelectContent>
                {attendanceGroupOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {canUpdate ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={saveQualityDrafts}
                disabled={qualitySaving || changedCount === 0}
              >
                {qualitySaving ? "Salvando..." : "Salvar"}
              </Button>
            ) : null}
          </div>
        }
      >
        {loading ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">Carregando...</p>
        ) : filteredRows.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            Nenhuma pessoa com presença registrada.
          </p>
        ) : (
          <ListView<MeetingAttendancesListItem>
            data={filteredRows}
            columns={columns}
            getRowId={(row) => row.enrollment.id}
            showColumnVisibilityButton={false}
            bordered={false}
          />
        )}
      </RelationListHost>
    </>
  );
}
