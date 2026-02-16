"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { SectionList, SectionListItem } from "@/components/section-list";
import { SectionDialog } from "@/components/section-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EducationForm, type EducationFormValues } from "./education-form";
import { useEducation } from "@/modules/people/features/education/data/use-education";
import type { EducationRecord } from "@/modules/people/shared/domain/types";
import { formatDate, toDateInputValue } from "@/modules/people/shared/domain/utils";
import { EDUCATION_TEXT } from "../config/education.constants";

const buildFormValues = (record?: EducationRecord): EducationFormValues => ({
  level: record?.level ?? "",
  status: record?.status ?? "",
  institution: record?.institution ?? "",
  grade: record?.grade ?? "",
  schoolYear: record?.schoolYear ?? "",
  isCurrent: record?.isCurrent ?? true,
  startDate: toDateInputValue(record?.startDate ?? null),
  endDate: toDateInputValue(record?.endDate ?? null),
  notes: record?.notes ?? "",
});

type EducationPanelProps = {
  personId: string;
};

export function EducationPanel({ personId }: EducationPanelProps) {
  const { educations, isLoading, error, create, update, remove } =
    useEducation(personId);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EducationRecord | null>(null);

  const initialValues = useMemo(() => buildFormValues(editing ?? undefined), [
    editing,
  ]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setEditing(null);
  };

  const handleSubmit = async (values: EducationFormValues) => {
    if (!values.level.trim()) return;
    const payload = {
      level: values.level.trim(),
      status: values.status?.trim() || null,
      institution: values.institution?.trim() || null,
      grade: values.grade?.trim() || null,
      schoolYear: values.schoolYear?.trim() || null,
      isCurrent: values.isCurrent,
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
      title={EDUCATION_TEXT.cardTitle}
      subtitle={EDUCATION_TEXT.cardSubtitle}
      actions={
        <SectionDialog
          open={open}
          onOpenChange={handleOpenChange}
          title={editing ? EDUCATION_TEXT.dialog.editTitle : EDUCATION_TEXT.dialog.createTitle}
          description={EDUCATION_TEXT.dialog.description}
          trigger={
            <Button variant="outline" size="sm" className="h-8 gap-2 text-xs">
              <Plus className="size-3.5" />
              {EDUCATION_TEXT.actions.new}
            </Button>
          }
        >
          <EducationForm
            initialValues={initialValues}
            submitLabel={
              editing
                ? EDUCATION_TEXT.form.submitEdit
                : EDUCATION_TEXT.form.submitCreate
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

      {educations.length ? (
        <SectionList>
          {educations.map((record) => (
            <SectionListItem
              key={record.id}
              title={
                <div className="flex flex-wrap items-center gap-2">
                  <span>{record.level}</span>
                  {record.grade ? (
                    <Badge variant="outline" className="text-[10px]">
                      {record.grade}
                    </Badge>
                  ) : null}
                  {record.isCurrent ? (
                    <Badge variant="secondary" className="text-[10px]">
                      Atual
                    </Badge>
                  ) : null}
                </div>
              }
              subtitle={record.institution ? record.institution : undefined}
              meta={
                <>
                  {record.status ? (
                    <Badge variant="outline">{record.status}</Badge>
                  ) : null}
                  {record.schoolYear ? (
                    <Badge variant="outline">{record.schoolYear}</Badge>
                  ) : null}
                  {record.startDate ? (
                    <Badge variant="secondary">
                      Início: {formatDate(record.startDate)}
                    </Badge>
                  ) : null}
                  {record.endDate ? (
                    <Badge variant="secondary">
                      Fim: {formatDate(record.endDate)}
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
                      setEditing(record);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(record.id)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              }
            />
          ))}
        </SectionList>
      ) : (
        <p className="text-xs text-muted-foreground">{EDUCATION_TEXT.emptyState}</p>
      )}

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Carregando...</p>
      ) : null}
    </SectionCard>
  );
}
