"use client";

import { FormEngine } from "@/components/FormEngine/FormEngine";
import type { CycleFormData } from "@/features/cycles/domain/types";
import { cycleFormFields, cycleFormSteps } from "@/features/cycles/config/cycle-form-config";

type CycleFormProps = {
  initialValues?: Partial<CycleFormData>;
  onSubmit: (values: CycleFormData) => void;
  onCancel?: () => void;
  submitLabel?: string;
};

export function CycleForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = "Salvar",
}: CycleFormProps) {
  return (
    <FormEngine
      fields={cycleFormFields}
      steps={cycleFormSteps}
      initialValues={initialValues}
      onSubmit={onSubmit}
      actions={{
        submit: { label: submitLabel, variant: "primary" },
        cancel: onCancel ? { label: "Cancelar", onClick: onCancel, variant: "ghost" } : undefined,
      }}
    />
  );
}
