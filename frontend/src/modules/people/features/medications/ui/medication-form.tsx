"use client";

import { RecordForm } from "@/web-client/forms";
import {
  medicationFormFields,
  medicationFormSteps,
  type MedicationFormValues,
} from "@/modules/people/features/medications/config/medication-form-config";

type MedicationFormProps = {
  initialValues?: Partial<MedicationFormValues>;
  onSubmit: (values: MedicationFormValues) => void;
  onValuesChange?: (values: MedicationFormValues) => void;
  onFieldCommit?: (values: MedicationFormValues) => void;
  onCancel?: () => void;
  submitLabel?: string;
  hideActions?: boolean;
};

export function MedicationForm({
  initialValues,
  onSubmit,
  onValuesChange,
  onFieldCommit,
  onCancel,
  submitLabel = "Salvar",
  hideActions = false,
}: MedicationFormProps) {
  return (
    <RecordForm
      appearance="inline-detail"
      fields={medicationFormFields}
      steps={medicationFormSteps}
      initialValues={initialValues}
      onSubmit={onSubmit}
      onValuesChange={onValuesChange}
      onFieldCommit={({ values }) => onFieldCommit?.(values)}
      actions={
        hideActions
          ? undefined
          : {
              submit: { label: submitLabel, variant: "primary" },
              cancel: onCancel
                ? { label: "Cancelar", onClick: onCancel, variant: "ghost" }
                : undefined,
            }
      }
    />
  );
}

