"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { SectionList, SectionListItem } from "@/components/section-list";
import { SectionDialog } from "@/components/section-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DetentionForm, type DetentionFormValues } from "./detention-form";
import { useDetentions } from "@/modules/people/features/detentions/data/use-detentions";
import type { PersonDetention } from "@/modules/people/shared/domain/types";
import { formatDate, toDateInputValue } from "@/modules/people/shared/domain/utils";
import { DETENTIONS_TEXT } from "../config/detentions.constants";

const buildFormValues = (detention?: PersonDetention): DetentionFormValues => ({
  status: detention?.status ?? "",
  type: detention?.type ?? "",
  unit: detention?.unit ?? "",
  startDate: toDateInputValue(detention?.startDate ?? null),
  endDate: toDateInputValue(detention?.endDate ?? null),
  notes: detention?.notes ?? "",
});

type DetentionsPanelProps = {
  personId: string;
};

export function DetentionsPanel({ personId }: DetentionsPanelProps) {
  const { detentions, isLoading, error, create, update, remove } =
    useDetentions(personId);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PersonDetention | null>(null);

  const initialValues = useMemo(() => buildFormValues(editing ?? undefined), [
    editing,
  ]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setEditing(null);
  };

  const handleSubmit = async (values: DetentionFormValues) => {
    if (!values.status.trim()) return;
    const payload = {
      status: values.status.trim(),
      type: values.type?.trim() || null,
      unit: values.unit?.trim() || null,
      startDate: values.startDate || null,
      endDate: values.endDate || null,
      notes: values.notes?.trim() || null,
    };
    if (editing) {
      await update(editing.id, payload);
    } else {
      await create(payload);
    }
    setOpen(false);
  };

  return (
    <SectionCard
      title={DETENTIONS_TEXT.cardTitle}
      subtitle={DETENTIONS_TEXT.cardSubtitle}
      actions={
        <SectionDialog
          open={open}
          onOpenChange={handleOpenChange}
          title={
            editing
              ? DETENTIONS_TEXT.dialog.editTitle
              : DETENTIONS_TEXT.dialog.createTitle
          }
          description={DETENTIONS_TEXT.dialog.description}
          trigger={
            <Button variant="outline" size="sm" className="h-8 gap-2 text-xs">
              <Plus className="size-3.5" />
              {DETENTIONS_TEXT.actions.new}
            </Button>
          }
        >
          <DetentionForm
            initialValues={initialValues}
            submitLabel={
              editing
                ? DETENTIONS_TEXT.form.submitEdit
                : DETENTIONS_TEXT.form.submitCreate
            }
            onSubmit={handleSubmit}
            onCancel={() => handleOpenChange(false)}
          />
        </SectionDialog>
      }
    >
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {detentions.length ? (
        <SectionList>
          {detentions.map((detention) => (
            <SectionListItem
              key={detention.id}
              title={
                <div className="flex flex-wrap items-center gap-2">
                  <span>{detention.status}</span>
                  {!detention.endDate ? (
                    <Badge variant="secondary" className="text-[10px]">
                      Em andamento
                    </Badge>
                  ) : null}
                </div>
              }
              subtitle={
                detention.type
                  ? detention.type
                  : detention.unit
                    ? detention.unit
                    : undefined
              }
              meta={
                <>
                  {detention.type && detention.unit ? (
                    <Badge variant="outline">{detention.unit}</Badge>
                  ) : null}
                  {detention.startDate ? (
                    <Badge variant="secondary">
                      Início: {formatDate(detention.startDate)}
                    </Badge>
                  ) : null}
                  {detention.endDate ? (
                    <Badge variant="secondary">
                      Fim: {formatDate(detention.endDate)}
                    </Badge>
                  ) : null}
                </>
              }
              actions={
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditing(detention);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(detention.id)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              }
            />
          ))}
        </SectionList>
      ) : (
        <p className="text-xs text-muted-foreground">
          {DETENTIONS_TEXT.emptyState}
        </p>
      )}

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Carregando...</p>
      ) : null}
    </SectionCard>
  );
}

