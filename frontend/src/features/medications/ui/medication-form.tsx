"use client";

import { FormEngine } from "@/components/FormEngine/FormEngine";
import {
  medicationFormFields,
  medicationFormSteps,
  type MedicationFormValues,
} from "@/features/medications/config/medication-form-config";

type MedicationFormProps = {
  initialValues?: Partial<MedicationFormValues>;
  onSubmit: (values: MedicationFormValues) => void;
  onCancel?: () => void;
  submitLabel?: string;
};

export function MedicationForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = "Salvar",
}: MedicationFormProps) {
  return (
    <FormEngine
      fields={medicationFormFields}
      steps={medicationFormSteps}
      initialValues={initialValues}
      onSubmit={onSubmit}
      actions={{
        submit: { label: submitLabel, variant: "primary" },
        cancel: onCancel
          ? { label: "Cancelar", onClick: onCancel, variant: "ghost" }
          : undefined,
      }}
    />
  );
}
