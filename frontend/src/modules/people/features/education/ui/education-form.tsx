"use client";

import * as React from "react";
import { RecordForm } from "@/web-client/forms";
import type { FormField } from "@/web-client/forms/types";
import {
  EDUCATION_GRADE_OPTIONS,
  EDUCATION_LEVEL_SUGGESTIONS,
  EDUCATION_STATUS_OPTIONS,
  EDUCATION_TEXT,
} from "../config/education.constants";

export type EducationFormValues = {
  level: string;
  status: string;
  institution: string;
  grade: string;
  schoolYear: string;
  isCurrent: boolean;
  startDate: string;
  endDate: string;
  notes: string;
};

type EducationFormProps = {
  initialValues: EducationFormValues;
  submitLabel: string;
  onSubmit: (values: EducationFormValues) => void | Promise<void>;
  onValuesChange?: (values: EducationFormValues) => void;
  onFieldCommit?: (values: EducationFormValues) => void;
  onCancel?: () => void;
  hideActions?: boolean;
};

export function EducationForm({
  initialValues,
  submitLabel,
  onSubmit,
  onValuesChange,
  onFieldCommit,
  onCancel,
  hideActions = false,
}: EducationFormProps) {
  const fields = React.useMemo<FormField<EducationFormValues>[]>(
    () => [
      {
        name: "level",
        label: EDUCATION_TEXT.form.levelLabel,
        type: "select",
        options: EDUCATION_LEVEL_SUGGESTIONS.map((value) => ({ value, label: value })),
      },
      {
        name: "status",
        label: EDUCATION_TEXT.form.statusLabel,
        type: "select",
        options: EDUCATION_STATUS_OPTIONS,
      },
      {
        name: "institution",
        label: EDUCATION_TEXT.form.institutionLabel,
        type: "text",
        placeholder: EDUCATION_TEXT.form.institutionPlaceholder,
      },
      {
        name: "grade",
        label: EDUCATION_TEXT.form.gradeLabel,
        type: "select",
        options: EDUCATION_GRADE_OPTIONS.map((value) => ({ value, label: value })),
      },
      {
        name: "schoolYear",
        label: EDUCATION_TEXT.form.schoolYearLabel,
        type: "text",
        placeholder: EDUCATION_TEXT.form.schoolYearPlaceholder,
      },
      {
        name: "isCurrent",
        label: EDUCATION_TEXT.form.isCurrentLabel,
        type: "boolean",
        helperText: "Quando ativo, este registro aparece como o principal.",
      },
      { name: "startDate", label: EDUCATION_TEXT.form.startDateLabel, type: "date" },
      {
        name: "endDate",
        label: EDUCATION_TEXT.form.endDateLabel,
        type: "date",
        visibleWhen: (values) => !values.isCurrent,
      },
    ],
    [],
  );

  return (
    <RecordForm<EducationFormValues>
      appearance="inline-detail"
      initialValues={initialValues}
      fields={fields}
      onValuesChange={onValuesChange}
      onFieldCommit={({ values }) => onFieldCommit?.(values)}
      onSubmit={(values) => {
        const normalized: EducationFormValues = {
          ...values,
          endDate: values.isCurrent ? "" : values.endDate,
        };
        onSubmit(normalized);
      }}
      actions={
        hideActions
          ? undefined
          : {
              cancel: onCancel
                ? { label: "Cancelar", onClick: onCancel, variant: "ghost" }
                : undefined,
              submit: { label: submitLabel, variant: "primary" },
            }
      }
    />
  );
}
