"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichText } from "@/components/ui/richtext/RichText";
import { Textarea } from "@/components/ui/textarea";
import { resolveMediaUrl } from "@/lib/api";
import type { ApiActivityPeopleGroup, ApiMeeting, OccurrenceStatus } from "@/modules/actions/api";
import { OCCURRENCE_STATUS_OPTIONS } from "@/modules/actions/shared/domain/actions.constants";
import { MeetingParticipantsSection } from "@/modules/actions/features/meetings/ui/meeting-participants-section";
import { MeetingResponsiblesSection } from "@/modules/actions/features/manage/ui/meeting-responsibles-section";
import { MultiSelectBadges } from "@/web-client/ui/MultiSelectBadges";
import { DetailSectionField } from "@/web-client/detail/DetailFormSection";
import type { DetailLayoutConfig } from "@/web-client/registry/types";

const AUTO_SAVE_EDITING = {
  saveMode: "auto",
  autoSave: {
    trigger: "field-commit",
  },
} as const;

const MEETING_DETAIL_INPUT_CLASS =
  "h-10 rounded-none border-0 border-b border-border/70 bg-transparent px-0 text-sm shadow-none focus-visible:border-primary focus-visible:ring-0";
const MEETING_DETAIL_TEXTAREA_CLASS =
  "min-h-[100px] rounded-none border-0 border-b border-border/70 bg-transparent px-0 py-3 text-sm shadow-none resize-none focus-visible:border-primary focus-visible:ring-0";
const MEETING_DETAIL_SECTION_CLASS = "border-y border-border/60 bg-transparent px-0 py-4";

export type MeetingDetailDraft = {
  title: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: OccurrenceStatus;
  peopleGroupIds: string[];
  notes: string;
  planHtml: string;
  executedHtml: string;
  conclusionHtml: string;
  photoPaths: string[];
};

export type MeetingDetailLayoutContext = {
  mode: "create" | "edit";
  readOnly: boolean;
  token: string;
  tenantSlug: string;
  projectId: string;
  actionId: string;
  meeting: ApiMeeting | null;
  draft: MeetingDetailDraft;
  setDraft: React.Dispatch<React.SetStateAction<MeetingDetailDraft>>;
  groups: ApiActivityPeopleGroup[];
  photoUploading: boolean;
  onCommitField: <K extends keyof MeetingDetailDraft>(
    field: K,
    nextValue?: MeetingDetailDraft[K],
  ) => void;
  onUploadPhoto: (file: File) => void;
  onDeletePhoto: (path: string) => void;
};

function MeetingDetailMain({
  draft,
  setDraft,
  readOnly,
  onCommitField,
  groups,
  mode,
  photoUploading,
  onUploadPhoto,
  onDeletePhoto,
}: Pick<
  MeetingDetailLayoutContext,
  | "draft"
  | "setDraft"
  | "readOnly"
  | "onCommitField"
  | "groups"
  | "mode"
  | "photoUploading"
  | "onUploadPhoto"
  | "onDeletePhoto"
>) {
  const photoInputRef = React.useRef<HTMLInputElement | null>(null);

  return (
    <div className={MEETING_DETAIL_SECTION_CLASS}>
      <DetailSectionField label="Título">
        <Input
          value={draft.title}
          onChange={(event) => setDraft((previous) => ({ ...previous, title: event.target.value }))}
          onBlur={() => onCommitField("title")}
          className={MEETING_DETAIL_INPUT_CLASS}
          placeholder="Ex.: Dinâmica sobre bullying - deixe em branco para gerar automaticamente"
          readOnly={readOnly}
        />
      </DetailSectionField>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <DetailSectionField label="Data" required>
          <Input
            type="date"
            value={draft.scheduledDate}
            onChange={(event) => setDraft((previous) => ({ ...previous, scheduledDate: event.target.value }))}
            onBlur={() => onCommitField("scheduledDate")}
            className={MEETING_DETAIL_INPUT_CLASS}
            readOnly={readOnly}
          />
        </DetailSectionField>
        <DetailSectionField label="Status">
          <Select
            value={draft.status}
            onValueChange={(value) => {
              const nextValue = value as OccurrenceStatus;
              setDraft((previous) => ({ ...previous, status: nextValue }));
              onCommitField("status", nextValue);
            }}
            disabled={readOnly || mode === "create"}
          >
            <SelectTrigger className={MEETING_DETAIL_INPUT_CLASS}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {OCCURRENCE_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DetailSectionField>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <DetailSectionField label="Início" required>
          <Input
            type="time"
            value={draft.startTime}
            onChange={(event) => setDraft((previous) => ({ ...previous, startTime: event.target.value }))}
            onBlur={() => onCommitField("startTime")}
            className={MEETING_DETAIL_INPUT_CLASS}
            readOnly={readOnly}
          />
        </DetailSectionField>
        <DetailSectionField label="Término (opcional)">
          <Input
            type="time"
            value={draft.endTime}
            onChange={(event) => setDraft((previous) => ({ ...previous, endTime: event.target.value }))}
            onBlur={() => onCommitField("endTime")}
            className={MEETING_DETAIL_INPUT_CLASS}
            readOnly={readOnly}
          />
        </DetailSectionField>
      </div>

      <div className="mt-6">
        <DetailSectionField label="Grupos">
          <MultiSelectBadges
            options={groups.map((link) => ({ value: link.peopleGroupId, label: link.peopleGroup.name }))}
            selectedValues={draft.peopleGroupIds}
            onChange={(next) => {
              setDraft((previous) => ({ ...previous, peopleGroupIds: next }));
              onCommitField("peopleGroupIds", next);
            }}
            disabled={readOnly}
            addLabel="Adicionar Grupos"
            searchPlaceholder="Pesquisar Grupos..."
            noOptionsLabel="Nenhum Grupos vinculado a esta atividade."
            emptyLabel="Sem Grupos específico - vale para qualquer participante da atividade."
          />
        </DetailSectionField>
      </div>

      <div className="mt-6">
        <DetailSectionField label="Notas">
          <Textarea
            value={draft.notes}
            onChange={(event) => setDraft((previous) => ({ ...previous, notes: event.target.value }))}
            onBlur={() => onCommitField("notes")}
            className={MEETING_DETAIL_TEXTAREA_CLASS}
            readOnly={readOnly}
          />
        </DetailSectionField>
      </div>

      {mode === "edit" ? (
        <>
          <div className="mt-6">
            <DetailSectionField label="Planejamento">
              <RichText
                value={draft.planHtml}
                onChange={(next) => setDraft((previous) => ({ ...previous, planHtml: next }))}
                disabled={readOnly}
              />
            </DetailSectionField>
          </div>

          <div className="mt-6">
            <DetailSectionField label="Relato da execução">
              <RichText
                value={draft.executedHtml}
                onChange={(next) => setDraft((previous) => ({ ...previous, executedHtml: next }))}
                disabled={readOnly}
              />
            </DetailSectionField>
          </div>

          <div className="mt-6">
            <DetailSectionField label="Conclusão">
              <RichText
                value={draft.conclusionHtml}
                onChange={(next) => setDraft((previous) => ({ ...previous, conclusionHtml: next }))}
                disabled={readOnly}
              />
            </DetailSectionField>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">Fotos</span>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) onUploadPhoto(file);
              }}
            />
            {!readOnly ? (
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/10 px-3 py-2">
                <span className="text-xs text-muted-foreground">{draft.photoPaths.length}/5 fotos</span>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={photoUploading || draft.photoPaths.length >= 5}
                >
                  {photoUploading ? "Enviando..." : "Enviar foto"}
                </Button>
              </div>
            ) : null}
            {draft.photoPaths.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhuma foto adicionada.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {draft.photoPaths.map((path) => (
                  <div key={path} className="group relative overflow-hidden rounded-lg border border-border/60 bg-muted/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={resolveMediaUrl(path)} alt="Foto do encontro" className="h-32 w-full object-cover" />
                    {!readOnly ? (
                      <div className="absolute inset-0 flex items-end justify-end bg-gradient-to-t from-black/40 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => onDeletePhoto(path)}
                          disabled={photoUploading}
                        >
                          Remover
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

export const meetingDetailLayout: DetailLayoutConfig<MeetingDetailLayoutContext> = {
  editing: AUTO_SAVE_EDITING,
  mainTab: { key: "details", label: "Detalhes" },
  main: ({ draft, setDraft, readOnly, onCommitField, groups, mode, photoUploading, onUploadPhoto, onDeletePhoto }) => (
    <MeetingDetailMain
      draft={draft}
      setDraft={setDraft}
      readOnly={readOnly}
      onCommitField={onCommitField}
      groups={groups}
      mode={mode}
      photoUploading={photoUploading}
      onUploadPhoto={onUploadPhoto}
      onDeletePhoto={onDeletePhoto}
    />
  ),
  tabTemplates: [
    {
      key: "participants",
      label: "Participantes",
      visible: ({ mode }) => mode === "edit",
      content: ({ token, projectId, actionId, meeting, readOnly }) =>
        meeting ? (
          <MeetingParticipantsSection
            token={token}
            projectId={projectId}
            actionId={actionId}
            occurrenceId={meeting.id}
            canUpdate={!readOnly}
          />
        ) : null,
      emptyLabel: "Salve o encontro para registrar presença.",
    },
    {
      key: "responsibles",
      label: "Responsáveis",
      visible: ({ mode }) => mode === "edit",
      content: ({ token, projectId, actionId, meeting, readOnly }) =>
        meeting ? (
          <MeetingResponsiblesSection
            token={token}
            projectId={projectId}
            actionId={actionId}
            occurrenceId={meeting.id}
            canUpdate={!readOnly}
          />
        ) : null,
      emptyLabel: "Salve o encontro para registrar responsáveis.",
    },
  ],
};
