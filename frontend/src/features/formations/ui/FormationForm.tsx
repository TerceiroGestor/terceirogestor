"use client";

import { FormEngine } from "@/components/FormEngine/FormEngine";
import {
  formationFormFields,
  formationFormSteps,
  type FormationFormValues,
} from "@/features/formations/config/formation-form-config";

type FormationFormProps = {
  initialValues?: Partial<FormationFormValues>;
  onSubmit: (values: FormationFormValues) => void;
  onCancel?: () => void;
  submitLabel?: string;
};

export function FormationForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = "Salvar",
}: FormationFormProps) {
  return (
    <FormEngine
      fields={formationFormFields}
      steps={formationFormSteps}
      initialValues={initialValues}
      onSubmit={onSubmit}
      actions={{
        submit: { label: submitLabel, variant: "primary" },
        cancel: onCancel ? { label: "Cancelar", onClick: onCancel, variant: "ghost" } : undefined,
      }}
    />
  );
}
