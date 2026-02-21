"use client";

import * as React from "react";
import { FormEngine } from "@/components/FormEngine";
import type { FormField } from "@/components/FormEngine/types";
import { DETENTIONS_TEXT } from "../config/detentions.constants";

export type DetentionFormValues = {
  status: string;
  type: string;
  unit: string;
  startDate: string;
  endDate: string;
  notes: string;
};

type DetentionFormProps = {
  initialValues: DetentionFormValues;
  submitLabel: string;
  onSubmit: (values: DetentionFormValues) => void | Promise<void>;
  onCancel?: () => void;
};

export function DetentionForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: DetentionFormProps) {
  const fields = React.useMemo<FormField<DetentionFormValues>[]>(
    () => [
      {
        name: "status",
        label: DETENTIONS_TEXT.form.statusLabel,
        type: "text",
        placeholder: DETENTIONS_TEXT.form.statusPlaceholder,
      },
      {
        name: "type",
        label: DETENTIONS_TEXT.form.typeLabel,
        type: "text",
        placeholder: DETENTIONS_TEXT.form.typePlaceholder,
      },
      {
        name: "unit",
        label: DETENTIONS_TEXT.form.unitLabel,
        type: "text",
        placeholder: DETENTIONS_TEXT.form.unitPlaceholder,
      },
      { name: "startDate", label: DETENTIONS_TEXT.form.startDateLabel, type: "date" },
      { name: "endDate", label: DETENTIONS_TEXT.form.endDateLabel, type: "date" },
      {
        name: "notes",
        label: DETENTIONS_TEXT.form.notesLabel,
        type: "textarea",
        placeholder: DETENTIONS_TEXT.form.notesPlaceholder,
        rows: 4,
      },
    ],
    [],
  );

  return (
    <FormEngine<DetentionFormValues>
      initialValues={initialValues}
      fields={fields}
      onSubmit={onSubmit}
      actions={{
        cancel: onCancel ? { label: "Cancelar", onClick: onCancel, variant: "ghost" } : undefined,
        submit: { label: submitLabel, variant: "primary" },
      }}
    />
  );
}
