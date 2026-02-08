"use client";

import { FormEngine } from "@/components/FormEngine/FormEngine";
import {
  healthConditionFormFields,
  healthConditionFormSteps,
  type HealthConditionFormValues,
} from "@/features/health-conditions/config/health-condition-form-config";

type HealthConditionFormProps = {
  initialValues?: Partial<HealthConditionFormValues>;
  onSubmit: (values: HealthConditionFormValues) => void;
  onCancel?: () => void;
  submitLabel?: string;
};

export function HealthConditionForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = "Salvar",
}: HealthConditionFormProps) {
  return (
    <FormEngine
      fields={healthConditionFormFields}
      steps={healthConditionFormSteps}
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
