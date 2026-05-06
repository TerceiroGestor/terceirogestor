"use client";

import * as React from "react";
import { RecordForm } from "@/web-client/forms";
import type { FormField } from "@/web-client/forms/types";
import {
  DETENTION_STATUS_OPTIONS,
  DETENTION_TYPE_OPTIONS,
  DETENTIONS_TEXT,
} from "../config/detentions.constants";

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
  onValuesChange?: (values: DetentionFormValues) => void;
  onFieldCommit?: (values: DetentionFormValues) => void;
  onCancel?: () => void;
  hideActions?: boolean;
};

export function DetentionForm({
  initialValues,
  submitLabel,
  onSubmit,
  onValuesChange,
  onFieldCommit,
  onCancel,
  hideActions = false,
}: DetentionFormProps) {
  const fields = React.useMemo<FormField<DetentionFormValues>[]>(
    () => [
      {
        name: "status",
        label: DETENTIONS_TEXT.form.statusLabel,
        type: "select",
        options: DETENTION_STATUS_OPTIONS.slice(),
      },
      {
        name: "type",
        label: DETENTIONS_TEXT.form.typeLabel,
        type: "select",
        options: DETENTION_TYPE_OPTIONS.slice(),
      },
      {
        name: "unit",
        label: DETENTIONS_TEXT.form.unitLabel,
        type: "text",
        placeholder: DETENTIONS_TEXT.form.unitPlaceholder,
      },
      { name: "startDate", label: DETENTIONS_TEXT.form.startDateLabel, type: "date" },
      { name: "endDate", label: DETENTIONS_TEXT.form.endDateLabel, type: "date" },
    ],
    [],
  );

  return (
    <RecordForm<DetentionFormValues>
      appearance="inline-detail"
      initialValues={initialValues}
      fields={fields}
      onValuesChange={onValuesChange}
      onFieldCommit={({ values }) => onFieldCommit?.(values)}
      onSubmit={onSubmit}
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
